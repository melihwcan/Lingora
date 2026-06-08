import { useState } from 'react'
import { Link } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { AuthLayout } from '../components/common/PageShell'
import { PAGE_THEMES } from '../utils/pageTheme'
import { BRAND_CTA, BRAND_TEXT } from '../utils/brandColors'

const Register = () => {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  const inputClass =
    'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-4 py-2.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'

  const theme = PAGE_THEMES.register

  return (
    <AuthLayout
      title="Hesap oluştur"
      subtitle="Dil öğrenme yolculuğuna bugün başla."
      gradient={theme.gradient}
      Icon={UserPlus}
    >
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1 text-center md:text-left">
        Kayıt Ol
      </h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 text-center md:text-left">
        Ücretsiz hesabını oluştur
      </p>

      {error && (
        <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm mb-4">
          {error}
        </div>
      )}

      {success ? (
        <div className="text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 text-sm text-center">
          <p className="font-semibold text-base mb-1">Kayıt başarılı!</p>
          E-posta adresinizi doğrulayın. Gelen kutunuzu kontrol edin.
          <div className="mt-4">
            <Link to="/login" className={`${BRAND_TEXT} font-semibold hover:underline text-sm`}>
              Giriş sayfasına git →
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Kullanıcı Adı</label>
            <input type="text" placeholder="takma adını yaz mösyo" value={username} onChange={(e) => setUsername(e.target.value)} required className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">E-posta</label>
            <input type="email" placeholder="mösyo@matmazel.com" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Şifre</label>
            <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Şifre (Tekrar)</label>
            <input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className={inputClass} />
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
            {loading ? 'Hesap oluşturuluyor…' : 'Hesap Oluştur'}
          </button>
        </form>
      )}

      {!success && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center md:text-left mt-5">
          Zaten hesabın var mı?{' '}
          <Link to="/login" className={`${BRAND_TEXT} font-semibold hover:underline`}>
            Giriş Yap
          </Link>
        </p>
      )}
    </AuthLayout>
  )
}

export default Register
