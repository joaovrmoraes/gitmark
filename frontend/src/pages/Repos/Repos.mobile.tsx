import { Library } from 'lucide-react'
import { useRepos } from '@/queries/repos'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { RepoCard } from './RepoCard'

export function ReposMobile() {
  const { data: repos, isLoading, error } = useRepos()

  return (
    <div className="px-5 py-6">
      <header className="mb-2">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-ink">Your library</h1>
        <p className="mt-1 text-sm text-body">
          {repos ? `${repos.length} vaults` : 'Vaults'} — open one to read.
        </p>
      </header>

      {isLoading && <Spinner label="Opening…" />}
      {error && (
        <EmptyState icon={<Library size={26} />} title="Couldn't load" description={(error as Error).message} />
      )}
      {repos && repos.length > 0 && (
        <div className="flex flex-col">
          {repos.map((r) => (
            <RepoCard key={r.id} repo={r} />
          ))}
        </div>
      )}
    </div>
  )
}
