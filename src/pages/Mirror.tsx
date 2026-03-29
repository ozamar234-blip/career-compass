import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserPlus, Send, Check, Clock } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface FriendInvite {
  id: string
  name: string
  phone: string
  status: 'pending' | 'sent' | 'opened' | 'completed'
}

export function Mirror() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [friends, setFriends] = useState<FriendInvite[]>([
    { id: '1', name: '', phone: '', status: 'pending' },
    { id: '2', name: '', phone: '', status: 'pending' },
    { id: '3', name: '', phone: '', status: 'pending' },
    { id: '4', name: '', phone: '', status: 'pending' },
  ])
  const [invitations, setInvitations] = useState<Array<{ id: string; invite_token: string; friend_name: string; status: string }>>([])
  const [completedCount, setCompletedCount] = useState(0)

  // Subscribe to realtime updates
  useEffect(() => {
    const sessionId = sessionStorage.getItem('sessionId')
    if (!sessionId) return

    const channel = supabase
      .channel('mirror-updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'mirror_responses',
        filter: `session_id=eq.${sessionId}`,
      }, () => {
        setCompletedCount(p => p + 1)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const updateFriend = (idx: number, field: 'name' | 'phone', value: string) => {
    setFriends(prev => prev.map((f, i) => i === idx ? { ...f, [field]: value } : f))
  }

  const sendInvite = async (idx: number) => {
    const friend = friends[idx]
    if (!friend.name || !user) return

    const sessionId = sessionStorage.getItem('sessionId') || ''

    // Save invitation to DB
    const { data } = await supabase
      .from('mirror_invitations')
      .insert({
        session_id: sessionId,
        user_id: user.id,
        friend_name: friend.name,
        friend_phone: friend.phone,
      })
      .select()
      .single()

    if (data) {
      setInvitations(prev => [...prev, data])

      // Generate WhatsApp link
      const baseUrl = window.location.origin
      const link = `${baseUrl}/mirror/respond/${data.invite_token}`
      const message = encodeURIComponent(
        `היי ${friend.name}! 👋\n${profile?.full_name || 'חבר שלך'} עושה תהליך לגילוי המקצוע שמתאים לו, וביקש ממך לעזור.\nזה לוקח 3 דקות — רק לענות על כמה שאלות קצרות.\n👉 ${link}`
      )
      window.open(`https://wa.me/?text=${message}`, '_blank')

      // Update status
      setFriends(prev => prev.map((f, i) => i === idx ? { ...f, status: 'sent' } : f))
    }
  }

  const canProceed = completedCount >= 3 || invitations.length >= 4

  return (
    <div className="px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-heebo font-black text-primary mb-2">
            ראיית מראה
          </h1>
          <p className="text-text-muted text-sm">
            הזמן 4 אנשים שמכירים אותך — הם יענו על שאלות קצרות עליך
          </p>
        </div>

        {/* Friend inputs */}
        <div className="space-y-3 mb-8">
          {friends.map((friend, i) => (
            <Card key={friend.id} className="!p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-7 h-7 bg-primary-light text-primary rounded-full flex items-center justify-center text-sm font-heebo font-bold">
                  {i + 1}
                </span>
                <span className="text-sm font-heebo font-bold">
                  {friend.status === 'sent' ? `${friend.name} — נשלח` :
                   friend.status === 'completed' ? `${friend.name} — ענה!` :
                   `מכר ${i + 1}`}
                </span>
                {friend.status === 'sent' && <Clock className="w-4 h-4 text-accent mr-auto" />}
                {friend.status === 'completed' && <Check className="w-4 h-4 text-success mr-auto" />}
              </div>

              {friend.status === 'pending' && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={friend.name}
                    onChange={e => updateFriend(i, 'name', e.target.value)}
                    placeholder="שם המכר"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:border-primary"
                  />
                  <input
                    type="tel"
                    value={friend.phone}
                    onChange={e => updateFriend(i, 'phone', e.target.value)}
                    placeholder="טלפון (אופציונלי)"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:border-primary"
                    dir="ltr"
                  />
                  <Button
                    size="sm"
                    fullWidth
                    variant="accent"
                    onClick={() => sendInvite(i)}
                    disabled={!friend.name}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Send className="w-4 h-4" />
                      שלח הזמנה ב-WhatsApp
                    </span>
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Status */}
        <div className="text-center mb-6">
          <p className="font-heebo font-bold text-lg">
            {completedCount}/4 מכרים ענו
          </p>
          <div className="w-full h-2 bg-border rounded-full overflow-hidden mt-2">
            <motion.div
              className="h-full bg-success rounded-full"
              animate={{ width: `${(completedCount / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Proceed */}
        <Button
          fullWidth
          size="lg"
          onClick={() => navigate('/results')}
          disabled={!canProceed}
        >
          {canProceed ? 'צפה בתוצאות' : 'ממתין לתשובות מכרים...'}
        </Button>

        <button
          onClick={() => navigate('/results')}
          className="w-full text-center text-sm text-text-muted hover:text-primary mt-4 transition-colors"
        >
          דלג — אני רוצה לראות תוצאות עכשיו
        </button>
      </motion.div>
    </div>
  )
}
