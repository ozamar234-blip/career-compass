import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { AIQuestion, QuestionAnswer } from '../types/database'

const MAX_QUESTIONS_FREE = 15
const MAX_QUESTIONS_PREMIUM = 25

export function useQuestionnaire(isPremium: boolean) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<QuestionAnswer[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<AIQuestion | null>(null)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [matchedProfessions, setMatchedProfessions] = useState<number[]>([])

  const maxQuestions = isPremium ? MAX_QUESTIONS_PREMIUM : MAX_QUESTIONS_FREE

  const startSession = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('questionnaire_sessions')
      .insert({ user_id: userId })
      .select()
      .single()

    if (error || !data) return
    setSessionId(data.id)
    await fetchNextQuestion([])
  }, [])

  const fetchNextQuestion = async (prevAnswers: QuestionAnswer[]) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('generate-question', {
        body: { session_id: sessionId, previous_answers: prevAnswers },
      })
      if (error) throw error
      setCurrentQuestion(data as AIQuestion)
    } catch {
      // Fallback question if edge function not available
      const fallbackQuestions: AIQuestion[] = [
        { question_id: `q_${prevAnswers.length + 1}`, question_text: 'אתה בחופש גדול. יום ראשון, אין תוכניות. מה אתה עושה?', category: 'תחומי_עניין', answer_type: 'open', progress_message: 'בוא נתחיל!' },
        { question_id: `q_${prevAnswers.length + 1}`, question_text: 'אם היית יכול לבחור רק דבר אחד בעבודה — מה זה היה?', category: 'ערכים', answer_type: 'choice', choices: ['כסף טוב', 'משמעות והשפעה', 'חופש וגמישות', 'ביטחון ויציבות'], progress_message: 'שאלה מעולה!' },
        { question_id: `q_${prevAnswers.length + 1}`, question_text: 'תתאר את יום העבודה האידיאלי שלך מהבוקר עד הערב', category: 'סגנון_עבודה', answer_type: 'open', progress_message: 'ממשיכים!' },
        { question_id: `q_${prevAnswers.length + 1}`, question_text: 'על מה חברים פונים אליך כשהם צריכים עזרה?', category: 'כישורים', answer_type: 'choice', choices: ['עזרה טכנית', 'עצה רגשית', 'ארגון ותכנון', 'רעיונות יצירתיים'], progress_message: 'נהדר!' },
        { question_id: `q_${prevAnswers.length + 1}`, question_text: 'אחרי איזו פעילות אתה מרגיש הכי חי ואנרגטי?', category: 'אנרגיה', answer_type: 'open', progress_message: 'כמעט באמצע!' },
        { question_id: `q_${prevAnswers.length + 1}`, question_text: 'כשיש בעיה — אתה קופץ לפעולה או חושב קודם?', category: 'אישיות', answer_type: 'choice', choices: ['קופץ לפעולה מיד', 'חושב ומתכנן', 'שואל אנשים אחרים', 'תלוי בסיטואציה'], progress_message: 'תובנות מעניינות!' },
        { question_id: `q_${prevAnswers.length + 1}`, question_text: 'איזו סביבה עבודה הכי מתאימה לך?', category: 'סגנון_עבודה', answer_type: 'choice', choices: ['משרד מסודר', 'בחוץ/שטח', 'מהבית', 'משתנה כל הזמן'], progress_message: 'אתה מתקדם יפה!' },
        { question_id: `q_${prevAnswers.length + 1}`, question_text: 'מה הדבר שהכי חשוב לך כשאתה בוחר מקום עבודה?', category: 'ערכים', answer_type: 'open', progress_message: 'תשובות מצוינות!' },
        { question_id: `q_${prevAnswers.length + 1}`, question_text: 'איזה נושא היית יכול לקרוא עליו שעות בלי לשים לב?', category: 'תחומי_עניין', answer_type: 'open', progress_message: 'מגלים דברים מעניינים!' },
        { question_id: `q_${prevAnswers.length + 1}`, question_text: 'מה עושה אותך שונה מרוב האנשים שאתה מכיר?', category: 'אישיות', answer_type: 'open', progress_message: 'שאלה חשובה!' },
        { question_id: `q_${prevAnswers.length + 1}`, question_text: 'מה הישג שאתה הכי גאה בו?', category: 'כישורים', answer_type: 'open', progress_message: 'ממש מעניין!' },
        { question_id: `q_${prevAnswers.length + 1}`, question_text: 'עדיף לך לעבוד לבד או בצוות?', category: 'סגנון_עבודה', answer_type: 'choice', choices: ['לבד — אני יותר יעיל', 'בצוות קטן', 'בצוות גדול', 'משתנה'], progress_message: 'מתקרבים!' },
        { question_id: `q_${prevAnswers.length + 1}`, question_text: 'אם היית יכול ללמד משהו — מה היית מלמד?', category: 'תחומי_עניין', answer_type: 'open', progress_message: 'שאלה יצירתית!' },
        { question_id: `q_${prevAnswers.length + 1}`, question_text: 'מה לדעתך חשוב יותר — לעזור לאנשים או לפתור בעיות?', category: 'ערכים', answer_type: 'choice', choices: ['לעזור לאנשים', 'לפתור בעיות', 'שניהם באותה מידה', 'תלוי בהקשר'], progress_message: 'תשובות חכמות!' },
        { question_id: `q_${prevAnswers.length + 1}`, question_text: 'תדמיין שאתה בגיל 60 ומסתכל אחורה — מה היית רוצה שיגידו עליך?', category: 'ערכים', answer_type: 'open', progress_message: 'שאלה עמוקה!' },
        { question_id: `q_${prevAnswers.length + 1}`, question_text: 'איזה סוג של אתגרים מלהיבים אותך?', category: 'אנרגיה', answer_type: 'choice', choices: ['טכניים ולוגיים', 'יצירתיים', 'חברתיים ובינאישיים', 'פיזיים'], progress_message: 'מעולה!' },
        { question_id: `q_${prevAnswers.length + 1}`, question_text: 'מה מעצבן אותך הכי הרבה בעבודה?', category: 'סגנון_עבודה', answer_type: 'open', progress_message: 'גם זה חשוב!' },
        { question_id: `q_${prevAnswers.length + 1}`, question_text: 'כמה כסף חשוב לך ביחס לסיפוק מהעבודה?', category: 'ערכים', answer_type: 'choice', choices: ['כסף קודם כל', 'סיפוק קודם כל', 'איזון בין שניהם', 'מספיק לחיות בנוחות'], progress_message: 'כמעט סיימנו!' },
        { question_id: `q_${prevAnswers.length + 1}`, question_text: 'איזו מילה אחת הכי מתארת אותך?', category: 'אישיות', answer_type: 'open', progress_message: 'מגיעים לסוף!' },
        { question_id: `q_${prevAnswers.length + 1}`, question_text: 'אם היית יכול להתנסות ביום אחד בכל עבודה — מה היית בוחר?', category: 'תחומי_עניין', answer_type: 'open', progress_message: 'שאלה אחרונה!' },
        { question_id: `q_${prevAnswers.length + 1}`, question_text: 'מה נותן לך תחושת הצלחה?', category: 'אנרגיה', answer_type: 'open', progress_message: 'ממש מתקרבים!' },
        { question_id: `q_${prevAnswers.length + 1}`, question_text: 'מה אתה הכי טוב בו מבלי להתאמץ?', category: 'כישורים', answer_type: 'open', progress_message: 'תובנה מעולה!' },
        { question_id: `q_${prevAnswers.length + 1}`, question_text: 'עדיף לך שגרה יציבה או הפתעות כל יום?', category: 'סגנון_עבודה', answer_type: 'choice', choices: ['שגרה יציבה', 'הפתעות ושינויים', 'קצת מזה קצת מזה', 'לא משנה'], progress_message: 'כמעט שם!' },
        { question_id: `q_${prevAnswers.length + 1}`, question_text: 'מה הדבר שהיית עושה גם בלי לקבל כסף?', category: 'תחומי_עניין', answer_type: 'open', progress_message: 'שאלה מצוינת!' },
        { question_id: `q_${prevAnswers.length + 1}`, question_text: 'מה לדעתך החוזקה הכי גדולה שלך?', category: 'כישורים', answer_type: 'open', progress_message: 'סיימנו את השאלון!' },
      ]
      const idx = prevAnswers.length % fallbackQuestions.length
      setCurrentQuestion(fallbackQuestions[idx])
    }
    setLoading(false)
  }

  const submitAnswer = async (answerText: string) => {
    if (!currentQuestion) return

    const newAnswer: QuestionAnswer = {
      question_id: currentQuestion.question_id,
      question_text: currentQuestion.question_text,
      answer_text: answerText,
      category: currentQuestion.category,
      timestamp: new Date().toISOString(),
    }

    const updatedAnswers = [...answers, newAnswer]
    setAnswers(updatedAnswers)

    // Save to DB
    if (sessionId) {
      await supabase.from('questionnaire_sessions').update({
        answers: updatedAnswers as unknown as Record<string, unknown>[],
        current_question_index: updatedAnswers.length,
      }).eq('id', sessionId)
    }

    // Check if done
    if (updatedAnswers.length >= maxQuestions) {
      await analyzeResults(updatedAnswers)
      return
    }

    await fetchNextQuestion(updatedAnswers)
  }

  const analyzeResults = async (allAnswers: QuestionAnswer[]) => {
    setAnalyzing(true)
    try {
      const { data, error } = await supabase.functions.invoke('analyze-and-match', {
        body: { session_id: sessionId, answers: allAnswers },
      })
      if (error) throw error
      setMatchedProfessions(data.matched_profession_ids || [])
    } catch {
      // Fallback: random selection of 25 professions for demo
      const randomIds = Array.from({ length: 25 }, () => Math.floor(Math.random() * 208) + 1)
      setMatchedProfessions([...new Set(randomIds)].slice(0, 25))
    }

    if (sessionId) {
      await supabase.from('questionnaire_sessions').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        matched_professions: matchedProfessions,
      }).eq('id', sessionId)
    }

    setAnalyzing(false)
    setCompleted(true)
  }

  const goBack = () => {
    if (answers.length === 0) return
    const prev = answers.slice(0, -1)
    setAnswers(prev)
    fetchNextQuestion(prev)
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
    submitAnswer,
    goBack,
  }
}
