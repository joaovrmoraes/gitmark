# Changelog

All notable changes to GitMark are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-06-26

First public release. GitMark is a **"Kindle for repositories"** — read your
GitHub Markdown vaults (and PDFs) with an immersive, page-turning reader.

### Added

- **GitHub OAuth login** — server-side sessions with an HttpOnly cookie; the
  GitHub token never reaches the browser. Reads your repos, including private.
- **Library** of your repositories as calm, text-forward vaults (no GitHub
  chrome, no clutter).
- **Immersive reader** — full-screen, swipe / keyboard / edge page turns, a
  progress bar, and a contents (file tree) drawer.
- **Reading themes** — light, sepia and dark — with serif (Literata) typography.
- **Markdown** rendering with GFM, syntax highlighting and raw HTML; YAML
  frontmatter is kept out of the body.
- **PDF reading** via pdf.js — paged and lazy-loaded; folders mixing `.md` and
  `.pdf` just work.
- **Installable PWA** with offline asset caching.
- **Go + Gin backend** proxying the GitHub REST API with an in-memory TTL cache.
- **Single-domain production deploy** (nginx reverse proxy + Coolify).

[1.0.0]: https://github.com/joaovrmoraes/gitmark/releases/tag/v1.0.0
