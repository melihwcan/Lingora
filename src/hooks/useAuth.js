import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

/**
 * Returns the current auth state (user, session, loading) and auth helpers
 * (signIn, signUp, signOut) from AuthContext.
 */
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }
  return context
}
