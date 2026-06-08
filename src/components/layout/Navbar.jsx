import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, BookOpen, Headphones, Languages } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../lib/supabaseClient'
import { useState, useEffect, useRef } from 'react'
import LingoraLogo from '../common/LingoraLogo'
import { DARK_BORDER, DARK_SURFACE } from '../../utils/brandColors'

const moduleLinks = [
  {
    to: '/reading',
    label: 'Okuma',
    icon: BookOpen,
    activeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    iconActiveClass: 'text-blue-600 dark:text-blue-400',
  },
  {
    to: '/listening',
    label: 'Dinleme',
    icon: Headphones,
    activeClass: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400',
    iconActiveClass: 'text-violet-600 dark:text-violet-400',
  },
  {
    to: '/vocabulary',
    label: 'Kelime',
    icon: Languages,
    activeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    iconActiveClass: 'text-emerald-600 dark:text-emerald-400',
  },
]

const Navbar = () => {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [isAdmin, setIsAdmin] = useState(false)
  const [username, setUsername] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const homePath = user ? '/dashboard' : '/'
  const isDashboardActive = pathname === '/dashboard'

  const handleLogout = async () => {
    setDropdownOpen(false)
    await signOut()
    navigate('/login')
  }

  useEffect(() => {
    if (!user) {
      Promise.resolve().then(() => { setIsAdmin(false); setUsername('') })
      return
    }
    supabase
      .from('profiles')
      .select('is_admin, username')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setIsAdmin(data?.is_admin ?? false)
        setUsername(data?.username ?? user.email?.split('@')[0] ?? '')
      })
  }, [user])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <nav className="bg-white/45 backdrop-blur-lg border-b border-gray-200/70 sticky top-0 z-50 dark:bg-black/50 dark:border-neutral-800/60">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Brand */}
        <div className="flex items-center">
          <Link
            to={homePath}
            className="transition-opacity hover:opacity-80"
            aria-label="Lingora ana sayfa"
          >
            <LingoraLogo size="md" />
          </Link>
        </div>

        {/* Nav links */}
        <ul className="hidden md:flex gap-1 items-center">
          {moduleLinks.map(({ to, label, icon: Icon, activeClass, iconActiveClass }) => {
            const isActive = pathname === to
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${
                    isActive
                      ? activeClass
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      isActive
                        ? iconActiveClass
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Home + User dropdown */}
        {user && (
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard"
              title="Ana Sayfa"
              aria-label="Ana Sayfa"
              className={`p-2 rounded-lg transition-colors ${
                isDashboardActive
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400'
                  : 'text-gray-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600'
              }`}
            >
              <Home className="w-5 h-5" />
            </Link>
            <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {/* Avatar initials */}
              <span className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 text-white flex items-center justify-center text-xs font-bold uppercase select-none shrink-0">
                {username.charAt(0) || '?'}
              </span>
              <span className="hidden sm:inline max-w-[120px] truncate">{username}</span>
              <svg
                className={`w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0 ${dropdownOpen ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown panel */}
            {dropdownOpen && (
              <div className={`absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-200 py-1.5 z-50 ${DARK_SURFACE} ${DARK_BORDER}`}>
                {/* User info header */}
                <div className="px-4 py-2 mb-1">
                  <p className="text-xs text-gray-400 dark:text-gray-500">Giriş yapıldı</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{username}</p>
                </div>

                <div className={`border-t border-gray-100 mb-1 ${DARK_BORDER}`} />

                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/60 rounded-lg mx-1"
                >
                  <span className="w-5 flex justify-center items-center flex-shrink-0 text-base">👤</span>
                  Profilim
                </Link>

                <Link
                  to="/my-collections"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/60 rounded-lg mx-1"
                >
                  <span className="w-5 flex justify-center items-center flex-shrink-0">
                    <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </span>
                  <span>Koleksiyonlarım</span>
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg mx-1"
                  >
                    <span className="w-5 flex justify-center items-center flex-shrink-0 text-base">⚙️</span>
                    Admin Paneli
                  </Link>
                )}

                <div className={`border-t border-gray-100 my-1 ${DARK_BORDER}`} />

                {/* Theme toggle */}
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/60 rounded-lg mx-1"
                  style={{ width: 'calc(100% - 8px)' }}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 flex justify-center items-center flex-shrink-0 text-base">{isDark ? '☀️' : '🌙'}</span>
                    <span>Görünüm</span>
                  </div>
                  {/* Toggle pill */}
                  <div
                    className={`w-10 h-5 rounded-full flex items-center px-0.5 ${isDark ? 'bg-indigo-600' : 'bg-gray-300'}`}
                    style={{ transition: 'background-color 300ms' }}
                  >
                    <div
                      className="w-4 h-4 rounded-full bg-white shadow-sm"
                      style={{
                        transform: isDark ? 'translateX(20px)' : 'translateX(0)',
                        transition: 'transform 300ms',
                      }}
                    />
                  </div>
                </button>

                <div className={`border-t border-gray-100 my-1 ${DARK_BORDER}`} />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg mx-1"
                  style={{ width: 'calc(100% - 8px)' }}
                >
                  <span className="w-5 flex justify-center items-center flex-shrink-0 text-base">🚪</span>
                  Çıkış Yap
                </button>
              </div>
            )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
