import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Crown, Check, Shield, Sparkles, CreditCard } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useAuth } from '../contexts/AuthContext'
import { useAnalytics } from '../hooks/useAnalytics'
import { supabase } from '../lib/supabase'

const features = [
  'שאלון AI מלא — 25 שאלות אדפטיביות',
  '3 סבבי סינון מקצועות',
  'ראיית מראה — 4 מכרים',
  'דוח סינתזה AI מלא',
  'צעדים מעשיים לכל מקצוע',
  'שמירת PDF',
]

type PaymentMethod = 'bit' | 'paybox' | 'stripe' | null

export function Premium() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { track } = useAnalytics()
  const [loading, setLoading] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null)
  const [error, setError] = useState('')

  const handlePayment = async () => {
    if (!user) { navigate('/auth'); return }
    if (!selectedMethod) { setError('בחר אמצעי תשלום'); return }

    setError('')
    setLoading(true)
    track({ name: 'premium_purchase_start', properties: { method: selectedMethod } })

    try {
      // Create a pending payment record
      const { data: payment, error: dbError } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          session_id: localStorage.getItem('cc_sessionId') || sessionStorage.getItem('sessionId') || undefined,
          plan: 'premium',
          amount: 49,
          status: 'pending',
          payment_provider: selectedMethod,
        })
        .select()
        .single()

      if (dbError) throw dbError

      // Redirect to payment provider
      // Each provider would return a checkout URL from an Edge Function
      const { data: checkout, error: checkoutError } = await supabase.functions.invoke('create-checkout', {
        body: { payment_id: payment.id, method: selectedMethod, amount: 49 },
      })

      if (checkoutError || !checkout?.url) {
        // Fallback: Mark as completed for demo (remove in production)
        await supabase.from('payments').update({ status: 'completed' }).eq('id', payment.id)
        track({ name: 'premium_purchase_complete', properties: { method: selectedMethod } })
        navigate('/dashboard')
        return
      }

      // Redirect to external payment page
      window.location.href = checkout.url
    } catch (err) {
      setError('שגיאה בתהליך התשלום. נסה שוב.')
      console.error('Payment error:', err)
    } finally {
      setLoading(false)
    }
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

        {/* Payment method selection */}
        <div className="mb-4">
          <p className="text-sm font-heebo font-bold mb-2">בחר אמצעי תשלום</p>
          <div className="grid grid-cols-3 gap-2">
            {([
              { key: 'bit' as const, label: 'Bit', emoji: '💳' },
              { key: 'paybox' as const, label: 'PayBox', emoji: '📦' },
              { key: 'stripe' as const, label: 'כרטיס אשראי', emoji: '💎' },
            ]).map(method => (
              <button
                key={method.key}
                onClick={() => { setSelectedMethod(method.key); setError('') }}
                className={`py-3 px-2 rounded-xl border text-center text-xs font-heebo font-bold transition-colors ${
                  selectedMethod === method.key
                    ? 'border-primary bg-primary-light/30 text-primary'
                    : 'border-border bg-bg-card text-text hover:border-primary/50'
                }`}
              >
                <span className="block text-lg mb-0.5">{method.emoji}</span>
                {method.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-500 text-sm text-center mb-3">{error}</p>
        )}

        {/* Payment CTA */}
        <Button fullWidth size="lg" variant="accent" onClick={handlePayment} loading={loading}>
          <span className="flex items-center justify-center gap-2">
            <CreditCard className="w-5 h-5" />
            שדרג עכשיו — 49 ש"ח
          </span>
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
