import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { AuthLayout } from '../components/common/PageShell'
import { PAGE_THEMES } from '../utils/pageTheme'

const ResetPassword = () => {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [ready, setReady] = useState(false)

  const inputClass =
    'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-4 py-2.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500'

  useEffect(() => {
    let subscription

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setReady(true)
        return
      }

      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY' || session) setReady(true)
      })
      subscription = data.subscription
    }

    init()

    return () => subscription?.unsubscribe()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.')
      return
    }
    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor.')
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
    } else {
      await supabase.auth.signOut()
      navigate('/login?reset=success')
    }
  }

  const theme = PAGE_THEMES.resetPassword

  return (
    <AuthLayout
      title="Yeni şifre belirle"
      subtitle="Güçlü bir şifre seç ve hesabını koru."
      gradient={theme.gradient}
      Icon={Lock}
    >
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1 text-center md:text-left">
        Şifre Güncelleme
      </h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 text-center md:text-left">
        Yeni şifrenizi belirleyin
      </p>

      {!ready ? (
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-sm mb-4">
            Geçersiz veya süresi dolmuş bağlantı
          </div>
          <Link to="/login" className="text-amber-600 dark:text-amber-400 font-semibold hover:underline text-sm">
            Giriş sayfasına dön →
          </Link>
        </div>
      ) : (
        <>
          {error && (
            <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Yeni Şifre</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Yeni Şifre (Tekrar)</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 mt-1 shadow-md transition-all"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {loading ? 'Kaydediliyor…' : 'Şifreyi Güncelle'}
            </button>
          </form>
        </>
      )}
    </AuthLayout>
  )
}

export default ResetPassword
