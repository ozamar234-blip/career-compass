import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brain, Filter, Users, FileText, Play, Crown, ChevronLeft, RotateCcw, CheckCircle2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useAuth } from '../contexts/AuthContext'
import { getCurrentStep, type FlowStep } from '../hooks/useQuestionnaire'

const steps = [
  { key: 'questionnaire', icon: Brain, title: 'שאלון AI', desc: 'ענה על שאלות חווייתיות', route: '/questionnaire', color: 'text-blue-500' },
  { key: 'filtering', icon: Filter, title: 'סינון מקצועות', desc: 'צמצם ל-3 מקצועות', route: '/filtering', color: 'text-purple-500' },
  { key: 'mirror', icon: Users, title: 'ראיית מראה', desc: 'הזמן 4 מכרים', route: '/mirror', color: 'text-accent-dark', premium: true },
  { key: 'results', icon: FileText, title: 'דוח סינתזה', desc: 'צפה בתוצאות המלאות', route: '/results', color: 'text-success', premium: true },
]

const stepOrder: FlowStep[] = ['questionnaire', 'filtering', 'mirror', 'results']

function getStepStatus(stepKey: string, currentStep: FlowStep, _answersCount: number) {
  if (!currentStep) return 'not_started'
  const currentIdx = stepOrder.indexOf(currentStep)
  const stepIdx = stepOrder.indexOf(stepKey as FlowStep)
  if (stepIdx < currentIdx) return 'completed'
  if (stepIdx === currentIdx) return 'in_progress'
  return 'not_started'
}

export function Dashboard() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [currentStep, setCurrentStep] = useState<FlowStep>(null)
  const [answersCount, setAnswersCount] = useState(0)

  useEffect(() => {
    setCurrentStep(getCurrentStep())
    try {
      const answers = localStorage.getItem('cc_answers')
      if (answers) setAnswersCount(JSON.parse(answers).length)
    } catch { /* ignore */ }
  }, [])

  const handleContinue = () => {
    if (currentStep) {
      const stepInfo = steps.find(s => s.key === currentStep)
      if (stepInfo) navigate(stepInfo.route)
    } else {
      navigate('/questionnaire')
    }
  }

  const handleStartNew = () => {
    // Clear all saved progress
    localStorage.removeItem('cc_sessionId')
    localStorage.removeItem('cc_answers')
    localStorage.removeItem('cc_matchedProfessions')
    localStorage.removeItem('cc_finalProfessions')
    localStorage.removeItem('cc_round2Professions')
    localStorage.removeItem('cc_currentStep')
    sessionStorage.clear()
    navigate('/questionnaire')
  }

  const hasProgress = currentStep !== null

  return (
    <div className="px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-heebo font-black text-primary mb-1">
            שלום{profile?.full_name ? `, ${profile.full_name}` : ''}!
          </h1>
          <p className="text-text-muted">בוא נגלה את המקצוע שמתאים לך</p>
        </div>

        {/* Continue / Start CTA */}
        {hasProgress ? (
          <Card className="mb-6 bg-gradient-to-l from-primary to-primary/90 !border-0 text-white">
            <div className="mb-3">
              <h2 className="font-heebo font-bold text-lg mb-1">יש לך תהליך פתוח!</h2>
              <p className="text-white/80 text-sm">
                {currentStep === 'questionnaire' && answersCount > 0
                  ? `ענית על ${answersCount} שאלות — המשך מאיפה שעצרת`
                  : currentStep === 'filtering'
                  ? 'סיימת את השאלון — ממשיך לסינון מקצועות'
                  : currentStep === 'mirror'
                  ? 'סיימת את הסינון — ממשיך לראיית מראה'
                  : currentStep === 'results'
                  ? 'הכל מוכן — צפה בתוצאות'
                  : 'המשך מאיפה שעצרת'
                }
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={handleContinue}
                className="flex-1 !bg-white/20 !text-white hover:!bg-white/30 !border-0"
              >
                <span className="flex items-center justify-center gap-2">
                  <Play className="w-5 h-5" />
                  המשך
                </span>
              </Button>
              <button
                onClick={handleStartNew}
                className="px-4 py-2 rounded-xl bg-white/10 text-white/70 text-sm hover:bg-white/20 transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-4 h-4" />
                התחל מחדש
              </button>
            </div>
          </Card>
        ) : (
          <Card className="mb-6 bg-gradient-to-l from-primary to-primary/90 !border-0 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heebo font-bold text-lg mb-1">התחל את התהליך</h2>
                <p className="text-white/80 text-sm">שאלון AI חכם — לוקח 10 דקות</p>
              </div>
              <button
                onClick={() => navigate('/questionnaire')}
                className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <Play className="w-6 h-6 text-white" />
              </button>
            </div>
          </Card>
        )}

        {/* Steps */}
        <h2 className="font-heebo font-bold text-lg mb-4">שלבי התהליך</h2>
        <div className="space-y-3 mb-8">
          {steps.map((step, i) => {
            const status = getStepStatus(step.key, currentStep, answersCount)
            return (
              <motion.div
                key={step.key}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i }}
              >
                <Card
                  onClick={() => navigate(step.route)}
                  className={`flex items-center gap-4 ${status === 'completed' ? 'opacity-70' : ''}`}
                >
                  <div className={`w-11 h-11 rounded-xl bg-primary-light/50 flex items-center justify-center`}>
                    {status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    ) : (
                      <step.icon className={`w-5 h-5 ${step.color}`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-heebo font-bold text-sm">{step.title}</h3>
                      {step.premium && (
                        <span className="flex items-center gap-0.5 text-xs bg-accent/20 text-accent-dark px-2 py-0.5 rounded-full">
                          <Crown className="w-3 h-3" /> פרימיום
                        </span>
                      )}
                      {status === 'in_progress' && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
                          בתהליך
                        </span>
                      )}
                      {status === 'completed' && (
                        <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full font-bold">
                          הושלם
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted">
                      {status === 'in_progress' && step.key === 'questionnaire' && answersCount > 0
                        ? `${answersCount} שאלות הושלמו`
                        : step.desc
                      }
                    </p>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-text-muted" />
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Premium CTA */}
        <Card className="bg-gradient-to-l from-accent/10 to-accent-dark/10 !border-accent/30">
          <div className="flex items-center gap-3 mb-3">
            <Crown className="w-6 h-6 text-accent-dark" />
            <h3 className="font-heebo font-bold">שדרג לפרימיום</h3>
          </div>
          <p className="text-sm text-text-muted mb-4">
            קבל שאלון מלא, 3 סבבי סינון, ראיית מראה ודוח AI מלא
          </p>
          <Button variant="accent" fullWidth onClick={() => navigate('/premium')}>
            שדרג עכשיו — 49 ש"ח
          </Button>
        </Card>
      </motion.div>
    </div>
  )
}
