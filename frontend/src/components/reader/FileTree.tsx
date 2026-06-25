import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'
import type { TreeNode } from '@/http/tree'
import { buildTree, type TreeItem } from './buildTree'

type Props = {
  nodes: TreeNode[]
  selected: string | null
  onSelect: (path: string) => void
}

// An Obsidian-like notes explorer: typographic, low-chrome — chevrons for
// folders, plain note titles for files (no folder/file icons), with a faint
// indentation guide instead of GitHub's file-browser look.
export function FileTree({ nodes, selected, onSelect }: Props) {
  const tree = buildTree(nodes)
  return (
    <div className="flex flex-col gap-px text-sm">
      {tree.map((item) => (
        <TreeRow key={item.path} item={item} depth={0} selected={selected} onSelect={onSelect} />
      ))}
    </div>
  )
}

function TreeRow({
  item,
  depth,
  selected,
  onSelect,
}: {
  item: TreeItem
  depth: number
  selected: string | null
  onSelect: (path: string) => void
}) {
  const [open, setOpen] = useState(depth < 1)

  if (item.type === 'tree') {
    return (
      <div>
        <button
          onClick={() => setOpen((v) => !v)}
          style={{ paddingLeft: `${depth * 14 + 6}px` }}
          className="flex w-full items-center gap-1 rounded-md py-1.5 pr-2 text-body transition-colors hover:bg-canvas-soft-2 hover:text-ink"
        >
          <ChevronRight
            size={13}
            className={clsx('shrink-0 text-mute transition-transform', open && 'rotate-90')}
          />
          <span className="truncate font-medium">{item.name}</span>
        </button>
        {open && (
          <div className="ml-[12px] border-l border-hairline">
            {item.children.map((c) => (
              <TreeRow key={c.path} item={c} depth={depth + 1} selected={selected} onSelect={onSelect} />
            ))}
          </div>
        )}
      </div>
    )
  }

  const isActive = selected === item.path
  return (
    <button
      onClick={() => onSelect(item.path)}
      style={{ paddingLeft: `${depth * 14 + 6}px` }}
      className={clsx(
        'flex w-full items-center rounded-md py-1.5 pr-2 text-left transition-colors',
        isActive
          ? 'bg-canvas-soft-2 font-medium text-ink'
          : 'text-body hover:bg-canvas-soft-2 hover:text-ink',
      )}
    >
      <span className="truncate">{item.name.replace(/\.(md|markdown)$/i, '')}</span>
    </button>
  )
}
