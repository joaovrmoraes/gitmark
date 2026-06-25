import { X } from 'lucide-react'
import { clsx } from 'clsx'
import type { TreeNode } from '@/http/tree'
import { FileTree } from '@/components/reader/FileTree'

type Props = {
  open: boolean
  onClose: () => void
  nodes: TreeNode[]
  selected: string | null
  onSelect: (path: string) => void
  repo: string
}

// Table of contents — a slide-over for readers who still want the tree.
export function Contents({ open, onClose, nodes, selected, onSelect, repo }: Props) {
  return (
    <>
      <div
        onClick={onClose}
        className={clsx(
          'fixed inset-0 z-40 bg-black/30 transition-opacity',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex w-[82%] max-w-sm flex-col border-r border-hairline bg-canvas transition-transform duration-300',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-wide text-mute">Contents</div>
            <div className="truncate text-sm font-medium text-ink">{repo}</div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-mute hover:bg-canvas-soft-2 hover:text-ink" aria-label="Close contents">
            <X size={16} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          <FileTree
            nodes={nodes}
            selected={selected}
            onSelect={(p) => {
              onSelect(p)
              onClose()
            }}
          />
        </div>
      </aside>
    </>
  )
}
