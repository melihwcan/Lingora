import { CATEGORY_COLOR_PRESETS, CURATED_CATEGORY_ICONS, getLucideIcon } from '../../utils/categoryTheme'

export default function CategoryIconPicker({ value, onChange, themeValue, onThemeChange, mode = 'new' }) {
  const isEdit = mode === 'edit'
  return (
    <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 p-4 space-y-4">
      <div>
        <p className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 mb-1">
          {isEdit ? 'İkon seçin' : 'Yeni kategori: ikon seçin'} <span className="text-red-500">*</span>
        </p>
        {!isEdit && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Bu kategori listede yok. Kaydetmeden önce bir ikon seçmelisiniz.
          </p>
        )}
        {isEdit && <div className="mb-3" />}
        <div className="grid grid-cols-6 gap-2">
          {CURATED_CATEGORY_ICONS.map(({ name, label }) => {
            const Icon = getLucideIcon(name)
            const selected = value === name
            return (
              <button
                key={name}
                type="button"
                title={label}
                onClick={() => onChange(name)}
                className={`flex flex-col items-center gap-1 rounded-lg border p-2 transition-colors ${
                  selected
                    ? 'border-indigo-600 bg-indigo-100 dark:bg-indigo-900/50 ring-2 ring-indigo-500'
                    : 'border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-indigo-300 dark:hover:border-indigo-700'
                }`}
              >
                <Icon className={`w-5 h-5 ${selected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`} strokeWidth={2} />
                <span className="text-[10px] leading-tight text-center text-slate-500 dark:text-slate-400 truncate w-full">
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 mb-1">
          Renk teması seçin <span className="text-red-500">*</span>
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Kategori kartının arka plan ve ikon rengini belirler.
        </p>
        <div className="grid grid-cols-10 gap-1.5 max-h-36 overflow-y-auto p-1 justify-items-center">
          {CATEGORY_COLOR_PRESETS.filter((p) => p.id !== 'slate').map(({ id, label, swatchClass }) => {
            const selected = themeValue === id
            return (
              <button
                key={id}
                type="button"
                title={label}
                onClick={() => onThemeChange(id)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400"
                aria-label={label}
                aria-pressed={selected}
              >
                <span
                  className={`block h-7 w-7 shrink-0 overflow-hidden rounded-full ${swatchClass} transition-opacity ${
                    selected
                      ? 'ring-2 ring-indigo-600 dark:ring-indigo-400 ring-offset-1 ring-offset-indigo-50 dark:ring-offset-indigo-950/80'
                      : 'opacity-90 hover:opacity-100'
                  }`}
                />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
