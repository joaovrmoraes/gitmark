// Package handler wires HTTP endpoints to GitHub OAuth + the proxy client.
package handler

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joaovrmoraes/gitmark/backend/internal/auth"
	"github.com/joaovrmoraes/gitmark/backend/internal/config"
	"github.com/joaovrmoraes/gitmark/backend/internal/github"
)

const (
	sessionCookie = "gitmark_session"
	stateCookie   = "gitmark_oauth_state"
	sessionMaxAge = 7 * 24 * 60 * 60 // 7 days
)

type Handler struct {
	gh       *github.Client
	sessions *auth.Store
	cfg      config.Config
	http     *http.Client
}

func New(gh *github.Client, sessions *auth.Store, cfg config.Config) *Handler {
	return &Handler{gh: gh, sessions: sessions, cfg: cfg, http: &http.Client{Timeout: 15 * time.Second}}
}

func (h *Handler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// ---- OAuth ----

// AuthGitHub kicks off the OAuth dance: set a CSRF state cookie, redirect to
// GitHub's consent screen.
func (h *Handler) AuthGitHub(c *gin.Context) {
	if h.cfg.GitHubClientID == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "GITHUB_CLIENT_ID not configured"})
		return
	}
	state := randomHex(16)
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(stateCookie, state, 600, "/", "", false, true)

	q := url.Values{}
	q.Set("client_id", h.cfg.GitHubClientID)
	q.Set("redirect_uri", h.callbackURL(c))
	q.Set("scope", h.cfg.OAuthScope)
	q.Set("state", state)
	c.Redirect(http.StatusFound, "https://github.com/login/oauth/authorize?"+q.Encode())
}

// AuthCallback handles GitHub's redirect: verify state, exchange the code for a
// token, load the user, open a session cookie, bounce back to the frontend.
func (h *Handler) AuthCallback(c *gin.Context) {
	wantState, _ := c.Cookie(stateCookie)
	if wantState == "" || c.Query("state") != wantState {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid OAuth state"})
		return
	}
	c.SetCookie(stateCookie, "", -1, "/", "", false, true)

	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "missing code"})
		return
	}

	token, err := h.exchangeCode(c.Request.Context(), code, h.callbackURL(c))
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"message": err.Error()})
		return
	}

	ghUser, err := h.gh.GetUser(c.Request.Context(), token)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"message": "couldn't load GitHub user"})
		return
	}

	id, err := h.sessions.Create(auth.Session{
		Token: token,
		User:  auth.User{Login: ghUser.Login, Name: ghUser.Name, AvatarURL: ghUser.AvatarURL},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "couldn't create session"})
		return
	}

	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(sessionCookie, id, sessionMaxAge, "/", "", false, true)
	c.Redirect(http.StatusFound, h.cfg.FrontendURL+"/repos")
}

func (h *Handler) Logout(c *gin.Context) {
	if id, _ := c.Cookie(sessionCookie); id != "" {
		h.sessions.Delete(id)
	}
	c.SetCookie(sessionCookie, "", -1, "/", "", false, true)
	c.Status(http.StatusNoContent)
}

// exchangeCode swaps an authorization code for an access token.
func (h *Handler) exchangeCode(ctx context.Context, code, redirectURI string) (string, error) {
	form := url.Values{}
	form.Set("client_id", h.cfg.GitHubClientID)
	form.Set("client_secret", h.cfg.GitHubClientSecret)
	form.Set("code", code)
	form.Set("redirect_uri", redirectURI)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		"https://github.com/login/oauth/access_token", strings.NewReader(form.Encode()))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")

	res, err := h.http.Do(req)
	if err != nil {
		return "", err
	}
	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)

	var parsed struct {
		AccessToken string `json:"access_token"`
		Error       string `json:"error_description"`
	}
	if err := json.Unmarshal(body, &parsed); err != nil {
		return "", errors.New("malformed token response")
	}
	if parsed.AccessToken == "" {
		if parsed.Error != "" {
			return "", errors.New(parsed.Error)
		}
		return "", errors.New("no access token returned")
	}
	return parsed.AccessToken, nil
}

// ---- Authenticated API ----

// Me returns the logged-in GitHub user (set on the context by RequireSession).
func (h *Handler) Me(c *gin.Context) {
	user := c.MustGet("user").(auth.User)
	c.JSON(http.StatusOK, gin.H{"user": user})
}

func (h *Handler) ListRepos(c *gin.Context) {
	token := c.GetString("token")
	owner := c.Query("owner")
	var (
		repos []github.Repo
		err   error
	)
	if owner == "" {
		// No owner → the logged-in user's own repos (incl. private).
		repos, err = h.gh.ListAuthedRepos(c.Request.Context(), token)
	} else {
		repos, err = h.gh.ListRepos(c.Request.Context(), token, owner)
	}
	if err != nil {
		h.fail(c, err)
		return
	}
	c.JSON(http.StatusOK, repos)
}

func (h *Handler) Tree(c *gin.Context) {
	owner, repo := c.Query("owner"), c.Query("repo")
	if owner == "" || repo == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "owner and repo are required"})
		return
	}
	nodes, err := h.gh.Tree(c.Request.Context(), c.GetString("token"), owner, repo, c.Query("branch"))
	if err != nil {
		h.fail(c, err)
		return
	}
	c.JSON(http.StatusOK, nodes)
}

func (h *Handler) Content(c *gin.Context) {
	owner, repo, path := c.Query("owner"), c.Query("repo"), c.Query("path")
	if owner == "" || repo == "" || path == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "owner, repo and path are required"})
		return
	}
	content, err := h.gh.Content(c.Request.Context(), c.GetString("token"), owner, repo, path, c.Query("branch"))
	if err != nil {
		h.fail(c, err)
		return
	}
	c.JSON(http.StatusOK, content)
}

// RequireSession loads the session from the cookie and aborts with 401 when
// absent. On success the token + user are attached to the context.
func (h *Handler) RequireSession(c *gin.Context) {
	id, _ := c.Cookie(sessionCookie)
	if id == "" {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "not authenticated"})
		return
	}
	sess, ok := h.sessions.Get(id)
	if !ok {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "session expired"})
		return
	}
	c.Set("token", sess.Token)
	c.Set("user", sess.User)
	c.Next()
}

func (h *Handler) callbackURL(c *gin.Context) string {
	scheme := "http"
	if c.Request.TLS != nil || c.GetHeader("X-Forwarded-Proto") == "https" {
		scheme = "https"
	}
	return scheme + "://" + c.Request.Host + "/auth/callback"
}

// fail mirrors an upstream GitHub status when available, else 502.
func (h *Handler) fail(c *gin.Context, err error) {
	var apiErr *github.APIError
	if errors.As(err, &apiErr) {
		c.JSON(apiErr.Status, gin.H{"message": apiErr.Message})
		return
	}
	c.JSON(http.StatusBadGateway, gin.H{"message": err.Error()})
}

func randomHex(n int) string {
	b := make([]byte, n)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
