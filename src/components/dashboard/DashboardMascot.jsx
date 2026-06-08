import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { MousePointerClick } from 'lucide-react'
import {
  isMascotPopped,
  migrateMascotStorage,
  setMascotPopped,
} from '../../utils/mascotStorage'
import { BRAND_FONT } from '../../utils/brandColors'

const SQUASH_MS = 100
const LOCAL_POP_MS = 750
const SPLASH_PARTICLE_COUNT = 55
const MAIN_GLOB_COUNT = 3
const COLLAPSE_MS = 500
const BUM_PAUSE_MS = 800
const BUM_POST_POP_MS = 3000

const DIALOGUE_STEPS = [
  {
    text: (name) =>
      `Hoş geldin, ${name}! Bugün yeni kelimeler avlamaya hazır mıyız?`,
    buttons: [
      { label: 'Tabii ki!', variant: 'primary' },
      { label: 'Üzgünüm LingoLingo.. Hiç halim yok..', variant: 'secondary' },
    ],
  },
  {
    text: () =>
      'Hop hop! O fare imlecini yavaşça yere bırak... Bana tıklamayı düşünmüyorsun değil mi?',
    buttons: [
      { label: 'Hayır canım ne alaka..', variant: 'primary' },
      { label: 'Sakinleş LingoLingo..', variant: 'secondary' },
    ],
  },
  {
    text: () =>
      'Hop hop! O fare imlecini yavaşça yere bırak... Bana tıklamayı düşünmüyorsun değil mi?',
    buttons: null,
    showClickHint: true,
  },
  {
    text: () =>
      'BUM! Beni patlattın... Neyse, içimdeki kelimeler dökülmeden sen öğrenmene bak!',
    buttons: null,
  },
]

const BUTTON_STYLES = {
  primary: `${BRAND_FONT} w-full min-w-[200px] shrink-0 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-transform hover:scale-105 hover:bg-emerald-600 active:scale-95`,
  secondary: `${BRAND_FONT} w-full min-w-[200px] shrink-0 rounded-full bg-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition-transform hover:scale-105 hover:bg-slate-300 active:scale-95 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500`,
}

const SPLAT_RADIUS = [
  '42% 58% 52% 48%',
  '55% 45% 48% 52%',
  '48% 52% 58% 42%',
  '60% 40% 45% 55%',
  '50% 50% 42% 58%',
]

const LOCAL_SPLATS = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  angle: (i * 12.9) + (i % 4) * 11,
  distance: 95 + (i % 7) * 24,
  delay: SQUASH_MS + (i % 5) * 10,
  width: 20 + (i % 5) * 9,
  rotation: (i * 23 + (i % 7) * 31) % 360,
  radius: SPLAT_RADIUS[i % SPLAT_RADIUS.length],
}))

const SPLASH_GRADIENTS = [
  'from-indigo-400 via-violet-400 to-fuchsia-400',
  'from-indigo-500 via-purple-400 to-fuchsia-500',
  'from-violet-400 via-fuchsia-400 to-pink-400',
  'from-indigo-300 via-violet-500 to-fuchsia-300',
]

const generateMainGlobs = () =>
  Array.from({ length: MAIN_GLOB_COUNT }, (_, i) => {
    const angle = (i / MAIN_GLOB_COUNT) * Math.PI * 2 + Math.PI / 5
    const distance = 6 + Math.random() * 14
    const burstX = Math.cos(angle) * distance
    const burstY = Math.sin(angle) * distance * 0.65
    const width = 52 + Math.random() * 36
    const height = width / 4.2

    return {
      id: `glob-${i}`,
      isMainGlob: true,
      burstX: `${burstX}vw`,
      burstY: `${burstY}vh`,
      driftX: `${(Math.random() - 0.5) * 10}vw`,
      fallY: `${28 + Math.random() * 32}vh`,
      fallDuration: `${2.8 + Math.random() * 1.4}s`,
      delay: `${SQUASH_MS + i * 8}ms`,
      width,
      height,
      rotation: Math.floor(Math.random() * 360),
      radius: SPLAT_RADIUS[i % SPLAT_RADIUS.length],
      gradient: SPLASH_GRADIENTS[i % SPLASH_GRADIENTS.length],
    }
  })

