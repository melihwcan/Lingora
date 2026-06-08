import { DARK_BORDER, DARK_SURFACE } from '../../utils/brandColors'
import { PAGE_BG, HERO_DOT_PATTERN } from '../../utils/pageTheme'

export { default as ContentDetailHeader } from './ContentDetailHeader'
export { default as ContentCard } from './ContentCard'
export { default as CompletionCTA } from './CompletionCTA'

export function PageShell({ children, maxWidth = 'max-w-4xl', className = '' }) {
  return (
    <div className={`${PAGE_BG} flex-1`}>
      <div className={`${maxWidth} mx-auto px-4 py-8 md:py-10 ${className}`}>
        {children}
      </div>
    </div>
  )
}

export function PageLoading({ spinnerColor = 'border-indigo-500', maxWidth = 'max-w-4xl' }) {
  return (
    <div className={`${PAGE_BG} flex-1`}>
      <div className={`${maxWidth} mx-auto px-4 py-8 md:py-10 flex justify-center`}>
        <div
          className={`w-8 h-8 border-4 ${spinnerColor} border-t-transparent rounded-full animate-spin`}
        />
      </div>
    </div>
  )
}

export function HeroBanner({
  title,
  titleNode,
  subtitle,
  gradient,
  Icon,
  AccentIcon,
  compact = false,
  centerContent = false,
  className = '',
}) {
  const padding = compact ? 'p-6 md:p-8' : 'p-8 md:p-10'
  const iconSize = compact ? 'w-20 h-20 md:w-24 md:h-24' : 'w-32 h-32'
  const titleSize = compact ? 'text-2xl md:text-3xl' : 'text-3xl'
  const pr = compact ? 'pr-20 md:pr-28' : 'pr-28'

  return (
    <div
      className={`rounded-3xl bg-gradient-to-r ${gradient} shadow-lg ring-1 ring-white/20 ${padding} relative overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 opacity-10" style={HERO_DOT_PATTERN} />
      {centerContent ? (
        <div className="relative z-10 flex w-full flex-col items-center justify-center text-center">
          {titleNode ? (
            <div className="mb-2">{titleNode}</div>
          ) : (
            <h1 className={`${titleSize} font-extrabold text-white mb-2`}>{title}</h1>
          )}
          {subtitle && <p className="text-white/90 text-sm md:text-base max-w-full">{subtitle}</p>}
        </div>
      ) : (
        <div className={`relative z-10 ${pr}`}>
          {titleNode ? (
            <div className="mb-2">{titleNode}</div>
          ) : (
            <h1 className={`${titleSize} font-extrabold text-white mb-2`}>{title}</h1>
          )}
          {subtitle && <p className="text-white/90 text-sm md:text-base">{subtitle}</p>}
        </div>
      )}
      {Icon && (
        <Icon
          className={`absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 ${
            centerContent
              ? `hidden sm:block ${compact ? 'w-20 h-20 md:w-24 md:h-24' : 'w-24 h-24 md:w-32 md:h-32'} opacity-10`
              : `${iconSize} opacity-20`
          } text-white pointer-events-none`}
          strokeWidth={1}
        />
      )}
      {AccentIcon && (
        <AccentIcon
          className={`absolute top-6 text-white pointer-events-none ${
            centerContent
              ? 'right-14 md:right-20 w-6 h-6 md:w-8 md:h-8 opacity-20 hidden sm:block'
              : 'right-24 md:right-28 w-8 h-8 opacity-30'
          }`}
          strokeWidth={1.5}
        />
      )}
    </div>
  )
}

export function AuthLayout({ title, subtitle, gradient, Icon, children }) {
  return (
    <div className={`min-h-screen ${PAGE_BG} flex items-center justify-center px-4 py-10`}>
      <div className="w-full max-w-4xl">
        <div className="grid md:grid-cols-5 gap-6 md:gap-8 items-stretch">
          <div className="md:col-span-2 flex flex-col justify-center">
            <HeroBanner
              title={title}
              subtitle={subtitle}
              gradient={gradient}
              Icon={Icon}
              compact
              className="h-full flex flex-col justify-center min-h-[140px] md:min-h-[320px]"
            />
          </div>
          <div className={`md:col-span-3 bg-white rounded-2xl shadow-xl dark:shadow-black/50 border border-gray-100 p-6 md:p-8 ${DARK_SURFACE} ${DARK_BORDER}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
