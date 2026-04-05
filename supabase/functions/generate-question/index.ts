import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const CLAUDE_API_KEY = Deno.env.get("CLAUDE_API_KEY")!
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const { session_id, previous_answers } = await req.json()
    const allAnswers = previous_answers || []
    const totalAnswered = allAnswers.length

    // Build a compact summary: categories covered + last 3 full answers
    const categoriesCovered = [...new Set(allAnswers.map((a: { category?: string }) => a.category).filter(Boolean))]
    const recentAnswers = allAnswers.slice(-3)

    // For early questions (≤3), send all. For later ones, send summary + recent 3
    const compactContext = totalAnswered <= 3
      ? JSON.stringify(allAnswers)
      : JSON.stringify({
          total_answered: totalAnswered,
          categories_covered: categoriesCovered,
          recent_answers: recentAnswers,
        })

    const systemPrompt = `אתה מומחה ייעוץ קריירה ישראלי. אתה מנהל שאלון חווייתי לגילוי מקצוע מתאים.

## כללים:
- שאל שאלות בעברית, בשפה חמה ולא פורמלית (פנייה בגוף שני)
- השאלות חייבות להיות חווייתיות ומעניינות — לא אקדמיות
- כל שאלה שייכת לאחת מ-6 הקטגוריות: תחומי_עניין, ערכים, סגנון_עבודה, כישורים, אנרגיה, אישיות
- התאם את השאלה הבאה לתשובות האחרונות (אדפטיבי)
- וודא שאתה מכסה קטגוריות שעוד לא כוסו
- החזר JSON בלבד

## פורמט תשובה (JSON בלבד):
{
  "question_text": "השאלה בעברית",
  "question_id": "q_XX",
  "category": "תחומי_עניין",
  "answer_type": "open" | "choice",
  "choices": ["אפשרות 1", "אפשרות 2", "אפשרות 3", "אפשרות 4"],
  "progress_message": "משפט עידוד קצר"
}`

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        system: systemPrompt,
        messages: [{
          role: "user",
          content: `הקשר: ${compactContext}\n\nצור שאלה ${totalAnswered + 1}.`,
        }],
      }),
    })

    const data = await response.json()
    const text = data.content?.[0]?.text || "{}"

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {}

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
