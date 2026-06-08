import { Link, useLocation } from 'react-router-dom'
import LingoraLogo from '../common/LingoraLogo'

const links = [
  { to: '/dashboard', label: 'Ana Sayfa', icon: '🏠' },
  { to: '/lessons', label: 'Dersler', icon: '📚' },
  { to: '/reading', label: 'Okuma', icon: '📖' },
  { to: '/listening', label: 'Dinleme', icon: '🎧' },
  { to: '/vocabulary', label: 'Kelime', icon: '🔤' },
  { to: '/profile', label: 'Profilim', icon: '👤' },
]

const Sidebar = () => {
  const { pathname } = useLocation()

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col py-6 px-3">
      <Link
        to="/"
        className="px-3 mb-8 inline-block transition-opacity hover:opacity-80"
        aria-label="Lingora ana sayfa"
      >
        <LingoraLogo size="md" />
      </Link>
      <nav className="flex flex-col gap-1">
        {links.map(({ to, label, icon }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              pathname === to
                ? 'bg-green-100 text-green-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>{icon}</span>
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
