import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderOpen, Bookmark } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import ReadingCard from '../components/reading/ReadingCard'
import ListeningCard from '../components/listening/ListeningCard'
import EmptyState from '../components/common/EmptyState'
import Modal from '../components/common/Modal'
import { PageShell, PageLoading, HeroBanner } from '../components/common/PageShell'
import { PAGE_THEMES } from '../utils/pageTheme'
import { getDifficultyColor } from '../utils/difficultyColors'
import { DIFFICULTY_FILTERS } from '../utils/labels'
import { enrichCollectionItems, getOrphanedCollectionItemIds } from '../utils/collectionItems'

export default function Collections() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createError, setCreateError] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')

  useEffect(() => {
    if (user) fetchCollections()
  }, [user])

  const fetchCollections = async () => {
    setLoading(true)

    const { data: cols } = await supabase
      .from('collections')
      .select('id, name, created_at, collection_items(id, content_id, content_type, created_at)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!cols) {
      setCollections([])
      setLoading(false)
      return
    }

    const allContentIds = cols.flatMap((c) => c.collection_items.map((i) => i.content_id))
    const uniqueIds = [...new Set(allContentIds)]

    let modulesMap = {}
    if (uniqueIds.length > 0) {
      const { data: mods } = await supabase
        .from('modules')
        .select('id, title, description, type, difficulty, xp_reward, is_published')
        .in('id', uniqueIds)
      mods?.forEach((m) => { modulesMap[m.id] = m })
    }

    const orphanedIds = cols.flatMap((col) =>
      getOrphanedCollectionItemIds(col.collection_items, modulesMap)
    )
    if (orphanedIds.length > 0) {
      await supabase.from('collection_items').delete().in('id', orphanedIds)
    }

    const enriched = cols.map((col) => ({
      ...col,
      items: enrichCollectionItems(col.collection_items, modulesMap),
    }))

    setCollections(enriched)
    setLoading(false)
  }

  const handleDeleteCollection = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    await supabase.from('collections').delete().eq('id', deleteTarget.id)
    setCollections((prev) => prev.filter((c) => c.id !== deleteTarget.id))
    setDeleteTarget(null)
    setDeleting(false)
  }

  const handleRemoveItem = async (collectionId, itemId) => {
    await supabase.from('collection_items').delete().eq('id', itemId)
    setCollections((prev) =>
      prev.map((col) =>
        col.id === collectionId
          ? { ...col, items: col.items.filter((i) => i.id !== itemId) }
          : col
      )
    )
  }

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return
    setCreating(true)
    setCreateError(null)
    const { data, error } = await supabase
      .from('collections')
      .insert({ user_id: user.id, name: newCollectionName.trim() })
      .select('id, name, created_at')
      .single()
    if (error) {
      setCreateError(error.message)
    } else {
      setCollections((prev) => [{ ...data, items: [] }, ...prev])
      setNewCollectionName('')
      setShowCreateForm(false)
    }
    setCreating(false)
  }

  const handleRename = async (collectionId) => {
    if (!editingName.trim()) return
    const { error } = await supabase
      .from('collections')
      .update({ name: editingName.trim() })
      .eq('id', collectionId)
    if (!error) {
      setCollections(prev => prev.map(c => c.id === collectionId ? { ...c, name: editingName.trim() } : c))
      setEditingId(null)
      setEditingName('')
    }
  }

  const getFilteredItems = (items) => {
    if (difficultyFilter === 'all') return items
    return items.filter((i) => i.module?.difficulty === difficultyFilter)
  }

  if (loading) {
    return <PageLoading spinnerColor="border-indigo-500" maxWidth="max-w-5xl" />
  }

  return (
    <PageShell maxWidth="max-w-5xl">
      <div className="flex items-start justify-between gap-4 mb-2">
        <HeroBanner
          title="Koleksiyonlarım"
          subtitle="Kaydettiğin içerikleri düzenle ve görüntüle."
          gradient={PAGE_THEMES.collections.gradient}
          Icon={FolderOpen}
          AccentIcon={Bookmark}
          className="flex-1"
        />
        <button
          onClick={() => setShowCreateForm((v) => !v)}
          className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-500 hover:from-indigo-700 hover:to-violet-600 text-white text-sm font-medium rounded-xl transition-all shadow-md shrink-0 mt-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yeni Koleksiyon
        </button>
      </div>

      <button
        onClick={() => setShowCreateForm((v) => !v)}
        className="sm:hidden flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-500 text-white text-sm font-medium rounded-xl transition-all shadow-md w-full justify-center mt-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Yeni Koleksiyon
      </button>

      <div className="mt-8">

      {/* Create form */}
      {showCreateForm && (
        <div className="mb-8 p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Yeni Koleksiyon Oluştur</h2>
          <div className="flex gap-3">
            <input
              type="text"
              autoFocus
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateCollection()
                if (e.key === 'Escape') { setShowCreateForm(false); setNewCollectionName('') }
              }}
              placeholder="Koleksiyon adı..."
              className="flex-1 text-sm px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleCreateCollection}
              disabled={!newCollectionName.trim() || creating}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
            >
              {creating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : 'Oluştur'}
            </button>
            <button
              onClick={() => { setShowCreateForm(false); setNewCollectionName('') }}
              className="px-3 py-2.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-xl border border-gray-200 dark:border-gray-600 transition-colors"
            >
              İptal
            </button>
          </div>
          {createError && <p className="text-xs text-red-500 mt-2">{createError}</p>}
        </div>
      )}

      {/* Difficulty filter */}
      {collections.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-8">
          {DIFFICULTY_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setDifficultyFilter(f.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                difficultyFilter === f.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {collections.length === 0 && (
        <EmptyState
          icon="📂"
          accent="indigo"
          message="Henüz koleksiyonun yok. İçerikleri kaydetmek için kart üzerindeki yer imi ikonuna tıkla."
        />
      )}

      {/* Collections */}
      <div className="space-y-10">
        {collections.map((col) => {
          const filteredItems = getFilteredItems(col.items)
          return (
            <section key={col.id}>
              {/* Collection header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  {editingId === col.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleRename(col.id); if (e.key === 'Escape') { setEditingId(null); setEditingName('') } }}
                        className="flex-1 px-2 py-1 text-lg font-semibold border border-indigo-300 rounded-lg bg-white dark:bg-gray-700 dark:text-white dark:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                      <button onClick={() => handleRename(col.id)} className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Kaydet</button>
                      <button onClick={() => { setEditingId(null); setEditingName('') }} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300">İptal</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{col.name}</h2>
                      <span className="text-sm text-gray-400 dark:text-gray-500">({col.items.length})</span>
                      <button
                        onClick={() => { setEditingId(col.id); setEditingName(col.name) }}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                        title="İsmi düzenle"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setDeleteTarget(col)}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                  title="Koleksiyonu sil"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {/* Items */}
              {filteredItems.length === 0 ? (
                <EmptyState
                  icon="📭"
                  message={difficultyFilter !== 'all' ? 'Bu zorlukta içerik yok.' : 'Bu koleksiyon boş.'}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredItems.map((item) => {
                    if (!item.module) return null
                    const m = item.module
                    return (
                      <div key={item.id}>
                        {item.content_type === 'reading' ? (
                          <ReadingCard
                            title={m.title}
                            excerpt={m.description}
                            level={m.difficulty}
                            xpReward={m.xp_reward}
                            onStart={() => navigate('/reading/' + m.id)}
                            moduleId={m.id}
                            isBookmarked={true}
                            onRemove={() => handleRemoveItem(col.id, item.id)}
                          />
                        ) : (
                          <ListeningCard
                            module={m}
                            isCompleted={false}
                            isBookmarked={true}
                            onRemove={() => handleRemoveItem(col.id, item.id)}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )
        })}
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Koleksiyonu Sil"
        accentGradient="from-red-500 to-rose-500"
      >
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          <strong className="text-gray-800 dark:text-gray-100">"{deleteTarget?.name}"</strong> koleksiyonunu silmek istediğine emin misin? İçindeki tüm kayıtlar da silinecek.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleDeleteCollection}
            disabled={deleting}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
          >
            {deleting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Siliniyor...
              </span>
            ) : 'Evet, Sil'}
          </button>
          <button
            onClick={() => setDeleteTarget(null)}
            className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium py-2.5 rounded-xl transition-colors"
          >
            İptal
          </button>
        </div>
      </Modal>
      </div>
    </PageShell>
  )
}
