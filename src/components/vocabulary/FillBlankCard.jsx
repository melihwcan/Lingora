import { useState } from 'react'

export default function FillBlankCard({ question, onAnswer }) {
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)

  const options = [
    { key: 'A', text: question.option_a },
    { key: 'B', text: question.option_b },
    { key: 'C', text: question.option_c },
    { key: 'D', text: question.option_d },
  ]

  const handleSelect = (key) => {
    if (answered) return
    setSelected(key)
    setAnswered(true)
    const isCorrect = key === question.correct_option
    setTimeout(() => onAnswer(isCorrect), 600)
  }

  const getOptionClass = (key) => {
    const base = 'w-full text-left px-4 py-3 rounded-xl border-2 font-medium transition-all text-sm'
    if (!answered) return `${base} border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-slate-700 dark:text-gray-200 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-gray-600 cursor-pointer`
    if (key === question.correct_option) return `${base} border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400`
    if (key === selected && key !== question.correct_option) return `${base} border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400`
    return `${base} border-slate-200 dark:border-gray-600 text-slate-400 dark:text-gray-500`
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm p-6">
      <div className="mb-6">
        <p className="text-xs text-slate-400 dark:text-gray-400 uppercase tracking-wide font-medium mb-3">Boşluğu Doldurun</p>
        <p className="text-xl font-semibold text-slate-900 dark:text-white leading-relaxed">
          {question.question_text.split('___').map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <span className={`inline-block px-3 py-0.5 rounded mx-1 font-bold ${
                  answered
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-indigo-100 dark:bg-gray-700 dark:border dark:border-gray-600 text-indigo-400 dark:text-gray-400'
                }`}>
                  {answered ? options.find(o => o.key === question.correct_option)?.text : '___'}
                </span>
              )}
            </span>
          ))}
        </p>
      </div>

      <div className="space-y-2">
        {options.map(({ key, text }) => (
          <button
            key={key}
            onClick={() => handleSelect(key)}
            disabled={answered}
            className={getOptionClass(key)}
          >
            <span
              className="inline-block w-6 h-6 rounded-full bg-slate-100 dark:bg-gray-600 text-slate-600 dark:text-gray-300 text-xs font-bold mr-2 flex-shrink-0"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {key}
            </span>
            {text}
          </button>
        ))}
      </div>
    </div>
  )
}
