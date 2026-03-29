import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Phone, Compass, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useAuth } from '../contexts/AuthContext'

type AuthMode = 'email' | 'phone' | 'otp'

export function Auth() {
  const navigate = useNavigate()
  const { signInWithPhone, verifyOTP, signInWithGoogle, signUpWithEmail, signInWithEmail, user } = useAuth()
  const [mode, setMode] = useState<AuthMode>('email')
  const [isSignUp, setIsSignUp] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

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

  // ---- Email ----
  const handleEmailSubmit = async () => {
    setError('')
    setSuccessMsg('')
    if (!email || !password) { setError('נא למלא אימייל וסיסמה'); return }
    if (password.length < 6) { setError('סיסמה חייבת להכיל לפחות 6 תווים'); return }

    setLoading(true)
    if (isSignUp) {
      const { error } = await signUpWithEmail(email, password)
      setLoading(false)
      if (error) {
        if (error.message.includes('already registered')) {
          setError('האימייל הזה כבר רשום. נסה להתחבר.')
        } else {
          setError('שגיאה בהרשמה. נסה שוב.')
        }
        return
      }
      setSuccessMsg('נרשמת בהצלחה! בדוק את האימייל שלך לאישור (או התחבר ישירות אם אישור לא נדרש).')
      // Try to sign in immediately (works if email confirmation is disabled in Supabase)
      const { error: signInErr } = await signInWithEmail(email, password)
      if (!signInErr) {
        navigate('/onboarding')
      }
    } else {
      const { error } = await signInWithEmail(email, password)
      setLoading(false)
      if (error) {
        setError('אימייל או סיסמה שגויים')
        return
      }
      navigate('/onboarding')
    }
  }

  // ---- Phone OTP ----
  const handleSendOTP = async () => {
    setError('')
    if (phone.length < 9) { setError('נא להזין מספר טלפון תקין'); return }
    setLoading(true)
    const { error } = await signInWithPhone(formatPhoneForAuth(phone))
    setLoading(false)
    if (error) { setError('שגיאה בשליחת קוד. נסה שוב.'); return }
    setMode('otp')
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

  // ---- Google ----
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
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Compass className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-heebo font-black text-primary mb-1">
            {mode === 'otp' ? 'אימות' : isSignUp ? 'הרשמה' : 'התחברות'}
          </h1>
          <p className="text-text-muted text-sm">
            {mode === 'otp'
              ? `שלחנו קוד ל-${phone}`
              : mode === 'email'
              ? (isSignUp ? 'צור חשבון עם אימייל וסיסמה' : 'התחבר עם האימייל שלך')
              : 'הזן מספר טלפון לקבלת קוד'}
          </p>
        </div>

        {/* ===== EMAIL MODE ===== */}
        {mode === 'email' && (
          <div className="space-y-4">
            {/* Email */}
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pr-10 pl-4 py-3 rounded-xl border border-border bg-bg-card text-lg font-heebo focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                dir="ltr"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="סיסמה (לפחות 6 תווים)"
                className="w-full pr-10 pl-10 py-3 rounded-xl border border-border bg-bg-card text-lg font-heebo focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                dir="ltr"
                onKeyDown={e => { if (e.key === 'Enter') handleEmailSubmit() }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <Button fullWidth loading={loading} onClick={handleEmailSubmit}>
              {isSignUp ? 'הרשמה' : 'התחברות'}
            </Button>

            {/* Toggle sign up / sign in */}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccessMsg('') }}
              className="w-full text-center text-sm text-primary hover:underline"
            >
              {isSignUp ? 'כבר יש לך חשבון? התחבר' : 'אין לך חשבון? הירשם'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-text-muted text-sm">או</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Google */}
            <Button variant="secondary" fullWidth loading={loading} onClick={handleGoogle}>
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                התחבר עם Google
              </span>
            </Button>

            {/* Switch to phone */}
            <button
              onClick={() => { setMode('phone'); setError(''); setSuccessMsg('') }}
              className="w-full text-center text-sm text-text-muted hover:text-primary transition-colors"
            >
              <span className="flex items-center justify-center gap-1">
                <Phone className="w-4 h-4" />
                התחבר עם מספר טלפון במקום
              </span>
            </button>
          </div>
        )}

        {/* ===== PHONE MODE ===== */}
        {mode === 'phone' && (
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
              שלח קוד SMS
            </Button>

            <div className="flex items-center gap-3 my-2">
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

            <button
              onClick={() => { setMode('email'); setError('') }}
              className="w-full text-center text-sm text-text-muted hover:text-primary transition-colors"
            >
              <span className="flex items-center justify-center gap-1">
                <Mail className="w-4 h-4" />
                התחבר עם אימייל וסיסמה במקום
              </span>
            </button>
          </div>
        )}

        {/* ===== OTP MODE ===== */}
        {mode === 'otp' && (
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
              onClick={() => { setMode('phone'); setOtp('') }}
              className="w-full text-center text-sm text-primary hover:underline"
            >
              שלח קוד חדש
            </button>
          </div>
        )}

        {/* Messages */}
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-500 text-sm text-center mt-4"
          >
            {error}
          </motion.p>
        )}
        {successMsg && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-success text-sm text-center mt-4"
          >
            {successMsg}
          </motion.p>
        )}
      </motion.div>
    </div>
  )
}