const generateSplashParticles = (count = SPLASH_PARTICLE_COUNT) => {
  const regularCount = count - MAIN_GLOB_COUNT

  const regular = Array.from({ length: regularCount }, (_, i) => {
    const angle = Math.random() * Math.PI * 2
    const distance = 38 + Math.random() * 82
    const burstX = Math.cos(angle) * distance
    const burstY = Math.sin(angle) * distance * 0.72
    const width = 16 + Math.random() * 34
    const height = width / 4

    return {
      id: i,
      isMainGlob: false,
      burstX: `${burstX}vw`,
      burstY: `${burstY}vh`,
      driftX: `${(Math.random() - 0.5) * 24}vw`,
      fallY: `${42 + Math.random() * 52}vh`,
      fallDuration: `${2.2 + Math.random() * 2.2}s`,
      delay: `${SQUASH_MS + Math.random() * 80}ms`,
      width,
      height,
      rotation: Math.floor(Math.random() * 360),
      radius: SPLAT_RADIUS[i % SPLAT_RADIUS.length],
      gradient: SPLASH_GRADIENTS[i % SPLASH_GRADIENTS.length],
    }
  })

  return [...generateMainGlobs(), ...regular]
}

const SlimeBlob = ({ className }) => (
  <svg
    viewBox="0 0 140 94"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="slime-gradient" x1="6%" y1="4%" x2="94%" y2="96%">
        <stop offset="0%" stopColor="#6366f1" />
        <stop offset="32%" stopColor="#7c3aed" />
        <stop offset="68%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#e879f9" />
      </linearGradient>
      <radialGradient id="slime-jelly" cx="50%" cy="38%" r="58%">
        <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.45" />
        <stop offset="55%" stopColor="#8b5cf6" stopOpacity="0.12" />
        <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="slime-shine" cx="34%" cy="22%" r="48%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.72" />
        <stop offset="45%" stopColor="#ffffff" stopOpacity="0.22" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="slime-bottom-glow" cx="50%" cy="88%" r="42%">
        <stop offset="0%" stopColor="#d946ef" stopOpacity="0.28" />
        <stop offset="100%" stopColor="#d946ef" stopOpacity="0" />
      </radialGradient>
    </defs>

    <ellipse cx="70" cy="91" rx="52" ry="3.5" fill="#312e81" opacity="0.18" />

    <path
      d="M 10 66
         C 10 48, 28 18, 70 16
         C 112 18, 130 48, 130 66
         C 130 78, 108 86, 70 87
         C 32 86, 10 78, 10 66 Z"
      fill="url(#slime-gradient)"
    />
    <path
      d="M 10 66
         C 10 48, 28 18, 70 16
         C 112 18, 130 48, 130 66
         C 130 78, 108 86, 70 87
         C 32 86, 10 78, 10 66 Z"
      fill="url(#slime-jelly)"
    />
    <path
      d="M 10 66
         C 10 48, 28 18, 70 16
         C 112 18, 130 48, 130 66
         C 130 78, 108 86, 70 87
         C 32 86, 10 78, 10 66 Z"
      fill="url(#slime-bottom-glow)"
    />
    <path
      d="M 10 66
         C 10 48, 28 18, 70 16
         C 112 18, 130 48, 130 66
         C 130 78, 108 86, 70 87
         C 32 86, 10 78, 10 66 Z"
      fill="url(#slime-shine)"
    />

    <ellipse cx="38" cy="38" rx="8" ry="5.5" fill="#ddd6fe" opacity="0.4" />
    <ellipse cx="98" cy="42" rx="7" ry="5" fill="#f3e8ff" opacity="0.35" />
    <ellipse cx="70" cy="28" rx="6" ry="4" fill="#ede9fe" opacity="0.3" />

    <ellipse cx="44" cy="28" rx="28" ry="13" fill="white" opacity="0.42" />
    <ellipse cx="36" cy="24" rx="12" ry="6" fill="white" opacity="0.62" />
    <ellipse cx="58" cy="34" rx="8" ry="4" fill="white" opacity="0.28" />

    <ellipse cx="34" cy="58" rx="11" ry="6.5" fill="#f9a8d4" opacity="0.55" />
    <ellipse cx="106" cy="58" rx="11" ry="6.5" fill="#f9a8d4" opacity="0.55" />

    <ellipse cx="50" cy="44" rx="12" ry="14" fill="#0f0a1a" />
    <ellipse cx="90" cy="44" rx="12" ry="14" fill="#0f0a1a" />

    <ellipse cx="46" cy="38" rx="5.5" ry="6" fill="#ffffff" opacity="0.95" />
    <ellipse cx="86" cy="38" rx="5.5" ry="6" fill="#ffffff" opacity="0.95" />
    <circle cx="54" cy="48" r="2.2" fill="#ffffff" opacity="0.85" />
    <circle cx="94" cy="48" r="2.2" fill="#ffffff" opacity="0.85" />
    <circle cx="48" cy="36" r="1.4" fill="#ffffff" />
    <circle cx="88" cy="36" r="1.4" fill="#ffffff" />

    <path
      d="M 62 58 Q 70 63 78 58"
      fill="none"
      stroke="#0f0a1a"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.55"
    />
  </svg>
)

