# GitMark

> Read your GitHub Markdown vaults with a clean, Notion-like reader — no setup, no friction.

PWA for reading GitHub repositories (Obsidian vaults, docs, wikis) on any device.
Sign in, browse the file tree, read beautifully rendered Markdown. **V1.0**

## Stack

| Layer | Tech |
|---|---|
| Frontend | Vite + React + TypeScript + Tailwind v4 + vite-plugin-pwa |
| Backend | Go + Gin (GitHub API proxy with in-memory TTL cache) |
| Data | GitHub REST API |

Frontend follows a **mobile/desktop split** pattern: each page is a folder with
`index.tsx` (dispatcher) + `Page.desktop.tsx` + `Page.mobile.tsx`.

## Project layout

```
git-mark/
├── backend/            Go API (proxy + cache)
│   ├── cmd/server      main entrypoint
│   └── internal/       config · cache · github · handler · router · middleware
├── frontend/           Vite + React PWA
│   └── src/            http · queries · contexts · lib · components · pages
└── docker-compose.yml
```

## Running locally

### Backend

```bash
cd backend
cp .env.example .env        # optional: set GITHUB_TOKEN to raise rate limits
go run ./cmd/server         # listens on :8080
```

### Frontend

```bash
cd frontend
cp .env.example .env
pnpm install
pnpm dev                    # http://localhost:3000
```

Or everything at once:

```bash
docker compose up --build
```

## Auth (current state)

Auth is **mocked** in V1.0: the backend serves the GitHub user named by
`MOCK_USER` and reads its **public** repos via the unauthenticated GitHub API
(60 req/h). Set `GITHUB_TOKEN` (a PAT) to raise the limit to 5000 req/h and read
private repos. **GitHub OAuth replaces the mock next** — the frontend session
and `credentials: 'include'` are already in place for a cookie-based flow.

## API

| Endpoint | Description |
|---|---|
| `GET /healthz` | Liveness |
| `GET /me` | Current (mocked) user |
| `GET /proxy/repos?owner=` | Public repos for a user (defaults to `MOCK_USER`) |
| `GET /proxy/tree?owner=&repo=&branch=` | Recursive file tree (dirs + markdown) |
| `GET /proxy/content?owner=&repo=&path=&branch=` | Raw file content |

## Roadmap

- **V1.0 (this)** — mocked auth, repo list, file tree, Markdown reader, PWA installable.
- **V1.1** — GitHub OAuth, offline cache (IndexedDB), frontmatter, `[[wikilinks]]`, search.
- **V2.0** — write-back (checkboxes, quick notes), sync, multi-workspace.
