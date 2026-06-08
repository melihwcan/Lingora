import { useId } from 'react'
import { Globe2 } from 'lucide-react'
import { BRAND_FONT, BRAND_GRADIENT_TEXT } from '../../utils/brandColors'

const SIZES = {
  sm: {
    icon: 'w-4 h-4',
    wordmark: 'text-base',
    gap: 'gap-1.5',
  },
  md: {
    icon: 'w-5 h-5',
    wordmark: 'text-xl',
    gap: 'gap-2',
  },
  lg: {
    icon: 'w-7 h-7',
    wordmark: 'text-3xl md:text-4xl',
    gap: 'gap-2.5',
  },
}

const LingoraLogo = ({ className = '', size = 'md', variant = 'default' }) => {
  const s = SIZES[size] ?? SIZES.md
  const isLight = variant === 'light'
  const gradId = `lingora-brand-${useId().replace(/:/g, '')}`

  return (
    <span className={`inline-flex items-center ${s.gap} ${className}`}>
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#d946ef" />
          </linearGradient>
        </defs>
      </svg>

      <Globe2
        className={`${s.icon} shrink-0 ${isLight ? 'text-white/90' : ''}`}
        stroke={isLight ? 'currentColor' : `url(#${gradId})`}
        strokeWidth={2}
        aria-hidden="true"
      />

      <span
        className={`${BRAND_FONT} font-extrabold tracking-tight ${s.wordmark} ${
          isLight ? 'text-white drop-shadow-sm' : BRAND_GRADIENT_TEXT
        }`}
      >
        Lingora
      </span>
    </span>
  )
}

export default LingoraLogo
