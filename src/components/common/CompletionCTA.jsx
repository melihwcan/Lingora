const VARIANTS = {
  reading: {
    border: 'border-slate-200/60 dark:border-neutral-800',
    bg: 'bg-white/80 dark:bg-neutral-900/70',
    shadow: 'shadow-lg shadow-slate-900/5 dark:shadow-black/30',
    button: 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600',
    title: 'Makaleyi tamamladınız mı?',
    description: 'Makaleyi okuyup bitirdiyseniz, tamamladığınızı işaretleyin ve XP kazanın.',
  },
  listening: {
    border: 'border-slate-200/60 dark:border-neutral-800',
    bg: 'bg-white/80 dark:bg-neutral-900/70',
    shadow: 'shadow-lg shadow-slate-900/5 dark:shadow-black/30',
    button: 'bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600',
    title: 'Dinlemeyi tamamladınız mı?',
    description: 'Dinlemeyi tamamladıysanız, tamamladığınızı işaretleyin ve XP kazanın.',
  },
}

export default function CompletionCTA({
  variant = 'reading',
  onComplete,
  completing = false,
  title,
  description,
  className = '',
}) {
  const theme = VARIANTS[variant] ?? VARIANTS.reading

  return (
    <div
      className={`rounded-2xl border backdrop-blur-sm ${theme.border} ${theme.bg} ${theme.shadow} p-5 md:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${className}`}
    >
      <div>
        <h2 className="font-semibold text-slate-900 dark:text-white">
          {title ?? theme.title}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {description ?? theme.description}
        </p>
      </div>
      <button
        onClick={onComplete}
        disabled={completing}
        className={`${theme.button} text-white font-semibold py-3 px-6 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 shadow-md`}
      >
        {completing ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            İşleniyor...
          </>
        ) : (
          'Dersi Tamamla'
        )}
      </button>
    </div>
  )
}
