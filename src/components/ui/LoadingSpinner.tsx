export function LoadingSpinner({ text = 'טוען...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <div className="w-10 h-10 border-4 border-primary-light border-t-primary rounded-full animate-spin" />
      <p className="text-text-muted font-assistant">{text}</p>
    </div>
  )
}
