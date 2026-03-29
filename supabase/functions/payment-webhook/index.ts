import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const PAYMENT_WEBHOOK_SECRET = Deno.env.get("PAYMENT_WEBHOOK_SECRET") || ""

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    // Verify webhook signature (implement per payment provider)
    const signature = req.headers.get("x-webhook-signature") || ""
    if (PAYMENT_WEBHOOK_SECRET && !verifySignature(signature, PAYMENT_WEBHOOK_SECRET)) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const body = await req.json()
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Expected payload from payment provider:
    // { user_id, session_id, payment_ref, amount, status, provider }
    const { user_id, session_id, payment_ref, amount, status, provider } = body

    if (status === "completed" || status === "success") {
      // Create/update payment record
      await supabase.from("payments").insert({
        user_id,
        session_id: session_id || null,
        plan: "premium",
        amount: amount || 49,
        status: "completed",
        payment_provider: provider || "manual",
        payment_ref: payment_ref || null,
      })

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    if (status === "failed" || status === "refunded") {
      await supabase.from("payments")
        .update({ status })
        .eq("payment_ref", payment_ref)

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify({ success: true, message: "No action taken" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})

function verifySignature(signature: string, secret: string): boolean {
  // TODO: Implement per payment provider (Stripe, PayBox, etc.)
  // For now, basic comparison
  return signature === secret || !secret
}
