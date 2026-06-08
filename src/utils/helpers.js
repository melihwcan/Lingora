/**
 * Formats a date string or Date object into a human-readable string.
 * @param {string|Date} date
 * @param {Intl.DateTimeFormatOptions} [options]
 */
export const formatDate = (date, options = { year: 'numeric', month: 'short', day: 'numeric' }) => {
  return new Intl.DateTimeFormat('en-US', options).format(new Date(date))
}

/**
 * Capitalizes the first letter of each word in a string.
 * @param {string} str
 */
export const capitalize = (str = '') =>
  str
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')

/**
 * Calculates XP earned based on lesson score and difficulty multiplier.
 * @param {number} score      - Score between 0 and 100
 * @param {number} multiplier - Difficulty multiplier (default 1)
 */
export const calculateXP = (score, multiplier = 1) => {
  if (score <= 0) return 0
  const base = Math.round((score / 100) * 50)
  return Math.round(base * multiplier)
}

/**
 * Truncates a string to maxLength and appends an ellipsis if needed.
 * @param {string} str
 * @param {number} maxLength
 */
export const truncate = (str = '', maxLength = 100) =>
  str.length > maxLength ? `${str.slice(0, maxLength).trimEnd()}…` : str

/**
 * Resolves a friendly display name from profile and auth user.
 * Priority: username → full_name → email local-part → fallback.
 */
export const resolveDisplayName = (profile, user, fallback = 'öğrenci') => {
  const username = profile?.username?.trim()
  if (username) return username

  const fullName = profile?.full_name?.trim()
  if (fullName) return fullName

  const emailLocal = user?.email?.split('@')[0]?.trim()
  if (emailLocal) return emailLocal

  return fallback
}

/**
 * Returns a CSS color class string for a proficiency level label (A1–C2).
 * @param {string} level
 */
export const levelColor = (level = '') => {
  const map = { A1: 'green', A2: 'emerald', B1: 'blue', B2: 'indigo', C1: 'purple', C2: 'pink' }
  return map[level.toUpperCase()] ?? 'gray'
}
