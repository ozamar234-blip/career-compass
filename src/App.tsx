import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './components/ui/Toast'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { PrivateRoute } from './components/PrivateRoute'
import { AppShell } from './components/layout/AppShell'
import { Landing } from './pages/Landing'
import { Auth } from './pages/Auth'
import { Onboarding } from './pages/Onboarding'
import { Dashboard } from './pages/Dashboard'
import { Questionnaire } from './pages/Questionnaire'
import { Filtering } from './pages/Filtering'
import { Mirror } from './pages/Mirror'
import { MirrorRespond } from './pages/MirrorRespond'
import { Results } from './pages/Results'
import { Premium } from './pages/Premium'

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              {/* Public pages — no header */}
              <Route path="/" element={<Landing />} />
              <Route path="/mirror/respond/:token" element={<MirrorRespond />} />

              {/* App pages — with header */}
              <Route element={<AppShell />}>
                <Route path="/auth" element={<Auth />} />
                <Route path="/onboarding" element={
                  <PrivateRoute><Onboarding /></PrivateRoute>
                } />
                <Route path="/dashboard" element={
                  <PrivateRoute requireProfile><Dashboard /></PrivateRoute>
                } />
                <Route path="/questionnaire" element={
                  <PrivateRoute requireProfile><Questionnaire /></PrivateRoute>
                } />
                <Route path="/filtering" element={
                  <PrivateRoute requireProfile><Filtering /></PrivateRoute>
                } />
                <Route path="/mirror" element={
                  <PrivateRoute requireProfile><Mirror /></PrivateRoute>
                } />
                <Route path="/results" element={
                  <PrivateRoute requireProfile><Results /></PrivateRoute>
                } />
                <Route path="/premium" element={
                  <PrivateRoute><Premium /></PrivateRoute>
                } />
              </Route>
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
