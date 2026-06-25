import { apiFetch } from '@/lib/fetch'

export type FileContent = {
  path: string
  content: string
}

export function getContent(
  owner: string,
  repo: string,
  path: string,
  branch?: string,
): Promise<FileContent> {
  const params = new URLSearchParams({ owner, repo, path })
  if (branch) params.set('branch', branch)
  return apiFetch<FileContent>(`/proxy/content?${params}`)
}
