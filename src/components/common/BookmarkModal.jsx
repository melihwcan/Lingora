import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth'

export default function BookmarkModal({ isOpen, onClose, contentId, contentType }) {
  const { user } = useAuth()
  const [collections, setCollections] = useState([])
  const [savedInCollections, setSavedInCollections] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [toggling, setToggling] = useState(new Set())

  useEffect(() => {
    if (isOpen && user && contentId) {
      fetchCollectionsAndStatus()
    }
  }, [isOpen, user, contentId])

  const fetchCollectionsAndStatus = async () => {
    setLoading(true)
    setError(null)
    try {
      const [{ data: cols, error: colsErr }, { data: items, error: itemsErr }] = await Promise.all([
        supabase
          .from('collections')
          .select('id, name, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('collection_items')
          .select('collection_id')
          .eq('content_id', contentId)
          .eq('content_type', contentType),
      ])
      if (colsErr) throw colsErr
      if (itemsErr) throw itemsErr
      setCollections(cols || [])
      setSavedInCollections(new Set((items || []).map((i) => i.collection_id)))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (collectionId) => {
    if (!contentId) { console.error('contentId is undefined'); return }
    if (toggling.has(collectionId)) return
    setToggling((prev) => new Set([...prev, collectionId]))

    const isSaved = savedInCollections.has(collectionId)
    try {
      if (isSaved) {
        const { error } = await supabase
          .from('collection_items')
          .delete()
          .eq('collection_id', collectionId)
          .eq('content_id', contentId)
          .eq('content_type', contentType)
        if (error) throw error
        setSavedInCollections((prev) => {
          const next = new Set(prev)
          next.delete(collectionId)
          return next
        })
      } else {
        const { error } = await supabase
          .from('collection_items')
          .insert({ collection_id: collectionId, content_id: contentId, content_type: contentType })
        if (error) throw error
        setSavedInCollections((prev) => new Set([...prev, collectionId]))
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setToggling((prev) => {
        const next = new Set(prev)
        next.delete(collectionId)
        return next
      })
    }
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    if (!contentId) { console.error('contentId is undefined'); return }
    setCreating(true)
    setError(null)
    try {
      const { data: col, error: colErr } = await supabase
        .from('collections')
        .insert({ user_id: user.id, name: newName.trim() })
        .select('id, name, created_at')
        .single()
      if (colErr) throw colErr

      const { error: itemErr } = await supabase
        .from('collection_items')
        .insert({ collection_id: col.id, content_id: contentId, content_type: contentType })
      if (itemErr) throw itemErr

      setCollections((prev) => [col, ...prev])
      setSavedInCollections((prev) => new Set([...prev, col.id]))
      setNewName('')
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleCreate()
    if (e.key === 'Escape') onClose()
  }

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-500 dark:from-indigo-700 dark:to-violet-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Koleksiyona Ekle</h2>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">

        {/* Error */}
        {error && (
          <p className="text-xs text-red-500 mb-3 bg-red-50 dark:bg-red-900/30 rounded-lg px-3 py-2">{error}</p>
        )}

        {/* Collections list */}
        <div className="mb-5 max-h-56 overflow-y-auto space-y-1">
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : collections.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
              Henüz koleksiyonun yok. Aşağıdan oluştur!
            </p>
          ) : (
            collections.map((col) => {
              const isSaved = savedInCollections.has(col.id)
              const isToggling = toggling.has(col.id)
              return (
                <label
                  key={col.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors"
                >
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={isSaved}
                      onChange={() => handleToggle(col.id)}
                      disabled={isToggling}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                        isSaved
                          ? 'bg-indigo-600 border-indigo-600'
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                      }`}
                    >
                      {isSaved && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {isToggling && (
                        <div className="w-3 h-3 border border-indigo-400 border-t-transparent rounded-full animate-spin" />
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-200 flex-1 truncate">{col.name}</span>
                </label>
              )
            })
          )}
        </div>

        {/* New collection input */}
        <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Yeni koleksiyon oluştur</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Koleksiyon adı..."
              className="flex-1 text-sm px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim() || creating}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-1.5"
            >
              {creating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              )}
              Oluştur
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