const LocalPopSplats = () => (
  <div className="absolute inset-0 pointer-events-none overflow-visible" aria-hidden="true">
    {LOCAL_SPLATS.map(({ id, angle, distance, delay, width, rotation, radius }) => (
      <span
        key={id}
        className="absolute left-1/2 top-1/2 bg-gradient-to-br from-indigo-400 via-violet-400 to-fuchsia-400 animate-mascot-local-splat"
        style={{
          width: `${width}px`,
          height: `${width / 3}px`,
          borderRadius: radius,
          '--splat-angle': `${angle}deg`,
          '--splat-rotation': `${rotation}deg`,
          '--splat-distance': `${distance}px`,
          animationDelay: `${delay}ms`,
        }}
      />
    ))}
  </div>
)

const SpeechCloudBubble = ({ message }) => (
  <div className="relative border-2 border-indigo-100 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-3xl p-6 shadow-sm min-w-[300px] max-w-[min(420px,calc(100vw-12rem))]">
    <div
      className="absolute top-1/2 -left-3 -translate-y-1/2 w-5 h-5 bg-white/60 dark:bg-slate-800/60 border-l-2 border-b-2 border-indigo-100 rotate-45 backdrop-blur-md"
      aria-hidden="true"
    />

    <p
      className={`${BRAND_FONT} relative pl-3 text-left text-base font-medium italic leading-relaxed text-slate-700 before:absolute before:-left-0.5 before:-top-1 before:text-lg before:font-normal before:not-italic before:text-indigo-300/80 before:content-['\u201C'] dark:text-slate-300 dark:before:text-indigo-400/60 md:text-lg`}
    >
      {message}
    </p>
  </div>
)

const DialogueButtons = ({ buttons, onButtonClick }) => (
  <div className="flex w-[220px] shrink-0 flex-col items-stretch justify-center gap-2 self-center">
    {buttons.map(({ label, variant }) => (
      <button
        key={label}
        type="button"
        onClick={onButtonClick}
        className={BUTTON_STYLES[variant]}
      >
        {label}
      </button>
    ))}
  </div>
)

const ClickHint = () => (
  <div className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden="true">
    <span className="absolute inset-0 rounded-full border-2 border-violet-400/50 animate-mascot-click-ripple" />
    <span className="absolute inset-0 rounded-full border border-fuchsia-400/30 animate-mascot-click-ripple-delayed" />
    <div className="absolute top-2 right-2 animate-mascot-click-hint">
      <MousePointerClick className="h-9 w-9 text-violet-500 drop-shadow-md" strokeWidth={2} />
    </div>
  </div>
)

const FullPageSplash = ({ origin, particles }) => {
  if (!origin || !particles.length) return null

  return createPortal(
    <div
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
      aria-hidden="true"
    >
      {particles.map(({
        id,
        isMainGlob,
        burstX,
        burstY,
        driftX,
        fallY,
        fallDuration,
        delay,
        width,
        height,
        rotation,
        radius,
        gradient,
      }) => (
        <span
          key={id}
          className={`absolute bg-gradient-to-br ${gradient} ${
            isMainGlob ? 'animate-mascot-splash-glob' : 'animate-mascot-splash-splat'
          }`}
          style={{
            left: origin.x,
            top: origin.y,
            width: `${width}px`,
            height: `${height}px`,
            borderRadius: radius,
            marginLeft: `${-width / 2}px`,
            marginTop: `${-height / 2}px`,
            '--burst-x': burstX,
            '--burst-y': burstY,
            '--drift-x': driftX,
            '--fall-y': fallY,
            '--fall-duration': fallDuration,
            '--splash-delay': delay,
            '--splat-rotation': `${rotation}deg`,
          }}
        />
      ))}
    </div>,
    document.body,
  )
}

