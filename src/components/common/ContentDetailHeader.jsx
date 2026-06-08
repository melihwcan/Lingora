const VARIANTS = {
  reading: {
    label: 'Okuma',
    blurBlob: 'bg-blue-500/8',
    pill: 'bg-blue-100/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    divider: 'from-blue-500/50 via-slate-200 dark:via-neutral-700',
  },
  listening: {
    label: 'Dinleme',
    blurBlob: 'bg-violet-500/8',
    pill: 'bg-violet-100/80 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
    divider: 'from-violet-500/50 via-slate-200 dark:via-neutral-700',
  },
  vocabulary: {
    label: 'Kelime',
    blurBlob: 'bg-emerald-500/8',
    pill: 'bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    divider: 'from-emerald-500/50 via-slate-200 dark:via-neutral-700',
  },
}

export default function ContentDetailHeader({
  variant = 'reading',
  title,
  description,
  badges,
  Icon,
  className = '',
}) {
  const theme = VARIANTS[variant] ?? VARIANTS.reading

  return (
    <div className={`mb-8 relative ${className}`}>
      <div
        className={`absolute -top-6 -right-8 w-40 h-40 ${theme.blurBlob} rounded-full blur-3xl pointer-events-none`}
      />

      <div className="flex flex-wrap items-center gap-2 mb-4 relative">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${theme.pill}`}
        >
          {Icon && <Icon className="w-3.5 h-3.5" />}
          {theme.label}
        </span>
        {badges}
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight relative">
        {title}
      </h1>

      {description && (
        <p className="mt-3 text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
          {description}
        </p>
      )}

      <div className={`mt-6 h-px bg-gradient-to-r ${theme.divider} to-transparent`} />
    </div>
  )
}
