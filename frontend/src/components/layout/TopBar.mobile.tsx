import { BookMarked, Sun, Moon, Coffee, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/lib/theme'

const themeIcon = { light: Sun, sepia: Coffee, dark: Moon }

// Mobile chrome. The reader app has a single section, so a compact top bar
// reads better than a near-empty bottom nav.
export function TopBarMobile() {
  const { logout } = useAuth()
  const { theme, cycle } = useTheme()
  const ThemeIcon = themeIcon[theme]

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-hairline bg-canvas/90 px-4 backdrop-blur">
      <div className="flex items-center gap-2">
        <BookMarked size={17} className="text-ink" />
        <span className="text-base font-semibold tracking-tight text-ink">GitMark</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={cycle}
          className="rounded-md p-2 text-mute transition-colors hover:bg-canvas-soft-2 hover:text-ink"
          aria-label="Cycle reading theme"
        >
          <ThemeIcon size={16} />
        </button>
        <button
          onClick={logout}
          className="rounded-md p-2 text-mute transition-colors hover:bg-canvas-soft-2 hover:text-ink"
          aria-label="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}
