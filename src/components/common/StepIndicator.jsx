/**
 * Props:
 *   total   - number: total questions
 *   current - number: 0-based index of the question being answered now
 *   history - array of 'correct' | 'wrong' | null  (length === answered so far)
 */
export default function StepIndicator({ total, current, history = [] }) {
  const correctCount = history.filter((h) => h === 'correct').length
  const wrongCount = history.filter((h) => h === 'wrong').length

  return (
    <div className="mb-6">
      {/* Segmented bar */}
      <div className="flex gap-1.5 mb-2">
        {Array.from({ length: total }).map((_, i) => {
          const result = history[i]
          const isCurrent = i === current && !result
          return (
            <div
              key={i}
              className={`flex-1 h-2 rounded-full transition-colors duration-300 ${
                result === 'correct'
                  ? 'bg-green-500 dark:bg-green-400'
                  : result === 'wrong'
                  ? 'bg-red-500 dark:bg-red-400'
                  : isCurrent
                  ? 'bg-indigo-400 dark:bg-indigo-500'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          )
        })}
      </div>

      {/* Text feedback row */}
      <div className="flex justify-between items-center text-xs">
        <span className="text-gray-400 dark:text-gray-500 font-medium">
          {Math.min(current + 1, total)} / {total}
        </span>
        <div className="flex gap-3">
          <span
            className={`font-semibold ${
              correctCount > 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-gray-400 dark:text-gray-600'
            }`}
          >
            {correctCount} Doğru
          </span>
          <span
            className={`font-semibold ${
              wrongCount > 0
                ? 'text-red-500 dark:text-red-400'
                : 'text-gray-400 dark:text-gray-600'
            }`}
          >
            {wrongCount} Yanlış
          </span>
        </div>
      </div>
    </div>
  )
}
