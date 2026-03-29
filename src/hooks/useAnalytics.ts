import { useCallback } from 'react'

type EventName =
  | 'page_view'
  | 'questionnaire_start'
  | 'questionnaire_complete'
  | 'questionnaire_abandon'
  | 'filtering_round_complete'
  | 'mirror_invite_sent'
  | 'mirror_response_received'
  | 'synthesis_viewed'
  | 'premium_page_viewed'
  | 'premium_purchase_start'
  | 'premium_purchase_complete'
  | 'share_whatsapp'
  | 'signup_complete'
  | 'onboarding_complete'

interface AnalyticsEvent {
  name: EventName
  properties?: Record<string, string | number | boolean>
}

export function useAnalytics() {
  const track = useCallback((event: AnalyticsEvent) => {
    // Console logging for dev — replace with real analytics provider
    if (import.meta.env.DEV) {
      console.log('[Analytics]', event.name, event.properties)
    }

    // Send to Supabase analytics table or external provider
    // Example: Mixpanel, PostHog, or custom Supabase table
    try {
      if (typeof window !== 'undefined' && 'gtag' in window) {
        // Google Analytics 4
        const gtag = (window as Record<string, (...args: unknown[]) => void>).gtag
        if (gtag) gtag('event', event.name, event.properties)
      }
    } catch {
      // Silent fail for analytics
    }
  }, [])

  const trackPageView = useCallback((page: string) => {
    track({ name: 'page_view', properties: { page } })
  }, [track])

  return { track, trackPageView }
}
