import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function AdminRoute() {
  const { user, loading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!user) { setChecking(false); return }
    supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setIsAdmin(data?.is_admin ?? false)
        setChecking(false)
      })
  }, [user])

  if (loading || checking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return <Outlet />
}
