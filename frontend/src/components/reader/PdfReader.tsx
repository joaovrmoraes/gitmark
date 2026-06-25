import { useEffect, useMemo, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { clsx } from 'clsx'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'

// Bundle the pdf.js worker via Vite so it works offline/same-origin.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

const SWIPE_THRESHOLD = 55

// Self-contained PDF reader: renders one page at a time (canvas), with the same
// page-turn affordances as the markdown reader — swipe, arrow keys, edge
// chevrons and a footer progress bar. Page turns here move through the PDF's
// pages; switch files via the Contents drawer.
export function PdfReader({ url }: { url: string }) {
  const [numPages, setNumPages] = useState(0)
  const [page, setPage] = useState(1)
  const [width, setWidth] = useState(820)
  const [dir, setDir] = useState<'next' | 'prev' | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // withCredentials so the session cookie is sent cross-origin in dev.
  const file = useMemo(() => ({ url, withCredentials: true }), [url])

  useEffect(() => {
    setPage(1)
    setNumPages(0)
  }, [url])

  // Fit the page to the container width.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const measure = () => setWidth(Math.min(el.clientWidth - 24, 860))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const hasPrev = page > 1
  const hasNext = numPages > 0 && page < numPages
  const goPrev = () => setPage((p) => (p > 1 ? (setDir('prev'), p - 1) : p))
  const goNext = () => setPage((p) => (p < numPages ? (setDir('next'), p + 1) : p))

  const navRef = useRef({ goPrev, goNext })
  navRef.current = { goPrev, goNext }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') navRef.current.goNext()
      else if (e.key === 'ArrowLeft') navRef.current.goPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

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

  const progress = numPages > 0 ? (page / numPages) * 100 : 0

  return (
    <>
      <div
        ref={containerRef}
        className="relative min-h-0 flex-1 overflow-y-auto bg-canvas-soft"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {hasPrev && (
          <button
            onClick={goPrev}
            aria-label="Previous page"
            className="group absolute inset-y-0 left-0 z-10 hidden w-16 items-center justify-center md:flex"
          >
            <span className="text-mute opacity-0 transition-opacity group-hover:opacity-100">‹</span>
          </button>
        )}
        {hasNext && (
          <button
            onClick={goNext}
            aria-label="Next page"
            className="group absolute inset-y-0 right-0 z-10 hidden w-16 items-center justify-center md:flex"
          >
            <span className="text-mute opacity-0 transition-opacity group-hover:opacity-100">›</span>
          </button>
        )}

        <Document
          file={file}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading={<Spinner label="Opening the PDF…" />}
          error={
            <div className="px-6 py-10">
              <EmptyState title="Couldn't open this PDF" description="The file may be too large or unavailable." />
            </div>
          }
          className="flex justify-center py-6"
        >
          <Page
            key={page}
            pageNumber={page}
            width={width}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className={clsx(
              'shadow-[0px_2px_8px_-2px_#00000033]',
              dir === 'next' && 'page-next',
              dir === 'prev' && 'page-prev',
            )}
          />
        </Document>
      </div>

      {numPages > 0 && (
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
            <span className="px-2 text-center text-xs text-body">
              Page <span className="text-ink">{page}</span> of {numPages}
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
    </>
  )
}
