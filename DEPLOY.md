# Deploying GitMark (Coolify · single domain)

Target: **https://gitmark.joaovrmoraes.dev** — frontend and backend behind one
domain. `nginx` serves the SPA and reverse-proxies `/auth`, `/proxy`, `/me`,
`/healthz` to the Go backend, so the session cookie stays `SameSite=Lax; Secure`
and there's no CORS to worry about.

## 1. GitHub OAuth App (production)

In the GitMark OAuth App (github.com/settings/developers):

- **Authorization callback URL:** add `https://gitmark.joaovrmoraes.dev/auth/callback`
  (GitHub allows multiple callback URLs — keep the localhost one for dev).
- **Homepage URL:** `https://gitmark.joaovrmoraes.dev`
- ⚠️ **Regenerate the client secret** (the dev one was shared in chat). Use the
  new value in the env vars below.

## 2. DNS

Point `gitmark.joaovrmoraes.dev` → your VPS IP (A record). Coolify will issue
the Let's Encrypt certificate automatically.

## 3. Coolify

Deploy this repo with the **Docker Compose** build pack (it reads
`docker-compose.yml`). Then:

- Attach the domain `https://gitmark.joaovrmoraes.dev` to the **`web`** service
  (container port **80**). Coolify terminates TLS and forwards
  `X-Forwarded-Proto=https` — the backend reads it to set `Secure` cookies and
  build the right OAuth callback URL.
- The **`api`** service stays internal (no public port) — `web` reaches it as
  `http://api:8080` on the compose network.

### Environment variables (set in Coolify)

| Var | Value |
|---|---|
| `FRONTEND_URL` | `https://gitmark.joaovrmoraes.dev` |
| `GITHUB_CLIENT_ID` | `Ov23liHRKjZROLlswddK` |
| `GITHUB_CLIENT_SECRET` | *(the regenerated secret)* |
| `OAUTH_SCOPE` | `read:user repo` |

The frontend needs no runtime env — `VITE_API_URL` is baked empty at build time
(`.env.production`), so it calls the API same-origin.

## 4. Verify

1. Open `https://gitmark.joaovrmoraes.dev` → **Continue with GitHub** → authorize.
2. You should land on `/repos` with your real repos (private included).
3. Open a vault → the reader should page-turn and switch themes.

## Notes / future

- **Sessions are in-memory** — a redeploy/restart logs everyone out. Fine for
  now; move to Redis when it matters (the cache + session stores were written to
  swap easily).
- If the proxy in front of `web` does **not** send `X-Forwarded-Proto=https`,
  the OAuth callback would be built as `http://…` and fail — Coolify/Traefik
  sets it by default, so this is just a heads-up.
