export default function EmptyState({ message = 'İçerikler yakında eklenecek!', icon = '📚', accent = 'indigo' }) {
  const accentClasses = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-400 dark:text-indigo-500',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-400 dark:text-blue-500',
    violet: 'bg-violet-50 dark:bg-violet-900/20 text-violet-400 dark:text-violet-500',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-400 dark:text-emerald-500',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-400 dark:text-orange-500',
  }

  const circleClass = accentClasses[accent] ?? accentClasses.indigo

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4 ${circleClass}`}>
        {icon}
      </div>
      <p className="text-slate-500 dark:text-slate-400 text-base font-medium max-w-sm">{message}</p>
    </div>
  )
}
