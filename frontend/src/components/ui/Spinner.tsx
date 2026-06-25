export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-mute">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-ink border-t-transparent" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  )
}
