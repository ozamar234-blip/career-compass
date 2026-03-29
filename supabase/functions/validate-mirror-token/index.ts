import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const { token } = await req.json()
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Find invitation by token
    const { data: invitation, error } = await supabase
      .from("mirror_invitations")
      .select("id, session_id, user_id, friend_name, status")
      .eq("invite_token", token)
      .single()

    if (error || !invitation) {
      return new Response(JSON.stringify({ error: "Token not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    if (invitation.status === "completed") {
      return new Response(JSON.stringify({ error: "Already completed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Update status to opened
    await supabase
      .from("mirror_invitations")
      .update({ status: "opened" })
      .eq("id", invitation.id)

    // Get user name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", invitation.user_id)
      .single()

    // Get professions from round 2 (the ones to show the friend)
    const { data: round } = await supabase
      .from("filtering_rounds")
      .select("selected_professions, maybe_professions")
      .eq("session_id", invitation.session_id)
      .eq("round_number", 2)
      .single()

    const profIds = [
      ...(round?.selected_professions || []),
      ...(round?.maybe_professions || []),
    ]

    // Get profession details
    const { data: professions } = await supabase
      .from("professions")
      .select("id, name, description, category")
      .in("id", profIds.length > 0 ? profIds : [0])

    return new Response(JSON.stringify({
      invitation_id: invitation.id,
      session_id: invitation.session_id,
      user_name: profile?.full_name || "החבר/ה שלך",
      professions: professions || [],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
