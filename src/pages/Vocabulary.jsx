import { useState, useEffect } from 'react'
import {
  Languages,
  ChevronLeft,
  Sprout,
  Gauge,
  Flame,
  Layers,
  Brain,
  PenLine,
  Link2,
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import FlashCard from '../components/vocabulary/FlashCard'
import QuizCard from '../components/vocabulary/QuizCard'
import FillBlankCard from '../components/vocabulary/FillBlankCard'
import WordMatch from '../components/vocabulary/WordMatch'
import EmptyState from '../components/common/EmptyState'
import StepIndicator from '../components/common/StepIndicator'
import { PageShell, HeroBanner } from '../components/common/PageShell'
import { PAGE_THEMES } from '../utils/pageTheme'
import { MODULE_LIST_CARD_BASE } from '../utils/brandColors'
import { getDifficultyLabel } from '../utils/labels'
import { getCategoryTheme, setCategoryMetaCache } from '../utils/categoryTheme'
import {
  mergeWithKnownCategories,
  getCategoryLabel,
  buildCategoryMetaMap,
  normalizeCategory,
} from '../utils/vocabularyCategories'
import { fetchCategoryMeta } from '../utils/categoryMeta'

const vocabularyTheme = PAGE_THEMES.vocabulary

const DIFFICULTY_OPTIONS = [
  {
    value: 'beginner',
    Icon: Sprout,
    iconBg: 'bg-green-100 dark:bg-green-900/40',
    iconColor: 'text-green-600 dark:text-green-400',
    hoverRing: 'hover:ring-green-500/30 hover:border-green-300 dark:hover:border-green-700',
  },
  {
    value: 'intermediate',
    Icon: Gauge,
    iconBg: 'bg-yellow-100 dark:bg-yellow-900/40',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    hoverRing: 'hover:ring-yellow-500/30 hover:border-yellow-300 dark:hover:border-yellow-700',
  },
  {
    value: 'advanced',
    Icon: Flame,
    iconBg: 'bg-red-100 dark:bg-red-900/40',
    iconColor: 'text-red-600 dark:text-red-400',
    hoverRing: 'hover:ring-red-500/30 hover:border-red-300 dark:hover:border-red-700',
  },
]

const MODE_OPTIONS = [
  {
    id: 'flashcard',
    Icon: Layers,
    title: 'Bilgi Kartları',
    description: 'Kartları çevirerek çalış',
  },
  {
    id: 'quiz',
    Icon: Brain,
    title: 'Sınav',
    description: 'Kendini test et',
  },
  {
    id: 'fillblank',
    Icon: PenLine,
    title: 'Boşluk Doldurma',
    description: 'Cümleleri tamamla',
  },
  {
    id: 'matching',
    Icon: Link2,
    title: 'Eşleştirme',
    description: 'Kelimeleri eşleştir',
  },
]

const GAME_WORD_LIMIT = 10

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickRandomWords(words, limit = GAME_WORD_LIMIT) {
  if (!words?.length) return []
  return shuffleArray(words).slice(0, Math.min(limit, words.length))
}

const backPillClass =
  'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-slate-100/80 dark:bg-neutral-800 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200/80 dark:hover:bg-neutral-700 transition-colors mb-6'

const difficultyCardClass =
  'relative rounded-2xl border bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col items-center text-center gap-3 ring-1 ring-transparent'

const modeCardClass = `${MODULE_LIST_CARD_BASE} h-full text-left hover:ring-emerald-500/30 dark:hover:ring-emerald-600/40 hover:border-emerald-300 dark:hover:border-emerald-700 group`

const ResultCard = ({ title, totalCount, correct, wrong, onRestart }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-8 text-center">
    <div className="text-5xl mb-4">🎉</div>
    <h2 className="text-2xl font-bold text-slate-900 dark:text-gray-100 mb-2">{title}</h2>
    <p className="text-slate-500 dark:text-slate-400 mb-6">{totalCount} soru tamamlandı</p>
    <div className="flex justify-center gap-8 mb-6">
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600 dark:text-green-400">{correct}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400">✅ Doğru</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-red-500 dark:text-red-400">{wrong}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400">❌ Yanlış</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
          {Math.round(correct / Math.max(correct + wrong, 1) * 100)}%
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">Doğruluk</div>
      </div>
    </div>
    <button
      onClick={onRestart}
      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-xl"
    >
      Tekrar Başla
    </button>
  </div>
)

export default function Vocabulary() {
  const [step, setStep] = useState('category')
  const [categories, setCategories] = useState([])
  const [categoryMeta, setCategoryMeta] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState(null)
  const [words, setWords] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loadingWords, setLoadingWords] = useState(false)

  const [cardIndex, setCardIndex] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [totalAnswered, setTotalAnswered] = useState(0)
  const [quizComplete, setQuizComplete] = useState(false)
  const [customQuizzes, setCustomQuizzes] = useState([])
  const [answerHistory, setAnswerHistory] = useState([])
  const [matchSessionKey, setMatchSessionKey] = useState(0)

  const categoryMetaMap = buildCategoryMetaMap(categoryMeta)

  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true)
      const [{ data }, meta] = await Promise.all([
        supabase
          .from('vocabulary_games')
          .select('category')
          .not('category', 'is', null),
        fetchCategoryMeta(),
      ])

      setCategoryMeta(meta)
      setCategoryMetaCache(meta)

      const unique = data
        ? [...new Set(data.map((d) => d.category).filter(Boolean))]
        : []
      setCategories(mergeWithKnownCategories(unique, meta))
      setLoadingCategories(false)
    }
    fetchCategories()
  }, [])

  const loadWords = async (mode) => {
    setLoadingWords(true)
    const { data } = await supabase
      .from('vocabulary_games')
      .select('*')
      .ilike('category', normalizeCategory(selectedCategory))
      .eq('difficulty', selectedDifficulty)
    let fetched = data || []
    if (mode === 'flashcard' || mode === 'quiz' || mode === 'matching') {
      fetched = pickRandomWords(fetched)
    }
    setWords(fetched)
    setCardIndex(0)
    setCorrectAnswers(0)
    setTotalAnswered(0)
    setQuizComplete(false)
    setAnswerHistory([])
    setLoadingWords(false)
  }

  const restartQuiz = async () => {
    await loadWords('quiz')
  }

  const restartMatching = async () => {
    await loadWords('matching')
    setMatchSessionKey((k) => k + 1)
  }

  const loadCustomQuizzes = async () => {
    setLoadingWords(true)
    const { data } = await supabase
      .from('custom_quizzes')
      .select('*')
      .ilike('category', normalizeCategory(selectedCategory))
      .eq('difficulty', selectedDifficulty)
    setCustomQuizzes(data || [])
    setCardIndex(0)
    setCorrectAnswers(0)
    setTotalAnswered(0)
    setQuizComplete(false)
    setAnswerHistory([])
    setLoadingWords(false)
  }

  const handleSelectMode = async (mode) => {
    setStep(mode)
    await loadWords(mode)
    if (mode === 'matching') setMatchSessionKey((k) => k + 1)
  }

  const goBack = () => {
    if (step === 'difficulty') { setStep('category'); setSelectedCategory(null) }
    else if (step === 'mode') { setStep('difficulty'); setSelectedDifficulty(null) }
    else if (step === 'flashcard' || step === 'quiz' || step === 'matching') { setStep('mode'); setWords([]) }
    else if (step === 'fillblank') { setStep('mode'); setCustomQuizzes([]) }
  }

  const handleQuizAnswer = (isCorrect) => {
    if (isCorrect) setCorrectAnswers((c) => c + 1)
    setTotalAnswered((t) => t + 1)
    setAnswerHistory((prev) => [...prev, isCorrect ? 'correct' : 'wrong'])
    if (cardIndex + 1 >= words.length) setQuizComplete(true)
    else setCardIndex((i) => i + 1)
  }

  const resetAll = () => {
    setStep('category')
    setSelectedCategory(null)
    setSelectedDifficulty(null)
    setCustomQuizzes([])
    setWords([])
  }

  const categoryTheme = selectedCategory ? getCategoryTheme(selectedCategory, categoryMetaMap) : null
  const CategoryIcon = categoryTheme?.Icon ?? Languages

  const handleModeSelect = async (modeId) => {
    if (modeId === 'fillblank') {
      setStep('fillblank')
      await loadCustomQuizzes()
      return
    }
    await handleSelectMode(modeId)
  }

  return (
    <PageShell>
      {/* Header - game steps only */}
      {step !== 'category' && step !== 'difficulty' && step !== 'mode' && (
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={goBack}
            className={backPillClass}
          >
            <ChevronLeft className="w-4 h-4" />
            Geri
          </button>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100 mb-2">
              Kelime Çalışması
            </h1>
            {selectedCategory && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {getCategoryLabel(selectedCategory, categoryMetaMap)}{selectedDifficulty ? ` · ${getDifficultyLabel(selectedDifficulty)}` : ''}
              </p>
            )}
          </div>
        </div>
      )}

      {/* STEP: Category */}
      {step === 'category' && (
        <div>
          <HeroBanner
            title="Kelime"
            subtitle="Yeni kelimeler öğren ve pratik yap."
            gradient={PAGE_THEMES.vocabulary.gradient}
            Icon={Languages}
          />

          <div className="mt-10">
            <p className="text-slate-600 dark:text-slate-400 mb-6">Çalışmak istediğiniz kategoriyi seçin:</p>
          {loadingCategories ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {categories.map((cat) => {
                const { Icon, accentBgClass, iconTextClass } = getCategoryTheme(cat, categoryMetaMap)
                return (
                  <div
                    key={cat}
                    role="button"
                    tabIndex={0}
                    onClick={() => { setSelectedCategory(cat); setStep('difficulty') }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setSelectedCategory(cat)
                        setStep('difficulty')
                      }
                    }}
                    className="relative group cursor-pointer w-full h-40 active:scale-[0.98] transition-transform"
                  >
                    <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-2xl rotate-3 transition-transform duration-300 group-hover:rotate-6" />
                    <div className="relative h-full bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-2xl p-5 flex flex-col justify-between overflow-hidden transition-transform duration-300 group-hover:-translate-y-2 group-hover:-translate-x-1 shadow-md group-hover:shadow-2xl">
                      <Icon
                        className="absolute -bottom-4 -right-4 w-24 h-24 text-gray-300 dark:text-gray-600 opacity-20 pointer-events-none"
                        strokeWidth={1.5}
                      />
                      <div className={`${accentBgClass} p-2.5 rounded-full w-fit`}>
                        <Icon className={`w-6 h-6 ${iconTextClass}`} strokeWidth={2} />
                      </div>
                      <div className="font-extrabold text-xl text-slate-800 dark:text-white">
                        {getCategoryLabel(cat, categoryMetaMap)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          </div>
        </div>
      )}

      {/* STEP: Difficulty */}
      {step === 'difficulty' && selectedCategory && (
        <div>
          <button type="button" onClick={goBack} className={backPillClass}>
            <ChevronLeft className="w-4 h-4" />
            Geri
          </button>

          <HeroBanner
            compact
            title="Kelime Çalışması"
            subtitle={getCategoryLabel(selectedCategory, categoryMetaMap)}
            gradient={vocabularyTheme.gradient}
            Icon={CategoryIcon}
          />

          <div className="mt-10">
            <p className="text-slate-600 dark:text-slate-400 mb-6 font-medium">
              Zorluk seviyesini seçin:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {DIFFICULTY_OPTIONS.map(({ value, Icon, iconBg, iconColor, hoverRing }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => { setSelectedDifficulty(value); setStep('mode') }}
                  className={`${difficultyCardClass} ${hoverRing}`}
                >
                  <div className={`p-3 rounded-full ${iconBg}`}>
                    <Icon className={`w-6 h-6 ${iconColor}`} strokeWidth={2} />
                  </div>
                  <span className="font-bold text-slate-900 dark:text-gray-100">
                    {getDifficultyLabel(value)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP: Mode selection */}
      {step === 'mode' && selectedCategory && selectedDifficulty && (
        <div>
          <button type="button" onClick={goBack} className={backPillClass}>
            <ChevronLeft className="w-4 h-4" />
            Geri
          </button>

          <HeroBanner
            compact
            title="Kelime Çalışması"
            subtitle={`${getCategoryLabel(selectedCategory, categoryMetaMap)} · ${getDifficultyLabel(selectedDifficulty)}`}
            gradient={vocabularyTheme.gradient}
            Icon={CategoryIcon}
          />

          <div className="mt-10">
            <p className="text-slate-600 dark:text-slate-400 mb-6 font-medium">
              Çalışma modunu seçin:
            </p>
            <div className="grid grid-cols-2 gap-4">
              {MODE_OPTIONS.map(({ id, Icon, title, description }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleModeSelect(id)}
                  className={modeCardClass}
                >
                  <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/40 w-fit mb-4 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/60 transition-colors">
                    <Icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                  </div>
                  <div className="font-bold text-slate-900 dark:text-gray-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                    {title}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP: Flashcard */}
      {step === 'flashcard' && (
        loadingWords ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : words.length === 0 ? (
          <EmptyState message="Bu kategori ve zorluk seviyesinde kelime bulunamadı." icon="🔍" />
        ) : (
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-slate-500 dark:text-slate-400">{cardIndex + 1} / {words.length}</span>
            </div>
            <FlashCard
              key={cardIndex}
              word={words[cardIndex].word}
              meaning={words[cardIndex].meaning}
              exampleSentence={words[cardIndex].example_sentence}
              exampleTranslation={words[cardIndex].example_translation}
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setCardIndex((i) => Math.max(0, i - 1))}
                disabled={cardIndex === 0}
                className="flex-1 border border-slate-200 dark:border-gray-600 rounded-xl py-2.5 text-sm font-medium text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Önceki
              </button>
              <button
                onClick={() => setCardIndex((i) => Math.min(words.length - 1, i + 1))}
                disabled={cardIndex === words.length - 1}
                className="flex-1 border border-slate-200 dark:border-gray-600 rounded-xl py-2.5 text-sm font-medium text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Sonraki →
              </button>
            </div>
          </div>
        )
      )}

      {/* STEP: Fill-in-the-blank */}
      {step === 'fillblank' && (
        loadingWords ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : customQuizzes.length === 0 ? (
          <EmptyState message="Bu kategoriye henüz boşluk doldurma sorusu eklenmedi." icon="✏️" />
        ) : quizComplete ? (
          <ResultCard
            title="Tamamlandı!"
            totalCount={customQuizzes.length}
            correct={correctAnswers}
            wrong={totalAnswered - correctAnswers}
            onRestart={resetAll}
          />
        ) : (
          <div>
            <StepIndicator
              total={customQuizzes.length}
              current={cardIndex}
              history={answerHistory}
            />
            <FillBlankCard
              key={cardIndex}
              question={customQuizzes[cardIndex]}
              onAnswer={(isCorrect) => {
                if (isCorrect) setCorrectAnswers((c) => c + 1)
                setTotalAnswered((t) => t + 1)
                setAnswerHistory((prev) => [...prev, isCorrect ? 'correct' : 'wrong'])
                if (cardIndex + 1 >= customQuizzes.length) setQuizComplete(true)
                else setCardIndex((i) => i + 1)
              }}
            />
          </div>
        )
      )}

      {/* STEP: Matching */}
      {step === 'matching' && (
        loadingWords ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : words.length === 0 ? (
          <EmptyState message="Bu kategori ve zorluk seviyesinde kelime bulunamadı." icon="🔍" />
        ) : (
          <WordMatch
            key={matchSessionKey}
            pairs={words.map((w) => ({ word: w.word, meaning: w.meaning }))}
            onRestart={restartMatching}
          />
        )
      )}

      {/* STEP: Quiz */}
      {step === 'quiz' && (
        loadingWords ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : words.length === 0 ? (
          <EmptyState message="Bu kategori ve zorluk seviyesinde kelime bulunamadı." icon="🔍" />
        ) : quizComplete ? (
          <ResultCard
            title="Sınav Tamamlandı!"
            totalCount={words.length}
            correct={correctAnswers}
            wrong={totalAnswered - correctAnswers}
            onRestart={restartQuiz}
          />
        ) : (
          <div>
            <StepIndicator
              total={words.length}
              current={cardIndex}
              history={answerHistory}
            />
            <QuizCard
              key={cardIndex}
              word={words[cardIndex].word}
              correctMeaning={words[cardIndex].meaning}
              allWords={words}
              onAnswer={handleQuizAnswer}
            />
          </div>
        )
      )}
    </PageShell>
  )
}
