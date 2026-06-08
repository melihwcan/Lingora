import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'

const inputCls =
  'w-full border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-neutral-500 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none'
const labelCls = 'block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1'

export function emptyListeningQuestion() {
  return { statement: '', correct_answer: true }
}

export default function ListeningQuestionsEditor({ questions, onChange }) {
  const updateQuestion = (index, patch) => {
    const next = questions.map((q, i) => (i === index ? { ...q, ...patch } : q))
    onChange(next)
  }

  const moveQuestion = (index, direction) => {
    const target = index + direction
    if (target < 0 || target >= questions.length) return
    const next = [...questions]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  const removeQuestion = (index) => {
    onChange(questions.filter((_, i) => i !== index))
  }

  const addQuestion = () => {
    onChange([...questions, emptyListeningQuestion()])
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className={labelCls}>Doğru/Yanlış Soruları</label>
        <button
          type="button"
          onClick={addQuestion}
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          <Plus className="w-3.5 h-3.5" />
          Soru Ekle
        </button>
      </div>

      {questions.length === 0 && (
        <p className="text-xs text-slate-400 dark:text-neutral-500 italic">
          Dinleme modülü için anlama quizi eklenmemiş. XP kazanmak için en az bir soru önerilir.
        </p>
      )}

      {questions.map((q, index) => (
        <div
          key={index}
          className="rounded-xl border border-slate-200 dark:border-neutral-700 p-3 space-y-2 bg-slate-50/50 dark:bg-neutral-800/40"
        >
          <div className="flex items-start gap-2">
            <span className="text-xs font-bold text-violet-600 dark:text-violet-400 mt-2.5 shrink-0">
              {index + 1}.
            </span>
            <textarea
              rows={2}
              className={`${inputCls} flex-1 resize-none`}
              value={q.statement}
              onChange={(e) => updateQuestion(index, { statement: e.target.value })}
              placeholder="Örn: Tom has a dog."
            />
            <div className="flex flex-col gap-1 shrink-0">
              <button
                type="button"
                onClick={() => moveQuestion(index, -1)}
                disabled={index === 0}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-30"
                title="Yukarı taşı"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => moveQuestion(index, 1)}
                disabled={index === questions.length - 1}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-30"
                title="Aşağı taşı"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => removeQuestion(index)}
                className="p-1 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                title="Sil"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex gap-2 pl-5">
            {[
              { value: true, label: 'Doğru' },
              { value: false, label: 'Yanlış' },
            ].map(({ value, label }) => (
              <button
                key={label}
                type="button"
                onClick={() => updateQuestion(index, { correct_answer: value })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  q.correct_answer === value
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
