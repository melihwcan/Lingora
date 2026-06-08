import { useState, useMemo } from 'react'

export default function QuizCard({ word, correctMeaning, allWords = [], onAnswer }) {
  const [chosen, setChosen] = useState(null)

  const options = useMemo(() => {
    const distractors = allWords
      .filter((w) => w.meaning !== correctMeaning)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((w) => w.meaning)
    return [...distractors, correctMeaning].sort(() => Math.random() - 0.5)
  }, [word, correctMeaning, allWords])

  const handleChoice = (opt) => {
    if (chosen !== null) return
    setChosen(opt)
    const isCorrect = opt === correctMeaning
    setTimeout(() => onAnswer?.(isCorrect), 600)
  }

  const stateClass = (opt) => {
    if (chosen === null) return 'border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-gray-600 text-slate-800 dark:text-gray-200'
    if (opt === correctMeaning) return 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-400'
    if (opt === chosen) return 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
    return 'border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700/30 opacity-50 text-slate-600 dark:text-gray-400'
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-lg font-semibold text-slate-800 dark:text-white">
        &ldquo;{word}&rdquo; kelimesinin anlamı nedir?
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => handleChoice(opt)}
            className={`border-2 rounded-xl px-4 py-3 text-sm font-medium text-left transition-all duration-150 ${stateClass(opt)}`}
          >
            {opt}
          </button>
        ))}
      </div>
      {chosen !== null && (
        <p className={`text-sm font-semibold ${chosen === correctMeaning ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
          {chosen === correctMeaning ? '✅ Doğru!' : `❌ Yanlış. Doğru cevap: ${correctMeaning}`}
        </p>
      )}
    </div>
  )
}
