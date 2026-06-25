package config

import (
	"bufio"
	"os"
	"strings"
)

// Config holds all runtime configuration, read from environment variables.
type Config struct {
	Port string
	// GitHub OAuth App credentials.
	GitHubClientID     string
	GitHubClientSecret string
	// OAuthScope controls what the user grants. "repo" is needed to read
	// private vaults; drop to "read:user" for public-only.
	OAuthScope string
	GitHubAPI  string
	// FrontendURL is where users land after a successful login, and the
	// allowed CORS origin.
	FrontendURL string
}

func Load() Config {
	loadDotEnv(".env")
	return Config{
		Port:               env("PORT", "8080"),
		GitHubClientID:     env("GITHUB_CLIENT_ID", ""),
		GitHubClientSecret: env("GITHUB_CLIENT_SECRET", ""),
		OAuthScope:         env("OAUTH_SCOPE", "read:user repo"),
		GitHubAPI:          env("GITHUB_API", "https://api.github.com"),
		FrontendURL:        env("FRONTEND_URL", "http://localhost:3000"),
	}
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

// loadDotEnv reads a simple KEY=VALUE .env file (if present) without pulling in
// a dependency. Real environment variables always win over the file.
func loadDotEnv(path string) {
	f, err := os.Open(path)
	if err != nil {
		return
	}
	defer f.Close()

	sc := bufio.NewScanner(f)
	for sc.Scan() {
		line := strings.TrimSpace(sc.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		key, val, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		key = strings.TrimSpace(key)
		val = strings.Trim(strings.TrimSpace(val), `"'`)
		if _, exists := os.LookupEnv(key); !exists {
			_ = os.Setenv(key, val)
		}
	}
}