const DashboardMascot = ({ displayName = 'öğrenci' }) => {
  const mascotRef = useRef(null)
  const wrapperRef = useRef(null)
  const popTimeoutRef = useRef(null)
  const sequenceTimeoutsRef = useRef([])
  const [dismissed] = useState(isMascotPopped)
  const [dialogueStep, setDialogueStep] = useState(0)
  const [popping, setPopping] = useState(false)
  const [collapsing, setCollapsing] = useState(false)
  const [measuredHeight, setMeasuredHeight] = useState(null)
  const [hidden, setHidden] = useState(false)
  const [splashOrigin, setSplashOrigin] = useState(null)
  const [splashParticles, setSplashParticles] = useState([])

  useEffect(() => {
    migrateMascotStorage()
  }, [])

  useEffect(() => () => {
    if (popTimeoutRef.current) clearTimeout(popTimeoutRef.current)
    sequenceTimeoutsRef.current.forEach(clearTimeout)
  }, [])

  const scheduleSequenceTimeout = useCallback((fn, ms) => {
    const id = setTimeout(fn, ms)
    sequenceTimeoutsRef.current.push(id)
    return id
  }, [])

  const beginCollapse = useCallback(() => {
    const el = wrapperRef.current
    if (el) {
      setMeasuredHeight(el.scrollHeight)
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setCollapsing(true)
      })
    })
  }, [])

  const triggerPop = useCallback(() => {
    const rect = mascotRef.current?.getBoundingClientRect()
    const origin = rect
      ? { x: rect.left + rect.width / 2, y: rect.top + rect.height * 0.42 }
      : { x: window.innerWidth * 0.12, y: window.innerHeight * 0.25 }

    setPopping(true)
    setSplashParticles(generateSplashParticles())

    scheduleSequenceTimeout(() => {
      setSplashOrigin(origin)
    }, LOCAL_POP_MS)

    scheduleSequenceTimeout(() => {
      setSplashOrigin(null)
      setSplashParticles([])
      beginCollapse()
    }, LOCAL_POP_MS + BUM_POST_POP_MS)
  }, [beginCollapse, scheduleSequenceTimeout])

  useEffect(() => {
    if (!collapsing) return undefined

    const finishHide = () => {
      setMascotPopped()
      setHidden(true)
    }

    const el = wrapperRef.current
    if (!el) {
      finishHide()
      return undefined
    }

    const onTransitionEnd = (event) => {
      if (event.target !== el) return
      if (event.propertyName === 'max-height' || event.propertyName === 'margin-bottom') {
        finishHide()
      }
    }

    const fallback = setTimeout(finishHide, COLLAPSE_MS + 100)

    el.addEventListener('transitionend', onTransitionEnd)
    return () => {
      clearTimeout(fallback)
      el.removeEventListener('transitionend', onTransitionEnd)
    }
  }, [collapsing])

  const handleAdvanceDialogue = () => {
    setDialogueStep((prev) => Math.min(prev + 1, DIALOGUE_STEPS.length - 1))
  }

  const handleMascotClick = () => {
    if (dialogueStep !== 2 || popping) return

    setDialogueStep(3)

    popTimeoutRef.current = setTimeout(() => {
      triggerPop()
    }, BUM_PAUSE_MS)
  }

  const showSplash = splashOrigin && splashParticles.length > 0

  if (dismissed || hidden) return null

  const step = DIALOGUE_STEPS[dialogueStep]
  const message = step.text(displayName)
  const canClickMascot = dialogueStep === 2 && !popping
  const showCloud = !collapsing

  return (
    <>
      {popping && (
        <div
          className="fixed inset-0 pointer-events-none z-[49] animate-mascot-pop-flash"
          aria-hidden="true"
        />
      )}

      {showSplash && (
        <FullPageSplash origin={splashOrigin} particles={splashParticles} />
      )}

      <div
        ref={wrapperRef}
        className={`overflow-hidden transition-all duration-500 ease-out mb-10 ${
          collapsing ? 'max-h-0 opacity-0 !mb-0' : 'opacity-100'
        }`}
        style={{
          maxHeight: collapsing ? 0 : measuredHeight ?? undefined,
        }}
      >
        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex shrink-0 flex-col items-center overflow-visible pt-1">
            <div className={`relative overflow-visible ${popping ? 'animate-mascot-pop-shake' : ''}`}>
              {popping && <LocalPopSplats />}
              <button
                ref={mascotRef}
                type="button"
                onClick={handleMascotClick}
                disabled={!canClickMascot}
                className={`relative flex h-[80px] w-[120px] items-center justify-center overflow-visible md:h-[94px] md:w-[140px] ${
                  popping ? 'pointer-events-none invisible' : ''
                } ${
                  canClickMascot
                    ? 'cursor-pointer transition-transform hover:scale-105 active:scale-95'
                    : 'cursor-default'
                }`}
                aria-label={canClickMascot ? 'LingoLingo\'ya tıkla' : 'LingoLingo'}
              >
                <SlimeBlob
                  className={`h-full w-full drop-shadow-xl ${
                    popping ? 'animate-mascot-squash-pop' : 'animate-mascot-idle'
                  }`}
                />
                {step.showClickHint && !popping && <ClickHint />}
              </button>
            </div>
            <span
              className={`${BRAND_FONT} -mt-0.5 rounded-full bg-violet-100/90 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-violet-600 shadow-sm dark:bg-violet-900/50 dark:text-violet-300 ${
                popping ? 'invisible' : ''
              }`}
            >
              LingoLingo
            </span>
          </div>

          {showCloud && (
            <div
              className={`flex min-w-0 flex-1 items-center gap-3 ${
                popping ? '' : 'animate-mascot-bubble-in'
              }`}
              role="status"
              aria-live="polite"
            >
              <SpeechCloudBubble message={message} />
              {!popping && step.buttons && (
                <DialogueButtons
                  buttons={step.buttons}
                  onButtonClick={handleAdvanceDialogue}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default DashboardMascot
