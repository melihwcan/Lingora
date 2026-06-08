import { supabase } from '../lib/supabaseClient'
import { normalizeCategory } from './vocabularyCategories'

export async function fetchCategoryMeta() {
  const { data, error } = await supabase
    .from('vocabulary_category_meta')
    .select('category, label_tr, icon_name, theme_preset')
    .order('category')

  if (error) {
    console.error('Kategori meta yüklenemedi:', error.message)
    return []
  }

  return data ?? []
}

export async function upsertCategoryMeta({ category, iconName, labelTr, themePreset }) {
  const normalized = normalizeCategory(category)
  if (!normalized || !iconName) {
    return { error: new Error('Kategori ve ikon zorunludur.') }
  }
  if (!themePreset) {
    return { error: new Error('Yeni kategori için renk teması seçmelisiniz.') }
  }

  const { error } = await supabase.from('vocabulary_category_meta').upsert(
    {
      category: normalized,
      icon_name: iconName,
      label_tr: labelTr || null,
      theme_preset: themePreset,
    },
    { onConflict: 'category' },
  )

  return { error }
}

export async function deleteCategoryMeta(category) {
  const normalized = normalizeCategory(category)
  if (!normalized) {
    return { error: new Error('Geçersiz kategori.') }
  }

  const { error } = await supabase
    .from('vocabulary_category_meta')
    .delete()
    .eq('category', normalized)

  return { error }
}
