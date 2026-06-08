import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { updateLoginStreak } from '../utils/streak'

export const useStreak = () => {
  const { user } = useAuth()
  const [streak, setStreak] = useState(0)
  const [totalXP, setTotalXP] = useState(0)
  const [level, setLevel] = useState(1)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('streak_count, total_xp, level, last_activity_date')
      .eq('id', user.id)
      .single()

    if (data) {
      const today = new Date().toISOString().split('T')[0]
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      const lastActivity = data.last_activity_date
      const isStreakActive = lastActivity === today || lastActivity === yesterday
      const currentStreak = isStreakActive ? (data.streak_count ?? 0) : 0

      setStreak(currentStreak)
      setTotalXP(data.total_xp ?? 0)
      setLevel(data.level ?? 1)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    const run = async () => {
      await updateLoginStreak(user.id)
      await fetchProfile()
    }
    run()
  }, [user, fetchProfile])

  return { streak, totalXP, level, loading, refetch: fetchProfile }
}
