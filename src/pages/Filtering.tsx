import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ProgressBar } from '../components/ui/ProgressBar'
import { ProfessionCard } from '../components/ProfessionCard'
import { Confetti } from '../components/ui/Confetti'
import { professions, type Profession, getProfessionsByIds } from '../data/professions'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

type Action = 'selected' | 'rejected' | 'maybe' | 'unknown'
type CardVariant = 'small' | 'medium' | 'full'

interface RoundConfig {
  number: number
  title: string
  subtitle: string
  variant: CardVariant
}

const rounds: RoundConfig[] = [
  { number: 1, title: 'סבב ראשון', subtitle: 'בואו נצמצם — סמנו מה מרגיש נכון', variant: 'small' },
  { number: 2, title: 'סבב שני', subtitle: 'עכשיו עם יותר מידע — בחרו בזהירות', variant: 'medium' },
  { number: 3, title: 'סבב אחרון', subtitle: 'בחרו את 3 המקצועות הסופיים', variant: 'full' },
]

export function Filtering() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [round, setRound] = useState(0)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [roundProfessions, setRoundProfessions] = useState<Profession[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [rejected, setRejected] = useState<number[]>([])
  const [maybe, setMaybe] = useState<number[]>([])
  const [unknown, setUnknown] = useState<number[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const [sessionId] = useState(() => sessionStorage.getItem('sessionId') || '')

  // Load matched professions from questionnaire
  useEffect(() => {
    const stored = sessionStorage.getItem('matchedProfessions')
    if (stored) {
      const ids = JSON.parse(stored) as number[]
      setRoundProfessions(getProfessionsByIds(ids))
    } else {
      // Demo fallback: pick random 25
      const shuffled = [...professions].sort(() => Math.random() - 0.5)
      setRoundProfessions(shuffled.slice(0, 25))
    }
  }, [])

  const currentProfession = roundProfessions[currentIdx]
  const roundConfig = rounds[round]
  const isLastCard = currentIdx >= roundProfessions.length - 1

  const handleAction = useCallback((action: Action) => {
    if (!currentProfession) return
    const id = currentProfession.id

    switch (action) {
      case 'selected': setSelected(p => [...p, id]); break
      case 'rejected': setRejected(p => [...p, id]); break
      case 'maybe': setMaybe(p => [...p, id]); break
      case 'unknown': setUnknown(p => [...p, id]); break
    }

    if (isLastCard) {
      finishRound()
    } else {
      setCurrentIdx(p => p + 1)
    }
  }, [currentProfession, isLastCard])

  const finishRound = async () => {
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 3000)

    // Save round to DB
    if (user && sessionId) {
      await supabase.from('filtering_rounds').insert({
        session_id: sessionId,
        user_id: user.id,
        round_number: round + 1,
        input_professions: roundProfessions.map(p => p.id),
        selected_professions: selected,
        rejected_professions: rejected,
        maybe_professions: maybe,
        unknown_professions: unknown,
      })
    }

    // Determine next round
    const nextProfessions = [...selected, ...maybe]

    if (round === 0) {
      // Round 1 → 2: selected + maybe go to round 2
      if (nextProfessions.length < 5) {
        // Add back some unknown
        const extra = unknown.slice(0, 5 - nextProfessions.length)
        nextProfessions.push(...extra)
      }

      // Check if premium — if not, show paywall
      // For now, continue to round 2
      setRound(1)
      setRoundProfessions(getProfessionsByIds(nextProfessions))
      setCurrentIdx(0)
      setSelected([])
      setRejected([])
      setMaybe([])
      setUnknown([])
    } else if (round === 1) {
      // Round 2 → 3
      setRound(2)
      setRoundProfessions(getProfessionsByIds(nextProfessions))
      setCurrentIdx(0)
      setSelected([])
      setRejected([])
      setMaybe([])
      setUnknown([])
    } else {
      // Round 3 complete — go to mirror or results
      const finalProfessions = selected.slice(0, 3)
      sessionStorage.setItem('finalProfessions', JSON.stringify(finalProfessions))
      sessionStorage.setItem('round2Professions', JSON.stringify(roundProfessions.map(p => p.id)))

      // Navigate to mirror for premium, results for free
      navigate('/mirror')
    }
  }

  if (roundProfessions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <p className="text-text-muted">אין מקצועות לסינון. חזור לשאלון.</p>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex flex-col px-6 py-6">
      <Confetti active={showConfetti} />

      {/* Round header */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-heebo font-bold text-primary">{roundConfig.title}</h2>
        <p className="text-text-muted text-sm">{roundConfig.subtitle}</p>
      </div>

      {/* Progress */}
      <ProgressBar
        current={currentIdx + 1}
        total={roundProfessions.length}
        label={`נשארו ${roundProfessions.length - currentIdx - 1} מקצועות`}
      />

      {/* Card */}
      <div className="flex-1 flex items-center justify-center py-6">
        <AnimatePresence mode="wait">
          {currentProfession && (
            <motion.div
              key={currentProfession.id}
              initial={{ opacity: 0, scale: 0.9, x: 50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: -50 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <ProfessionCard
                profession={currentProfession}
                variant={roundConfig.variant}
                onAction={handleAction}
                matchPercentage={Math.floor(60 + Math.random() * 35)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats */}
      <div className="flex justify-center gap-4 text-xs text-text-muted">
        <span className="text-success font-bold">{selected.length} מתאים</span>
        <span className="text-red-500 font-bold">{rejected.length} לא מתאים</span>
        <span className="text-accent font-bold">{maybe.length} אולי</span>
      </div>

      {/* Swipe hint */}
      <p className="text-center text-text-muted/60 text-xs mt-3">
        החלק ימינה למתאים, שמאלה ללא מתאים
      </p>
    </div>
  )
}
