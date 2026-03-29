import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brain, Filter, Users, FileText, Play, Crown, ChevronLeft } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useAuth } from '../contexts/AuthContext'

const steps = [
  { key: 'questionnaire', icon: Brain, title: 'שאלון AI', desc: 'ענה על שאלות חווייתיות', route: '/questionnaire', color: 'text-blue-500' },
  { key: 'filtering', icon: Filter, title: 'סינון מקצועות', desc: 'צמצם ל-3 מקצועות', route: '/filtering', color: 'text-purple-500' },
  { key: 'mirror', icon: Users, title: 'ראיית מראה', desc: 'הזמן 4 מכרים', route: '/mirror', color: 'text-accent-dark', premium: true },
  { key: 'results', icon: FileText, title: 'דוח סינתזה', desc: 'צפה בתוצאות המלאות', route: '/results', color: 'text-success', premium: true },
]

export function Dashboard() {
  const navigate = useNavigate()
  const { profile } = useAuth()

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

        {/* Quick Start */}
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

        {/* Steps */}
        <h2 className="font-heebo font-bold text-lg mb-4">שלבי התהליך</h2>
        <div className="space-y-3 mb-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i }}
            >
              <Card
                onClick={() => navigate(step.route)}
                className="flex items-center gap-4"
              >
                <div className={`w-11 h-11 rounded-xl bg-primary-light/50 flex items-center justify-center`}>
                  <step.icon className={`w-5 h-5 ${step.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heebo font-bold text-sm">{step.title}</h3>
                    {step.premium && (
                      <span className="flex items-center gap-0.5 text-xs bg-accent/20 text-accent-dark px-2 py-0.5 rounded-full">
                        <Crown className="w-3 h-3" /> פרימיום
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted">{step.desc}</p>
                </div>
                <ChevronLeft className="w-5 h-5 text-text-muted" />
              </Card>
            </motion.div>
          ))}
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
