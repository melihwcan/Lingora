import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import Card from '../components/common/Card'
import { PageShell, PageLoading, HeroBanner } from '../components/common/PageShell'
import { PAGE_THEMES } from '../utils/pageTheme'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { getDifficultyLabel } from '../utils/labels'

const Lessons = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleStartModule = (module) => {
    switch (module.type) {
      case 'reading':
        navigate(`/reading/${module.id}`)
        break
      case 'listening':
        navigate(`/listening/${module.id}`)
        break
      case 'vocabulary':
        navigate(`/vocabulary/${module.id}`)
        break
      default:
        navigate(`/lessons`)
    }
  }
  const [modules, setModules] = useState([])
  const [progress, setProgress] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const [modulesRes, progressRes] = await Promise.all([
        supabase.from('modules').select('*').eq('is_published', true).order('order_index'),
        user
          ? supabase.from('user_progress').select('*').eq('user_id', user.id)
          : Promise.resolve({ data: [] }),
      ])
      setModules(modulesRes.data ?? [])
      setProgress(progressRes.data ?? [])
      setLoading(false)
    }
    fetchData()
  }, [user])

  const isCompleted = (moduleId) =>
    progress.some((p) => p.module_id === moduleId && p.status === 'completed')

  if (loading) {
    return <PageLoading spinnerColor="border-sky-500" />
  }

  return (
    <PageShell>
      <HeroBanner
        title="Dersler"
        subtitle="Dersleri tamamlayarak XP kazan ve yeni içeriklerin kilidini aç."
        gradient={PAGE_THEMES.lessons.gradient}
        Icon={GraduationCap}
      />

      <div className="mt-10 flex flex-col gap-3">
        {modules.map((module, idx) => {
          const completed = isCompleted(module.id)
          return (
            <Card key={module.id} accent={completed ? 'green' : 'sky'} className="flex items-center justify-between !p-4">
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${completed ? 'bg-gradient-to-br from-green-500 to-emerald-400 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                  {completed ? '✓' : idx + 1}
                </div>
                <div>
                  <p className="font-semibold text-gray-700 dark:text-gray-200">{module.title}</p>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{getDifficultyLabel(module.difficulty)}</span>
                </div>
              </div>
              <button
                onClick={() => handleStartModule(module)}
                className={`text-sm font-semibold px-4 py-1.5 rounded-lg transition-all ${completed ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600' : 'bg-gradient-to-r from-sky-500 to-blue-400 hover:from-sky-600 hover:to-blue-500 text-white shadow-sm'}`}
              >
                {completed ? 'Tekrar Et' : 'Başla'}
              </button>
            </Card>
          )
        })}
        {modules.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic text-center py-8">Henüz ders eklenmemiş.</p>
        )}
      </div>
    </PageShell>
  )
}

export default Lessons
