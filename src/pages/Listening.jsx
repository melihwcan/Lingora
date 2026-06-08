import { useState, useEffect } from 'react'
import { Headphones } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import ListeningCard from '../components/listening/ListeningCard'
import EmptyState from '../components/common/EmptyState'
import { PageShell, PageLoading, HeroBanner } from '../components/common/PageShell'
import { PAGE_THEMES } from '../utils/pageTheme'
import { DIFFICULTY_FILTERS } from '../utils/labels'

const FILTERS = DIFFICULTY_FILTERS
const theme = PAGE_THEMES.listening

const Listening = () => {
  const { user } = useAuth()
  const [modules, setModules] = useState([])
  const [completedSet, setCompletedSet] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      const { data } = await supabase
        .from('modules')
        .select('*')
        .eq('type', 'listening')
        .eq('is_published', true)
        .order('order_index', { ascending: true })

      setModules(data ?? [])

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
    return <PageLoading spinnerColor="border-violet-500" />
  }

  const filtered = modules.filter((m) => filter === 'all' || m.difficulty === filter)
  const activeModules = filtered.filter((m) => !completedSet.has(m.id))
  const completedModules = filtered.filter((m) => completedSet.has(m.id))

  return (
    <PageShell>
      <HeroBanner
        title="Dinleme"
        subtitle="Gerçek dünya konuşmalarıyla kulağını geliştir."
        gradient={theme.gradient}
        Icon={Headphones}
      />

      <div className="mt-10">
        <div className="flex flex-wrap gap-2 mb-8">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f.value
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {modules.length === 0 ? (
          <EmptyState message="Dinleme içerikleri yakında eklenecek!" icon="🎧" accent="violet" />
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
                  {activeModules.map((m) => (
                    <ListeningCard key={m.id} module={m} isCompleted={false} />
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
                  {completedModules.map((m) => (
                    <ListeningCard key={m.id} module={m} isCompleted={true} />
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

export default Listening
