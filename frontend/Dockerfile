# ---- build ----
FROM node:22-alpine AS build
# Skip Playwright's browser download — it's a dev-only dep (demo recording),
# not needed to build the app, and downloading Chromium would break the build.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
# Pin pnpm directly (avoids corepack signature issues on newer pnpm versions).
RUN npm install -g pnpm@11.8.0
WORKDIR /app
# pnpm-workspace.yaml carries `allowBuilds: esbuild` — it MUST be present at
# install time or esbuild's native binary is skipped and `pnpm build` fails.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# ---- runtime (static) ----
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
