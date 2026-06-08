/**
 * Idempotent custom_quizzes seeder - fills each category/difficulty to 5 quizzes.
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env (or use --dry-run / --sql).
 *
 * Usage:
 *   node scripts/seedCustomQuizzes.js
 *   node scripts/seedCustomQuizzes.js --dry-run
 *   node scripts/seedCustomQuizzes.js --sql > scripts/seed-custom-quizzes.sql
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { VOCABULARY_CATEGORIES } from '../src/utils/vocabularyCategories.js'
import { SEED_VOCABULARY } from './vocabularySeedData.js'
import {
  HARDWARE_EXISTING_QUIZZES,
  HARDWARE_EXTRA_QUIZZES,
} from './quizSeedData.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TARGET_PER_BUCKET = 5
const BATCH_SIZE = 50
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced']
const OPTION_KEYS = ['A', 'B', 'C', 'D']

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

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizeQuestionKey(questionText) {
  return (questionText ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function quizKey(category, difficulty, questionText) {
  return `${category}|${difficulty}|${normalizeQuestionKey(questionText)}`
}

function escapeSql(val) {
  if (val == null) return 'NULL'
  return `'${String(val).replace(/'/g, "''")}'`
}

function shuffleDeterministic(items, seed) {
  const arr = [...items]
  let state = seed + 1
  for (let i = arr.length - 1; i > 0; i--) {
    state = (state * 1103515245 + 12345) & 0x7fffffff
    const j = state % (i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function findWordInSentence(sentence, word) {
  const pattern = new RegExp(`\\b${escapeRegex(word)}\\b`, 'i')
  const match = sentence.match(pattern)
  if (!match) return null
  return { pattern, answer: match[0] }
}

function createQuizFromVocab(entry, pool, slotIndex, category, difficulty) {
  const found = findWordInSentence(entry.example_sentence, entry.word)
  if (!found) return null

  const question_text = entry.example_sentence.replace(found.pattern, '___')
  const correctAnswer = found.answer

  const distractorPool = pool
    .filter((item) => item.word.toLowerCase() !== entry.word.toLowerCase())
    .map((item) => {
      const inSentence = findWordInSentence(item.example_sentence, item.word)
      return inSentence?.answer ?? item.word
    })

  const distractors = []
  if (distractorPool.length === 0) return null

  let offset = slotIndex * 3
  while (distractors.length < 3 && offset < distractorPool.length + slotIndex * 3 + 30) {
    const candidate = distractorPool[offset % distractorPool.length]
    offset++
    if (
      candidate.toLowerCase() === correctAnswer.toLowerCase() ||
      distractors.some((d) => d.toLowerCase() === candidate.toLowerCase())
    ) {
      continue
    }
    distractors.push(candidate)
  }

  if (distractors.length < 3) return null

  const shuffled = shuffleDeterministic([correctAnswer, ...distractors], slotIndex)
  const correctIndex = shuffled.findIndex(
    (opt) => opt.toLowerCase() === correctAnswer.toLowerCase(),
  )
  if (correctIndex === -1) return null

  return {
    category,
    difficulty,
    question_text,
    option_a: shuffled[0],
    option_b: shuffled[1],
    option_c: shuffled[2],
    option_d: shuffled[3],
    correct_option: OPTION_KEYS[correctIndex],
  }
}

function attachCategoryDifficulty(quiz, category, difficulty) {
  return { category, difficulty, ...quiz }
}

function buildManualHardwareQuizzes() {
  const quizzes = [...HARDWARE_EXISTING_QUIZZES]
  for (const difficulty of DIFFICULTIES) {
    for (const quiz of HARDWARE_EXTRA_QUIZZES[difficulty] ?? []) {
      quizzes.push(attachCategoryDifficulty(quiz, 'hardware', difficulty))
    }
  }
  return quizzes
}

function buildAutoQuizzesForBucket(category, difficulty) {
  if (category === 'hardware') return []

  const pool = SEED_VOCABULARY[category]?.[difficulty] ?? []
  const quizzes = []
  const usedQuestions = new Set()

  for (let slot = 0; slot < pool.length && quizzes.length < TARGET_PER_BUCKET; slot++) {
    const quiz = createQuizFromVocab(pool[slot], pool, slot, category, difficulty)
    if (!quiz) continue
    const key = normalizeQuestionKey(quiz.question_text)
    if (usedQuestions.has(key)) continue
    usedQuestions.add(key)
    quizzes.push(quiz)
  }

  return quizzes
}

export function buildAllQuizSeed() {
  const all = []
  const seen = new Set()

  const addQuiz = (quiz) => {
    const key = quizKey(quiz.category, quiz.difficulty, quiz.question_text)
    if (seen.has(key)) return
    seen.add(key)
    all.push(quiz)
  }

  for (const quiz of buildManualHardwareQuizzes()) {
    addQuiz(quiz)
  }

  for (const { value: category } of VOCABULARY_CATEGORIES) {
    for (const difficulty of DIFFICULTIES) {
      for (const quiz of buildAutoQuizzesForBucket(category, difficulty)) {
        addQuiz(quiz)
      }
    }
  }

  return all
}

function groupByBucket(quizzes) {
  const grouped = {}
  for (const quiz of quizzes) {
    const bucket = `${quiz.category}|${quiz.difficulty}`
    grouped[bucket] = grouped[bucket] ?? []
    grouped[bucket].push(quiz)
  }
  return grouped
}

function selectQuizzesToInsert(seedQuizzes, existingKeys, existingCounts) {
  const grouped = groupByBucket(seedQuizzes)
  const toInsert = []

  for (const { value: category } of VOCABULARY_CATEGORIES) {
    for (const difficulty of DIFFICULTIES) {
      const bucket = `${category}|${difficulty}`
      const have = existingCounts[bucket] ?? 0
      const need = Math.max(0, TARGET_PER_BUCKET - have)
      if (need === 0) continue

      const candidates = grouped[bucket] ?? []
      let added = 0

      for (const quiz of candidates) {
        if (added >= need) break
        const key = quizKey(category, difficulty, quiz.question_text)
        if (existingKeys.has(key)) continue
        existingKeys.add(key)
        toInsert.push(quiz)
        added++
      }

      if (added < need) {
        console.warn(
          `Warning: ${category}/${difficulty} still short by ${need - added} (have ${have}, will add ${added})`,
        )
      }
    }
  }

  return toInsert
}

async function fetchExistingQuizzes(supabase) {
  const { data, error } = await supabase
    .from('custom_quizzes')
    .select('category, difficulty, question_text')

  if (error) throw error

  const keys = new Set()
  const counts = {}
  for (const row of data ?? []) {
    const category = (row.category ?? '').toLowerCase().trim()
    const difficulty = row.difficulty
    keys.add(quizKey(category, difficulty, row.question_text))
    const bucket = `${category}|${difficulty}`
    counts[bucket] = (counts[bucket] ?? 0) + 1
  }

  return { keys, counts, total: data?.length ?? 0 }
}

async function insertBatch(supabase, rows) {
  const { error } = await supabase.from('custom_quizzes').insert(rows)
  if (error) throw error
}

function printSummary(seedQuizzes, toInsert, existingCounts) {
  console.log(`Seed quiz definitions: ${seedQuizzes.length}`)
  console.log(`Quizzes to insert: ${toInsert.length}`)

  const byCat = {}
  for (const row of toInsert) {
    byCat[row.category] = (byCat[row.category] ?? 0) + 1
  }
  if (Object.keys(byCat).length > 0) {
    console.log('Insert breakdown by category:', byCat)
  }

  console.log('\nTarget per bucket (5 each):')
  for (const { value: category } of VOCABULARY_CATEGORIES) {
    for (const difficulty of DIFFICULTIES) {
      const bucket = `${category}|${difficulty}`
      const have = existingCounts[bucket] ?? 0
      const willAdd = toInsert.filter(
        (q) => q.category === category && q.difficulty === difficulty,
      ).length
      const final = have + willAdd
      const status = final === TARGET_PER_BUCKET ? 'OK' : 'SHORT'
      console.log(`  ${category}/${difficulty}: ${have} + ${willAdd} = ${final} [${status}]`)
    }
  }
}

function renderSql(toInsert) {
  if (toInsert.length === 0) {
    console.log('-- No quizzes to insert.')
    return
  }

  console.log('-- Idempotent custom_quizzes seed (run once; duplicates skipped if re-run manually)')
  console.log(
    'INSERT INTO custom_quizzes (category, difficulty, question_text, option_a, option_b, option_c, option_d, correct_option)',
  )
  console.log('VALUES')

  const lines = toInsert.map((row, index) => {
    const suffix = index === toInsert.length - 1 ? ';' : ','
    return `  (${escapeSql(row.category)}, ${escapeSql(row.difficulty)}, ${escapeSql(row.question_text)}, ${escapeSql(row.option_a)}, ${escapeSql(row.option_b)}, ${escapeSql(row.option_c)}, ${escapeSql(row.option_d)}, ${escapeSql(row.correct_option)})${suffix}`
  })

  console.log(lines.join('\n'))
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const sqlMode = process.argv.includes('--sql')
  loadEnv()

  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const seedQuizzes = buildAllQuizSeed()

  if (sqlMode) {
    const existingKeys = new Set(
      HARDWARE_EXISTING_QUIZZES.map((q) =>
        quizKey(q.category, q.difficulty, q.question_text),
      ),
    )
    const existingCounts = {}
    for (const q of HARDWARE_EXISTING_QUIZZES) {
      const bucket = `${q.category}|${q.difficulty}`
      existingCounts[bucket] = (existingCounts[bucket] ?? 0) + 1
    }
    const toInsert = selectQuizzesToInsert(seedQuizzes, existingKeys, existingCounts)
    renderSql(toInsert)
    return
  }

  if (!url) {
    console.error('Missing VITE_SUPABASE_URL or SUPABASE_URL')
    process.exit(1)
  }

  let existingKeys = new Set()
  let existingCounts = {}
  let existingTotal = 0

  if (serviceKey) {
    const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })
    const existing = await fetchExistingQuizzes(supabase)
    existingKeys = existing.keys
    existingCounts = existing.counts
    existingTotal = existing.total

    const toInsert = selectQuizzesToInsert(seedQuizzes, existingKeys, existingCounts)
    printSummary(seedQuizzes, toInsert, existingCounts)

    if (dryRun) {
      console.log('\nDry run - no rows inserted.')
      return
    }

    if (toInsert.length === 0) {
      console.log('Nothing to insert.')
      return
    }

    let inserted = 0
    for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
      const batch = toInsert.slice(i, i + BATCH_SIZE)
      await insertBatch(supabase, batch)
      inserted += batch.length
      console.log(`Inserted ${inserted}/${toInsert.length}`)
    }

    const final = await fetchExistingQuizzes(supabase)
    console.log(`Done. Total custom_quizzes: ${final.total} (was ${existingTotal}, inserted ${inserted})`)
    return
  }

  // No service key - dry-run with empty existing counts (shows full seed plan)
  const toInsert = selectQuizzesToInsert(seedQuizzes, new Set(), {})
  console.log('SUPABASE_SERVICE_ROLE_KEY not set - showing full seed plan only.')
  printSummary(seedQuizzes, toInsert, {})
  if (!dryRun) {
    console.log('\nAdd SUPABASE_SERVICE_ROLE_KEY to .env and run again, or use:')
    console.log('  node scripts/seedCustomQuizzes.js --sql > scripts/seed-custom-quizzes.sql')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
