/**
 * Idempotent vocabulary seeder - fills each category/difficulty to 30 words.
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env (or environment).
 *
 * Usage: node scripts/seedVocabulary.js
 *        node scripts/seedVocabulary.js --dry-run
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { VOCABULARY_CATEGORIES } from '../src/utils/vocabularyCategories.js'
import { SEED_VOCABULARY } from './vocabularySeedData.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TARGET_PER_BUCKET = 30
const BATCH_SIZE = 50

function loadEnv() {
  const envPath = resolve(__dirname, '../.env')
  if (!existsSync(envPath)) return
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim()
    if (!process.env[key]) process.env[key] = val
  }
}

function wordKey(word, category, difficulty) {
  return `${category.toLowerCase()}|${difficulty}|${word.toLowerCase().trim()}`
}

async function normalizeCategories(supabase) {
  const { data, error } = await supabase
    .from('vocabulary_games')
    .select('id, category')
    .not('category', 'is', null)

  if (error) throw error

  const updates = (data ?? [])
    .filter((row) => row.category && row.category !== row.category.toLowerCase())
    .map((row) => ({ id: row.id, category: row.category.toLowerCase().trim() }))

  if (updates.length === 0) return 0

  for (const row of updates) {
    const { error: upErr } = await supabase
      .from('vocabulary_games')
      .update({ category: row.category })
      .eq('id', row.id)
    if (upErr) throw upErr
  }
  return updates.length
}

async function fetchExistingKeys(supabase) {
  const { data, error } = await supabase
    .from('vocabulary_games')
    .select('word, category, difficulty')
    .is('module_id', null)

  if (error) throw error

  const keys = new Set()
  const counts = {}
  for (const row of data ?? []) {
    const cat = (row.category ?? '').toLowerCase().trim()
    const diff = row.difficulty
    keys.add(wordKey(row.word, cat, diff))
    const bucket = `${cat}|${diff}`
    counts[bucket] = (counts[bucket] ?? 0) + 1
  }
  return { keys, counts, total: data?.length ?? 0 }
}

function buildInsertList(existingKeys, existingCounts) {
  const toInsert = []
  const categories = VOCABULARY_CATEGORIES.map((c) => c.value)

  for (const category of categories) {
    for (const difficulty of ['beginner', 'intermediate', 'advanced']) {
      const bucket = `${category}|${difficulty}`
      const have = existingCounts[bucket] ?? 0
      const need = Math.max(0, TARGET_PER_BUCKET - have)
      const candidates = SEED_VOCABULARY[category]?.[difficulty] ?? []

      let added = 0
      for (const entry of candidates) {
        if (added >= need) break
        const key = wordKey(entry.word, category, difficulty)
        if (existingKeys.has(key)) continue
        existingKeys.add(key)
        toInsert.push({
          word: entry.word,
          meaning: entry.meaning,
          category,
          difficulty,
          language: 'en',
          module_id: null,
          example_sentence: entry.example_sentence ?? null,
          example_translation: entry.example_translation ?? null,
        })
        added++
      }

      if (added < need) {
        console.warn(
          `Warning: ${category}/${difficulty} still short by ${need - added} (have ${have}, added ${added})`,
        )
      }
    }
  }
  return toInsert
}

async function insertBatch(supabase, rows) {
  const { error } = await supabase.from('vocabulary_games').insert(rows)
  if (error) throw error
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  loadEnv()

  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    console.error('Missing VITE_SUPABASE_URL or SUPABASE_URL')
    process.exit(1)
  }
  if (!serviceKey && !dryRun) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY - add to .env or run with --dry-run')
    process.exit(1)
  }

  const supabase = serviceKey
    ? createClient(url, serviceKey, { auth: { persistSession: false } })
    : null

  if (supabase) {
    const normalized = await normalizeCategories(supabase)
    if (normalized > 0) console.log(`Normalized ${normalized} category values to lowercase.`)
  }

  const { keys, counts, total } = supabase
    ? await fetchExistingKeys(supabase)
    : { keys: new Set(), counts: {}, total: 0 }

  const toInsert = buildInsertList(keys, counts)

  console.log(`Existing standalone words: ${total}`)
  console.log(`Words to insert: ${toInsert.length}`)

  if (dryRun) {
    const byCat = {}
    for (const row of toInsert) {
      byCat[row.category] = (byCat[row.category] ?? 0) + 1
    }
    console.log('Dry run - insert breakdown by category:', byCat)
    return
  }

  let inserted = 0
  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE)
    await insertBatch(supabase, batch)
    inserted += batch.length
    console.log(`Inserted ${inserted}/${toInsert.length}`)
  }

  const { counts: finalCounts, total: finalTotal } = await fetchExistingKeys(supabase)
  console.log(`Done. Total standalone words: ${finalTotal}`)
  for (const cat of VOCABULARY_CATEGORIES.map((c) => c.value)) {
    for (const diff of ['beginner', 'intermediate', 'advanced']) {
      const n = finalCounts[`${cat}|${diff}`] ?? 0
      if (n !== TARGET_PER_BUCKET) {
        console.warn(`  ${cat}/${diff}: ${n}/${TARGET_PER_BUCKET}`)
      }
    }
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
