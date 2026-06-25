import { Library } from 'lucide-react'
import { useRepos } from '@/queries/repos'
import { useAuth } from '@/contexts/AuthContext'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { RepoCard } from './RepoCard'

export function ReposDesktop() {
  const { user } = useAuth()
  const { data: repos, isLoading, error } = useRepos()

  return (
    <div className="mx-auto max-w-2xl px-8 py-14">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-ink">Your library</h1>
        <p className="mt-2 text-sm text-body">
          {repos ? `${repos.length} vaults` : 'Vaults'}
          {user ? ` from ${user.login}` : ''} — open one to start reading.
        </p>
      </header>

      {isLoading && <Spinner label="Opening your library…" />}
      {error && (
        <EmptyState icon={<Library size={28} />} title="Couldn't load your library" description={(error as Error).message} />
      )}
      {repos && repos.length === 0 && <EmptyState icon={<Library size={28} />} title="No vaults found" />}
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
