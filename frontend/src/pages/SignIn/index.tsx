import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { BookMarked, Github } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function SignIn() {
  const { user, login } = useAuth()
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/repos" replace />

  function handleLogin() {
    setBusy(true)
    login() // redirects to GitHub
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-canvas px-6">
      {/* Mesh gradient — hero scale only, the brand's single decorative chrome */}
      <div className="mesh-gradient pointer-events-none absolute inset-x-0 top-0 h-[55vh] opacity-90 [mask-image:linear-gradient(to_bottom,black,transparent)]" />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
        <div className="mb-6 flex items-center gap-2 rounded-full border border-hairline bg-canvas px-3 py-1 text-xs text-body">
          <span className="font-mono">v1.0 · alpha</span>
        </div>

        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-ink text-on-primary shadow-lg">
          <BookMarked size={26} />
        </div>

        <h1 className="text-4xl font-semibold tracking-[-0.04em] text-ink">GitMark.</h1>
        <p className="mt-3 text-lg leading-7 text-body">
          Read your GitHub Markdown vaults with a clean, Notion-like reader — no setup, no friction.
        </p>

        <button
          onClick={handleLogin}
          disabled={busy}
          className="mt-8 flex items-center gap-2 rounded-pill bg-ink px-5 py-3 text-base font-medium text-on-primary transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          <Github size={18} />
          {busy ? 'Redirecting to GitHub…' : 'Continue with GitHub'}
        </button>

        <p className="mt-4 max-w-xs font-mono text-xs text-mute">
          We only read your repositories — your notes never leave GitHub.
        </p>
      </div>
    </div>
  )
}
