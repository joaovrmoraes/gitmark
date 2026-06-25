import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useTree } from '@/queries/tree'
import { useContent } from '@/queries/content'

export type PageDir = 'next' | 'prev' | null

// The "book": resolves owner/repo/page from the URL, loads the table of
// contents (tree) + current page (file), and exposes Kindle-style paging over
// the ordered markdown files.
export function useBrowse() {
  const { owner = '', repo = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const path = params.get('path')
  const [dir, setDir] = useState<PageDir>(null)

  const isPdf = path ? /\.pdf$/i.test(path) : false
  const tree = useTree(owner, repo)
  // PDFs are rendered straight from /proxy/raw by pdf.js — don't fetch them as
  // markdown text.
  const content = useContent(owner, repo, isPdf ? null : path)

  // Ordered "pages" = every markdown file, in tree order.
  const pages = useMemo(
    () => (tree.data ?? []).filter((n) => n.type === 'blob').map((n) => n.path),
    [tree.data],
  )

  const index = path ? pages.indexOf(path) : -1
  const total = pages.length

  // Open to README (or the first page) the first time a book is opened — once
  // per repo, so closing to the contents view doesn't bounce back open.
  const openedFor = useRef<string | null>(null)
  useEffect(() => {
    const key = `${owner}/${repo}`
    if (path || pages.length === 0) return
    if (openedFor.current === key) return
    openedFor.current = key
    const readme = pages.find((p) => /(^|\/)readme\.md$/i.test(p))
    setParams({ path: readme ?? pages[0] }, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages, path, owner, repo])

  const go = (next: string, direction: PageDir) => {
    setDir(direction)
    setParams({ path: next })
  }
  const select = (next: string) => go(next, null)
  const goNext = () => index >= 0 && index < total - 1 && go(pages[index + 1], 'next')
  const goPrev = () => index > 0 && go(pages[index - 1], 'prev')
  const clear = () => setParams({}, { replace: true })

  return {
    owner,
    repo,
    path,
    tree,
    content,
    pages,
    index,
    total,
    dir,
    select,
    goNext,
    goPrev,
    clear,
    hasNext: index >= 0 && index < total - 1,
    hasPrev: index > 0,
  }
}
