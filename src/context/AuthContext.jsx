import { createContext, useState, useEffect, useContext } from 'react'
import { supabase } from '../lib/supabaseClient'
import { updateLoginStreak } from '../utils/streak'
import { clearMascotPoppedStorage } from '../utils/mascotStorage'

export const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        updateLoginStreak(session.user.id)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (event === 'SIGNED_IN' && session?.user) {
        updateLoginStreak(session.user.id)
      }
      if (event === 'SIGNED_OUT') {
        clearMascotPoppedStorage()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password })

  const signUp = (email, password, username) =>
    supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    })

  const signOut = async () => {
    clearMascotPoppedStorage()
    return supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
