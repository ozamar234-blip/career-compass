import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
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
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public pages — no header */}
          <Route path="/" element={<Landing />} />
          <Route path="/mirror/respond/:token" element={<MirrorRespond />} />

          {/* App pages — with header */}
          <Route element={<AppShell />}>
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/questionnaire" element={<Questionnaire />} />
            <Route path="/filtering" element={<Filtering />} />
            <Route path="/mirror" element={<Mirror />} />
            <Route path="/results" element={<Results />} />
            <Route path="/premium" element={<Premium />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
