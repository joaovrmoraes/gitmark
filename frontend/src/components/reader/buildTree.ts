import type { TreeNode } from '@/http/tree'

export type TreeItem = {
  name: string
  path: string
  type: 'blob' | 'tree'
  children: TreeItem[]
}

// Turns GitHub's flat path list into a nested folder structure, folders first
// then files, each alphabetically.
export function buildTree(nodes: TreeNode[]): TreeItem[] {
  const root: TreeItem = { name: '', path: '', type: 'tree', children: [] }
  const dirIndex = new Map<string, TreeItem>([['', root]])

  const ensureDir = (path: string): TreeItem => {
    const existing = dirIndex.get(path)
    if (existing) return existing
    const slash = path.lastIndexOf('/')
    const parent = ensureDir(slash === -1 ? '' : path.slice(0, slash))
    const dir: TreeItem = {
      name: path.slice(slash + 1),
      path,
      type: 'tree',
      children: [],
    }
    parent.children.push(dir)
    dirIndex.set(path, dir)
    return dir
  }

  for (const node of nodes) {
    if (node.type === 'tree') {
      ensureDir(node.path)
      continue
    }
    const slash = node.path.lastIndexOf('/')
    const parent = ensureDir(slash === -1 ? '' : node.path.slice(0, slash))
    parent.children.push({
      name: node.path.slice(slash + 1),
      path: node.path,
      type: 'blob',
      children: [],
    })
  }

  const sortRec = (item: TreeItem) => {
    item.children.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'tree' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    item.children.forEach(sortRec)
  }
  sortRec(root)

  // Drop folders that contain no markdown anywhere beneath them.
  const prune = (item: TreeItem): boolean => {
    item.children = item.children.filter((c) => (c.type === 'blob' ? true : prune(c)))
    return item.children.length > 0
  }
  prune(root)

  return root.children
}
