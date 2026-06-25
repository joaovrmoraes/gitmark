export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

// Thin fetch wrapper for the GitMark API. Auth is mocked for now; once OAuth
// lands a session cookie will ride along automatically via credentials.
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body != null ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  if (res.status === 204) return undefined as T

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `Request failed: ${res.status}` }))
    throw new Error((err as { message?: string }).message ?? `Request failed: ${res.status}`)
  }

  return res.json() as Promise<T>
}
