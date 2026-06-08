/**
 * Canonical Tailwind classes for difficulty level badges.
 * Used across Dashboard, Reading, Listening, Vocabulary, Admin pages.
 */
export const DIFFICULTY_COLORS = {
  beginner:     'bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400',
  intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  advanced:     'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400',
}

/**
 * Returns the Tailwind badge classes for a given difficulty string.
 * Falls back to a neutral gray if the value is unrecognized.
 */
export function getDifficultyColor(difficulty) {
  return DIFFICULTY_COLORS[difficulty?.toLowerCase()]
    ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
}
