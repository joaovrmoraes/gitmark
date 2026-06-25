import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Shell } from '@/components/layout/Shell'
import { Spinner } from '@/components/ui/Spinner'

const SignIn = lazy(() => import('@/pages/SignIn'))
const Repos = lazy(() => import('@/pages/Repos'))
const Browse = lazy(() => import('@/pages/Browse'))

function PageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas-soft">
      <Spinner />
    </div>
  )
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <PageFallback />
  if (!user) return <Navigate to="/signin" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/signin" element={<SignIn />} />

          {/* Immersive, full-screen reader — no app chrome (Kindle-style). */}
          <Route
            path="/browse/:owner/:repo"
            element={
              <RequireAuth>
                <Browse />
              </RequireAuth>
            }
          />

          {/* Everything else lives inside the app shell. */}
          <Route
            path="*"
            element={
              <RequireAuth>
                <Shell>
                  <Suspense fallback={<PageFallback />}>
                    <Routes>
                      <Route path="/" element={<Navigate to="/repos" replace />} />
                      <Route path="/repos" element={<Repos />} />
                      <Route path="*" element={<Navigate to="/repos" replace />} />
                    </Routes>
                  </Suspense>
                </Shell>
              </RequireAuth>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
