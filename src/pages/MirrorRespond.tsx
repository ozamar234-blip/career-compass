import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, Compass, Send, Check } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { supabase } from '../lib/supabase'
import { getProfessionsByIds, type Profession } from '../data/professions'
import { Confetti } from '../components/ui/Confetti'

interface MirrorQuestion {
  id: string
  text: string
  type: 'open' | 'choice'
  choices?: string[]
}

export function MirrorRespond() {
  const { token } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userName, setUserName] = useState('')
  const [invitation, setInvitation] = useState<{ id: string; session_id: string } | null>(null)
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [inputValue, setInputValue] = useState('')
  const [professions, setProfessions] = useState<Profession[]>([])
  const [selectedProfessions, setSelectedProfessions] = useState<number[]>([])
  const [step, setStep] = useState<'questions' | 'professions' | 'done'>('questions')
  const [showConfetti, setShowConfetti] = useState(false)

  const questions: MirrorQuestion[] = [
    { id: 'm1', text: `באיזה מצבים ${userName || 'החבר/ה שלך'} הכי זורח/ת?`, type: 'open' },
    { id: 'm2', text: `מה החוזקה הכי ברורה של ${userName || 'החבר/ה שלך'}?`, type: 'choice', choices: ['תקשורת ויחסים', 'חשיבה אנליטית', 'יצירתיות', 'ארגון וסדר', 'מנהיגות', 'פתרון בעיות טכניות', 'אמפתיה וטיפול', 'אחר'] },
    { id: 'm3', text: `איזה תפקיד היית רואה את ${userName || 'החבר/ה שלך'} עושה?`, type: 'open' },
    { id: 'm4', text: `מה ${userName || 'החבר/ה שלך'} עושה טוב בלי שהוא/היא שמ/ה לב?`, type: 'open' },
  ]

  useEffect(() => {
    validateToken()
  }, [token])

  const validateToken = async () => {
    if (!token) { setError('קישור לא תקין'); setLoading(false); return }

    // Try to validate via edge function, fallback to direct query
    try {
      const { data, error } = await supabase.functions.invoke('validate-mirror-token', {
        body: { token },
      })
      if (error) throw error
      setUserName(data.user_name)
      setInvitation({ id: data.invitation_id, session_id: data.session_id })
      if (data.professions) setProfessions(data.professions)
    } catch {
      // Fallback for demo
      setUserName('החבר/ה שלך')
      setInvitation({ id: 'demo', session_id: 'demo' })
      // Load professions from sessionStorage or use random
      const stored = sessionStorage.getItem('round2Professions')
      if (stored) {
        setProfessions(getProfessionsByIds(JSON.parse(stored)))
      } else {
        setProfessions(getProfessionsByIds([1, 5, 17, 36, 60, 68, 81, 94]))
      }
    }
    setLoading(false)
  }

  const handleAnswer = (answer: string) => {
    const q = questions[currentQ]
    setAnswers(prev => ({ ...prev, [q.id]: answer }))
    setInputValue('')

    if (currentQ < questions.length - 1) {
      setCurrentQ(p => p + 1)
    } else {
      setStep('professions')
    }
  }

  const toggleProfession = (id: number) => {
    setSelectedProfessions(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : prev.length < 3 ? [...prev, id] : prev
    )
  }

  const submitAll = async () => {
    if (!invitation) return
    setLoading(true)

    await supabase.from('mirror_responses').insert({
      invitation_id: invitation.id,
      session_id: invitation.session_id,
      friend_name: 'מכר',
      answers: {
        shining_moments: answers['m1'],
        top_strength: answers['m2'],
        ideal_role: answers['m3'],
        hidden_talent: answers['m4'],
      },
      selected_professions: selectedProfessions,
    })

    // Update invitation status
    await supabase
      .from('mirror_invitations')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', invitation.id)

    setStep('done')
    setShowConfetti(true)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-light border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <Compass className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h2 className="font-heebo font-bold text-xl mb-2">קישור לא תקין</h2>
          <p className="text-text-muted">{error}</p>
        </div>
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center">
        <Confetti active={showConfetti} />
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-success" />
          </div>
          <h2 className="font-heebo font-bold text-2xl mb-2">תודה רבה!</h2>
          <p className="text-text-muted">
            התשובות שלך יעזרו ל-{userName} לגלות את המקצוע שמתאים לו.
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-6 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Compass className="w-6 h-6 text-primary" />
        </div>
        <h1 className="font-heebo font-bold text-xl text-primary mb-1">
          עוזרים ל-{userName} לגלות את המקצוע שלו
        </h1>
        <p className="text-text-muted text-sm">זה לוקח 3 דקות</p>
      </div>

      {step === 'questions' && (
        <motion.div
          key={currentQ}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-md mx-auto"
        >
          <p className="text-xs text-accent font-heebo font-bold mb-2">
            שאלה {currentQ + 1} מתוך {questions.length}
          </p>
          <h2 className="font-heebo font-bold text-lg mb-5">
            {questions[currentQ].text}
          </h2>

          {questions[currentQ].type === 'open' ? (
            <div className="space-y-3">
              <textarea
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="כתוב כאן..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-border bg-bg-card resize-none focus:outline-none focus:border-primary"
              />
              <Button fullWidth onClick={() => handleAnswer(inputValue)} disabled={!inputValue.trim()}>
                <span className="flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" /> הבא
                </span>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {questions[currentQ].choices?.map(c => (
                <button
                  key={c}
                  onClick={() => handleAnswer(c)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-bg-card text-right hover:border-primary hover:bg-primary-light/20 transition-colors text-sm"
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {step === 'professions' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md mx-auto">
          <h2 className="font-heebo font-bold text-lg mb-2 text-center">
            איזה 3 מקצועות הכי מתאימים ל-{userName}?
          </h2>
          <p className="text-text-muted text-sm text-center mb-6">
            בחר/י עד 3 מקצועות ({selectedProfessions.length}/3)
          </p>

          <div className="space-y-2 mb-6">
            {professions.map(p => (
              <button
                key={p.id}
                onClick={() => toggleProfession(p.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-right ${
                  selectedProfessions.includes(p.id)
                    ? 'border-primary bg-primary-light/30'
                    : 'border-border bg-bg-card hover:border-primary/50'
                }`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  selectedProfessions.includes(p.id) ? 'border-primary bg-primary' : 'border-border'
                }`}>
                  {selectedProfessions.includes(p.id) && <Check className="w-4 h-4 text-white" />}
                </div>
                <div>
                  <p className="font-heebo font-bold text-sm">{p.name}</p>
                  <p className="text-xs text-text-muted">{p.description}</p>
                </div>
              </button>
            ))}
          </div>

          <Button fullWidth size="lg" onClick={submitAll} disabled={selectedProfessions.length === 0} loading={loading}>
            שלח תשובות
          </Button>
        </motion.div>
      )}
    </div>
  )
}
