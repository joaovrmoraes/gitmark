import { useState } from 'react'
import { Plus, Library } from 'lucide-react'
import { useLibrary } from '@/lib/library'
import { EmptyState } from '@/components/ui/EmptyState'
import { VaultCard } from './VaultCard'
import { AddVaultModal } from './AddVaultModal'

export function ReposMobile() {
  const { vaults } = useLibrary()
  const [adding, setAdding] = useState(false)

  return (
    <div className="px-5 py-6">
      <header className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-ink">Your library</h1>
        <button
          onClick={() => setAdding(true)}
          className="flex shrink-0 items-center gap-1 rounded-pill bg-ink px-3 py-1.5 text-sm font-medium text-on-primary hover:opacity-90"
        >
          <Plus size={14} /> Add
        </button>
      </header>

      {vaults.length === 0 ? (
        <EmptyState
          icon={<Library size={26} />}
          title="Your library is empty"
          description="Add a GitHub repo — yours or any public one — to start reading."
          action={
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-1.5 rounded-pill bg-ink px-4 py-2 text-sm font-medium text-on-primary hover:opacity-90"
            >
              <Plus size={15} /> Add your first vault
            </button>
          }
        />
      ) : (
        <div className="flex flex-col">
          {vaults.map((v) => (
            <VaultCard key={`${v.owner}/${v.name}`} vault={v} />
          ))}
        </div>
      )}

      {adding && <AddVaultModal onClose={() => setAdding(false)} />}
    </div>
  )
}
