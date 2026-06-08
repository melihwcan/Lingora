import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { BookOpen, ChevronLeft, Bookmark } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { completeModule } from '../utils/gamification'
import CompletionModal from '../components/common/CompletionModal'
import BookmarkModal from '../components/common/BookmarkModal'
import TextHighlighter from '../components/reading/TextHighlighter'
import { PageShell, PageLoading, ContentDetailHeader, ContentCard, CompletionCTA } from '../components/common/PageShell'

import { getDifficultyColor } from '../utils/difficultyColors'
import { getDifficultyLabel } from '../utils/labels'

export default function ReadingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [module, setModule] = useState(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [modalState, setModalState] = useState({ isOpen: false, xpEarned: 0, alreadyCompleted: false })
  const [bookmarkOpen, setBookmarkOpen] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)

  useEffect(() => {
    const fetchModule = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('modules')
        .select('*')
        .eq('id', id)
        .single()
      setModule(data ?? null)
      setLoading(false)
    }
    fetchModule()
  }, [id])

  useEffect(() => {
    if (!module?.id || !user) return
    const checkBookmark = async () => {
      const { data } = await supabase
        .from('collection_items')
        .select('id')
        .eq('content_id', module.id)
        .eq('content_type', 'reading')
        .limit(1)
      setIsBookmarked((data?.length ?? 0) > 0)
    }
    checkBookmark()
  }, [module?.id, user])

  const handleComplete = async () => {
    if (!user || !module) return
    setCompleting(true)
    try {
      const result = await completeModule(user.id, module.id, 100, 100, module.xp_reward)
      setModalState({ isOpen: true, xpEarned: result.xpEarned, alreadyCompleted: result.alreadyCompleted })
    } catch (err) {
      console.error('Failed to complete module:', err)
    } finally {
      setCompleting(false)
    }
  }

  const handleGoToDashboard = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }))
    navigate('/dashboard')
  }

  if (loading) {
    return <PageLoading spinnerColor="border-blue-500" maxWidth="max-w-3xl" />
  }

  if (!module) {
    return (
      <PageShell maxWidth="max-w-3xl">
        <p className="text-slate-500 dark:text-slate-400 text-lg mb-6 text-center py-16">Modül bulunamadı.</p>
        <Link
          to="/reading"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-slate-100/80 dark:bg-neutral-800 text-blue-600 dark:text-blue-400 hover:bg-slate-200/80 dark:hover:bg-neutral-700 font-medium mx-auto w-fit transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Okumaya Dön
        </Link>
      </PageShell>
    )
  }

  return (
    <PageShell maxWidth="max-w-3xl">
      <Link
        to="/reading"
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-slate-100/80 dark:bg-neutral-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200/80 dark:hover:bg-neutral-700 transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Okumaya Dön
      </Link>

      <ContentDetailHeader
        variant="reading"
        title={module.title}
        description={module.description}
        Icon={BookOpen}
        badges={
          <>
            {module.difficulty && (
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getDifficultyColor(module.difficulty)}`}>
                {getDifficultyLabel(module.difficulty)}
              </span>
            )}
            {module.xp_reward && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
                +{module.xp_reward} XP
              </span>
            )}
            <button
              onClick={() => setBookmarkOpen(true)}
              className={`inline-flex items-center justify-center w-8 h-8 rounded-full border transition-colors ${
                isBookmarked
                  ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'border-blue-200 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              }`}
              title={isBookmarked ? 'Kaydedildi' : 'Kaydet'}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
          </>
        }
      />

      <ContentCard className="mb-10">
        <TextHighlighter text={module.content} />
      </ContentCard>

      <CompletionCTA
        variant="reading"
        onComplete={handleComplete}
        completing={completing}
      />

      <CompletionModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
        xpEarned={modalState.xpEarned}
        alreadyCompleted={modalState.alreadyCompleted}
        onGoToDashboard={handleGoToDashboard}
      />

      <BookmarkModal
        isOpen={bookmarkOpen}
        onClose={() => {
          setBookmarkOpen(false)
          if (module?.id && user) {
            supabase
              .from('collection_items')
              .select('id')
              .eq('content_id', module.id)
              .eq('content_type', 'reading')
              .limit(1)
              .then(({ data }) => setIsBookmarked((data?.length ?? 0) > 0))
          }
        }}
        contentId={module?.id}
        contentType="reading"
      />
    </PageShell>
  )
}
