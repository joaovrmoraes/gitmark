package main

import (
	"log/slog"
	"os"

	"github.com/joaovrmoraes/gitmark/backend/internal/auth"
	"github.com/joaovrmoraes/gitmark/backend/internal/cache"
	"github.com/joaovrmoraes/gitmark/backend/internal/config"
	"github.com/joaovrmoraes/gitmark/backend/internal/github"
	"github.com/joaovrmoraes/gitmark/backend/internal/handler"
	"github.com/joaovrmoraes/gitmark/backend/internal/router"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	cfg := config.Load()
	store := cache.NewMemory()
	sessions := auth.NewStore()
	gh := github.NewClient(cfg.GitHubAPI, store)
	h := handler.New(gh, sessions, cfg)
	r := router.New(h, cfg)

	slog.Info("gitmark backend starting",
		"port", cfg.Port,
		"oauth", cfg.GitHubClientID != "",
		"frontend", cfg.FrontendURL,
	)

	if err := r.Run(":" + cfg.Port); err != nil {
		slog.Error("server stopped", "err", err)
		os.Exit(1)
	}
}
