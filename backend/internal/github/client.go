package github

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"time"

	"github.com/joaovrmoraes/gitmark/backend/internal/cache"
)

// Client is a thin proxy over the GitHub REST API with response caching. Every
// call takes the caller's OAuth token so requests run as the logged-in user
// (private repos, per-user rate limits).
type Client struct {
	api     string
	http    *http.Client
	rawHTTP *http.Client
	cache   cache.Store
}

func NewClient(api string, store cache.Store) *Client {
	return &Client{
		api:  strings.TrimRight(api, "/"),
		http: &http.Client{Timeout: 15 * time.Second},
		// Raw files (PDFs) can be tens of MB — give them a longer budget and
		// stream them instead of buffering.
		rawHTTP: &http.Client{Timeout: 120 * time.Second},
		cache:   store,
	}
}

// APIError carries an upstream status code so handlers can mirror it.
type APIError struct {
	Status  int
	Message string
}

func (e *APIError) Error() string { return e.Message }

// AuthedUser is the identity behind a token.
type AuthedUser struct {
	Login     string `json:"login"`
	Name      string `json:"name"`
	AvatarURL string `json:"avatar_url"`
}

// GetUser resolves the user that owns the token.
func (c *Client) GetUser(ctx context.Context, token string) (*AuthedUser, error) {
	body, err := c.get(ctx, token, "/user", "")
	if err != nil {
		return nil, err
	}
	var u AuthedUser
	if err := json.Unmarshal(body, &u); err != nil {
		return nil, err
	}
	return &u, nil
}

// ListAuthedRepos returns the logged-in user's own repositories (incl. private),
// most-recently-updated first.
func (c *Client) ListAuthedRepos(ctx context.Context, token string) ([]Repo, error) {
	body, err := c.get(ctx, token, "/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator,organization_member", "")
	if err != nil {
		return nil, err
	}
	return decodeRepos(body)
}

// GetRepo returns metadata for a single repo (used when adding a vault by
// link — works for any public repo, or private ones the token can read).
func (c *Client) GetRepo(ctx context.Context, token, owner, repo string) (*Repo, error) {
	body, err := c.get(ctx, token, fmt.Sprintf("/repos/%s/%s", url.PathEscape(owner), url.PathEscape(repo)), "")
	if err != nil {
		return nil, err
	}
	var r ghRepo
	if err := json.Unmarshal(body, &r); err != nil {
		return nil, err
	}
	return &Repo{
		ID:            r.ID,
		Name:          r.Name,
		FullName:      r.FullName,
		Owner:         r.Owner.Login,
		Description:   r.Description,
		Private:       r.Private,
		DefaultBranch: r.DefaultBranch,
		UpdatedAt:     r.UpdatedAt,
		Stars:         r.StargazersCnt,
	}, nil
}

// ListRepos returns a specific user's public repositories.
func (c *Client) ListRepos(ctx context.Context, token, owner string) ([]Repo, error) {
	path := fmt.Sprintf("/users/%s/repos?sort=updated&per_page=100", url.PathEscape(owner))
	body, err := c.get(ctx, token, path, "")
	if err != nil {
		return nil, err
	}
	return decodeRepos(body)
}

// Tree returns the full recursive file tree of a repo, filtered to directories
// and markdown files (the only thing a vault reader cares about).
func (c *Client) Tree(ctx context.Context, token, owner, repo, branch string) ([]TreeNode, error) {
	if branch == "" {
		b, err := c.defaultBranch(ctx, token, owner, repo)
		if err != nil {
			return nil, err
		}
		branch = b
	}

	key := fmt.Sprintf("tree:%s/%s@%s", owner, repo, branch)
	if cached, ok := c.cache.Get(key); ok {
		var nodes []TreeNode
		if json.Unmarshal(cached, &nodes) == nil {
			return nodes, nil
		}
	}

	path := fmt.Sprintf("/repos/%s/%s/git/trees/%s?recursive=1",
		url.PathEscape(owner), url.PathEscape(repo), url.PathEscape(branch))
	body, err := c.get(ctx, token, path, "")
	if err != nil {
		return nil, err
	}

	var raw ghTreeResponse
	if err := json.Unmarshal(body, &raw); err != nil {
		return nil, err
	}

	nodes := make([]TreeNode, 0, len(raw.Tree))
	for _, e := range raw.Tree {
		if e.Type == "tree" || isReadable(e.Path) {
			nodes = append(nodes, TreeNode{Path: e.Path, Type: e.Type, Size: e.Size, SHA: e.SHA})
		}
	}
	sort.Slice(nodes, func(i, j int) bool { return nodes[i].Path < nodes[j].Path })

	c.cacheJSON(key, nodes, 5*time.Minute)
	return nodes, nil
}

