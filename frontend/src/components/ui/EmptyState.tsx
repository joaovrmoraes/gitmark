import type { ReactNode } from 'react'

type Props = {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg bg-canvas-soft px-6 py-16 text-center">
      {icon && <div className="mb-1 text-mute">{icon}</div>}
      <h3 className="text-base font-medium text-ink">{title}</h3>
      {description && <p className="max-w-sm text-sm text-body">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
