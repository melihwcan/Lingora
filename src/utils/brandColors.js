/** Lingora brand palette - Indigo → Violet → Fuchsia */

export const BRAND_FONT = 'font-brand'

export const BRAND_GRADIENT =
  'bg-gradient-to-r from-indigo-600 via-violet-500 to-fuchsia-500 dark:from-indigo-500 dark:via-violet-500 dark:to-fuchsia-500'

export const BRAND_GRADIENT_TEXT =
  'text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-500 to-fuchsia-500'

export const BRAND_TEXT = 'text-indigo-600 dark:text-indigo-400'

export const BRAND_CTA =
  'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700'

export const BRAND_FOOTER_LINE =
  'bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent'

export const BRAND_BORDER =
  'border-indigo-500 text-indigo-600 dark:text-indigo-400 dark:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'

/** Dark mode surface tokens - navbar, page bg, cards, borders */
export const DARK_NAV = 'dark:bg-black/95 dark:border-neutral-800'
export const DARK_SURFACE = 'dark:bg-neutral-950'
export const DARK_CARD = 'dark:bg-neutral-900'
export const DARK_BORDER = 'dark:border-neutral-800'

/** Shared shell for Reading/Listening list cards - solid opaque bg, identical on both modules */
export const MODULE_LIST_CARD_BASE =
  'relative rounded-2xl border bg-white dark:bg-neutral-900 border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col ring-1 ring-transparent hover:ring-gray-200/60 dark:hover:ring-gray-600/40'

/** Completed list cards - border/ring only, no whole-card opacity */
export const MODULE_LIST_CARD_COMPLETED =
  'ring-green-500/30 dark:ring-green-600/40 border-green-200 dark:border-green-800/50'

/** Gradient stops for HeroBanner / pageTheme (no bg-gradient prefix) */
export const BRAND_GRADIENT_STOPS =
  'from-indigo-600 via-violet-500 to-fuchsia-500 dark:from-indigo-500 dark:via-violet-500 dark:to-fuchsia-500'
