import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Compass, Brain, Filter, Users, FileText, ChevronDown } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useState } from 'react'

const steps = [
  { icon: Brain, title: 'שאלון AI חכם', desc: '25 שאלות חווייתיות שמגלות מי אתה באמת' },
  { icon: Filter, title: 'סינון בסבבים', desc: 'מצמצמים 208 מקצועות ל-3 שמתאימים לך' },
  { icon: Users, title: 'ראיית מראה', desc: '4 מכרים עונים עליך — מה הם רואים שאתה לא' },
  { icon: FileText, title: 'דוח סינתזה', desc: 'AI משלב הכל ונותן לך תמונה מלאה + צעדים מעשיים' },
]

const faqs = [
  { q: 'כמה זמן לוקח כל התהליך?', a: 'השאלון לוקח כ-10 דקות, הסינון כ-5 דקות. ראיית המראה תלויה בקצב התשובות של המכרים שלך.' },
  { q: 'מה ההבדל בין חינמי לפרימיום?', a: 'בחינמי תקבלו שאלון מקוצר ותוצאות ראשוניות. בפרימיום (49 ש"ח) — שאלון מלא, 3 סבבי סינון, ראיית מראה מ-4 מכרים, ודוח AI מלא עם צעדים מעשיים.' },
  { q: 'איך ראיית המראה עובדת?', a: 'שולחים הזמנה ב-WhatsApp ל-4 אנשים שמכירים אותך. הם עונים על 5 שאלות קצרות עליך (בלי להתחבר). ה-AI משלב את מה שהם רואים עם מה שאתה אמרת.' },
  { q: 'האם המידע שלי מאובטח?', a: 'כן. כל המידע מוצפן ושמור בצורה מאובטחת. אנחנו לא חולקים מידע עם צדדים שלישיים.' },
  { q: 'אפשר לעשות את התהליך שוב?', a: 'בוודאי! אפשר להתחיל תהליך חדש בכל זמן.' },
]

export function Landing() {
  const navigate = useNavigate()
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary to-primary/90 text-white px-6 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <Compass className="w-9 h-9 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-heebo font-black mb-4 leading-tight">
            מצפן הקריירה
          </h1>
          <p className="text-xl font-assistant text-white/90 mb-2">
            גלה את המקצוע שמתאים לך באמת
          </p>
          <p className="text-white/70 mb-8 max-w-sm mx-auto">
            שאלון AI חכם + ראיית מראה מ-4 מכרים = התמונה המלאה
          </p>
          <Button
            variant="accent"
            size="lg"
            onClick={() => navigate('/auth')}
            className="shadow-lg shadow-accent-dark/30"
          >
            התחל עכשיו — בחינם
          </Button>
        </motion.div>

        {/* Decorative circles */}
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute -top-5 -right-5 w-24 h-24 bg-white/5 rounded-full" />
      </section>

      {/* Steps */}
      <section className="px-6 py-12">
        <h2 className="text-2xl font-heebo font-bold text-center mb-8">
          איך זה עובד?
        </h2>
        <div className="space-y-4 max-w-md mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.4 }}
              className="flex items-start gap-4 bg-bg-card rounded-xl p-4 border border-border"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center">
                <step.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-heebo font-bold text-accent text-sm">שלב {i + 1}</span>
                </div>
                <h3 className="font-heebo font-bold text-lg">{step.title}</h3>
                <p className="text-text-muted text-sm">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Social Proof */}
      <section className="px-6 py-10 bg-primary-light/30 text-center">
        <p className="font-heebo font-bold text-2xl text-primary">208</p>
        <p className="text-text-muted">מקצועות ישראליים במאגר</p>
        <div className="flex justify-center gap-8 mt-4">
          <div>
            <p className="font-heebo font-bold text-xl text-primary">AI</p>
            <p className="text-text-muted text-sm">מונע בינה מלאכותית</p>
          </div>
          <div>
            <p className="font-heebo font-bold text-xl text-primary">4</p>
            <p className="text-text-muted text-sm">מכרים נותנים מבט חיצוני</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-12">
        <h2 className="text-2xl font-heebo font-bold text-center mb-8">
          שאלות נפוצות
        </h2>
        <div className="space-y-2 max-w-md mx-auto">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-bg-card border border-border rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3 text-right"
              >
                <span className="font-heebo font-bold text-sm">{faq.q}</span>
                <ChevronDown className={`w-5 h-5 text-text-muted transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              <motion.div
                initial={false}
                animate={{ height: openFaq === i ? 'auto' : 0, opacity: openFaq === i ? 1 : 0 }}
                className="overflow-hidden"
              >
                <p className="px-4 pb-3 text-sm text-text-muted">{faq.a}</p>
              </motion.div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="px-6 py-10 text-center bg-gradient-to-t from-primary-light/30 to-transparent">
        <h3 className="font-heebo font-bold text-xl mb-4">מוכנים לגלות?</h3>
        <Button variant="primary" size="lg" onClick={() => navigate('/auth')}>
          התחל את התהליך
        </Button>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-text-muted text-sm border-t border-border">
        <p>מצפן הקריירה &copy; {new Date().getFullYear()} — OZ AI</p>
      </footer>
    </div>
  )
}
