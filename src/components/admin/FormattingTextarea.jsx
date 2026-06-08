import { useRef, useLayoutEffect, useCallback } from 'react'
import { Bold, Italic, Underline } from 'lucide-react'
import { richTextToHtml, htmlToRichText, autoFormatContentEditable } from '../../utils/richText'

const defaultEditorCls =
  'w-full border-0 bg-white dark:bg-neutral-900 text-slate-700 dark:text-slate-300 rounded-none px-4 py-2.5 text-base leading-[1.75] focus:outline-none [&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_i]:italic [&_u]:underline empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:dark:text-neutral-500 empty:before:italic empty:before:text-sm'

const editorScrollCls =
  'max-h-[240px] md:max-h-[320px] overflow-y-auto overflow-x-hidden border-b border-slate-200 dark:border-neutral-800'

const toolbarBtnCls =
  'inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-700 hover:text-slate-900 dark:hover:text-slate-100 transition-colors disabled:opacity-40'

const FORMATS = [
  { command: 'bold', Icon: Bold, label: 'Kalın' },
  { command: 'italic', Icon: Italic, label: 'İtalik' },
  { command: 'underline', Icon: Underline, label: 'Altı Çizili' },
]

export default function FormattingTextarea({ value, onChange, rows = 4, className = '' }) {
  const editorRef = useRef(null)
  // undefined so the first layout pass always hydrates the empty contentEditable
  const lastSyncedRef = useRef(undefined)

  useLayoutEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    const externalValue = value ?? ''
    if (externalValue === lastSyncedRef.current) return

    editor.innerHTML = richTextToHtml(externalValue)
    lastSyncedRef.current = externalValue
  }, [value])

  const emitChange = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return

    const serialized = htmlToRichText(editor)
    lastSyncedRef.current = serialized
    onChange(serialized)
  }, [onChange])

  const handleEditorInput = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return

    autoFormatContentEditable(editor)
    emitChange()
  }, [emitChange])

  const applyFormat = (command) => {
    const editor = editorRef.current
    if (!editor) return

    editor.focus()
    document.execCommand(command, false, null)
    emitChange()
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const editor = editorRef.current
    if (!editor) return

    const text = e.clipboardData.getData('text/plain')
    editor.focus()
    document.execCommand('insertText', false, text)
    autoFormatContentEditable(editor)
    emitChange()
  }

  const editorCls = className
    ? `${className} rounded-none border-0 text-base leading-[1.75] focus:ring-0 [&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_i]:italic [&_u]:underline empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:dark:text-neutral-500 empty:before:italic empty:before:text-sm`
    : defaultEditorCls

  return (
    <div className="rounded-xl border border-slate-200 dark:border-neutral-800 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
      <div
        className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/60 shrink-0"
        role="toolbar"
        aria-label="Metin biçimlendirme"
      >
        {FORMATS.map(({ command, Icon, label }) => (
          <button
            key={label}
            type="button"
            className={toolbarBtnCls}
            title={label}
            aria-label={label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyFormat(command)}
          >
            <Icon className="w-4 h-4" strokeWidth={2.5} />
          </button>
        ))}
      </div>
      <div className={editorScrollCls}>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          className={editorCls}
          style={{ minHeight: `${rows * 1.75}rem` }}
          data-placeholder="Metin girin…"
          onInput={handleEditorInput}
          onPaste={handlePaste}
        />
      </div>
      <p className="px-3 py-1.5 text-[11px] text-slate-400 dark:text-neutral-500 border-t border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-800/30">
        **kalın**, *italik*, ++altı çizili++ yazın veya metni seçip düğmeleri kullanın
      </p>
    </div>
  )
}
