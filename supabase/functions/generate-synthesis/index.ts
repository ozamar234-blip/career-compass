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
    const { session_id } = await req.json()
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Gather all data
    const { data: session } = await supabase
      .from("questionnaire_sessions")
      .select("*")
      .eq("id", session_id)
      .single()

    const { data: rounds } = await supabase
      .from("filtering_rounds")
      .select("*")
      .eq("session_id", session_id)
      .order("round_number")

    const { data: responses } = await supabase
      .from("mirror_responses")
      .select("*")
      .eq("session_id", session_id)

    // Get user's final 3 professions
    const lastRound = rounds?.[rounds.length - 1]
    const finalProfIds = lastRound?.selected_professions || []

    const { data: finalProfs } = await supabase
      .from("professions")
      .select("*")
      .in("id", finalProfIds.length > 0 ? finalProfIds : [0])

    const systemPrompt = `אתה מומחה ייעוץ קריירה. בצע סינתזה מקיפה.

## נתונים:
1. תשובות שאלון + ניתוח RIASEC/VIPS
2. 3 המקצועות שהמשתמש בחר אחרי סינון
3. תשובות מכרים + המקצועות שהם בחרו

## משימה:
1. זהה 3 מקצועות מובילים עם % התאמה
2. נתח פערי תפיסה
3. 3 צעדים מעשיים לכל מקצוע
4. תובנה מפתיעה

## פורמט JSON:
{
  "top_3": [{
    "profession_id": 67,
    "profession_name": "שם",
    "match_percentage": 92,
    "user_signals": "...",
    "friend_signals": "...",
    "gap_analysis": "...",
    "action_steps": ["צעד 1", "צעד 2", "צעד 3"]
  }],
  "surprising_insight": "...",
  "perception_gap_summary": "...",
  "full_narrative": "..."
}`

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-20250514",
        max_tokens: 3000,
        system: systemPrompt,
        messages: [{
          role: "user",
          content: `תשובות שאלון: ${JSON.stringify(session?.answers)}\n\nניתוח AI: ${JSON.stringify(session?.ai_analysis)}\n\nסבבי סינון: ${JSON.stringify(rounds)}\n\nמקצועות סופיים: ${JSON.stringify(finalProfs)}\n\nתשובות מכרים: ${JSON.stringify(responses)}\n\nבצע סינתזה מלאה.`,
        }],
      }),
    })

    const data = await response.json()
    const text = data.content?.[0]?.text || "{}"
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {}

    // Save report
    const authHeader = req.headers.get("Authorization")
    if (authHeader) {
      const userSupabase = createClient(SUPABASE_URL, authHeader.replace("Bearer ", ""))
      const { data: { user } } = await userSupabase.auth.getUser()
      if (user) {
        await supabase.from("synthesis_reports").insert({
          session_id,
          user_id: user.id,
          top_3_professions: parsed.top_3 || [],
          full_analysis: parsed,
        })
      }
    }

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
