import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Languages } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { completeModule } from '../utils/gamification'
import CompletionModal from '../components/common/CompletionModal'
import FlashCard from '../components/vocabulary/FlashCard'
import QuizCard from '../components/vocabulary/QuizCard'
import WordMatch from '../components/vocabulary/WordMatch'
import StepIndicator from '../components/common/StepIndicator'
import { PageShell, PageLoading, ContentDetailHeader } from '../components/common/PageShell'

import { getDifficultyColor } from '../utils/difficultyColors'
import { getDifficultyLabel } from '../utils/labels'

export default function VocabularyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [module, setModule] = useState(null)
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)

  const [mode, setMode] = useState('flashcard')
  const [cardIndex, setCardIndex] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [totalAnswered, setTotalAnswered] = useState(0)
  const [currentCardAnswered, setCurrentCardAnswered] = useState(false)
  const [quizDone, setQuizDone] = useState(false)
  const [answerHistory, setAnswerHistory] = useState([])

  const [completing, setCompleting] = useState(false)
  const [modalState, setModalState] = useState({ isOpen: false, xpEarned: 0, alreadyCompleted: false })

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const [moduleRes, cardsRes] = await Promise.all([
        supabase.from('modules').select('*').eq('id', id).single(),
        supabase.from('vocabulary_games').select('*').eq('module_id', id),
      ])
      setModule(moduleRes.data ?? null)
      setCards(cardsRes.data ?? [])
      setLoading(false)
    }
    fetchData()
  }, [id])

  const resetQuiz = () => {
    setCardIndex(0)
    setCorrectAnswers(0)
    setTotalAnswered(0)
    setCurrentCardAnswered(false)
    setQuizDone(false)
    setAnswerHistory([])
  }

  const handleModeChange = (newMode) => {
    setMode(newMode)
    if (newMode === 'quiz') resetQuiz()
  }

  const nextCard = () => setCardIndex((i) => (i + 1) % Math.max(cards.length, 1))

  const handleQuizAnswer = (isCorrect) => {
    setCurrentCardAnswered(true)
    setTotalAnswered((prev) => prev + 1)
    if (isCorrect) setCorrectAnswers((prev) => prev + 1)
    setAnswerHistory((prev) => [...prev, isCorrect ? 'correct' : 'wrong'])
  }

  const handleNextQuizCard = () => {
    setCurrentCardAnswered(false)
    if (cardIndex === cards.length - 1) {
      setQuizDone(true)
    } else {
      nextCard()
    }
  }

  const handleClaimXP = async () => {
    if (!user || !module) return
    setCompleting(true)
    try {
      const accuracy = totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0
      const result = await completeModule(user.id, module.id, correctAnswers, accuracy, module.xp_reward)
      setModalState({ isOpen: true, xpEarned: result.xpEarned, alreadyCompleted: result.alreadyCompleted })
    } catch (err) {
      console.error('Failed to claim XP:', err)
    } finally {
      setCompleting(false)
    }
  }

  const handleGoToDashboard = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }))
    navigate('/dashboard')
  }

  if (loading) {
    return <PageLoading spinnerColor="border-emerald-500" maxWidth="max-w-3xl" />
  }

  if (!module) {
    return (
      <PageShell maxWidth="max-w-3xl">
        <p className="text-slate-500 dark:text-slate-400 text-lg mb-6 text-center py-16">Modül bulunamadı.</p>
        <Link
          to="/vocabulary"
          className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-semibold mx-auto block w-fit"
        >
          <span>←</span>
          <span>Kelimelere Dön</span>
        </Link>
      </PageShell>
    )
  }

  const accuracy = totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0

  return (
    <PageShell maxWidth="max-w-3xl">
      <Link
        to="/vocabulary"
        className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 text-sm font-medium transition-colors mb-6"
      >
        <span>←</span>
        <span>Kelimelere Dön</span>
      </Link>

      <ContentDetailHeader
        variant="vocabulary"
        title={module.title}
        description={module.description}
        Icon={Languages}
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
          </>
        }
      />

      {cards.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <p className="text-slate-500 text-sm italic">Bu modüle ait kelime bulunamadı.</p>
        </div>
      ) : (
        <>
          <div className="flex gap-2 mb-8">
            {[
              { value: 'flashcard', label: 'Bilgi Kartı' },
              { value: 'quiz', label: 'Sınav' },
              { value: 'matching', label: 'Eşleştirme' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleModeChange(tab.value)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === tab.value ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {mode === 'matching' ? (
            <WordMatch pairs={cards.map((c) => ({ word: c.word, meaning: c.meaning }))} />
          ) : mode === 'flashcard' ? (
            <div className="flex flex-col items-center gap-4">
              <FlashCard
                key={cardIndex}
                word={cards[cardIndex].word}
                meaning={cards[cardIndex].meaning}
                exampleSentence={cards[cardIndex].example_sentence}
                exampleTranslation={cards[cardIndex].example_translation}
              />
              <div className="flex gap-3 mt-2 w-full">
                <button
                  onClick={() => setCardIndex(i => Math.max(0, i - 1))}
                  disabled={cardIndex === 0}
                  className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Önceki
                </button>
                <button
                  onClick={() => setCardIndex(i => Math.min(cards.length - 1, i + 1))}
                  disabled={cardIndex === cards.length - 1}
                  className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Sonraki →
                </button>
              </div>
              <p className="text-xs text-gray-400">{cardIndex + 1} / {cards.length}</p>
            </div>
          ) : quizDone ? (
            <div className="bg-white rounded-2xl shadow-md p-8 text-center">
              <p className="text-3xl mb-4">🎉</p>
              <h2 className="text-2xl font-extrabold text-gray-800 mb-6">Sınav Tamamlandı!</h2>
              <div className="flex flex-col gap-3 mb-8 text-left max-w-xs mx-auto">
                <p className="text-gray-600">
                  <span className="font-semibold">{cards.length}</span> / {cards.length} Kelime
                </p>
                <p className="text-green-600 font-semibold">✅ Doğru: {correctAnswers}</p>
                <p className="text-red-500 font-semibold">❌ Yanlış: {totalAnswered - correctAnswers}</p>
                <p className="text-gray-700 font-semibold">Doğruluk: {accuracy}%</p>
              </div>
              <button
                onClick={handleClaimXP}
                disabled={completing}
                className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 text-white font-bold py-3 px-8 rounded-xl text-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 mx-auto shadow-md"
              >
                {completing ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    İşleniyor...
                  </>
                ) : (
                  `+${module.xp_reward ?? 20} XP Kazan`
                )}
              </button>
              <button
                onClick={resetQuiz}
                className="mt-4 text-sm text-gray-500 hover:text-gray-700 underline block mx-auto"
              >
                Sınavı Tekrarla
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <StepIndicator
                total={cards.length}
                current={cardIndex}
                history={answerHistory}
              />
              <QuizCard
                key={cardIndex}
                word={cards[cardIndex].word}
                correctMeaning={cards[cardIndex].meaning}
                allWords={cards}
                onAnswer={(isCorrect) => {
                  handleQuizAnswer(isCorrect)
                  setTimeout(() => handleNextQuizCard(), 650)
                }}
              />
            </div>
          )}
        </>
      )}

      <CompletionModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
        xpEarned={modalState.xpEarned}
        alreadyCompleted={modalState.alreadyCompleted}
        onGoToDashboard={handleGoToDashboard}
      />
    </PageShell>
  )
}
