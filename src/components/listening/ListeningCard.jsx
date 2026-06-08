import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MODULE_LIST_CARD_BASE, MODULE_LIST_CARD_COMPLETED } from '../../utils/brandColors'
import { getDifficultyColor } from '../../utils/difficultyColors'
import { getDifficultyLabel } from '../../utils/labels'
import BookmarkModal from '../common/BookmarkModal'
import { supabase } from '../../lib/supabaseClient'

const ListeningCard = ({ module, isCompleted, isBookmarked = false, onRemove = null }) => {
  const navigate = useNavigate()
  const badgeColor = getDifficultyColor(module.difficulty)
  const [bookmarkOpen, setBookmarkOpen] = useState(false)
  const [bookmarked, setBookmarked] = useState(isBookmarked ?? false)

  useEffect(() => {
    setBookmarked(isBookmarked ?? false)
  }, [isBookmarked])

  useEffect(() => {
    if (!module?.id) return
    supabase
      .from('collection_items')
      .select('id')
      .eq('content_id', module.id)
      .eq('content_type', 'listening')
      .limit(1)
      .then(({ data }) => setBookmarked((data?.length ?? 0) > 0))
  }, [module?.id])

  const handleBookmarkClose = async () => {
    setBookmarkOpen(false)
    if (!module?.id) return
    const { data } = await supabase
      .from('collection_items')
      .select('id')
      .eq('content_id', module.id)
      .eq('content_type', 'listening')
      .limit(1)
    setBookmarked((data?.length ?? 0) > 0)
  }

  const handleNavigate = () => navigate(`/listening/${module.id}`)

  return (
    <div
      onClick={handleNavigate}
      className={`${MODULE_LIST_CARD_BASE} ${isCompleted ? MODULE_LIST_CARD_COMPLETED : ''}`}
    >
      {onRemove ? (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="absolute top-3 right-3 p-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
          title="Koleksiyondan çıkar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); setBookmarkOpen(true) }}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:text-indigo-400 dark:hover:bg-indigo-900/30 transition-colors"
          title="Koleksiyona ekle"
        >
          {bookmarked ? (
            <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400 fill-current" viewBox="0 0 24 24">
              <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3-7 3V5z" />
            </svg>
          )}
        </button>
      )}

      <h3 className="font-semibold text-gray-800 dark:text-white text-base leading-snug pr-8">
        {module.title ?? 'Dinleme Modülü'}
      </h3>

      {module.description && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
          {module.description}
        </p>
      )}

      <div className="flex items-center gap-2 flex-wrap pt-3">
          {module.difficulty && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeColor}`}>
              {getDifficultyLabel(module.difficulty)}
            </span>
          )}
          {module.xp_reward && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
              +{module.xp_reward} XP
            </span>
          )}
          {isCompleted && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              ✓ Tamamlandı
            </span>
          )}
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); handleNavigate() }}
        className="w-full mt-4 bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-all shadow-sm hover:shadow-md"
      >
        {isCompleted ? 'Tekrar Dinle' : 'Dinlemeye Başla'}
      </button>

      <BookmarkModal
        isOpen={bookmarkOpen}
        onClose={handleBookmarkClose}
        contentId={module.id}
        contentType="listening"
      />
    </div>
  )
}

export default ListeningCard
