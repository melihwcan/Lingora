import { useEffect } from 'react'

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [message, onClose])

  if (!message) return null

  const colors =
    type === 'success'
      ? 'bg-green-600 text-white'
      : 'bg-red-600 text-white'

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${colors}`}>
      <span>{type === 'success' ? '✓' : '✕'}</span>
      <span>{message}</span>
      <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100 text-lg leading-none">&times;</button>
    </div>
  )
}
