import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { useLibrary, type Vault } from '@/lib/library'

// A curated vault in the library. Shows the owner too, since vaults can now be
// anyone's public repo, not just yours.
export function VaultCard({ vault }: { vault: Vault }) {
  const navigate = useNavigate()
  const { removeVault } = useLibrary()

  return (
    <div className="group relative border-b border-hairline last:border-0">
      <button
        onClick={() => navigate(`/browse/${vault.owner}/${vault.name}`)}
        className="block w-full py-5 pr-10 text-left"
      >
        <div className="flex items-baseline gap-2">
          <h2 className="text-lg font-semibold tracking-tight text-ink transition-colors group-hover:text-link">
            {vault.name}
          </h2>
          <span className="truncate text-xs text-mute">{vault.owner}</span>
        </div>
        {vault.description && (
          <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-body">{vault.description}</p>
        )}
      </button>
      <button
        onClick={() => removeVault(vault.owner, vault.name)}
        className="absolute right-0 top-5 rounded-md p-1.5 text-mute opacity-0 transition-all hover:bg-canvas-soft-2 hover:text-error group-hover:opacity-100"
        aria-label={`Remove ${vault.name}`}
      >
        <X size={15} />
      </button>
    </div>
  )
}
