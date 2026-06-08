import { useState, useEffect, useRef, useCallback } from 'react'
import RichTextDisplay from '../common/RichTextDisplay'

const TextHighlighter = ({ text = '' }) => {
  const [tooltip, setTooltip] = useState(null)
  // tooltip: { x, y, selected, translation, loading, error }
  const containerRef = useRef(null)
  const tooltipRef = useRef(null)

  const dismiss = useCallback(() => setTooltip(null), [])

  useEffect(() => {
    const onMouseDown = (e) => {
      if (tooltipRef.current?.contains(e.target)) return
      dismiss()
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [dismiss])

  const handleMouseUp = async () => {
    const sel = window.getSelection()
    const selected = sel?.toString().trim()

    if (!selected) {
      dismiss()
      return
    }

    let rect
    try {
      rect = sel.getRangeAt(0).getBoundingClientRect()
    } catch {
      dismiss()
      return
    }

    if (!rect || rect.width === 0) {
      dismiss()
      return
    }

    const x = rect.left + rect.width / 2
    const y = rect.top

    setTooltip({ x, y, selected, translation: null, loading: true, error: null })

    try {
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(selected)}&langpair=en|tr`
      )
      const json = await res.json()
      const raw = json?.responseData?.translatedText ?? ''
      const isError =
        !raw ||
        raw.toLowerCase().includes('mymemory warning') ||
        raw.toLowerCase() === selected.toLowerCase()

      setTooltip((prev) =>
        prev?.selected === selected
          ? { ...prev, loading: false, translation: isError ? null : raw, error: isError ? 'Çeviri bulunamadı.' : null }
          : prev
      )
    } catch {
      setTooltip((prev) =>
        prev?.selected === selected
          ? { ...prev, loading: false, translation: null, error: 'Bağlantı hatası.' }
          : prev
      )
    }
  }

  return (
    <>
      <div
        ref={containerRef}
        onMouseUp={handleMouseUp}
        className="text-base md:text-lg leading-[1.75] text-slate-700 dark:text-slate-300 whitespace-pre-wrap select-text cursor-text selection:bg-blue-200 dark:selection:bg-blue-900/50"
      >
        <RichTextDisplay text={text} />
      </div>

      {tooltip && (
        <div
          ref={tooltipRef}
          style={{
            position: 'fixed',
            top: tooltip.y - 12,
            left: tooltip.x,
            transform: 'translate(-50%, -100%)',
            zIndex: 9999,
            maxWidth: '300px',
            minWidth: '160px',
          }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm"
        >
          {tooltip.loading ? (
            <div className="flex items-center justify-center gap-2 py-0.5">
              <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin shrink-0" />
              <span className="text-gray-500 dark:text-gray-400 text-xs">Çevriliyor…</span>
            </div>
          ) : tooltip.error ? (
            <p className="text-red-500 dark:text-red-400 text-xs text-center py-0.5">{tooltip.error}</p>
          ) : (
            <div className="space-y-1">
              <p className="font-semibold text-gray-900 dark:text-gray-100 leading-snug break-words">
                {tooltip.translation}
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs break-words italic">
                &ldquo;{tooltip.selected}&rdquo;
              </p>
            </div>
          )}

          {/* Close button */}
          <button
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); dismiss() }}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300 flex items-center justify-center text-xs font-bold hover:bg-gray-300 dark:hover:bg-gray-500 leading-none"
            aria-label="Kapat"
          >
            ×
          </button>

          {/* Downward caret – dark-mode aware rotated square */}
          <span className="absolute left-1/2 -bottom-[5px] -translate-x-1/2 block w-2.5 h-2.5 bg-white dark:bg-gray-800 border-r border-b border-gray-200 dark:border-gray-700 rotate-45" />
        </div>
      )}
    </>
  )
}

export default TextHighlighter
