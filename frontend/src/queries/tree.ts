import { useQuery } from '@tanstack/react-query'
import { getTree } from '@/http/tree'

export function useTree(owner: string, repo: string, branch?: string) {
  return useQuery({
    queryKey: ['tree', owner, repo, branch ?? 'default'],
    queryFn: () => getTree(owner, repo, branch),
    enabled: Boolean(owner && repo),
  })
}
