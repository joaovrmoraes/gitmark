import { useEffect, useState } from 'react'
import { X, Plus, Check, Link2, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import { getRepo } from '@/http/repo'
import type { Repo } from '@/http/repos'
import { useRepos } from '@/queries/repos'
import { useLibrary, parseRepoRef } from '@/lib/library'
import { Spinner } from '@/components/ui/Spinner'

export function AddVaultModal({ onClose }: { onClose: () => void }) {
  const { addVault, hasVault } = useLibrary()
  const { data: repos, isLoading } = useRepos()
  const [link, setLink] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function add(repo: Repo) {
    addVault({ owner: repo.owner, name: repo.name, fullName: repo.fullName, description: repo.description })
  }

  async function addByLink() {
    setError(null)
    const ref = parseRepoRef(link)
    if (!ref) {
      setError('Paste a GitHub URL or owner/repo')
      return
    }
    if (hasVault(ref.owner, ref.name)) {
      setError('Already in your library')
      return
    }
    setBusy(true)
    try {
      const repo = await getRepo(ref.owner, ref.name)
      add(repo)
      setLink('')
    } catch (e) {
      setError((e as Error).message || "Couldn't find that repo")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-[10vh]">
        <div
          className="w-full max-w-lg rounded-xl border border-hairline bg-canvas shadow-[0px_8px_16px_-4px_#0000001a,0px_24px_32px_-8px_#0000001f]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
            <h2 className="text-base font-semibold text-ink">Add a vault</h2>
            <button onClick={onClose} className="rounded-md p-1.5 text-mute hover:bg-canvas-soft-2 hover:text-ink" aria-label="Close">
              <X size={16} />
            </button>
          </div>

          {/* Add by link */}
          <div className="border-b border-hairline px-5 py-4">
            <label className="mb-1.5 block text-xs font-medium text-body">Paste a public repo link</label>
            <div className="flex gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-md border border-hairline px-2.5">
                <Link2 size={14} className="shrink-0 text-mute" />
                <input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addByLink()}
                  placeholder="github.com/owner/repo  or  owner/repo"
                  className="h-9 w-full bg-transparent text-sm text-ink outline-none placeholder:text-mute"
                />
              </div>
              <button
                onClick={addByLink}
                disabled={busy}
                className="flex h-9 items-center gap-1.5 rounded-md bg-ink px-3 text-sm font-medium text-on-primary transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Add
              </button>
            </div>
            {error && <p className="mt-2 text-xs text-error">{error}</p>}
          </div>

          {/* Pick from your repos */}
          <div className="max-h-[40vh] overflow-y-auto px-2 py-2">
            <div className="px-3 py-2 text-xs font-medium text-body">Or pick from your repositories</div>
            {isLoading && <Spinner label="Loading your repos…" />}
            {repos?.map((r) => {
              const added = hasVault(r.owner, r.name)
              return (
                <div key={r.id} className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-canvas-soft">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink">{r.name}</div>
                    {r.description && <div className="truncate text-xs text-mute">{r.description}</div>}
                  </div>
                  <button
                    onClick={() => add(r)}
                    disabled={added}
                    className={clsx(
                      'flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                      added
                        ? 'text-mute'
                        : 'border border-hairline text-ink hover:bg-canvas-soft-2',
                    )}
                  >
                    {added ? <><Check size={13} /> Added</> : <><Plus size={13} /> Add</>}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
