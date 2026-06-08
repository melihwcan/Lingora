import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { AuthLayout } from '../components/common/PageShell'
import { PAGE_THEMES } from '../utils/pageTheme'
import { BRAND_CTA, BRAND_TEXT } from '../utils/brandColors'

const Login = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (searchParams.get('reset') === 'success') {
      setSuccess('Şifreniz başarıyla güncellendi. Giriş yapabilirsiniz.')
    }
  }, [searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  const theme = PAGE_THEMES.login

  return (
    <AuthLayout
      title="Tekrar hoş geldin"
      subtitle="Hesabına giriş yap ve öğrenmeye devam et."
      gradient={theme.gradient}
      Icon={LogIn}
    >
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1 text-center md:text-left">
        Giriş Yap
      </h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 text-center md:text-left">
        E-posta ve şifrenle giriş yap
      </p>

      {success && (
        <div className="text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm mb-4">
          {success}
        </div>
      )}

      {error && (
        <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">E-posta</label>
          <input
            type="email"
            placeholder="mösyo@matmazel.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-4 py-2.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Şifre</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-4 py-2.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <Link to="/forgot-password" className={`text-sm ${BRAND_TEXT} hover:underline mt-1`}>
            Şifremi unuttum
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`${BRAND_CTA} disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 mt-1 shadow-md transition-all`}
        >
          {loading && (
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {loading ? 'Giriş yapılıyor…' : 'Giriş Yap'}
        </button>
      </form>

      <p className="text-sm text-gray-500 dark:text-gray-400 text-center md:text-left mt-5">
        Hesabın yok mu?{' '}
        <Link to="/register" className={`${BRAND_TEXT} font-semibold hover:underline`}>
          Kayıt Ol
        </Link>
      </p>
    </AuthLayout>
  )
}

export default Login
