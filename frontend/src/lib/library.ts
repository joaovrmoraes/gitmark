import { useSyncExternalStore } from 'react'

// The user's curated library of vaults. Persisted in localStorage for now —
// this module is the ONLY place that knows where it's stored, so swapping in a
// backend/DB later means changing just this file.

export type Vault = {
  owner: string
  name: string
  fullName: string
  description: string
  /** epoch ms when added */
  addedAt: number
}

const KEY = 'gitmark-library'

function load(): Vault[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? (JSON.parse(raw) as Vault[]) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

let vaults: Vault[] = load()
const listeners = new Set<() => void>()
const id = (owner: string, name: string) => `${owner}/${name}`.toLowerCase()

function commit(next: Vault[]) {
  vaults = next
  try {
    localStorage.setItem(KEY, JSON.stringify(vaults))
  } catch {
    /* ignore quota errors */
  }
  listeners.forEach((l) => l())
}

export function getVaults(): Vault[] {
  return vaults
}

export function hasVault(owner: string, name: string): boolean {
  return vaults.some((v) => id(v.owner, v.name) === id(owner, name))
}

export function addVault(v: Omit<Vault, 'addedAt'>) {
  if (hasVault(v.owner, v.name)) return
  commit([{ ...v, addedAt: Date.now() }, ...vaults])
}

export function removeVault(owner: string, name: string) {
  commit(vaults.filter((v) => id(v.owner, v.name) !== id(owner, name)))
}

export function useLibrary() {
  const list = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => vaults,
    () => vaults,
  )
  return { vaults: list, addVault, removeVault, hasVault }
}

// Parse "owner/repo", a full GitHub URL, or a git URL into {owner, name}.
export function parseRepoRef(input: string): { owner: string; name: string } | null {
  const s = input.trim()
  if (!s) return null
  // Full/partial URL
  const urlMatch = s.match(/github\.com[/:]([^/]+)\/([^/#?]+)/i)
  if (urlMatch) {
    return { owner: urlMatch[1], name: urlMatch[2].replace(/\.git$/i, '') }
  }
  // owner/repo
  const shortMatch = s.match(/^([\w.-]+)\/([\w.-]+)$/)
  if (shortMatch) {
    return { owner: shortMatch[1], name: shortMatch[2].replace(/\.git$/i, '') }
  }
  return null
}
