import { useEffect } from 'react'
import confetti from 'canvas-confetti'
import { Star } from 'lucide-react'
import { BRAND_CTA, BRAND_GRADIENT_STOPS } from '../../utils/brandColors'

const CompletionModal = ({ isOpen, onClose, xpEarned, alreadyCompleted, onGoToDashboard }) => {
  useEffect(() => {
    if (isOpen && !alreadyCompleted) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.55 } })
      setTimeout(() => {
        confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0, y: 0.65 } })
        confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.65 } })
      }, 200)
    }
  }, [isOpen, alreadyCompleted])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full mx-4 text-center shadow-2xl overflow-hidden">
        <div className={`bg-gradient-to-r ${BRAND_GRADIENT_STOPS} px-8 py-10 relative`}>
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          />
          <div className="relative z-10">
            <Star className="w-16 h-16 text-white mx-auto mb-2" strokeWidth={2} />
            <h2 className="text-2xl font-extrabold text-white">Tebrikler!</h2>
          </div>
        </div>
        <div className="p-8">
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">
            {alreadyCompleted
              ? 'Tekrar tamamlandı, XP eklenmedi.'
              : (
                <>
                  <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">+{xpEarned}</span>
                  <span className="block text-sm mt-1 text-gray-500 dark:text-gray-400">XP Kazandın!</span>
                </>
              )}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={onGoToDashboard}
              className={`${BRAND_CTA} text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg`}
            >
              Ana Sayfaya Git
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-6 py-2 transition-colors text-sm"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompletionModal
