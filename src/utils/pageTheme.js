import { BRAND_GRADIENT_STOPS } from './brandColors'

export const PAGE_BG =
  'min-h-full bg-[#f8fafc] dark:bg-neutral-950 [background-image:radial-gradient(#e2e8f0_1px,transparent_1px)] dark:[background-image:radial-gradient(#262626_1px,transparent_1px)] [background-size:16px_16px]'

export const HERO_DOT_PATTERN = {
  backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px)',
  backgroundSize: '24px 24px',
}

/** Page-level gradient + icon presets */
export const PAGE_THEMES = {
  home: {
    gradient: BRAND_GRADIENT_STOPS,
  },
  login: {
    gradient: BRAND_GRADIENT_STOPS,
  },
  register: {
    gradient: 'from-teal-600 to-cyan-500 dark:from-teal-700 dark:to-cyan-600',
  },
  forgotPassword: {
    gradient: 'from-amber-500 to-orange-400 dark:from-amber-600 dark:to-orange-500',
  },
  resetPassword: {
    gradient: 'from-amber-600 to-orange-500 dark:from-amber-700 dark:to-orange-600',
  },
  dashboard: {
    gradient: 'from-orange-500 to-amber-400 dark:from-orange-600 dark:to-amber-500',
  },
  profile: {
    gradient: 'from-rose-500 to-pink-400 dark:from-rose-600 dark:to-pink-500',
  },
  collections: {
    gradient: 'from-indigo-600 to-violet-500 dark:from-indigo-700 dark:to-violet-600',
  },
  lessons: {
    gradient: 'from-sky-500 to-blue-400 dark:from-sky-600 dark:to-blue-500',
  },
  reading: {
    gradient: 'from-blue-600 to-cyan-500 dark:from-blue-700 dark:to-cyan-600',
  },
  readingDetail: {
    gradient: 'from-blue-600 to-cyan-500 dark:from-blue-700 dark:to-cyan-600',
  },
  listening: {
    gradient: 'from-violet-600 to-purple-500 dark:from-violet-700 dark:to-purple-600',
  },
  listeningDetail: {
    gradient: 'from-violet-600 to-purple-500 dark:from-violet-700 dark:to-purple-600',
  },
  vocabulary: {
    gradient: 'from-emerald-500 to-teal-400 dark:from-emerald-600 dark:to-teal-500',
  },
  vocabularyDetail: {
    gradient: 'from-emerald-500 to-teal-400 dark:from-emerald-600 dark:to-teal-500',
  },
}
