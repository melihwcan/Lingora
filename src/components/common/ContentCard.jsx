export default function ContentCard({ children, className = '' }) {
  return (
    <div
      className={`rounded-2xl bg-white/80 dark:bg-neutral-900/70 backdrop-blur-sm border border-slate-200/60 dark:border-neutral-800 shadow-lg shadow-slate-900/5 dark:shadow-black/30 px-8 py-10 md:px-10 md:py-12 ${className}`}
    >
      {children}
    </div>
  )
}
