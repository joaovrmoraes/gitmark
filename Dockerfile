# Single-image deployment: the Go server serves BOTH the built SPA and the API
# on one port. One service = the reverse proxy has nothing to disambiguate, so
# the domain always lands here and client-side routes survive refresh (no more
# "404 after deploy").

# ---- frontend ----
FROM node:22-alpine AS web
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN npm install -g pnpm@11.8.0
WORKDIR /app
COPY frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY frontend/ ./
RUN pnpm build

# ---- backend ----
FROM golang:1.26-alpine AS api
WORKDIR /src
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /out/gitmark ./cmd/server

# ---- runtime ----
FROM alpine:3.20
RUN apk add --no-cache ca-certificates
COPY --from=api /out/gitmark /usr/local/bin/gitmark
COPY --from=web /app/dist /web
ENV WEB_DIR=/web
EXPOSE 8080
ENTRYPOINT ["gitmark"]
