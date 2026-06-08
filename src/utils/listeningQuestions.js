import { supabase } from '../lib/supabaseClient'

export async function fetchListeningQuestions(moduleId) {
  const { data, error } = await supabase
    .from('listening_comprehension_questions')
    .select('id, statement, correct_answer, order_index')
    .eq('module_id', moduleId)
    .order('order_index', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function saveListeningQuestions(moduleId, questions) {
  const { error: deleteError } = await supabase
    .from('listening_comprehension_questions')
    .delete()
    .eq('module_id', moduleId)

  if (deleteError) throw deleteError

  const rows = questions
    .filter((q) => q.statement?.trim())
    .map((q, index) => ({
      module_id: moduleId,
      statement: q.statement.trim(),
      correct_answer: Boolean(q.correct_answer),
      order_index: index,
    }))

  if (rows.length === 0) return

  const { error: insertError } = await supabase
    .from('listening_comprehension_questions')
    .insert(rows)

  if (insertError) throw insertError
}

export const LISTENING_PASS_THRESHOLD = 70

export function calculateQuizAccuracy(questions, answers) {
  if (!questions.length) return 0
  const correct = questions.filter((q) => answers[q.id] === q.correct_answer).length
  return Math.round((correct / questions.length) * 100)
}

export function restoreQuizAnswers(storedAnswers, questions) {
  if (!storedAnswers || typeof storedAnswers !== 'object') return {}
  const restored = {}
  for (const q of questions) {
    if (storedAnswers[q.id] !== undefined) {
      restored[q.id] = Boolean(storedAnswers[q.id])
    }
  }
  return restored
}

export function resolveListeningXpForfeitReasons(progress, quizResult = null) {
  const xpEarned = quizResult?.xpEarned ?? progress?.xp_earned ?? 0
  if (xpEarned > 0) return []

  if (quizResult?.xpForfeitReasons?.length) {
    return quizResult.xpForfeitReasons
  }

  const transcriptRevealed = progress?.transcript_revealed ?? false
  const xpEligible = progress?.xp_eligible ?? true
  const attempts = progress?.attempts ?? 0
  const accuracy = quizResult?.accuracy ?? progress?.accuracy_percent ?? 0
  const passed = quizResult ? quizResult.passed : accuracy >= LISTENING_PASS_THRESHOLD
  const isFirstQuizSubmit = quizResult?.isFirstQuizSubmit ?? attempts <= 1

  const reasons = []

  if (!passed && !xpEligible && isFirstQuizSubmit) {
    return ['first_fail']
  }

  if (transcriptRevealed) reasons.push('transcript')
  if (!xpEligible && passed && attempts > 1) reasons.push('prior_fail')

  return reasons
}

/**
 * Returns at most one XP forfeit message, or null.
 * @param {object} progress - user_progress row
 * @param {object|null} quizResult - quiz result after submit or restored from progress
 * @param {'transcript-panel'|'quiz'} context - transcript-panel: pre-quiz warning only
 */
export function getListeningXpForfeitMessage(progress, quizResult = null, context = 'quiz') {
  const xpEarned = quizResult?.xpEarned ?? progress?.xp_earned ?? 0
  if (xpEarned > 0) return null

  const transcriptRevealed = progress?.transcript_revealed ?? false
  const xpEligible = progress?.xp_eligible ?? true
  const attempts = progress?.attempts ?? 0
  const hasQuizFeedback = quizResult !== null
  const passed = hasQuizFeedback
    ? quizResult.passed
    : (progress?.accuracy_percent ?? 0) >= LISTENING_PASS_THRESHOLD

  if (context === 'transcript-panel') {
    if (attempts === 0 && !hasQuizFeedback && transcriptRevealed) {
      return 'Transkript açıldığı için XP kazanılamaz.'
    }
    return null
  }

  const reasons = resolveListeningXpForfeitReasons(progress, quizResult)

  if (!hasQuizFeedback) {
    if (reasons.includes('prior_fail') || (!xpEligible && attempts > 0 && !transcriptRevealed)) {
      return 'Bu içerikten artık XP kazanamazsınız (ilk deneme başarısız).'
    }
    return null
  }

  if (!passed) {
    if (reasons.includes('first_fail') || (!xpEligible && (quizResult.isFirstQuizSubmit ?? attempts <= 1))) {
      return 'Doğruluk oranı %70\'in altında. Tekrar deneyebilirsin ancak bu içerikten artık XP kazanamazsın.'
    }
    if (!xpEligible) {
      return 'Doğruluk oranı %70\'in altında. Tekrar deneyebilirsin ancak bu içerikten artık XP kazanamazsın.'
    }
    return null
  }

  const xpForfeited = quizResult.xpForfeited ?? false
  if (!xpForfeited) return null

  const hasTranscript = reasons.includes('transcript')
  const hasPriorFail = reasons.includes('prior_fail')

  if (hasTranscript && hasPriorFail) {
    return 'Transkript açıldığı ve ilk deneme başarısız olduğu için XP kazanılamadı.'
  }
  if (hasTranscript) {
    return 'Transkript açıldığı için XP kazanılamadı.'
  }
  if (hasPriorFail) {
    return 'İlk denemenizde %70 altında kaldığınız için XP kazanılamadı.'
  }

  return null
}

export function buildQuizResultFromProgress(progress) {
  if (!progress || (progress.attempts ?? 0) === 0) return null

  const accuracy = progress.accuracy_percent ?? 0
  const passed = accuracy >= LISTENING_PASS_THRESHOLD
  const xpEarned = progress.xp_earned ?? 0
  const transcriptRevealed = progress.transcript_revealed ?? false
  const xpEligible = progress.xp_eligible ?? true
  const attempts = progress.attempts ?? 0
  const isFirstQuizSubmit = attempts === 1

  const xpForfeitReasons = resolveListeningXpForfeitReasons(progress, {
    accuracy,
    passed,
    xpEarned,
    isFirstQuizSubmit,
    xpForfeited: passed && xpEarned === 0,
  })

  return {
    accuracy,
    passed,
    xpEarned,
    xpForfeited: passed && xpEarned === 0,
    xpForfeitReason: xpForfeitReasons[0] ?? null,
    xpForfeitReasons,
    isFirstQuizSubmit,
    alreadyCompleted: progress.status === 'completed',
    persisted: true,
  }
}
