import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function PublicRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (user) return <Navigate to="/dashboard" replace />

  return <Outlet />
}
