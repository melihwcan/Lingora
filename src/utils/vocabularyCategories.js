export const VOCABULARY_CATEGORIES_SOURCE = [
  { value: 'hardware', label: 'Donanım' },
  { value: 'animals', label: 'Hayvanlar' },
  { value: 'daily life', label: 'Günlük Hayat' },
  { value: 'jobs', label: 'Meslekler' },
  { value: 'foods', label: 'Yiyecekler' },
  { value: 'drinks', label: 'İçecekler' },
  { value: 'health', label: 'Sağlık' },
  { value: 'nature', label: 'Doğa' },
  { value: 'emotions', label: 'Duygular' },
  { value: 'education', label: 'Eğitim' },
  { value: 'clothes', label: 'Giysiler' },
  { value: 'relationships', label: 'İlişkiler' },
]

function compareByTurkishLabel(a, b) {
  return a.label.localeCompare(b.label, 'tr')
}

/** Known categories, always sorted by Turkish label. */
export function getVocabularyCategories() {
  return [...VOCABULARY_CATEGORIES_SOURCE].sort(compareByTurkishLabel)
}

export const VOCABULARY_CATEGORIES = getVocabularyCategories()

const LABEL_MAP = Object.fromEntries(
  VOCABULARY_CATEGORIES_SOURCE.map(({ value, label }) => [value.toLowerCase(), label]),
)

/** Slugs of the 12 seed/built-in categories (Donanım, Hayvanlar, …). */
export const SYSTEM_CATEGORY_SLUGS = new Set(
  VOCABULARY_CATEGORIES_SOURCE.map(({ value }) => value.toLowerCase()),
)

const KNOWN_LOWER = SYSTEM_CATEGORY_SLUGS

export function normalizeCategory(category) {
  return (category ?? '').trim().toLowerCase()
}

/** Normalized keys that refer to the same category slug (slug + optional label_tr). */
export function getCategoryMatchKeys(category, metaMap = {}) {
  const normalized = normalizeCategory(category)
  if (!normalized) return new Set()

  const keys = new Set([normalized])
  const meta = metaMap[normalized]
  if (meta?.label_tr) {
    keys.add(normalizeCategory(meta.label_tr))
  }
  return keys
}

/** Map a raw DB category value to its canonical slug when meta label_tr was stored instead. */
export function resolveCanonicalCategoryKey(rawCategory, metaMap = {}) {
  const key = normalizeCategory(rawCategory)
  if (!key) return key
  if (metaMap[key]) return key
  for (const [slug, meta] of Object.entries(metaMap)) {
    if (meta.label_tr && normalizeCategory(meta.label_tr) === key) {
      return slug
    }
  }
  return key
}

export function capitalizeCategoryLabel(category) {
  return normalizeCategory(category)
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/** True for the 12 predefined seed slugs (hardware, animals, …). */
export function isSystemCategory(category) {
  return SYSTEM_CATEGORY_SLUGS.has(normalizeCategory(category))
}

export function isKnownCategory(category) {
  return isSystemCategory(category)
}

export function getCategoryLabel(category, metaMap = {}) {
  const key = normalizeCategory(category)
  if (LABEL_MAP[key]) return LABEL_MAP[key]
  if (metaMap[key]?.label_tr) return metaMap[key].label_tr
  return capitalizeCategoryLabel(category)
}

function sortCategoryValues(values, metaMap = {}) {
  return [...values].sort((a, b) =>
    getCategoryLabel(a, metaMap).localeCompare(getCategoryLabel(b, metaMap), 'tr'),
  )
}

/**
 * Merge DB meta rows and distinct vocabulary_games / custom_quizzes categories.
 * Built-in slugs appear only when they still have words, quizzes, or meta - not forced into the list.
 * Returns normalized lowercase category values, sorted by Turkish label.
 */
export function mergeWithKnownCategories(dbCategories = [], categoryMeta = []) {
  const metaMap = Object.fromEntries(
    categoryMeta.map((row) => [normalizeCategory(row.category), row]),
  )

  const seen = new Set()
  const merged = []

  const add = (value) => {
    const key = normalizeCategory(value)
    if (!key || seen.has(key)) return
    seen.add(key)
    merged.push(key)
  }

  for (const row of categoryMeta) {
    add(row.category)
  }

  for (const category of dbCategories) {
    add(category)
  }

  return sortCategoryValues(merged, metaMap)
}

export function buildCategoryMetaMap(categoryMeta = []) {
  return Object.fromEntries(
    categoryMeta.map((row) => [normalizeCategory(row.category), row]),
  )
}

export function categoryHasMeta(category, metaMap = {}) {
  return Boolean(metaMap[normalizeCategory(category)])
}

export function needsCategoryIcon(category, metaMap = {}) {
  const key = normalizeCategory(category)
  if (!key) return false
  if (isKnownCategory(key)) return false
  return !categoryHasMeta(key, metaMap)
}
