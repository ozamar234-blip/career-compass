import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function usePremium() {
  const { user } = useAuth()
  const [isPremium, setIsPremium] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }

    const check = async () => {
      const { data } = await supabase
        .from('payments')
        .select('id')
        .eq('user_id', user.id)
        .eq('plan', 'premium')
        .eq('status', 'completed')
        .limit(1)
        .single()

      setIsPremium(!!data)
      setLoading(false)
    }
    check()
  }, [user])

  return { isPremium, loading }
}
