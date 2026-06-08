import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export const useProgress = () => {
  const { user } = useAuth()
  const [progress, setProgress] = useState([])
  const [progressByType, setProgressByType] = useState({ reading: 0, listening: 0, vocabulary: 0 })
  const [totalCompleted, setTotalCompleted] = useState(0)
  const [totalModules, setTotalModules] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchProgress = useCallback(async () => {
    setLoading(true)

    const [modulesRes, progressRes] = await Promise.all([
      supabase.from('modules').select('id, type').eq('is_published', true),
      user
        ? supabase.from('user_progress').select('module_id, status').eq('user_id', user.id)
        : Promise.resolve({ data: [] }),
    ])

    const modules = modulesRes.data ?? []
    const userProgress = progressRes.data ?? []

    const completedIds = new Set(
      userProgress.filter((p) => p.status === 'completed').map((p) => p.module_id)
    )

    const byType = {}
    for (const type of ['reading', 'listening', 'vocabulary']) {
      const ofType = modules.filter((m) => m.type === type)
      byType[type] = ofType.length
        ? Math.round((ofType.filter((m) => completedIds.has(m.id)).length / ofType.length) * 100)
        : 0
    }

    setProgress(userProgress)
    setProgressByType(byType)
    setTotalCompleted(completedIds.size)
    setTotalModules(modules.length)
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchProgress()
  }, [fetchProgress])

  return { progress, progressByType, totalCompleted, totalModules, loading, refetch: fetchProgress }
}
