import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { BookMarked, Library, LogOut, Sun, Moon, Coffee, ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/lib/theme'

const nav = [{ to: '/repos', icon: Library, label: 'Library' }]

const themeIcon = { light: Sun, sepia: Coffee, dark: Moon }
const themeLabel = { light: 'Light', sepia: 'Sepia', dark: 'Dark' }

export function SidebarDesktop() {
  const { user, logout } = useAuth()
  const { theme, cycle } = useTheme()
  const ThemeIcon = themeIcon[theme]
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-hairline bg-canvas px-3 py-4">
      <div className="mb-6 flex items-center gap-2 px-3">
        <BookMarked size={18} className="text-ink" />
        <span className="text-lg font-semibold tracking-tight text-ink">GitMark</span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-canvas-soft-2 font-medium text-ink'
                  : 'font-normal text-body hover:bg-canvas-soft hover:text-ink',
              )
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-4 flex flex-col gap-1 border-t border-hairline pt-4">
        <button
          onClick={cycle}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-body transition-colors hover:bg-canvas-soft hover:text-ink"
        >
          <ThemeIcon size={14} />
          {themeLabel[theme]} mode
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-sm text-body transition-colors hover:bg-canvas-soft hover:text-ink"
          >
            <span className="flex items-center gap-2 truncate">
              {user && (
                <img src={user.avatarUrl} alt="" className="h-5 w-5 rounded-full" />
              )}
              <span className="truncate">{user?.login ?? 'Account'}</span>
            </span>
            <ChevronDown size={13} className={clsx('shrink-0 transition-transform', menuOpen && 'rotate-180')} />
          </button>

          {menuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1 rounded-md border border-hairline bg-canvas py-1 shadow-lg">
              <button
                onClick={logout}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-error hover:bg-canvas-soft"
              >
                <LogOut size={13} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
