import { API_URL } from '@/lib/fetch'

// URL for the raw bytes of a file (PDFs etc.), served by the authed backend.
// Same-origin in production, so the session cookie rides along automatically.
export function rawUrl(owner: string, repo: string, path: string, branch?: string): string {
  const params = new URLSearchParams({ owner, repo, path })
  if (branch) params.set('branch', branch)
  return `${API_URL}/proxy/raw?${params}`
}
