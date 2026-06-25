import { apiFetch } from '@/lib/fetch'

export type TreeNode = {
  path: string
  type: 'blob' | 'tree'
  size: number
  sha: string
}

export function getTree(owner: string, repo: string, branch?: string): Promise<TreeNode[]> {
  const params = new URLSearchParams({ owner, repo })
  if (branch) params.set('branch', branch)
  return apiFetch<TreeNode[]>(`/proxy/tree?${params}`)
}
