import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import ProtectedRoute from './components/common/ProtectedRoute'
import PublicRoute from './components/common/PublicRoute'
import AdminRoute from './components/common/AdminRoute'

import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Reading from './pages/Reading'
import ReadingDetail from './pages/ReadingDetail'
import Listening from './pages/Listening'
import ListeningDetail from './pages/ListeningDetail'
import Vocabulary from './pages/Vocabulary'
import VocabularyDetail from './pages/VocabularyDetail'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import Collections from './pages/Collections'

const AppLayout = ({ children }) => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1 flex flex-col">{children}</main>
    <Footer />
  </div>
)

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route element={<PublicRoute />}>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>

            {/* Recovery flow - outside PublicRoute so session doesn't redirect to dashboard */}
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
              <Route path="/reading" element={<AppLayout><Reading /></AppLayout>} />
              <Route path="/reading/:id" element={<AppLayout><ReadingDetail /></AppLayout>} />
              <Route path="/listening" element={<AppLayout><Listening /></AppLayout>} />
              <Route path="/listening/:id" element={<AppLayout><ListeningDetail /></AppLayout>} />
              <Route path="/vocabulary" element={<AppLayout><Vocabulary /></AppLayout>} />
              <Route path="/vocabulary/:id" element={<AppLayout><VocabularyDetail /></AppLayout>} />
              <Route path="/profile" element={<AppLayout><Profile /></AppLayout>} />
              <Route path="/my-collections" element={<AppLayout><Collections /></AppLayout>} />
            </Route>

            {/* Admin routes */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<Admin />} />
            </Route>

            {/* Legacy /lessons redirect → dashboard */}
            <Route path="/lessons" element={<Navigate to="/dashboard" replace />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
