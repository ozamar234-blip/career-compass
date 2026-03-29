import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Phone, Compass } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useAuth } from '../contexts/AuthContext'

export function Auth() {
  const navigate = useNavigate()
  const { signInWithPhone, verifyOTP, signInWithGoogle, user } = useAuth()
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Redirect if already logged in
  if (user) {
    navigate('/onboarding')
    return null
  }

  const formatPhoneForAuth = (p: string) => {
    const cleaned = p.replace(/\D/g, '')
    if (cleaned.startsWith('0')) return '+972' + cleaned.slice(1)
    if (cleaned.startsWith('972')) return '+' + cleaned
    return '+972' + cleaned
  }

  const handleSendOTP = async () => {
    setError('')
    if (phone.length < 9) { setError('נא להזין מספר טלפון תקין'); return }
    setLoading(true)
    const { error } = await signInWithPhone(formatPhoneForAuth(phone))
    setLoading(false)
    if (error) { setError('שגיאה בשליחת קוד. נסה שוב.'); return }
    setStep('otp')
  }

  const handleVerifyOTP = async () => {
    setError('')
    if (otp.length < 6) { setError('נא להזין קוד בן 6 ספרות'); return }
    setLoading(true)
    const { error } = await verifyOTP(formatPhoneForAuth(phone), otp)
    setLoading(false)
    if (error) { setError('קוד שגוי. נסה שוב.'); return }
    navigate('/onboarding')
  }

  const handleGoogle = async () => {
    setLoading(true)
    const { error } = await signInWithGoogle()
    setLoading(false)
    if (error) setError('שגיאה בהתחברות עם Google')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Compass className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-heebo font-black text-primary mb-1">
            {step === 'phone' ? 'התחברות' : 'אימות'}
          </h1>
          <p className="text-text-muted text-sm">
            {step === 'phone' ? 'הזן מספר טלפון לקבלת קוד' : `שלחנו קוד ל-${phone}`}
          </p>
        </div>

        {step === 'phone' ? (
          <div className="space-y-4">
            <div className="relative">
              <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="050-1234567"
                className="w-full pr-10 pl-4 py-3 rounded-xl border border-border bg-bg-card text-right text-lg font-heebo focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                dir="ltr"
              />
            </div>
            <Button fullWidth loading={loading} onClick={handleSendOTP}>
              שלח קוד
            </Button>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-text-muted text-sm">או</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <Button variant="secondary" fullWidth loading={loading} onClick={handleGoogle}>
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                התחבר עם Google
              </span>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <input
              type="text"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="_ _ _ _ _ _"
              className="w-full px-4 py-3 rounded-xl border border-border bg-bg-card text-center text-2xl font-heebo tracking-[0.5em] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              dir="ltr"
              maxLength={6}
            />
            <Button fullWidth loading={loading} onClick={handleVerifyOTP}>
              אימות
            </Button>
            <button
              onClick={() => { setStep('phone'); setOtp('') }}
              className="w-full text-center text-sm text-primary hover:underline"
            >
              שלח קוד חדש
            </button>
          </div>
        )}

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-500 text-sm text-center mt-4"
          >
            {error}
          </motion.p>
        )}
      </motion.div>
    </div>
  )
}
