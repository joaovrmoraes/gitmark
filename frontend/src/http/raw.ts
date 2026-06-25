import { API_URL } from '@/lib/fetch'

// URL for the raw bytes of a file (PDFs etc.), served by the authed backend.
// Passing the blob `sha` lets the backend use the Git Blobs API (up to 100 MB)
// instead of the 1 MB-capped Contents API. Same-origin in prod, so the session
// cookie rides along automatically.
export function rawUrl(
  owner: string,
  repo: string,
  path: string,
  opts: { branch?: string; sha?: string } = {},
): string {
  const params = new URLSearchParams({ owner, repo, path })
  if (opts.branch) params.set('branch', opts.branch)
  if (opts.sha) params.set('sha', opts.sha)
  return `${API_URL}/proxy/raw?${params}`
}
