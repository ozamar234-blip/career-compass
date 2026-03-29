import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Crown, Check, Shield, Sparkles } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

const features = [
  'שאלון AI מלא — 25 שאלות אדפטיביות',
  '3 סבבי סינון מקצועות',
  'ראיית מראה — 4 מכרים',
  'דוח סינתזה AI מלא',
  'צעדים מעשיים לכל מקצוע',
  'שמירת PDF',
]

export function Premium() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handlePayment = async () => {
    setLoading(true)
    // TODO: Integrate with payment provider (Bit / PayBox / Stripe)
    // For now, simulate payment
    setTimeout(() => {
      setLoading(false)
      navigate('/dashboard')
    }, 2000)
  }

  return (
    <div className="px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-sm mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-accent-dark" />
          </div>
          <h1 className="text-2xl font-heebo font-black text-primary mb-2">
            רוצה לדייק?
          </h1>
          <p className="text-text-muted">
            עם פרימיום אתה מקבל את התמונה המלאה
          </p>
        </div>

        {/* Price */}
        <Card className="text-center mb-6 bg-gradient-to-b from-accent/5 to-transparent !border-accent/30">
          <div className="flex items-center justify-center gap-1 mb-2">
            <Sparkles className="w-5 h-5 text-accent" />
            <span className="text-sm text-text-muted">מחיר חד-פעמי</span>
          </div>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-5xl font-heebo font-black text-primary">49</span>
            <span className="text-xl font-heebo text-text-muted">ש"ח</span>
          </div>
        </Card>

        {/* Features */}
        <div className="space-y-3 mb-8">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
              className="flex items-center gap-3"
            >
              <div className="w-6 h-6 bg-success/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-success" />
              </div>
              <span className="text-sm">{f}</span>
            </motion.div>
          ))}
        </div>

        {/* Payment */}
        <Button fullWidth size="lg" variant="accent" onClick={handlePayment} loading={loading}>
          שדרג עכשיו — 49 ש"ח
        </Button>

        <div className="flex items-center justify-center gap-2 mt-4 text-text-muted text-xs">
          <Shield className="w-4 h-4" />
          <span>תשלום מאובטח — אחריות 100%</span>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="w-full text-center text-sm text-text-muted hover:text-primary mt-6 transition-colors"
        >
          חזור — אני רוצה להמשיך בחינם
        </button>
      </motion.div>
    </div>
  )
}