// Content returns the raw text of a single file.
func (c *Client) Content(ctx context.Context, token, owner, repo, filePath, branch string) (*FileContent, error) {
	key := fmt.Sprintf("content:%s/%s@%s:%s", owner, repo, branch, filePath)
	if cached, ok := c.cache.Get(key); ok {
		return &FileContent{Path: filePath, Content: string(cached)}, nil
	}

	p := fmt.Sprintf("/repos/%s/%s/contents/%s",
		url.PathEscape(owner), url.PathEscape(repo), encodePath(filePath))
	if branch != "" {
		p += "?ref=" + url.QueryEscape(branch)
	}
	body, err := c.get(ctx, token, p, "application/vnd.github.raw+json")
	if err != nil {
		return nil, err
	}

	c.cache.Set(key, body, 10*time.Minute)
	return &FileContent{Path: filePath, Content: string(body)}, nil
}

// RawStream fetches a file's raw bytes for streaming to the client. It prefers
// the Git Blobs API (handles files up to 100 MB — the Contents API caps at
// 1 MB and 403s "too large" on bigger files like PDFs). The caller must close
// the returned response body.
func (c *Client) RawStream(ctx context.Context, token, owner, repo, sha, filePath, branch string) (*http.Response, error) {
	var p string
	if sha != "" {
		p = fmt.Sprintf("/repos/%s/%s/git/blobs/%s",
			url.PathEscape(owner), url.PathEscape(repo), url.PathEscape(sha))
	} else {
		p = fmt.Sprintf("/repos/%s/%s/contents/%s",
			url.PathEscape(owner), url.PathEscape(repo), encodePath(filePath))
		if branch != "" {
			p += "?ref=" + url.QueryEscape(branch)
		}
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.api+p, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/vnd.github.raw")
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")
	req.Header.Set("User-Agent", "GitMark")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	res, err := c.rawHTTP.Do(req)
	if err != nil {
		return nil, err
	}
	if res.StatusCode >= 400 {
		body, _ := io.ReadAll(res.Body)
		res.Body.Close()
		return nil, &APIError{Status: res.StatusCode, Message: upstreamMessage(body)}
	}
	return res, nil
}

func (c *Client) defaultBranch(ctx context.Context, token, owner, repo string) (string, error) {
	key := fmt.Sprintf("branch:%s/%s", owner, repo)
	if cached, ok := c.cache.Get(key); ok {
		return string(cached), nil
	}
	path := fmt.Sprintf("/repos/%s/%s", url.PathEscape(owner), url.PathEscape(repo))
	body, err := c.get(ctx, token, path, "")
	if err != nil {
		return "", err
	}
	var r ghRepo
	if err := json.Unmarshal(body, &r); err != nil {
		return "", err
	}
	if r.DefaultBranch == "" {
		r.DefaultBranch = "main"
	}
	c.cache.Set(key, []byte(r.DefaultBranch), 10*time.Minute)
	return r.DefaultBranch, nil
}

func (c *Client) get(ctx context.Context, token, path, accept string) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.api+path, nil)
	if err != nil {
		return nil, err
	}
	if accept == "" {
		accept = "application/vnd.github+json"
	}
	req.Header.Set("Accept", accept)
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")
	req.Header.Set("User-Agent", "GitMark")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	res, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, err
	}

	if res.StatusCode >= 400 {
		msg := upstreamMessage(body)
		if res.StatusCode == http.StatusForbidden && res.Header.Get("X-RateLimit-Remaining") == "0" {
			msg = "GitHub rate limit reached"
		}
		return nil, &APIError{Status: res.StatusCode, Message: msg}
	}
	return body, nil
}

func decodeRepos(body []byte) ([]Repo, error) {
	var raw []ghRepo
	if err := json.Unmarshal(body, &raw); err != nil {
		return nil, err
	}
	repos := make([]Repo, 0, len(raw))
	for _, r := range raw {
		repos = append(repos, Repo{
			ID:            r.ID,
			Name:          r.Name,
			FullName:      r.FullName,
			Owner:         r.Owner.Login,
			Description:   r.Description,
			Private:       r.Private,
			DefaultBranch: r.DefaultBranch,
			UpdatedAt:     r.UpdatedAt,
			Stars:         r.StargazersCnt,
		})
	}
	return repos, nil
}

func (c *Client) cacheJSON(key string, v any, ttl time.Duration) {
	if b, err := json.Marshal(v); err == nil {
		c.cache.Set(key, b, ttl)
	}
}

func upstreamMessage(body []byte) string {
	var e struct {
		Message string `json:"message"`
	}
	if json.Unmarshal(body, &e) == nil && e.Message != "" {
		return e.Message
	}
	return "GitHub request failed"
}

func isMarkdown(p string) bool {
	lp := strings.ToLower(p)
	return strings.HasSuffix(lp, ".md") || strings.HasSuffix(lp, ".markdown")
}

func isPDF(p string) bool {
	return strings.HasSuffix(strings.ToLower(p), ".pdf")
}

// isReadable reports whether a file is something GitMark can open (markdown or
// PDF). Everything else is hidden from the tree.
func isReadable(p string) bool {
	return isMarkdown(p) || isPDF(p)
}

// encodePath escapes each path segment but keeps the slashes the contents
// endpoint expects.
func encodePath(p string) string {
	parts := strings.Split(p, "/")
	for i, seg := range parts {
		parts[i] = url.PathEscape(seg)
	}
	return strings.Join(parts, "/")
}
