package router

import (
	"github.com/gin-gonic/gin"
	"github.com/joaovrmoraes/gitmark/backend/internal/config"
	"github.com/joaovrmoraes/gitmark/backend/internal/handler"
	"github.com/joaovrmoraes/gitmark/backend/internal/middleware"
)

func New(h *handler.Handler, cfg config.Config) *gin.Engine {
	r := gin.New()
	// We sit behind a single trusted reverse proxy (nginx/Coolify); don't infer
	// client IPs from arbitrary forwarded headers.
	_ = r.SetTrustedProxies(nil)
	r.Use(gin.Recovery())
	r.Use(middleware.CORS(cfg.FrontendURL))

	r.GET("/healthz", h.Health)

	// OAuth — public.
	r.GET("/auth/github", h.AuthGitHub)
	r.GET("/auth/callback", h.AuthCallback)
	r.POST("/auth/logout", h.Logout)

	// Authenticated API.
	authed := r.Group("/", h.RequireSession)
	{
		authed.GET("/me", h.Me)
		authed.GET("/proxy/repos", h.ListRepos)
		authed.GET("/proxy/repo", h.GetRepo)
		authed.GET("/proxy/tree", h.Tree)
		authed.GET("/proxy/content", h.Content)
		authed.GET("/proxy/raw", h.Raw)
	}

	return r
}
