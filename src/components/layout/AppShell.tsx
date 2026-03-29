import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Compass, Home, LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const isPublicPage = location.pathname === '/' || location.pathname.startsWith('/mirror/respond') || location.pathname === '/auth'

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      {!isPublicPage && (
        <header className="sticky top-0 z-40 bg-bg-card/80 backdrop-blur-md border-b border-border">
          <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
            <button onClick={() => navigate('/')} className="flex items-center gap-2">
              <Compass className="w-6 h-6 text-primary" />
              <span className="font-heebo font-bold text-primary text-lg">מצפן הקריירה</span>
            </button>
            {user && (
              <div className="flex items-center gap-2">
                <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-primary-light/30 rounded-lg transition-colors">
                  <Home className="w-5 h-5 text-text-muted" />
                </button>
                <button onClick={() => { signOut(); navigate('/') }} className="p-2 hover:bg-primary-light/30 rounded-lg transition-colors">
                  <LogOut className="w-5 h-5 text-text-muted" />
                </button>
              </div>
            )}
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
