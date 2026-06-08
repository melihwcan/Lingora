import { supabase } from '../lib/supabaseClient'

import { LISTENING_PASS_THRESHOLD } from './listeningQuestions'

export async function revealListeningTranscript(userId, moduleId) {
  const { data: existing } = await supabase
    .from('user_progress')
    .select('id')
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .maybeSingle()

  const payload = {
    transcript_revealed: true,
    xp_eligible: false,
  }

  if (existing) {
    const { error } = await supabase
      .from('user_progress')
      .update(payload)
      .eq('id', existing.id)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('user_progress')
      .insert({
        user_id: userId,
        module_id: moduleId,
        status: 'in_progress',
        attempts: 0,
        ...payload,
      })
    if (error) throw error
  }
}

export async function completeListeningModule(userId, moduleId, accuracyPercent, xpReward = null, quizAnswers = null) {
  let xpToAward = xpReward
  if (xpToAward === null || xpToAward === undefined) {
    const { data: mod } = await supabase
      .from('modules')
      .select('xp_reward')
      .eq('id', moduleId)
      .single()
    xpToAward = mod?.xp_reward ?? 30
  }

  const { data: existing } = await supabase
    .from('user_progress')
    .select('id, status, attempts, xp_earned, transcript_revealed, xp_eligible')
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .maybeSingle()

  const isFirstQuizSubmit = !existing || (existing.attempts ?? 0) === 0
  const alreadyCompleted = existing?.status === 'completed'
  const passed = accuracyPercent >= LISTENING_PASS_THRESHOLD

  let xpEligible = existing?.xp_eligible ?? true
  const transcriptRevealed = existing?.transcript_revealed ?? false

  if (isFirstQuizSubmit && passed === false) {
    xpEligible = false
  }

  const canEarnXp =
    !alreadyCompleted &&
    xpEligible &&
    !transcriptRevealed &&
    passed &&
    isFirstQuizSubmit

  const xpEarned = canEarnXp ? xpToAward : 0
  const newStatus = alreadyCompleted ? 'completed' : (passed ? 'completed' : 'in_progress')

  let xpForfeitReason = null
  if (!canEarnXp && !alreadyCompleted) {
    if (transcriptRevealed) xpForfeitReason = 'transcript'
    else if (!xpEligible && !isFirstQuizSubmit && passed) xpForfeitReason = 'prior_fail'
    else if (!xpEligible && isFirstQuizSubmit && !passed) xpForfeitReason = 'first_fail'
    else if (!passed) xpForfeitReason = 'below_threshold'
    else if (!xpEligible) xpForfeitReason = 'prior_fail'
  }

  const upsertPayload = {
    user_id: userId,
    module_id: moduleId,
    status: newStatus,
    score: accuracyPercent,
    accuracy_percent: accuracyPercent,
    xp_earned: alreadyCompleted
      ? (existing?.xp_earned ?? 0)
      : canEarnXp
        ? xpToAward
        : (existing?.xp_earned ?? 0),
    completed_at: alreadyCompleted
      ? existing?.completed_at
      : passed
        ? new Date().toISOString()
        : null,
    attempts: (existing?.attempts || 0) + 1,
    transcript_revealed: canEarnXp ? true : transcriptRevealed,
    xp_eligible: xpEligible,
  }

  if (quizAnswers && typeof quizAnswers === 'object') {
    upsertPayload.quiz_answers = quizAnswers
  }

  const { error: progressError } = await supabase
    .from('user_progress')
    .upsert(upsertPayload, { onConflict: 'user_id,module_id' })

  if (progressError) throw progressError

  if (canEarnXp) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_xp')
      .eq('id', userId)
      .single()

    const newXP = (profile?.total_xp || 0) + xpToAward
    const newLevel = Math.floor(newXP / 100) + 1

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ total_xp: newXP, level: newLevel })
      .eq('id', userId)

    if (profileError) throw profileError
  }

  return {
    xpEarned,
    alreadyCompleted,
    passed,
    xpForfeited: !canEarnXp && !alreadyCompleted,
    xpForfeitReason,
    xpForfeitReasons: [
      ...(transcriptRevealed && !canEarnXp && !alreadyCompleted ? ['transcript'] : []),
      ...(isFirstQuizSubmit && !passed && !alreadyCompleted ? ['first_fail'] : []),
      ...(!isFirstQuizSubmit && !xpEligible && passed && !alreadyCompleted ? ['prior_fail'] : []),
    ],
    isFirstQuizSubmit,
    xpEligible,
    transcriptRevealed: canEarnXp ? true : transcriptRevealed,
  }
}

export async function completeModule(userId, moduleId, score = 100, accuracyPercent = 100, xpReward = null) {
  // If xpReward not passed, fetch it from the modules table
  let xpToAward = xpReward
  if (xpToAward === null || xpToAward === undefined) {
    const { data: mod } = await supabase
      .from('modules')
      .select('xp_reward')
      .eq('id', moduleId)
      .single()
    xpToAward = mod?.xp_reward ?? 30
  }

  // Check if already completed
  const { data: existing } = await supabase
    .from('user_progress')
    .select('id, status, attempts')
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .single()

  const alreadyCompleted = existing?.status === 'completed'
  const xpEarned = alreadyCompleted ? 0 : xpToAward

  // Upsert user_progress
  const { error: progressError } = await supabase
    .from('user_progress')
    .upsert({
      user_id: userId,
      module_id: moduleId,
      status: 'completed',
      score,
      accuracy_percent: accuracyPercent,
      xp_earned: xpEarned,
      completed_at: new Date().toISOString(),
      attempts: (existing?.attempts || 0) + 1,
    }, { onConflict: 'user_id,module_id' })

  if (progressError) throw progressError

  // Only update XP on first completion
  if (!alreadyCompleted) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_xp')
      .eq('id', userId)
      .single()

    const newXP = (profile?.total_xp || 0) + xpToAward
    const newLevel = Math.floor(newXP / 100) + 1

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        total_xp: newXP,
        level: newLevel,
      })
      .eq('id', userId)

    if (profileError) throw profileError
  }

  return { xpEarned, alreadyCompleted }
}
