interface BadgeProps {
  percentage: number
  size?: 'sm' | 'md'
}

export function Badge({ percentage, size = 'md' }: BadgeProps) {
  const color =
    percentage >= 80 ? 'bg-success text-white' :
    percentage >= 60 ? 'bg-accent text-white' :
    'bg-text-muted/20 text-text-muted'

  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'

  return (
    <span className={`font-heebo font-bold rounded-full ${color} ${sizeClass}`}>
      {percentage}%
    </span>
  )
}
