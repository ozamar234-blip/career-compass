import { useState } from 'react'

export function usePremium() {
  // TODO: Re-enable payment check when payment flow is ready
  // For now, all users get premium access
  const [isPremium] = useState(true)
  const [loading] = useState(false)

  return { isPremium, loading }
}
