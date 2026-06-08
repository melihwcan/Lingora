import { supabase } from '../lib/supabaseClient'

/**
 * Kullanıcının günlük giriş streak'ini günceller.
 * Aynı gün içinde birden fazla çağrılırsa streak tekrar artmaz.
 */
export async function updateLoginStreak(userId) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('streak_count, last_activity_date')
    .eq('id', userId)
    .single()
  if (error || !profile) return

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const lastActivity = profile.last_activity_date

  if (lastActivity === today) return

  let newStreak = profile.streak_count ?? 0
  if (!lastActivity) {
    newStreak = 1
  } else if (lastActivity === yesterday) {
    newStreak = newStreak + 1
  } else {
    newStreak = 1
  }

  await supabase
    .from('profiles')
    .update({ streak_count: newStreak, last_activity_date: today })
    .eq('id', userId)
}
