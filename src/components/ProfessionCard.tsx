import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion'
import { Badge } from './ui/Badge'
import { Check, X, HelpCircle, CircleHelp } from 'lucide-react'
import type { Profession } from '../data/professions'

type Action = 'selected' | 'rejected' | 'maybe' | 'unknown'

interface ProfessionCardProps {
  profession: Profession
  matchPercentage?: number
  variant: 'small' | 'medium' | 'full'
  onAction: (action: Action) => void
  showDescription?: boolean
  salaryRange?: string
  educationRequired?: string
  workEnvironment?: string
}

export function ProfessionCard({
  profession,
  matchPercentage = 75,
  variant,
  onAction,
  showDescription = true,
  salaryRange,
  educationRequired,
  workEnvironment,
}: ProfessionCardProps) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-15, 15])
  const bgRight = useTransform(x, [0, 100], ['rgba(16,185,129,0)', 'rgba(16,185,129,0.15)'])
  const bgLeft = useTransform(x, [-100, 0], ['rgba(239,68,68,0.15)', 'rgba(239,68,68,0)'])

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 100) onAction('selected')
    else if (info.offset.x < -100) onAction('rejected')
  }

  return (
    <motion.div
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      whileHover={{ y: -2 }}
      className="relative cursor-grab active:cursor-grabbing"
    >
      <motion.div
        style={{ background: bgRight }}
        className="absolute inset-0 rounded-2xl pointer-events-none"
      />
      <motion.div
        style={{ background: bgLeft }}
        className="absolute inset-0 rounded-2xl pointer-events-none"
      />

      <div className={`bg-bg-card rounded-2xl shadow-sm border border-border p-5 ${
        variant === 'full' ? 'min-h-[220px]' : variant === 'medium' ? 'min-h-[180px]' : 'min-h-[140px]'
      }`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-heebo font-bold text-lg leading-tight">{profession.name}</h3>
            <span className="text-xs text-text-muted bg-primary-light/40 px-2 py-0.5 rounded-full">
              {profession.category}
            </span>
          </div>
          <Badge percentage={matchPercentage} />
        </div>

        {/* Description */}
        {showDescription && (
          <p className="text-sm text-text-muted mb-3">{profession.description}</p>
        )}

        {/* Extended info for medium/full */}
        {(variant === 'medium' || variant === 'full') && (
          <div className="flex flex-wrap gap-2 mb-3 text-xs">
            {salaryRange && (
              <span className="bg-bg px-2 py-1 rounded-lg text-text-muted">
                שכר: {salaryRange}
              </span>
            )}
            {educationRequired && (
              <span className="bg-bg px-2 py-1 rounded-lg text-text-muted">
                השכלה: {educationRequired}
              </span>
            )}
            {workEnvironment && (
              <span className="bg-bg px-2 py-1 rounded-lg text-text-muted">
                סביבה: {workEnvironment}
              </span>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 mt-auto">
          <button
            onClick={() => onAction('selected')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-success/10 text-success font-heebo font-bold text-sm hover:bg-success/20 transition-colors"
          >
            <Check className="w-4 h-4" /> מתאים
          </button>
          <button
            onClick={() => onAction('rejected')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-500/10 text-red-500 font-heebo font-bold text-sm hover:bg-red-500/20 transition-colors"
          >
            <X className="w-4 h-4" /> לא מתאים
          </button>
          <button
            onClick={() => onAction('maybe')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-accent/10 text-accent font-heebo font-bold text-sm hover:bg-accent/20 transition-colors"
          >
            <HelpCircle className="w-4 h-4" /> אולי
          </button>
          <button
            onClick={() => onAction('unknown')}
            className="flex items-center justify-center px-3 py-2.5 rounded-xl bg-text-muted/10 text-text-muted text-sm hover:bg-text-muted/20 transition-colors"
          >
            <CircleHelp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
