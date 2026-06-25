import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import type { Repo } from '@/http/repos'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days < 1) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  if (days < 365) return `${Math.floor(days / 30)} months ago`
  return `${Math.floor(days / 365)} years ago`
}

// A vault in the library — calm and text-forward, for people who write their
// second brain. No book covers, no GitHub chrome: just the name, what it's
// about, and when it last changed.
export function RepoCard({ repo }: { repo: Repo }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(`/browse/${repo.owner}/${repo.name}`)}
      className="group block w-full border-b border-hairline py-5 text-left last:border-0"
    >
      <div className="flex items-baseline gap-2">
        <h2 className="text-lg font-semibold tracking-tight text-ink transition-colors group-hover:text-link">
          {repo.name}
        </h2>
        {repo.private && <Lock size={12} className="shrink-0 translate-y-px text-mute" />}
      </div>
      {repo.description && (
        <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-body">{repo.description}</p>
      )}
      <p className="mt-2 text-xs text-mute">Updated {timeAgo(repo.updatedAt)}</p>
    </button>
  )
}
