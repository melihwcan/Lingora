import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Headphones, ChevronLeft, Bookmark, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { completeListeningModule, revealListeningTranscript } from '../utils/gamification'
import {
  fetchListeningQuestions,
  calculateQuizAccuracy,
  restoreQuizAnswers,
  buildQuizResultFromProgress,
  getListeningXpForfeitMessage,
} from '../utils/listeningQuestions'
import CompletionModal from '../components/common/CompletionModal'
import BookmarkModal from '../components/common/BookmarkModal'
import Modal from '../components/common/Modal'
import AudioPlayer from '../components/listening/AudioPlayer'
import TranscriptViewer from '../components/listening/TranscriptViewer'
import TranscriptPanel from '../components/listening/TranscriptPanel'
import ListeningTrueFalseQuiz from '../components/listening/ListeningTrueFalseQuiz'
import { PageShell, PageLoading, ContentDetailHeader } from '../components/common/PageShell'

import { getDifficultyColor } from '../utils/difficultyColors'
import { getDifficultyLabel } from '../utils/labels'

export default function ListeningDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [module, setModule] = useState(null)
  const [questions, setQuestions] = useState([])
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [answers, setAnswers] = useState({})
  const [quizResult, setQuizResult] = useState(null)
  const [transcriptWarningOpen, setTranscriptWarningOpen] = useState(false)
  const [revealingTranscript, setRevealingTranscript] = useState(false)
  const [modalState, setModalState] = useState({ isOpen: false, xpEarned: 0, alreadyCompleted: false })
  const [bookmarkOpen, setBookmarkOpen] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [quizSessionActive, setQuizSessionActive] = useState(false)

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      const [{ data: mod }, qs] = await Promise.all([
        supabase.from('modules').select('*').eq('id', id).single(),
        fetchListeningQuestions(id).catch((err) => {
          console.error('Failed to fetch listening questions:', err)
          return []
        }),
      ])
      setModule(mod ?? null)
      setQuestions(qs ?? [])
      setLoading(false)
    }
    fetchAll()
  }, [id])

  useEffect(() => {
    if (!module?.id || !user) return
    const loadUserData = async () => {
      const [{ data: bookmarkData }, { data: progressData }] = await Promise.all([
        supabase
          .from('collection_items')
          .select('id')
          .eq('content_id', module.id)
          .eq('content_type', 'listening')
          .limit(1),
        supabase
          .from('user_progress')
          .select('status, attempts, transcript_revealed, xp_eligible, accuracy_percent, xp_earned, quiz_answers')
          .eq('user_id', user.id)
          .eq('module_id', module.id)
          .maybeSingle(),
      ])
      setIsBookmarked((bookmarkData?.length ?? 0) > 0)

      let resolvedProgress = progressData ?? null
      const earnedXp = (resolvedProgress?.xp_earned ?? 0) > 0
      if (earnedXp && resolvedProgress && !resolvedProgress.transcript_revealed) {
        try {
          await revealListeningTranscript(user.id, module.id)
          resolvedProgress = { ...resolvedProgress, transcript_revealed: true }
        } catch (err) {
          console.error('Failed to auto-reveal transcript for XP-earned module:', err)
        }
      }

      setProgress(resolvedProgress)
    }
    loadUserData()
  }, [module?.id, user])

  useEffect(() => {
    if (!progress || questions.length === 0 || quizSessionActive) return
    if ((progress.attempts ?? 0) > 0 && progress.quiz_answers) {
      const restoredAnswers = restoreQuizAnswers(progress.quiz_answers, questions)
      if (Object.keys(restoredAnswers).length > 0) {
        setAnswers(restoredAnswers)
        setQuizResult(buildQuizResultFromProgress(progress))
      }
    }
  }, [progress, questions, quizSessionActive])

  const handleRevealTranscript = async () => {
    if (!user || !module) return
    setRevealingTranscript(true)
    try {
      await revealListeningTranscript(user.id, module.id)
      setProgress((prev) => ({
        ...prev,
        transcript_revealed: true,
        xp_eligible: false,
      }))
      setTranscriptWarningOpen(false)
    } catch (err) {
      console.error('Failed to reveal transcript:', err)
    } finally {
      setRevealingTranscript(false)
    }
  }

  const handleQuizSubmit = async () => {
    if (!user || !module || questions.length === 0) return
    setSubmitting(true)
    setQuizResult(null)

    const accuracy = calculateQuizAccuracy(questions, answers)

    try {
      const result = await completeListeningModule(user.id, module.id, accuracy, module.xp_reward, answers)

      setQuizResult({
        accuracy,
        passed: result.passed,
        xpEarned: result.xpEarned,
        xpForfeited: result.xpForfeited,
        xpForfeitReason: result.xpForfeitReason,
        xpForfeitReasons: result.xpForfeitReasons,
        isFirstQuizSubmit: result.isFirstQuizSubmit,
        alreadyCompleted: result.alreadyCompleted,
      })

      setProgress((prev) => ({
        ...prev,
        attempts: (prev?.attempts ?? 0) + 1,
        status: result.passed ? 'completed' : 'in_progress',
        xp_eligible: result.xpEligible,
        accuracy_percent: accuracy,
        xp_earned: result.xpEarned > 0 ? result.xpEarned : (prev?.xp_earned ?? 0),
        transcript_revealed: result.xpEarned > 0 ? true : (prev?.transcript_revealed ?? false),
        quiz_answers: answers,
      }))

      setQuizSessionActive(false)

      if (result.passed && result.xpEarned > 0) {
        setModalState({ isOpen: true, xpEarned: result.xpEarned, alreadyCompleted: result.alreadyCompleted })
      }
    } catch (err) {
      console.error('Failed to submit quiz:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRetry = () => {
    setAnswers({})
    setQuizResult(null)
    setQuizSessionActive(true)
  }

  const handleGoToDashboard = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }))
    navigate('/dashboard')
  }

  const transcriptRevealed = progress?.transcript_revealed ?? false
  const xpEligible = progress?.xp_eligible ?? true
  const hasEarnedModuleXp = (progress?.xp_earned ?? 0) > 0 || (quizResult?.xpEarned ?? 0) > 0
  const attempts = progress?.attempts ?? 0
  const transcriptVisible = hasEarnedModuleXp || transcriptRevealed
  const canRevealTranscript = !transcriptVisible
  const failedQuiz = !xpEligible && attempts > 0

  const transcriptPanelXpMessage = getListeningXpForfeitMessage(progress, quizResult, 'transcript-panel')
  const quizXpForfeitMessage = getListeningXpForfeitMessage(progress, quizResult, 'quiz')

  const handleTranscriptShowClick = () => {
    if (failedQuiz) {
      handleRevealTranscript()
      return
    }
    setTranscriptWarningOpen(true)
  }

  if (loading) {
    return <PageLoading spinnerColor="border-violet-500" maxWidth="max-w-3xl" />
  }

  if (!module) {
    return (
      <PageShell maxWidth="max-w-3xl">
        <p className="text-slate-500 dark:text-slate-400 text-lg mb-6 text-center py-16">Modül bulunamadı.</p>
        <Link
          to="/listening"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-slate-100/80 dark:bg-neutral-800 text-violet-600 dark:text-violet-400 hover:bg-slate-200/80 dark:hover:bg-neutral-700 font-medium mx-auto w-fit transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Dinlemeye Dön
        </Link>
      </PageShell>
    )
  }

  return (
    <PageShell maxWidth="max-w-3xl">
      <Link
        to="/listening"
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-slate-100/80 dark:bg-neutral-800 text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-200/80 dark:hover:bg-neutral-700 transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Dinlemeye Dön
      </Link>

      <ContentDetailHeader
        variant="listening"
        title={module.title}
        description={module.description}
        Icon={Headphones}
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
                  ? 'border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'
                  : 'border-violet-200 dark:border-violet-800/60 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20'
              }`}
              title={isBookmarked ? 'Kaydedildi' : 'Kaydet'}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
          </>
        }
      />

      <div className="rounded-2xl bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent dark:from-violet-600/15 dark:via-purple-600/8 border border-violet-200/40 dark:border-violet-800/40 px-8 py-8 md:px-10 md:py-10 mb-8">
        {module.audio_url ? (
          <AudioPlayer src={module.audio_url} variant="listening" />
        ) : (
          <div className="text-sm italic text-slate-400 dark:text-slate-500">
            Ses dosyası yakında eklenecek
          </div>
        )}
      </div>

      <TranscriptPanel className="mb-8">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="font-semibold text-slate-900 dark:text-white">Transkript</h2>
          {canRevealTranscript && (
            <button
              type="button"
              onClick={handleTranscriptShowClick}
              className="text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline"
            >
              Transkripti Göster
            </button>
          )}
        </div>

        {transcriptVisible ? (
          <TranscriptViewer transcript={module.content} />
        ) : (
          <p className="text-sm text-slate-400 dark:text-slate-500 italic">
            {failedQuiz
              ? 'Transkript gizli. Dinleyerek anlamaya çalışın.'
              : 'Transkript gizli. Dinleyerek anlamaya çalışın; transkripti açarsanız XP kazanamazsınız.'}
          </p>
        )}

        {transcriptPanelXpMessage && (
          <p className="mt-4 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            {transcriptPanelXpMessage}
          </p>
        )}
      </TranscriptPanel>

      {questions.length === 0 ? (
        <div className="rounded-2xl border border-amber-200/60 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-900/20 p-5 mb-8">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Bu modül için henüz anlama quizi eklenmemiş. XP kazanmak için quiz gereklidir.
          </p>
        </div>
      ) : (
        <ListeningTrueFalseQuiz
          questions={questions}
          answers={answers}
          onAnswerChange={(qId, value) => setAnswers((prev) => ({ ...prev, [qId]: value }))}
          onSubmit={handleQuizSubmit}
          submitting={submitting}
          disabled={!user}
          result={quizResult}
          onRetry={handleRetry}
          xpForfeitMessage={quizXpForfeitMessage}
        />
      )}

      <CompletionModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
        xpEarned={modalState.xpEarned}
        alreadyCompleted={modalState.alreadyCompleted}
        onGoToDashboard={handleGoToDashboard}
      />

      <Modal
        isOpen={transcriptWarningOpen}
        onClose={() => setTranscriptWarningOpen(false)}
        title="Transkripti Aç"
        accentGradient="from-violet-600 to-purple-500"
      >
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Transkripti açarsan bu içerikten XP kazanamazsın. Bu işlem geri alınamaz.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => setTranscriptWarningOpen(false)}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleRevealTranscript}
            disabled={revealingTranscript}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
          >
            {revealingTranscript ? 'Açılıyor...' : 'Transkripti Aç'}
          </button>
        </div>
      </Modal>

      <BookmarkModal
        isOpen={bookmarkOpen}
        onClose={() => {
          setBookmarkOpen(false)
          if (module?.id && user) {
            supabase
              .from('collection_items')
              .select('id')
              .eq('content_id', module.id)
              .eq('content_type', 'listening')
              .limit(1)
              .then(({ data }) => setIsBookmarked((data?.length ?? 0) > 0))
          }
        }}
        contentId={module?.id}
        contentType="listening"
      />
    </PageShell>
  )
}
