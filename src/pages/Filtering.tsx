import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ProgressBar } from '../components/ui/ProgressBar'
import { ProfessionCard } from '../components/ProfessionCard'
import { Confetti } from '../components/ui/Confetti'
import { type Profession, getProfessionsByIds } from '../data/professions'
import { useAuth } from '../contexts/AuthContext'
import { usePremium } from '../hooks/usePremium'
import { supabase } from '../lib/supabase'
import { setCurrentStep } from '../hooks/useQuestionnaire'

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
  const [sessionId] = useState(() => localStorage.getItem('cc_sessionId') || sessionStorage.getItem('sessionId') || '')
  const { isPremium } = usePremium()

  // Load matched professions from questionnaire (try localStorage first, then sessionStorage)
  useEffect(() => {
    const stored = localStorage.getItem('cc_matchedProfessions') || sessionStorage.getItem('matchedProfessions')
    if (!stored) {
      // No professions — questionnaire not completed, redirect back
      navigate('/questionnaire')
      return
    }
    setCurrentStep('filtering')
    const ids = JSON.parse(stored) as number[]
    setRoundProfessions(getProfessionsByIds(ids))
  }, [])

  const currentProfession = roundProfessions[currentIdx]
  const roundConfig = rounds[round]
  const isLastCard = currentIdx >= roundProfessions.length - 1

  const handleAction = useCallback((action: Action) => {
    if (!currentProfession) return
    const id = currentProfession.id

    // Update state for UI
    switch (action) {
      case 'selected': setSelected(p => [...p, id]); break
      case 'rejected': setRejected(p => [...p, id]); break
      case 'maybe': setMaybe(p => [...p, id]); break
      case 'unknown': setUnknown(p => [...p, id]); break
    }

    if (isLastCard) {
      // Pass the last card's action explicitly — React state hasn't updated yet
      finishRound(id, action)
    } else {
      setCurrentIdx(p => p + 1)
    }
  }, [currentProfession, isLastCard])

  const finishRound = async (lastId?: number, lastAction?: Action) => {
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 3000)

    // Include the last card's action — React state hasn't updated yet
    const allSelected = lastAction === 'selected' && lastId ? [...selected, lastId] : selected
    const allRejected = lastAction === 'rejected' && lastId ? [...rejected, lastId] : rejected
    const allMaybe = lastAction === 'maybe' && lastId ? [...maybe, lastId] : maybe
    const allUnknown = lastAction === 'unknown' && lastId ? [...unknown, lastId] : unknown

    // Save round to DB
    if (user && sessionId) {
      await supabase.from('filtering_rounds').insert({
        session_id: sessionId,
        user_id: user.id,
        round_number: round + 1,
        input_professions: roundProfessions.map(p => p.id),
        selected_professions: allSelected,
        rejected_professions: allRejected,
        maybe_professions: allMaybe,
        unknown_professions: allUnknown,
      })
    }

    // Determine next round — ensure minimum professions
    const nextProfessions = [...allSelected, ...allMaybe]

    // Fill from unknown/rejected if too few
    const fillFrom = [...allUnknown, ...allRejected]
    while (nextProfessions.length < 3 && fillFrom.length > 0) {
      nextProfessions.push(fillFrom.shift()!)
    }

    const advanceRound = (nextRound: number) => {
      setRound(nextRound)
      setRoundProfessions(getProfessionsByIds(nextProfessions))
      setCurrentIdx(0)
      setSelected([])
      setRejected([])
      setMaybe([])
      setUnknown([])
    }

    if (round === 0) {
      // Round 1 done — check premium for round 2+
      if (!isPremium) {
        // Free users: save top 5 and go to results
        const freeResults = allSelected.length > 0 ? allSelected.slice(0, 5) : nextProfessions.slice(0, 5)
        localStorage.setItem('cc_finalProfessions', JSON.stringify(freeResults))
        sessionStorage.setItem('finalProfessions', JSON.stringify(freeResults))
        navigate('/premium')
        return
      }
      advanceRound(1)
    } else if (round === 1) {
      advanceRound(2)
    } else {
      // Round 3 complete
      const finalProfessions = allSelected.length >= 3
        ? allSelected.slice(0, 3)
        : [...allSelected, ...allMaybe].slice(0, 3)

      localStorage.setItem('cc_finalProfessions', JSON.stringify(finalProfessions))
      localStorage.setItem('cc_round2Professions', JSON.stringify(roundProfessions.map(p => p.id)))
      sessionStorage.setItem('finalProfessions', JSON.stringify(finalProfessions))
      sessionStorage.setItem('round2Professions', JSON.stringify(roundProfessions.map(p => p.id)))
      setCurrentStep('mirror')
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
                matchPercentage={60 + (currentProfession.id * 7 + round * 13) % 35}
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
