import { useQuery } from '@tanstack/react-query'
import { listRepos } from '@/http/repos'

export function useRepos(owner?: string) {
  return useQuery({
    queryKey: ['repos', owner ?? 'me'],
    queryFn: () => listRepos(owner),
  })
}
