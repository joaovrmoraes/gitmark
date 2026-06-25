import { apiFetch } from '@/lib/fetch'
import type { Repo } from './repos'

// Fetch metadata for a single repo (validating a pasted link before adding it
// to the library). Works for public repos and the user's private ones.
export function getRepo(owner: string, name: string): Promise<Repo> {
  const params = new URLSearchParams({ owner, repo: name })
  return apiFetch<Repo>(`/proxy/repo?${params}`)
}
