export const DIFFICULTY_LABELS = {
  beginner: 'Başlangıç',
  intermediate: 'Orta',
  advanced: 'İleri',
}

export const MODULE_TYPE_LABELS = {
  reading: 'Okuma',
  listening: 'Dinleme',
  vocabulary: 'Kelime',
}

export const DIFFICULTY_FILTERS = [
  { value: 'all', label: 'Tümü' },
  { value: 'beginner', label: 'Başlangıç' },
  { value: 'intermediate', label: 'Orta' },
  { value: 'advanced', label: 'İleri' },
]

export function getDifficultyLabel(difficulty) {
  return DIFFICULTY_LABELS[difficulty] ?? difficulty
}

export function getModuleTypeLabel(type) {
  return MODULE_TYPE_LABELS[type] ?? type
}
