import { supabase, fetchPaginatedRows } from '../lib/supabaseClient'
import { normalizeCategory, getCategoryMatchKeys } from './vocabularyCategories'

const DELETE_BATCH = 100

async function collectMatchingIds(table, matchKeys) {
  const rows = await fetchPaginatedRows((from, to) =>
    supabase
      .from(table)
      .select('id, category')
      .not('category', 'is', null)
      .range(from, to),
  )

  return rows
    .filter((row) => matchKeys.has(normalizeCategory(row.category)))
    .map((row) => row.id)
}

async function deleteIdsFromTable(table, ids) {
  if (!ids.length) return { error: null, deletedCount: 0 }

  let deletedCount = 0
  for (let i = 0; i < ids.length; i += DELETE_BATCH) {
    const batch = ids.slice(i, i + DELETE_BATCH)
    const { error, count } = await supabase
      .from(table)
      .delete({ count: 'exact' })
      .in('id', batch)
    if (error) return { error, deletedCount }
    deletedCount += count ?? batch.length
  }
  return { error: null, deletedCount }
}

/**
 * Delete all vocabulary_games and custom_quizzes rows for a category.
 * Matches by normalized slug and optional meta label_tr (case/whitespace tolerant).
 */
export async function deleteCategoryContent(category, metaMap = {}) {
  const normalized = normalizeCategory(category)
  if (!normalized) {
    return { error: new Error('Geçersiz kategori.'), wordsDeleted: 0, quizzesDeleted: 0 }
  }

  const matchKeys = getCategoryMatchKeys(category, metaMap)

  const [wordIds, quizIds] = await Promise.all([
    collectMatchingIds('vocabulary_games', matchKeys),
    collectMatchingIds('custom_quizzes', matchKeys),
  ])

  const { error: wordsError, deletedCount: wordsDeleted } = await deleteIdsFromTable(
    'vocabulary_games',
    wordIds,
  )
  if (wordsError) {
    return { error: wordsError, wordsDeleted: 0, quizzesDeleted: 0 }
  }

  const { error: quizError, deletedCount: quizzesDeleted } = await deleteIdsFromTable(
    'custom_quizzes',
    quizIds,
  )
  if (quizError) {
    return { error: quizError, wordsDeleted, quizzesDeleted: 0 }
  }

  return { error: null, wordsDeleted, quizzesDeleted }
}
