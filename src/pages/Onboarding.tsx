import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../components/ui/Button'
import { useAuth } from '../contexts/AuthContext'

const statusOptions = [
  'חייל/ת משוחרר/ת',
  'סטודנט/ית',
  'עובד/ת',
  'מחפש/ת שינוי',
  'אחר',
]

export function Onboarding() {
  const navigate = useNavigate()
  const { updateProfile, profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    age: profile?.age || 25,
    gender: profile?.gender || '',
    city: profile?.city || '',
    current_status: profile?.current_status || '',
  })

  // If profile is complete, skip onboarding
  if (profile?.full_name && profile?.current_status) {
    navigate('/dashboard')
    return null
  }

  const handleSubmit = async () => {
    if (!form.full_name || !form.gender || !form.current_status) return
    setLoading(true)
    await updateProfile({
      full_name: form.full_name,
      age: form.age,
      gender: form.gender as 'male' | 'female' | 'other',
      city: form.city,
      current_status: form.current_status,
    })
    setLoading(false)
    navigate('/dashboard')
  }

  return (
    <div className="px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-sm mx-auto"
      >
        <h1 className="text-2xl font-heebo font-black text-primary mb-2 text-center">
          ספר/י לנו קצת על עצמך
        </h1>
        <p className="text-text-muted text-center mb-8">
          זה עוזר לנו להתאים את השאלון עבורך
        </p>

        <div className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-heebo font-bold mb-1">שם מלא</label>
            <input
              type="text"
              value={form.full_name}
              onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-border bg-bg-card focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="השם שלך"
            />
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-heebo font-bold mb-1">גיל: {form.age}</label>
            <input
              type="range"
              min={16}
              max={65}
              value={form.age}
              onChange={e => setForm(p => ({ ...p, age: Number(e.target.value) }))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-text-muted">
              <span>16</span>
              <span>65</span>
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-heebo font-bold mb-2">מגדר</label>
            <div className="flex gap-2">
              {[
                { value: 'male', label: 'זכר' },
                { value: 'female', label: 'נקבה' },
                { value: 'other', label: 'אחר' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setForm(p => ({ ...p, gender: opt.value }))}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-heebo font-bold transition-colors ${
                    form.gender === opt.value
                      ? 'bg-primary text-white border-primary'
                      : 'bg-bg-card border-border text-text hover:border-primary/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-heebo font-bold mb-1">עיר</label>
            <input
              type="text"
              value={form.city}
              onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-border bg-bg-card focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="איפה אתה גר?"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-heebo font-bold mb-2">סטטוס נוכחי</label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map(s => (
                <button
                  key={s}
                  onClick={() => setForm(p => ({ ...p, current_status: s }))}
                  className={`px-4 py-2 rounded-xl border text-sm font-assistant transition-colors ${
                    form.current_status === s
                      ? 'bg-primary text-white border-primary'
                      : 'bg-bg-card border-border text-text hover:border-primary/50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <Button
            fullWidth
            size="lg"
            loading={loading}
            onClick={handleSubmit}
            disabled={!form.full_name || !form.gender || !form.current_status}
          >
            בוא נתחיל
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
