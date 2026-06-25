import { apiFetch } from '@/lib/fetch'

export type Repo = {
  id: number
  name: string
  fullName: string
  owner: string
  description: string
  private: boolean
  defaultBranch: string
  updatedAt: string
  stars: number
}

export function listRepos(owner?: string): Promise<Repo[]> {
  const qs = owner ? `?owner=${encodeURIComponent(owner)}` : ''
  return apiFetch<Repo[]>(`/proxy/repos${qs}`)
}
