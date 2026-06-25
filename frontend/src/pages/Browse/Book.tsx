import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, List, Type, Library } from 'lucide-react'
import { clsx } from 'clsx'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Markdown } from '@/components/reader/Markdown'
import { useTheme, type Theme } from '@/lib/theme'
import { useBrowse } from './useBrowse'
import { Contents } from './Contents'

const SWIPE_THRESHOLD = 55

// The reading experience: a repo opened as a book whose markdown files are
// pages. Turn pages by swiping (touch), arrow keys, or the edge chevrons.
export function Book() {
  const navigate = useNavigate()
  const { repo, owner, path, tree, content, index, total, dir, select, goNext, goPrev, hasNext, hasPrev } =
    useBrowse()
  const [contentsOpen, setContentsOpen] = useState(false)

  // Keep latest paging fns in refs so the key handler never goes stale.
  const nav = useRef({ goNext, goPrev })
  nav.current = { goNext, goPrev }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nav.current.goNext()
      else if (e.key === 'ArrowLeft') nav.current.goPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Swipe handling.
  const touch = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (e: React.TouchEvent) => {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current) return
    const dx = e.changedTouches[0].clientX - touch.current.x
    const dy = e.changedTouches[0].clientY - touch.current.y
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy) * 1.4) {
      if (dx < 0) goNext()
      else goPrev()
    }
    touch.current = null
  }

  const pageName = path ? path.split('/').pop()!.replace(/\.(md|markdown)$/i, '') : ''
  const progress = total > 0 && index >= 0 ? ((index + 1) / total) * 100 : 0

  return (
    <div className="reading flex h-dvh min-h-0 flex-col bg-canvas">
      {/* Reader top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-hairline px-3 md:px-5">
        <button
          onClick={() => navigate('/repos')}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-mute transition-colors hover:bg-canvas-soft-2 hover:text-ink"
        >
          <Library size={16} />
          <span className="hidden sm:inline">Library</span>
        </button>

        <div className="min-w-0 text-center">
          <div className="truncate text-sm font-medium text-ink">{repo}</div>
          <div className="truncate font-mono text-[11px] text-mute">{owner}</div>
        </div>

        <div className="flex items-center gap-1">
          <ReadingThemeMenu />
          <button
            onClick={() => setContentsOpen(true)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-mute transition-colors hover:bg-canvas-soft-2 hover:text-ink"
            aria-label="Contents"
          >
            <List size={17} />
          </button>
        </div>
      </header>

      {/* Page */}
      <div
        data-reader-page
        className="relative min-h-0 flex-1 overflow-y-auto"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Edge page-turn zones (desktop) */}
        {hasPrev && (
          <button
            onClick={goPrev}
            aria-label="Previous page"
            className="group absolute inset-y-0 left-0 z-10 hidden w-16 items-center justify-center md:flex"
          >
            <ChevronLeft size={22} className="text-mute opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        )}
        {hasNext && (
          <button
            onClick={goNext}
            aria-label="Next page"
            className="group absolute inset-y-0 right-0 z-10 hidden w-16 items-center justify-center md:flex"
          >
            <ChevronRight size={22} className="text-mute opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        )}

        <div className="px-6 py-10 md:px-8 md:py-14">
          {tree.isLoading && <Spinner label="Opening the book…" />}
          {content.isLoading && !content.data && <Spinner label="Turning the page…" />}
          {content.error && (
            <EmptyState title="Couldn't load this page" description={(content.error as Error).message} />
          )}
          {content.data && (
            <div
              key={path}
              className={clsx(
                'mx-auto max-w-2xl',
                dir === 'next' && 'page-next',
                dir === 'prev' && 'page-prev',
              )}
            >
              <Markdown content={content.data.content} />
            </div>
          )}
        </div>
      </div>

      {/* Footer: page progress */}
      {total > 0 && index >= 0 && (
        <footer className="shrink-0 border-t border-hairline">
          <div className="h-0.5 bg-canvas-soft-2">
            <div className="h-full bg-ink transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex items-center justify-between px-4 py-2.5 md:px-6">
            <button
              onClick={goPrev}
              disabled={!hasPrev}
              className="rounded-md px-2 py-1 text-xs text-mute transition-colors enabled:hover:text-ink disabled:opacity-30"
            >
              ← Prev
            </button>
            <span className="truncate px-2 text-center text-xs text-body">
              {pageName} <span className="text-mute">· {index + 1} of {total}</span>
            </span>
            <button
              onClick={goNext}
              disabled={!hasNext}
              className="rounded-md px-2 py-1 text-xs text-mute transition-colors enabled:hover:text-ink disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        </footer>
      )}

      <Contents
        open={contentsOpen}
        onClose={() => setContentsOpen(false)}
        nodes={tree.data ?? []}
        selected={path}
        onSelect={select}
        repo={repo}
      />
    </div>
  )
}

const READING_THEMES: { id: Theme; label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'sepia', label: 'Sepia' },
  { id: 'dark', label: 'Dark' },
]

function ReadingThemeMenu() {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-mute transition-colors hover:bg-canvas-soft-2 hover:text-ink"
        aria-label="Reading theme"
      >
        <Type size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-32 rounded-lg border border-hairline bg-canvas p-1 shadow-lg">
            {READING_THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id)
                  setOpen(false)
                }}
                className={clsx(
                  'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-canvas-soft-2',
                  theme === t.id ? 'font-medium text-ink' : 'text-body',
                )}
              >
                <span
                  className="h-3.5 w-3.5 rounded-full border border-hairline-strong"
                  style={{ background: t.id === 'light' ? '#ffffff' : t.id === 'sepia' ? '#faf3e1' : '#1c1c1c' }}
                />
                {t.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
