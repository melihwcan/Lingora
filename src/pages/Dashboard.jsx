import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flame, Folder, FolderPlus, Star, Trophy } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useStreak } from '../hooks/useStreak'
import Card from '../components/common/Card'
import Modal from '../components/common/Modal'
import EmptyState from '../components/common/EmptyState'
import { PageShell, PageLoading } from '../components/common/PageShell'
import {
  DARK_BORDER,
  DARK_CARD,
  MODULE_LIST_CARD_BASE,
  MODULE_LIST_CARD_COMPLETED,
} from '../utils/brandColors'
import { getDifficultyColor } from '../utils/difficultyColors'
import { getDifficultyLabel, getModuleTypeLabel } from '../utils/labels'
import {
  countValidCollectionItems,
  enrichCollectionItems,
  getOrphanedCollectionItemIds,
} from '../utils/collectionItems'
import { resolveDisplayName } from '../utils/helpers'
import ReadingCard from '../components/reading/ReadingCard'
import ListeningCard from '../components/listening/ListeningCard'
import DashboardMascot from '../components/dashboard/DashboardMascot'

const TYPE_CONFIG = {
  reading: {
    label: getModuleTypeLabel('reading'),
    icon: '📖',
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    route: '/reading',
  },
  listening: {
    label: getModuleTypeLabel('listening'),
    icon: '🎧',
    badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    route: '/listening',
  },
  vocabulary: {
    label: getModuleTypeLabel('vocabulary'),
    icon: '🔤',
    badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    route: '/vocabulary',
  },
}

