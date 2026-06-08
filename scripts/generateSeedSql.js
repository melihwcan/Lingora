/**
 * Generates idempotent INSERT SQL for missing vocabulary words.
 * Usage: node scripts/generateSeedSql.js > scripts/seed.sql
 */

import { VOCABULARY_CATEGORIES } from '../src/utils/vocabularyCategories.js'
import { SEED_VOCABULARY } from './vocabularySeedData.js'

const TARGET = 30

function esc(val) {
  if (val == null) return 'NULL'
  return `'${String(val).replace(/'/g, "''")}'`
}

// Existing words in DB (standalone, before lowercase normalization)
const EXISTING = new Set([
  // hardware
  'battery|hardware|beginner', 'button|hardware|beginner', 'cable|hardware|beginner',
  'charger|hardware|beginner', 'headphone|hardware|beginner', 'keyboard|hardware|beginner',
  'mouse|hardware|beginner', 'screen|hardware|beginner', 'speaker|hardware|beginner',
  'cooling fan|hardware|intermediate', 'graphics card|hardware|intermediate',
  'motherboard|hardware|intermediate', 'processor|hardware|intermediate', 'ram|hardware|intermediate',
  'refresh rate|hardware|intermediate', 'resolution|hardware|intermediate',
  'solid-state drive|hardware|intermediate',
  'bandwidth|hardware|advanced', 'bottleneck|hardware|advanced', 'firmware|hardware|advanced',
  'heat sink|hardware|advanced', 'latency|hardware|advanced', 'overclocking|hardware|advanced',
  'polling rate|hardware|advanced', 'thermal throttling|hardware|advanced',
  // animals
  'bird|animals|beginner', 'cat|animals|beginner', 'cow|animals|beginner', 'dog|animals|beginner',
  'duck|animals|beginner', 'fish|animals|beginner', 'horse|animals|beginner',
  'rabbit|animals|beginner', 'sheep|animals|beginner',
  'camouflage|animals|intermediate', 'endangered|animals|intermediate', 'habitat|animals|intermediate',
  'mammal|animals|intermediate', 'migration|animals|intermediate', 'nocturnal|animals|intermediate',
  'predator|animals|intermediate', 'reptile|animals|intermediate',
  'apex predator|animals|advanced', 'domestication|animals|advanced', 'fauna|animals|advanced',
  'hibernation|animals|advanced', 'instinct|animals|advanced', 'symbiosis|animals|advanced',
  'territorial|animals|advanced', 'venomous|animals|advanced',
  // daily life
  'alarm|daily life|beginner', 'breakfast|daily life|beginner', 'errand|daily life|beginner',
  'grocery|daily life|beginner', 'laundry|daily life|beginner', 'neighbor|daily life|beginner',
  'schedule|daily life|beginner', 'shower|daily life|beginner', 'trash|daily life|beginner',
  'appliance|daily life|intermediate', 'appointment|daily life|intermediate', 'budget|daily life|intermediate',
  'commute|daily life|intermediate', 'deadline|daily life|intermediate', 'routine|daily life|intermediate',
  'subscription|daily life|intermediate', 'utility bill|daily life|intermediate',
  'clutter|daily life|advanced', 'frugal|daily life|advanced', 'mindful|daily life|advanced',
  'overwhelmed|daily life|advanced', 'procrastinate|daily life|advanced', 'resilience|daily life|advanced',
  'spontaneous|daily life|advanced', 'sustainable|daily life|advanced',
  // jobs
  'accountant|jobs|beginner', 'chef|jobs|beginner', 'doctor|jobs|beginner', 'driver|jobs|beginner',
  'engineer|jobs|beginner', 'lawyer|jobs|beginner', 'nurse|jobs|beginner', 'pilot|jobs|beginner',
  'teacher|jobs|beginner',
  'colleague|jobs|intermediate', 'deadline|jobs|intermediate', 'freelancer|jobs|intermediate',
  'internship|jobs|intermediate', 'promotion|jobs|intermediate', 'remote work|jobs|intermediate',
  'resignation|jobs|intermediate', 'salary|jobs|intermediate',
  'appraisal|jobs|advanced', 'entrepreneur|jobs|advanced', 'liability|jobs|advanced',
  'mediator|jobs|advanced', 'outsourcing|jobs|advanced', 'redundancy|jobs|advanced',
  'severance pay|jobs|advanced', 'whistleblower|jobs|advanced',
])

function key(word, category, difficulty) {
  return `${word.toLowerCase().trim()}|${category}|${difficulty}`
}

const counts = {}
const rows = []

for (const { value: category } of VOCABULARY_CATEGORIES) {
  for (const difficulty of ['beginner', 'intermediate', 'advanced']) {
    const bucket = `${category}|${difficulty}`
    counts[bucket] = 0
    const candidates = SEED_VOCABULARY[category]?.[difficulty] ?? []
    for (const entry of candidates) {
      if (counts[bucket] >= TARGET) break
      const k = key(entry.word, category, difficulty)
      if (EXISTING.has(k)) {
        counts[bucket]++
        continue
      }
      if (rows.some((r) => key(r.word, r.category, r.difficulty) === k)) continue
      rows.push({ ...entry, category, difficulty })
      counts[bucket]++
    }
  }
}

import { writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(__dirname, 'seed-batches')
mkdirSync(outDir, { recursive: true })

console.log(`Generating SQL for ${rows.length} new rows`)

const chunkSize = 200
const batches = []
for (let i = 0; i < rows.length; i += chunkSize) {
  const chunk = rows.slice(i, i + chunkSize)
  const values = chunk
    .map(
      (r) =>
        `(${esc(r.word)}, ${esc(r.meaning)}, ${esc(r.category)}, ${esc(r.difficulty)}, 'en', ${esc(r.example_sentence ?? null)}, ${esc(r.example_translation ?? null)})`,
    )
    .join(',\n  ')
  batches.push(
    `INSERT INTO vocabulary_games (word, meaning, category, difficulty, language, example_sentence, example_translation)\nVALUES\n  ${values};`,
  )
}

writeFileSync(resolve(__dirname, 'seed.sql'), batches.join('\n\n') + '\n', 'utf8')
batches.forEach((stmt, i) => {
  writeFileSync(resolve(outDir, `batch-${String(i + 1).padStart(2, '0')}.sql`), stmt + '\n', 'utf8')
})
console.log(`Wrote seed.sql and ${batches.length} batches to scripts/seed-batches/`)
