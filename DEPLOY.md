# Deploying GitMark (Coolify · single service)

Target: **https://gitmark.joaovrmoraes.dev**

GitMark deploys as **one container**: the Go server serves the built SPA *and*
the API on port `8080`. With a single service there's nothing for the reverse
proxy to disambiguate, so the domain always lands on the app and client-side
routes survive refresh — this is what fixed the recurring "404 after deploy".

## 1. GitHub OAuth App

- **Authorization callback URL:** `https://gitmark.joaovrmoraes.dev/auth/callback`
- **Homepage URL:** `https://gitmark.joaovrmoraes.dev`
- Keep the client secret **only** in Coolify env (never in git).

## 2. Coolify

Deploy this repo with the **Docker Compose** build pack (`docker-compose.yml`,
which builds the root `Dockerfile`). Then:

- Point the domain `https://gitmark.joaovrmoraes.dev` at the **`app`** service,
  container port **8080**. (There is only one service now.)
- Coolify terminates TLS and forwards `X-Forwarded-Proto=https`; the app uses it
  to set Secure cookies and build the OAuth callback URL.

### Environment variables

| Var | Value |
|---|---|
| `FRONTEND_URL` | `https://gitmark.joaovrmoraes.dev` |
| `GITHUB_CLIENT_ID` | your OAuth app client id |
| `GITHUB_CLIENT_SECRET` | your OAuth app client secret |
| `OAUTH_SCOPE` | `read:user repo` |

(`WEB_DIR=/web` and `PORT=8080` are already baked into the image.)

## 3. Verify

- `https://gitmark.joaovrmoraes.dev/` → the sign-in page (not 404)
- Hard-refresh on `/repos` or `/signin` → still loads (SPA fallback)
- **Continue with GitHub** → authorize → land on `/repos`

## Notes

- Sessions are in-memory (7-day TTL) — a redeploy logs everyone out. Fine for
  now; move to Redis when it matters.
- Local prod-like run: `docker compose up --build` then open `http://localhost:8080`.
