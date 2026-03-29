import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LoadingSpinner } from './ui/LoadingSpinner'

interface PrivateRouteProps {
  children: React.ReactNode
  requireProfile?: boolean
}

export function PrivateRoute({ children, requireProfile = false }: PrivateRouteProps) {
  const { user, profile, loading } = useAuth()

  if (loading) return <LoadingSpinner text="בודק הרשאות..." />
  if (!user) return <Navigate to="/auth" replace />
  if (requireProfile && (!profile?.full_name || !profile?.current_status)) {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}
