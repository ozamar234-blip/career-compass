import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { AIQuestion, QuestionAnswer } from '../types/database'

const MAX_QUESTIONS_FREE = 15
const MAX_QUESTIONS_PREMIUM = 25

// Persist keys in localStorage so data survives logout/tab close
const LS_SESSION_ID = 'cc_sessionId'
const LS_ANSWERS = 'cc_answers'
const LS_MATCHED = 'cc_matchedProfessions'
const LS_FINAL = 'cc_finalProfessions'
const LS_ROUND2 = 'cc_round2Professions'
const LS_STEP = 'cc_currentStep' // 'questionnaire' | 'filtering' | 'mirror' | 'results'

export type FlowStep = 'questionnaire' | 'filtering' | 'mirror' | 'results' | null

/** Read a JSON value from localStorage safely */
function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

/** Persist helpers — write to both localStorage and sessionStorage for backwards compat */
function persist(key: string, value: unknown) {
  const json = JSON.stringify(value)
  localStorage.setItem(key, json)
  // Also write to sessionStorage for any legacy readers
  sessionStorage.setItem(key.replace('cc_', ''), json)
}

export function useQuestionnaire(isPremium: boolean) {
  const [sessionId, setSessionId] = useState<string | null>(
    () => localStorage.getItem(LS_SESSION_ID) || null
  )
  const [answers, setAnswers] = useState<QuestionAnswer[]>(
    () => lsGet<QuestionAnswer[]>(LS_ANSWERS, [])
  )
  const [currentQuestion, setCurrentQuestion] = useState<AIQuestion | null>(null)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [matchedProfessions, setMatchedProfessions] = useState<number[]>(
    () => lsGet<number[]>(LS_MATCHED, [])
  )

  const maxQuestions = isPremium ? MAX_QUESTIONS_PREMIUM : MAX_QUESTIONS_FREE

  /** Try to resume an existing in-progress session from the DB */
  const resumeSession = useCallback(async (userId: string): Promise<boolean> => {
    // Check localStorage first
    const storedSessionId = localStorage.getItem(LS_SESSION_ID)
    const storedAnswers = lsGet<QuestionAnswer[]>(LS_ANSWERS, [])
    const storedMatched = lsGet<number[]>(LS_MATCHED, [])

    // If we have matched professions in localStorage, the questionnaire is done
    if (storedSessionId && storedMatched.length > 0) {
      setSessionId(storedSessionId)
      setAnswers(storedAnswers)
      setMatchedProfessions(storedMatched)
      setCompleted(true)
      return true
    }

    // If we have a session ID + answers in localStorage, resume from there
    if (storedSessionId && storedAnswers.length > 0) {
      setSessionId(storedSessionId)
      setAnswers(storedAnswers)
      if (storedAnswers.length >= maxQuestions) {
        await analyzeResults(storedAnswers, storedSessionId)
        return true
      }
      await fetchNextQuestion(storedAnswers)
      return true
    }

    // No localStorage data — check DB only for in-progress sessions
    // (Don't restore completed sessions — user may have clicked "start over")
    const { data } = await supabase
      .from('questionnaire_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!data) return false

    const dbAnswers = (data.answers || []) as QuestionAnswer[]

    if (dbAnswers.length > 0) {
      // Session in progress — resume
      setSessionId(data.id)
      setAnswers(dbAnswers)
      persist(LS_SESSION_ID, data.id)
      persist(LS_ANSWERS, dbAnswers)
      localStorage.setItem(LS_SESSION_ID, data.id)

      if (dbAnswers.length >= maxQuestions) {
        await analyzeResults(dbAnswers, data.id)
        return true
      }

      await fetchNextQuestion(dbAnswers)
      return true
    }

    return false
  }, [maxQuestions])

  const startSession = useCallback(async (userId: string) => {
    // First try to resume existing session
    const resumed = await resumeSession(userId)
    if (resumed) return

    // No existing session — create new
    const { data, error } = await supabase
      .from('questionnaire_sessions')
      .insert({ user_id: userId })
      .select()
      .single()

    if (error || !data) return
    setSessionId(data.id)
    localStorage.setItem(LS_SESSION_ID, data.id)
    persist(LS_SESSION_ID, data.id)
    await fetchNextQuestion([])
  }, [resumeSession])

  /** Get fallback question by index — used when edge function is unavailable */
  const getFallbackQuestion = (questionIndex: number): AIQuestion => {
    const fallbackQuestions: AIQuestion[] = [
      { question_id: `q_1`, question_text: 'אתה בחופש גדול. יום ראשון, אין תוכניות. מה אתה עושה?', category: 'תחומי_עניין', answer_type: 'open', progress_message: 'בוא נתחיל!' },
      { question_id: `q_2`, question_text: 'אם היית יכול לבחור רק דבר אחד בעבודה — מה זה היה?', category: 'ערכים', answer_type: 'choice', choices: ['כסף טוב', 'משמעות והשפעה', 'חופש וגמישות', 'ביטחון ויציבות'], progress_message: 'שאלה מעולה!' },
      { question_id: `q_3`, question_text: 'תתאר את יום העבודה האידיאלי שלך מהבוקר עד הערב', category: 'סגנון_עבודה', answer_type: 'open', progress_message: 'ממשיכים!' },
      { question_id: `q_4`, question_text: 'על מה חברים פונים אליך כשהם צריכים עזרה?', category: 'כישורים', answer_type: 'choice', choices: ['עזרה טכנית', 'עצה רגשית', 'ארגון ותכנון', 'רעיונות יצירתיים'], progress_message: 'נהדר!' },
      { question_id: `q_5`, question_text: 'אחרי איזו פעילות אתה מרגיש הכי חי ואנרגטי?', category: 'אנרגיה', answer_type: 'open', progress_message: 'כמעט באמצע!' },
      { question_id: `q_6`, question_text: 'כשיש בעיה — אתה קופץ לפעולה או חושב קודם?', category: 'אישיות', answer_type: 'choice', choices: ['קופץ לפעולה מיד', 'חושב ומתכנן', 'שואל אנשים אחרים', 'תלוי בסיטואציה'], progress_message: 'תובנות מעניינות!' },
      { question_id: `q_7`, question_text: 'איזו סביבה עבודה הכי מתאימה לך?', category: 'סגנון_עבודה', answer_type: 'choice', choices: ['משרד מסודר', 'בחוץ/שטח', 'מהבית', 'משתנה כל הזמן'], progress_message: 'אתה מתקדם יפה!' },
      { question_id: `q_8`, question_text: 'מה הדבר שהכי חשוב לך כשאתה בוחר מקום עבודה?', category: 'ערכים', answer_type: 'open', progress_message: 'תשובות מצוינות!' },
      { question_id: `q_9`, question_text: 'איזה נושא היית יכול לקרוא עליו שעות בלי לשים לב?', category: 'תחומי_עניין', answer_type: 'open', progress_message: 'מגלים דברים מעניינים!' },
      { question_id: `q_10`, question_text: 'מה עושה אותך שונה מרוב האנשים שאתה מכיר?', category: 'אישיות', answer_type: 'open', progress_message: 'שאלה חשובה!' },
      { question_id: `q_11`, question_text: 'מה הישג שאתה הכי גאה בו?', category: 'כישורים', answer_type: 'open', progress_message: 'ממש מעניין!' },
      { question_id: `q_12`, question_text: 'עדיף לך לעבוד לבד או בצוות?', category: 'סגנון_עבודה', answer_type: 'choice', choices: ['לבד — אני יותר יעיל', 'בצוות קטן', 'בצוות גדול', 'משתנה'], progress_message: 'מתקרבים!' },
      { question_id: `q_13`, question_text: 'אם היית יכול ללמד משהו — מה היית מלמד?', category: 'תחומי_עניין', answer_type: 'open', progress_message: 'שאלה יצירתית!' },
      { question_id: `q_14`, question_text: 'מה לדעתך חשוב יותר — לעזור לאנשים או לפתור בעיות?', category: 'ערכים', answer_type: 'choice', choices: ['לעזור לאנשים', 'לפתור בעיות', 'שניהם באותה מידה', 'תלוי בהקשר'], progress_message: 'תשובות חכמות!' },
      { question_id: `q_15`, question_text: 'תדמיין שאתה בגיל 60 ומסתכל אחורה — מה היית רוצה שיגידו עליך?', category: 'ערכים', answer_type: 'open', progress_message: 'שאלה עמוקה!' },
      { question_id: `q_16`, question_text: 'איזה סוג של אתגרים מלהיבים אותך?', category: 'אנרגיה', answer_type: 'choice', choices: ['טכניים ולוגיים', 'יצירתיים', 'חברתיים ובינאישיים', 'פיזיים'], progress_message: 'מעולה!' },
      { question_id: `q_17`, question_text: 'מה מעצבן אותך הכי הרבה בעבודה?', category: 'סגנון_עבודה', answer_type: 'open', progress_message: 'גם זה חשוב!' },
      { question_id: `q_18`, question_text: 'כמה כסף חשוב לך ביחס לסיפוק מהעבודה?', category: 'ערכים', answer_type: 'choice', choices: ['כסף קודם כל', 'סיפוק קודם כל', 'איזון בין שניהם', 'מספיק לחיות בנוחות'], progress_message: 'כמעט סיימנו!' },
      { question_id: `q_19`, question_text: 'איזו מילה אחת הכי מתארת אותך?', category: 'אישיות', answer_type: 'open', progress_message: 'מגיעים לסוף!' },
      { question_id: `q_20`, question_text: 'אם היית יכול להתנסות ביום אחד בכל עבודה — מה היית בוחר?', category: 'תחומי_עניין', answer_type: 'open', progress_message: 'שאלה אחרונה!' },
      { question_id: `q_21`, question_text: 'מה נותן לך תחושת הצלחה?', category: 'אנרגיה', answer_type: 'open', progress_message: 'ממש מתקרבים!' },
      { question_id: `q_22`, question_text: 'מה אתה הכי טוב בו מבלי להתאמץ?', category: 'כישורים', answer_type: 'open', progress_message: 'תובנה מעולה!' },
      { question_id: `q_23`, question_text: 'עדיף לך שגרה יציבה או הפתעות כל יום?', category: 'סגנון_עבודה', answer_type: 'choice', choices: ['שגרה יציבה', 'הפתעות ושינויים', 'קצת מזה קצת מזה', 'לא משנה'], progress_message: 'כמעט שם!' },
      { question_id: `q_24`, question_text: 'מה הדבר שהיית עושה גם בלי לקבל כסף?', category: 'תחומי_עניין', answer_type: 'open', progress_message: 'שאלה מצוינת!' },
      { question_id: `q_25`, question_text: 'מה לדעתך החוזקה הכי גדולה שלך?', category: 'כישורים', answer_type: 'open', progress_message: 'סיימנו את השאלון!' },
    ]
    const idx = questionIndex % fallbackQuestions.length
    return fallbackQuestions[idx]
  }

  const fetchNextQuestion = async (prevAnswers: QuestionAnswer[]) => {
    setLoading(true)
    setCurrentQuestion(null) // Clear so spinner shows

    try {
      const sid = localStorage.getItem(LS_SESSION_ID)

      // Race the edge function against a 5-second timeout
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 5000)
      )

      const fetchPromise = supabase.functions.invoke('generate-question', {
        body: { session_id: sid, previous_answers: prevAnswers },
      })

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise])
      if (error) throw error
      setCurrentQuestion(data as AIQuestion)
    } catch {
      // Fallback question — instant, no waiting
      setCurrentQuestion(getFallbackQuestion(prevAnswers.length))
    }
    setLoading(false)
  }

  const submitAnswer = async (answerText: string) => {
    if (!currentQuestion || loading) return

    const newAnswer: QuestionAnswer = {
      question_id: currentQuestion.question_id,
      question_text: currentQuestion.question_text,
      answer_text: answerText,
      category: currentQuestion.category,
      timestamp: new Date().toISOString(),
    }

    const updatedAnswers = [...answers, newAnswer]
    setAnswers(updatedAnswers)
    persist(LS_ANSWERS, updatedAnswers)

    // Save to DB in background — don't block the UI
    const sid = sessionId || localStorage.getItem(LS_SESSION_ID)
    if (sid) {
      supabase.from('questionnaire_sessions').update({
        answers: updatedAnswers as unknown as Record<string, unknown>[],
        current_question_index: updatedAnswers.length,
      }).eq('id', sid) // fire-and-forget, no await
    }

    // Check if done
    if (updatedAnswers.length >= maxQuestions) {
      await analyzeResults(updatedAnswers, sid)
      return
    }

    await fetchNextQuestion(updatedAnswers)
  }

  const analyzeResults = async (allAnswers: QuestionAnswer[], sid?: string | null) => {
    setAnalyzing(true)
    const effectiveSessionId = sid || sessionId || localStorage.getItem(LS_SESSION_ID)
    let matched: number[] = []

    try {
      const { data, error } = await supabase.functions.invoke('analyze-and-match', {
        body: { session_id: effectiveSessionId, answers: allAnswers },
      })
      if (error) throw error
      matched = data.matched_profession_ids || []
    } catch {
      // Fallback: random selection of 25 professions for demo
      const randomIds = Array.from({ length: 25 }, () => Math.floor(Math.random() * 208) + 1)
      matched = [...new Set(randomIds)].slice(0, 25)
    }

    setMatchedProfessions(matched)
    persist(LS_MATCHED, matched)
    localStorage.setItem(LS_STEP, 'filtering')

    if (effectiveSessionId) {
      await supabase.from('questionnaire_sessions').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        matched_professions: matched,
      }).eq('id', effectiveSessionId)
    }

    setAnalyzing(false)
    setCompleted(true)
  }

  const goBack = () => {
    if (answers.length === 0) return
    const prev = answers.slice(0, -1)
    setAnswers(prev)
    persist(LS_ANSWERS, prev)
    fetchNextQuestion(prev)
  }

  /** Reset all local state and storage — for starting a completely new session */
  const resetSession = () => {
    localStorage.removeItem(LS_SESSION_ID)
    localStorage.removeItem(LS_ANSWERS)
    localStorage.removeItem(LS_MATCHED)
    localStorage.removeItem(LS_FINAL)
    localStorage.removeItem(LS_ROUND2)
    localStorage.removeItem(LS_STEP)
    sessionStorage.removeItem('sessionId')
    sessionStorage.removeItem('matchedProfessions')
    sessionStorage.removeItem('finalProfessions')
    sessionStorage.removeItem('round2Professions')
    setSessionId(null)
    setAnswers([])
    setCurrentQuestion(null)
    setMatchedProfessions([])
    setCompleted(false)
  }

  return {
    sessionId,
    answers,
    currentQuestion,
    loading,
    analyzing,
    completed,
    matchedProfessions,
    maxQuestions,
    startSession,
    resumeSession,
    submitAnswer,
    goBack,
    resetSession,
  }
}

/** Helper: get current flow step from localStorage */
export function getCurrentStep(): FlowStep {
  return (localStorage.getItem(LS_STEP) as FlowStep) || null
}

/** Helper: set current flow step */
export function setCurrentStep(step: FlowStep) {
  if (step) {
    localStorage.setItem(LS_STEP, step)
  } else {
    localStorage.removeItem(LS_STEP)
  }
}
