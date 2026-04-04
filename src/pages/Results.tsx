import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Lightbulb, Share2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { Confetti } from '../components/ui/Confetti'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { getProfessionsByIds } from '../data/professions'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface ResultProfession {
  id: number
  name: string
  matchPercentage: number
  userSignals: string
  friendSignals: string
  gapAnalysis: string
  actionSteps: string[]
}

const medals = ['🥇', '🥈', '🥉']

export function Results() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [showConfetti, setShowConfetti] = useState(false)
  const [expandedCard, setExpandedCard] = useState<number | null>(0)
  const [results, setResults] = useState<ResultProfession[]>([])
  const [insight, setInsight] = useState('')
  const [narrative, setNarrative] = useState('')
  const [gapSummary, setGapSummary] = useState('')

  useEffect(() => {
    generateResults()
  }, [])

  const generateResults = async () => {
    setLoading(true)

    try {
      const sessionId = localStorage.getItem('cc_sessionId') || sessionStorage.getItem('sessionId')
      if (sessionId) {
        const { data, error } = await supabase.functions.invoke('generate-synthesis', {
          body: { session_id: sessionId },
        })
        if (error) throw error
        if (data) {
          setResults(data.top_3.map((p: Record<string, unknown>) => ({
            id: p.profession_id,
            name: p.profession_name,
            matchPercentage: p.match_percentage,
            userSignals: p.user_signals,
            friendSignals: p.friend_signals,
            gapAnalysis: p.gap_analysis,
            actionSteps: p.action_steps,
          })))
          setInsight(data.surprising_insight || '')
          setNarrative(data.full_narrative || '')
          setGapSummary(data.perception_gap_summary || '')
          setLoading(false)
          setShowConfetti(true)
          return
        }
      }
    } catch {
      // Fallback to demo results
    }

    // Fallback demo data
    const storedFinal = localStorage.getItem('cc_finalProfessions') || sessionStorage.getItem('finalProfessions')
    const profIds = storedFinal ? JSON.parse(storedFinal) : [60, 81, 68]
    const profs = getProfessionsByIds(profIds)

    setResults(profs.slice(0, 3).map((p, i) => ({
      id: p.id,
      name: p.name,
      matchPercentage: 92 - i * 7,
      userSignals: 'יש לך כישורים חזקים בתקשורת ופתרון בעיות, עניין עמוק באנשים ורצון להשפיע.',
      friendSignals: 'המכרים שלך מדגישים את יכולת ההקשבה שלך, החשיבה האנליטית והנטייה הטבעית להוביל.',
      gapAnalysis: 'אתה מזלזל ביכולת המנהיגות שלך — אחרים רואים אותה הרבה יותר חזק ממה שאתה חושב.',
      actionSteps: [
        'חפש קורס או סדנה ראשונית בתחום',
        'דבר עם 2-3 אנשים שעובדים במקצוע',
        'התנסה בפרויקט קטן או התנדבות בתחום',
      ],
    })))

    setInsight('יש לך שילוב נדיר של חשיבה אנליטית ואינטליגנציה רגשית — זה מה שהמכרים שלך ממש מדגישים, למרות שאתה לא רואה את זה.')
    setNarrative('מהתשובות שלך עולה תמונה של אדם שמחפש משמעות, שאוהב לפתור בעיות מורכבות ושיש לו רגישות גבוהה לאנשים. השילוב הזה, יחד עם מה שהמכרים שלך סיפרו, מצביע על מקצועות שדורשים גם ראש אנליטי וגם לב חם.')
    setGapSummary('אתה רואה את עצמך כמישהו שיטתי ומאורגן. המכרים שלך רואים את זה, אבל גם מוסיפים שאתה מנהיג טבעי ואיש אנשים — דבר שאתה פחות מזהה בעצמך.')

    setLoading(false)
    setTimeout(() => setShowConfetti(true), 500)
  }

  const shareResults = () => {
    const text = `גיליתי את 3 המקצועות שהכי מתאימים לי! 🎯\n${results.map((r, i) => `${medals[i]} ${r.name} (${r.matchPercentage}%)`).join('\n')}\n\nגלה גם את שלך: ${window.location.origin}`
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  if (loading) {
    return <LoadingSpinner text="מכין את הדוח שלך..." />
  }

  return (
    <div className="px-6 py-8">
      <Confetti active={showConfetti} />

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-accent-dark" />
        </div>
        <h1 className="text-2xl font-heebo font-black text-primary mb-2">
          המקצועות שהכי מתאימים לך
        </h1>
        {profile?.full_name && (
          <p className="text-text-muted">הי {profile.full_name}, הנה התוצאות שלך</p>
        )}
      </motion.div>

      {/* Top 3 Professions */}
      <div className="space-y-4 mb-8">
        {results.map((result, i) => (
          <motion.div
            key={result.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 * i }}
          >
            <Card className="!p-0 overflow-hidden">
              {/* Header */}
              <button
                onClick={() => setExpandedCard(expandedCard === i ? null : i)}
                className="w-full flex items-center gap-3 p-5 text-right"
              >
                <span className="text-3xl">{medals[i]}</span>
                <div className="flex-1">
                  <h3 className="font-heebo font-bold text-lg">{result.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge percentage={result.matchPercentage} />
                    <span className="text-xs text-text-muted">התאמה</span>
                  </div>
                </div>
                {expandedCard === i ? (
                  <ChevronUp className="w-5 h-5 text-text-muted" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-text-muted" />
                )}
              </button>

              {/* Expanded content */}
              <motion.div
                initial={false}
                animate={{ height: expandedCard === i ? 'auto' : 0 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">
                  {/* Why it fits */}
                  <div>
                    <h4 className="font-heebo font-bold text-sm text-primary mb-1">למה זה מתאים לך</h4>
                    <p className="text-sm text-text-muted">{result.userSignals}</p>
                  </div>

                  {/* What friends see */}
                  <div>
                    <h4 className="font-heebo font-bold text-sm text-primary mb-1">מה אחרים רואים</h4>
                    <p className="text-sm text-text-muted">{result.friendSignals}</p>
                  </div>

                  {/* Gap */}
                  <div className="bg-accent/10 rounded-xl p-3">
                    <h4 className="font-heebo font-bold text-sm text-accent-dark mb-1">פער תפיסה</h4>
                    <p className="text-sm text-text">{result.gapAnalysis}</p>
                  </div>

                  {/* Action steps */}
                  <div>
                    <h4 className="font-heebo font-bold text-sm text-primary mb-2">3 צעדים ראשונים</h4>
                    <ol className="space-y-2">
                      {result.actionSteps.map((step, j) => (
                        <li key={j} className="flex gap-2 text-sm">
                          <span className="w-6 h-6 bg-primary-light text-primary rounded-full flex items-center justify-center flex-shrink-0 text-xs font-heebo font-bold">
                            {j + 1}
                          </span>
                          <span className="text-text-muted">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </motion.div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Surprising Insight */}
      {insight && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-r from-accent/20 to-accent-dark/10 rounded-2xl p-5 mb-6"
        >
          <div className="flex items-start gap-3">
            <Lightbulb className="w-6 h-6 text-accent-dark flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-heebo font-bold text-sm mb-1">תובנה מפתיעה</h4>
              <p className="text-sm">{insight}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Narrative */}
      {narrative && (
        <Card className="mb-6">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-heebo font-bold text-sm text-primary mb-1">הסיפור שלך</h4>
              <p className="text-sm text-text-muted leading-relaxed">{narrative}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Gap Summary */}
      {gapSummary && (
        <Card className="mb-8">
          <h4 className="font-heebo font-bold text-sm text-primary mb-1">סיכום פערי תפיסה</h4>
          <p className="text-sm text-text-muted">{gapSummary}</p>
        </Card>
      )}

      {/* Share */}
      <div className="space-y-3">
        <Button fullWidth variant="accent" onClick={shareResults}>
          <span className="flex items-center justify-center gap-2">
            <Share2 className="w-4 h-4" />
            שתף את התוצאות ב-WhatsApp
          </span>
        </Button>
        <Button fullWidth variant="ghost" onClick={() => window.print()}>
          שמור PDF
        </Button>
      </div>
    </div>
  )
}
