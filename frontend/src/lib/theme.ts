import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'sepia' | 'dark'
const THEMES: Theme[] = ['light', 'sepia', 'dark']
const KEY = 'gitmark-theme'

function getStored(): Theme {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem(KEY) as Theme | null
  if (stored && THEMES.includes(stored)) return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function apply(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.classList.toggle('sepia', theme === 'sepia')
}

// Tiny external store so every theme control (sidebar, top bar, reader) stays
// in sync instead of holding independent useState copies.
let current = getStored()
const listeners = new Set<() => void>()

export function setTheme(theme: Theme) {
  current = theme
  localStorage.setItem(KEY, theme)
  apply(theme)
  listeners.forEach((l) => l())
}

export function cycleTheme() {
  setTheme(THEMES[(THEMES.indexOf(current) + 1) % THEMES.length])
}

export function useTheme() {
  const theme = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => current,
    () => 'light' as Theme,
  )
  return { theme, setTheme, cycle: cycleTheme }
}

// Apply before React hydrates to avoid a flash of the wrong theme.
apply(current)
