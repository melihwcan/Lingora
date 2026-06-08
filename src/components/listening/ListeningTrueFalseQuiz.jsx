import { Check, X } from 'lucide-react'

export default function ListeningTrueFalseQuiz({
  questions,
  answers,
  onAnswerChange,
  onSubmit,
  submitting = false,
  disabled = false,
  result = null,
  onRetry = null,
  xpForfeitMessage = null,
}) {
  const showFeedback = result !== null
  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id] !== undefined)
  const showPreSubmitWarning = !showFeedback && xpForfeitMessage

  return (
    <div className="rounded-2xl border border-violet-200/40 dark:border-violet-800/40 bg-white/80 dark:bg-neutral-900/70 backdrop-blur-sm shadow-lg shadow-slate-900/5 dark:shadow-black/30 p-6 md:p-8">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
        Anlama Quizi
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Dinlediğiniz içeriğe göre aşağıdaki ifadelerin doğru mu yanlış mı olduğunu seçin.
        İlk denemenizde %70 ve üzeri başarı + transkripti açmamış olmanız XP kazandırır.
      </p>

      <div className="space-y-4">
        {questions.map((q, index) => {
          const selected = answers[q.id]
          const isCorrect = selected === q.correct_answer

          return (
            <div
              key={q.id}
              className={`rounded-xl border p-4 transition-colors ${
                showFeedback
                  ? isCorrect
                    ? 'border-emerald-300/60 dark:border-emerald-700/50 bg-emerald-50/50 dark:bg-emerald-900/20'
                    : 'border-red-300/60 dark:border-red-700/50 bg-red-50/50 dark:bg-red-900/20'
                  : 'border-slate-200/60 dark:border-neutral-800'
              }`}
            >
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-3">
                <span className="text-violet-600 dark:text-violet-400 mr-2">{index + 1}.</span>
                {q.statement}
              </p>
              <div className="flex gap-2">
                {[
                  { value: true, label: 'Doğru', Icon: Check },
                  { value: false, label: 'Yanlış', Icon: X },
                ].map(({ value, label, Icon }) => {
                  const active = selected === value
                  return (
                    <button
                      key={label}
                      type="button"
                      disabled={disabled || submitting || showFeedback}
                      onClick={() => onAnswerChange(q.id, value)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold border transition-all disabled:opacity-50 ${
                        active
                          ? value
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-red-600 border-red-600 text-white'
                          : 'bg-slate-50 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-slate-300 hover:border-violet-300 dark:hover:border-violet-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {!showFeedback && (
        <button
          type="button"
          onClick={onSubmit}
          disabled={!allAnswered || submitting || disabled}
          className="mt-6 w-full bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 text-white font-semibold py-3 px-6 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
        >
          {submitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Değerlendiriliyor...
            </>
          ) : (
            'Quizi Gönder'
          )}
        </button>
      )}

      {showPreSubmitWarning && (
        <div className="mt-6 pt-5 border-t border-slate-200/60 dark:border-neutral-800">
          <p className="text-xs text-amber-600 dark:text-amber-400">
            {xpForfeitMessage}
          </p>
        </div>
      )}

      {showFeedback && (
        <div
          className={`mt-6 pt-5 border-t space-y-2 ${
            result.passed
              ? 'border-emerald-200/60 dark:border-emerald-800/40'
              : 'border-red-200/60 dark:border-red-800/40'
          }`}
        >
          <p className="font-semibold text-slate-900 dark:text-white">
            {result.passed ? 'Tebrikler! Quizi geçtiniz.' : 'Quiz tamamlanamadı.'}
            {' '}
            <span className="text-violet-600 dark:text-violet-400">%{result.accuracy}</span> doğruluk
          </p>

          {result.xpEarned > 0 && (
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              +{result.xpEarned} XP kazandınız!
            </p>
          )}

          {xpForfeitMessage && (
            <p
              className={`text-sm ${
                result.passed
                  ? 'text-amber-700 dark:text-amber-300'
                  : 'text-red-700 dark:text-red-300'
              }`}
            >
              {xpForfeitMessage}
            </p>
          )}

          {!result.passed && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline"
            >
              Tekrar Dene
            </button>
          )}
        </div>
      )}
    </div>
  )
}
