import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import ReadingCard from '../components/reading/ReadingCard'
import EmptyState from '../components/common/EmptyState'
import { PageShell, PageLoading, HeroBanner } from '../components/common/PageShell'
import { PAGE_THEMES } from '../utils/pageTheme'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { DIFFICULTY_FILTERS } from '../utils/labels'

const FILTERS = DIFFICULTY_FILTERS
const theme = PAGE_THEMES.reading

const Reading = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [passages, setPassages] = useState([])
  const [completedSet, setCompletedSet] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      const { data } = await supabase
        .from('modules')
        .select('*')
        .eq('type', 'reading')
        .eq('is_published', true)
        .order('order_index')

      setPassages(data ?? [])

      if (user) {
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('module_id, status')
          .eq('user_id', user.id)

        const ids = new Set(
          (progressData ?? [])
            .filter((p) => p.status === 'completed')
            .map((p) => p.module_id)
        )
        setCompletedSet(ids)
      }

      setLoading(false)
    }
    fetchData()
  }, [user])

  if (loading) {
    return <PageLoading spinnerColor="border-blue-500" />
  }

  const filtered = passages.filter((p) => filter === 'all' || p.difficulty === filter)
  const activeModules = filtered.filter((p) => !completedSet.has(p.id))
  const completedModules = filtered.filter((p) => completedSet.has(p.id))

  return (
    <PageShell>
      <HeroBanner
        title="Okuma"
        subtitle="Kendi seviyendeki metinleri okuyarak anlama becerini geliştir."
        gradient={theme.gradient}
        Icon={BookOpen}
      />

      <div className="mt-10">
        <div className="flex flex-wrap gap-2 mb-8">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {passages.length === 0 ? (
          <EmptyState message="Okuma içerikleri yakında eklenecek!" icon="📖" accent="blue" />
        ) : (
          <>
            <section className="mb-10">
              <h2 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-4">
                Devam Edenler / Yeni İçerikler
              </h2>
              {activeModules.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                  Bu filtrede aktif modül yok.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeModules.map((p) => (
                    <ReadingCard
                      key={p.id}
                      title={p.title}
                      excerpt={p.description}
                      level={p.difficulty}
                      xpReward={p.xp_reward}
                      isCompleted={false}
                      moduleId={p.id}
                      onStart={() => navigate(`/reading/${p.id}`)}
                    />
                  ))}
                </div>
              )}
            </section>

            {completedModules.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-4">
                  Tamamlananlar
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completedModules.map((p) => (
                    <ReadingCard
                      key={p.id}
                      title={p.title}
                      excerpt={p.description}
                      level={p.difficulty}
                      xpReward={p.xp_reward}
                      isCompleted={true}
                      moduleId={p.id}
                      onStart={() => navigate(`/reading/${p.id}`)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </PageShell>
  )
}

export default Reading
