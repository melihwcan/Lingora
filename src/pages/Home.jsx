import { Link } from 'react-router-dom'
import { Sparkles, GraduationCap, BookOpen, Headphones, Languages } from 'lucide-react'
import { PAGE_BG, PAGE_THEMES } from '../utils/pageTheme'
import { BRAND_CTA, BRAND_BORDER, BRAND_FONT } from '../utils/brandColors'
import { HeroBanner } from '../components/common/PageShell'
import LingoraLogo from '../components/common/LingoraLogo'

const Home = () => {
  const theme = PAGE_THEMES.home

  return (
    <div className={`min-h-screen ${PAGE_BG} flex flex-col`}>
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center max-w-4xl mx-auto w-full">
        <HeroBanner
          centerContent
          titleNode={<LingoraLogo size="lg" variant="light" />}
          subtitle={
            <span
              className={`${BRAND_FONT} block text-base md:text-lg font-semibold tracking-wide text-white/90 leading-relaxed`}
            >
              Oku, dinle, ustalaş. Lingora ile yeni bir dil, yeni bir sen.
            </span>
          }
          gradient={theme.gradient}
          Icon={GraduationCap}
          AccentIcon={Sparkles}
          className="w-full mb-10"
        />

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            to="/register"
            className={`${BRAND_CTA} text-white font-bold px-8 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5`}
          >
            Hemen Başla
          </Link>
          <Link
            to="/login"
            className={`border-2 ${BRAND_BORDER} font-bold px-8 py-3.5 rounded-xl transition-colors`}
          >
            Giriş Yap
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-4 w-full max-w-lg">
          {[
            { icon: BookOpen, label: 'Okuma', color: 'text-blue-500' },
            { icon: Headphones, label: 'Dinleme', color: 'text-violet-500' },
            { icon: Languages, label: 'Kelime', color: 'text-emerald-500' },
          ].map(({ icon: Icon, label, color }) => (
            <div
              key={label}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm"
            >
              <Icon className={`w-8 h-8 ${color} mx-auto mb-2`} strokeWidth={1.5} />
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Home
