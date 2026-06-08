import { useEffect } from 'react'

const Modal = ({ isOpen, onClose, title, children, accentGradient }) => {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md mx-4 z-10 overflow-hidden">
        {accentGradient && (
          <div className={`h-1.5 bg-gradient-to-r ${accentGradient}`} />
        )}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            {title && <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{title}</h2>}
            <button
              onClick={onClose}
              className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none transition-colors"
            >
              &times;
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal
