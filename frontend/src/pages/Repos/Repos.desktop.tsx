import { useState } from 'react'
import { Plus, Library } from 'lucide-react'
import { useLibrary } from '@/lib/library'
import { useAuth } from '@/contexts/AuthContext'
import { EmptyState } from '@/components/ui/EmptyState'
import { VaultCard } from './VaultCard'
import { AddVaultModal } from './AddVaultModal'

export function ReposDesktop() {
  const { user } = useAuth()
  const { vaults } = useLibrary()
  const [adding, setAdding] = useState(false)

  return (
    <div className="mx-auto max-w-2xl px-8 py-14">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-ink">Your library</h1>
          <p className="mt-2 text-sm text-body">
            {vaults.length > 0
              ? `${vaults.length} vault${vaults.length > 1 ? 's' : ''}${user ? ` · ${user.login}` : ''}`
              : 'The repos you choose to read live here.'}
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-pill bg-ink px-4 py-2 text-sm font-medium text-on-primary transition-opacity hover:opacity-90"
        >
          <Plus size={15} /> Add vault
        </button>
      </header>

      {vaults.length === 0 ? (
        <EmptyState
          icon={<Library size={28} />}
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
