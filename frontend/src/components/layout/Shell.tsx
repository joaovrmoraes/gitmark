import type { ReactNode } from 'react'
import { SidebarDesktop } from './Sidebar.desktop'
import { TopBarMobile } from './TopBar.mobile'

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-canvas-soft text-ink">
      <div className="hidden md:flex">
        <SidebarDesktop />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="md:hidden">
          <TopBarMobile />
        </div>
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