const CollectionCard = ({ collection, onClick }) => {
  const itemCount = collection.validItemCount ?? 0
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl border border-gray-200 ${DARK_BORDER} bg-white ${DARK_CARD} px-4 py-3.5 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700/50 hover:-translate-y-0.5 transition-all flex items-center gap-3`}
    >
      <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
        <Folder className="w-4 h-4 text-indigo-600 dark:text-indigo-400" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">{collection.name}</h3>
        <p className="text-xs text-gray-400 dark:text-neutral-500 mt-0.5">{itemCount} içerik</p>
      </div>
    </button>
  )
}

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { streak, totalXP, level, loading: streakLoading } = useStreak()

  const [modules, setModules] = useState([])
  const [progressMap, setProgressMap] = useState({})
  const [loading, setLoading] = useState(true)

  const [collections, setCollections] = useState([])
  const [collectionsLoading, setCollectionsLoading] = useState(true)
  const [quickPeekCollection, setQuickPeekCollection] = useState(null)
  const [quickPeekItems, setQuickPeekItems] = useState([])
  const [quickPeekLoading, setQuickPeekLoading] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [showNewInput, setShowNewInput] = useState(false)
  const [creatingCollection, setCreatingCollection] = useState(false)
  const [createError, setCreateError] = useState(null)
  const [displayName, setDisplayName] = useState('')

  useEffect(() => {
    if (!user) {
      setDisplayName('')
      return
    }
    supabase
      .from('profiles')
      .select('username, full_name')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setDisplayName(resolveDisplayName(data, user))
      })
  }, [user])

  useEffect(() => {
    if (!user) return
    let cancelled = false

    const fetchData = async () => {
      setLoading(true)
      const [modulesRes, progressRes] = await Promise.all([
        supabase
          .from('modules')
          .select('id, title, description, type, difficulty, xp_reward')
          .eq('is_published', true)
          .order('order_index'),
        supabase
          .from('user_progress')
          .select('module_id, status')
          .eq('user_id', user.id),
      ])
      if (cancelled) return
      const map = {}
      progressRes.data?.forEach((p) => { map[p.module_id] = p.status })
      setModules(modulesRes.data ?? [])
      setProgressMap(map)
      setLoading(false)
    }

    fetchData()
    return () => { cancelled = true }
  }, [user])

  useEffect(() => {
    if (!user) return
    fetchCollections()
  }, [user])

  const fetchCollections = async () => {
    setCollectionsLoading(true)
    const { data: cols } = await supabase
      .from('collections')
      .select('id, name, created_at, collection_items(id, content_id, content_type)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!cols?.length) {
      setCollections([])
      setCollectionsLoading(false)
      return
    }

    const allContentIds = cols.flatMap((c) => c.collection_items.map((i) => i.content_id))
    const uniqueIds = [...new Set(allContentIds)]

    let modulesMap = {}
    if (uniqueIds.length > 0) {
      const { data: mods } = await supabase
        .from('modules')
        .select('id, title, type, difficulty')
        .in('id', uniqueIds)
      mods?.forEach((m) => { modulesMap[m.id] = m })
    }

    const orphanedIds = cols.flatMap((col) =>
      getOrphanedCollectionItemIds(col.collection_items, modulesMap)
    )
    if (orphanedIds.length > 0) {
      await supabase.from('collection_items').delete().in('id', orphanedIds)
    }

    setCollections(
      cols.map((col) => ({
        id: col.id,
        name: col.name,
        created_at: col.created_at,
        validItemCount: countValidCollectionItems(col.collection_items, modulesMap),
      }))
    )
    setCollectionsLoading(false)
  }

  const handleQuickPeek = async (collection) => {
    setQuickPeekCollection(collection)
    setQuickPeekLoading(true)
    setQuickPeekItems([])

    const { data: items } = await supabase
      .from('collection_items')
      .select('id, content_id, content_type')
      .eq('collection_id', collection.id)
      .order('created_at', { ascending: false })

    if (items && items.length > 0) {
      const ids = [...new Set(items.map((i) => i.content_id))]
      const { data: mods } = await supabase
        .from('modules')
        .select('id, title, type, difficulty')
        .in('id', ids)
      const modMap = {}
      mods?.forEach((m) => { modMap[m.id] = m })
      setQuickPeekItems(enrichCollectionItems(items, modMap).slice(0, 3))
    }

    setQuickPeekLoading(false)
  }

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return
    setCreatingCollection(true)
    setCreateError(null)
    const { data, error } = await supabase
      .from('collections')
      .insert({ user_id: user.id, name: newCollectionName.trim() })
      .select('id, name, created_at')
      .single()
    if (error) {
      setCreateError(error.message)
    } else {
      setCollections((prev) => [{ ...data, validItemCount: 0 }, ...prev])
      setNewCollectionName('')
      setShowNewInput(false)
    }
    setCreatingCollection(false)
  }

  const completed = modules.filter((m) => progressMap[m.id] === 'completed')

  const getRoute = (m) => {
    const base = TYPE_CONFIG[m.type]?.route ?? '/dashboard'
    return `${base}/${m.id}`
  }

  if (loading || streakLoading) {
    return <PageLoading spinnerColor="border-indigo-500" maxWidth="max-w-5xl" />
  }

  const stats = [
    {
      icon: Flame,
      iconClass: 'text-rose-500 dark:text-rose-400',
      value: streak,
      label: 'Günlük Seri',
      accent: 'rose',
      bgClass: 'bg-gradient-to-br from-white to-rose-50/40 dark:from-neutral-900 dark:to-rose-900/10',
    },
    {
      icon: Star,
      iconClass: 'text-violet-500 dark:text-violet-400',
      value: totalXP,
      label: 'Toplam XP',
      accent: null,
      bgClass: 'bg-gradient-to-br from-white to-violet-50/40 dark:from-neutral-900 dark:to-violet-900/10 !border-l-4 !border-l-violet-400 dark:!border-l-violet-500',
    },
    {
      icon: Trophy,
      iconClass: 'text-indigo-500 dark:text-indigo-400',
      value: level,
      label: 'Seviye',
      accent: 'indigo',
      bgClass: 'bg-gradient-to-br from-white to-indigo-50/40 dark:from-neutral-900 dark:to-indigo-900/10',
    },
  ]

  return (
    <PageShell maxWidth="max-w-5xl" className="!pt-4 md:!pt-5">
      <DashboardMascot displayName={displayName || 'öğrenci'} />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {stats.map(({ icon: Icon, iconClass, value, label, accent, bgClass }) => (
          <Card key={label} accent={accent} className={`text-center !p-4 ${bgClass}`}>
            <div className="flex justify-center mb-1.5">
              <Icon className={`w-6 h-6 ${iconClass}`} strokeWidth={2} />
            </div>
            <p className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">{label}</p>
          </Card>
        ))}
      </div>

      {/* Collections section */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-700 dark:text-gray-200">
            Koleksiyonlarım
            {collections.length > 0 && (
              <span className="ml-2 text-sm font-medium text-gray-400 dark:text-neutral-500">
                ({collections.length})
              </span>
            )}
          </h2>
          <button
            onClick={() => navigate('/my-collections')}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            Tümünü Gör →
          </button>
        </div>

        {collectionsLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {collections.map((col) => (
                <CollectionCard
                  key={col.id}
                  collection={col}
                  onClick={() => handleQuickPeek(col)}
                />
              ))}

              {/* New collection card */}
              {showNewInput ? (
                <div className="rounded-2xl border border-dashed border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-900/20 p-4 flex flex-col gap-2">
                  <input
                    type="text"
                    autoFocus
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateCollection()
                      if (e.key === 'Escape') { setShowNewInput(false); setNewCollectionName('') }
                    }}
                    placeholder="Koleksiyon adı..."
                    className={`text-sm px-3 py-2 border border-gray-200 ${DARK_BORDER} bg-white ${DARK_CARD} text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-neutral-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  />
                  {createError && <p className="text-xs text-red-500">{createError}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateCollection}
                      disabled={!newCollectionName.trim() || creatingCollection}
                      className="flex-1 text-xs bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-1.5 rounded-lg transition-colors"
                    >
                      {creatingCollection ? '...' : 'Oluştur'}
                    </button>
                    <button
                      onClick={() => { setShowNewInput(false); setNewCollectionName('') }}
                      className="text-xs text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-gray-200 px-2"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewInput(true)}
                  className={`rounded-2xl border-2 border-dashed border-gray-200 ${DARK_BORDER} hover:border-indigo-300 dark:hover:border-indigo-600 bg-white/60 ${DARK_CARD} shadow-sm hover:shadow-md p-5 flex flex-col items-center justify-center gap-2 text-gray-400 dark:text-neutral-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all min-h-[88px]`}
                >
                  <FolderPlus className="w-6 h-6" strokeWidth={1.5} />
                  <span className="text-xs font-medium">Yeni Oluştur</span>
                </button>
              )}
            </div>

            {collections.length === 0 && !showNewInput && (
              <p className="text-sm text-gray-400 dark:text-neutral-500 mt-3">
                Henüz koleksiyonun yok. İçerikleri kaydetmek için kart üzerindeki 🔖 ikonuna tıkla.
              </p>
            )}
          </>
        )}
      </section>

      {/* Completed modules */}
      {completed.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-4">
            Tamamlananlar
            <span className="ml-2 text-sm font-medium text-gray-400 dark:text-neutral-500">
              ({completed.length})
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {completed.map((m) => {
              if (m.type === 'reading') {
                return (
                  <ReadingCard
                    key={m.id}
                    title={m.title}
                    excerpt={m.description}
                    level={m.difficulty}
                    xpReward={m.xp_reward}
                    isCompleted={true}
                    moduleId={m.id}
                    onStart={() => navigate(getRoute(m))}
                  />
                )
              }
              if (m.type === 'listening') {
                return (
                  <ListeningCard
                    key={m.id}
                    module={m}
                    isCompleted={true}
                  />
                )
              }
              const typeConf = TYPE_CONFIG[m.type] ?? { label: getModuleTypeLabel(m.type), icon: '📚', badgeClass: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' }
              return (
                <button
                  key={m.id}
                  onClick={() => navigate(getRoute(m))}
                  className={`w-full text-left ${MODULE_LIST_CARD_BASE} ${MODULE_LIST_CARD_COMPLETED}`}
                >
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeConf.badgeClass}`}>
                      {typeConf.icon} {typeConf.label}
                    </span>
                    {m.difficulty && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getDifficultyColor(m.difficulty)}`}>
                        {getDifficultyLabel(m.difficulty)}
                      </span>
                    )}
                    <span className="text-green-500 text-xs font-semibold">✓ Tamamlandı</span>
                  </div>
                  <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm leading-snug">{m.title}</h3>
                  {m.xp_reward > 0 && (
                    <p className="mt-2 text-xs font-semibold text-green-600 dark:text-green-400">✓ {m.xp_reward} XP</p>
                  )}
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* Quick Peek Modal */}
      <Modal
        isOpen={!!quickPeekCollection}
        onClose={() => { setQuickPeekCollection(null); setQuickPeekItems([]) }}
        title={quickPeekCollection?.name}
        accentGradient="from-indigo-600 to-violet-500"
      >
        <div className="min-h-[80px]">
          {quickPeekLoading ? (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : quickPeekItems.length === 0 ? (
            <EmptyState message="Bu koleksiyon boş." icon="📂" />
          ) : (
            <div className="space-y-2">
              {quickPeekItems.map((item) => {
                if (!item.module) return null
                const typeConf = TYPE_CONFIG[item.module.type] ?? { label: getModuleTypeLabel(item.module.type), icon: '📚', badgeClass: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' }
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      const path = item.content_type === 'reading'
                        ? `/reading/${item.content_id}`
                        : item.content_type === 'listening'
                          ? `/listening/${item.content_id}`
                          : `/vocabulary/${item.content_id}`
                      setQuickPeekCollection(null)
                      setQuickPeekItems([])
                      navigate(path)
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-neutral-800/80 cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors`}
                  >
                    <span className="text-lg">{typeConf.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{item.module.title}</p>
                      {item.module.difficulty && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${getDifficultyColor(item.module.difficulty)}`}>
                          {getDifficultyLabel(item.module.difficulty)}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => { setQuickPeekCollection(null); navigate('/my-collections') }}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
          >
            Tümünü Gör
          </button>
        </div>
      </Modal>

    </PageShell>
  )
}

export default Dashboard
