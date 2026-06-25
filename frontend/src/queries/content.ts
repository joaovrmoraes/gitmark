import { useQuery } from '@tanstack/react-query'
import { getContent } from '@/http/content'

export function useContent(owner: string, repo: string, path: string | null, branch?: string) {
  return useQuery({
    queryKey: ['content', owner, repo, branch ?? 'default', path],
    queryFn: () => getContent(owner, repo, path!, branch),
    enabled: Boolean(owner && repo && path),
    staleTime: 1000 * 60 * 10,
  })
}
