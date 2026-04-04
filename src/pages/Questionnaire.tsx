import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Send } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { useAuth } from '../contexts/AuthContext'
import { useQuestionnaire, setCurrentStep } from '../hooks/useQuestionnaire'
import { usePremium } from '../hooks/usePremium'

export function Questionnaire() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isPremium } = usePremium()
  const {
    answers, currentQuestion, loading, analyzing, completed,
    matchedProfessions, maxQuestions, startSession, submitAnswer, goBack,
  } = useQuestionnaire(isPremium)
  const [inputValue, setInputValue] = useState('')
  const [resuming, setResuming] = useState(true)
  const sessionStartedRef = useRef(false)

  useEffect(() => {
    if (user && !sessionStartedRef.current) {
      sessionStartedRef.current = true
      setCurrentStep('questionnaire')
      setResuming(true)
      startSession(user.id).then(() => setResuming(false))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    if (completed && matchedProfessions.length > 0) {
      // matchedProfessions are already persisted in useQuestionnaire hook
      setCurrentStep('filtering')
      navigate('/filtering')
    }
  }, [completed, matchedProfessions, navigate])

  const handleSubmit = () => {
    if (!inputValue.trim()) return
    submitAnswer(inputValue.trim())
    setInputValue('')
  }

  const handleChoice = (choice: string) => {
    submitAnswer(choice)
  }

  if (analyzing) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-6">
        <LoadingSpinner text="מנתח את התשובות שלך..." />
        <p className="text-text-muted text-sm mt-4">ה-AI שלנו בודק את הפרופיל שלך ומתאים מקצועות</p>
      </div>
    )
  }

  if (resuming) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <LoadingSpinner text={answers.length > 0 ? `ממשיך מאיפה שעצרת (שאלה ${answers.length + 1})...` : 'מכין את השאלון...'} />
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex flex-col px-6 py-6">
      {/* Progress */}
      <ProgressBar current={answers.length} total={maxQuestions} label="התקדמות השאלון" />

      {/* Resume indicator */}
      {answers.length > 0 && answers.length < maxQuestions && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-primary/70 text-xs mb-2"
        >
          ממשיך מאיפה שעצרת
        </motion.p>
      )}

      {/* Question */}
      <div className="flex-1 flex flex-col justify-center py-8">
        <AnimatePresence mode="wait">
          {loading && !analyzing ? (
            <motion.div
              key="loading-spinner"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center justify-center gap-4 py-12"
            >
              <div className="w-12 h-12 border-4 border-primary-light border-t-primary rounded-full animate-spin" />
              <p className="text-text-muted font-assistant text-sm">טוען את השאלה הבאה...</p>
            </motion.div>
          ) : currentQuestion ? (
            <motion.div
              key={currentQuestion.question_id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
            >
              {/* Progress message */}
              {currentQuestion.progress_message && (
                <p className="text-accent text-sm font-heebo font-bold mb-3">
                  {currentQuestion.progress_message}
                </p>
              )}

              {/* Question text */}
              <h2 className="text-xl font-heebo font-bold text-text mb-6 leading-relaxed">
                {currentQuestion.question_text}
              </h2>

              {/* Answer area */}
              {currentQuestion.answer_type === 'open' ? (
                <div className="space-y-4">
                  <textarea
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    placeholder="הקלד את תשובתך כאן..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-bg-card resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() } }}
                  />
                  <Button fullWidth onClick={handleSubmit} disabled={!inputValue.trim() || loading}>
                    <span className="flex items-center justify-center gap-2">
                      <Send className="w-4 h-4" />
                      הבא
                    </span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentQuestion.choices?.map((choice, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleChoice(choice)}
                      disabled={loading}
                      className="w-full px-5 py-4 rounded-xl border border-border bg-bg-card text-right font-assistant text-base hover:border-primary hover:bg-primary-light/20 transition-colors"
                    >
                      {choice}
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Back button */}
      {answers.length > 0 && (
        <button
          onClick={goBack}
          className="flex items-center gap-1 text-text-muted text-sm hover:text-primary transition-colors self-start"
        >
          <ArrowRight className="w-4 h-4" />
          חזור לשאלה הקודמת
        </button>
      )}
    </div>
  )
}
