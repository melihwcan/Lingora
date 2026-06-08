import { DARK_BORDER, DARK_CARD } from '../../utils/brandColors'

const Card = ({ children, className = '', onClick, accent }) => {
  const accentClasses = {
    orange: 'border-l-4 border-l-orange-400 dark:border-l-orange-500',
    rose: 'border-l-4 border-l-rose-400 dark:border-l-rose-500',
    green: 'border-l-4 border-l-green-400 dark:border-l-green-500',
    indigo: 'border-l-4 border-l-indigo-400 dark:border-l-indigo-500',
    sky: 'border-l-4 border-l-sky-400 dark:border-l-sky-500',
  }

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200 ${DARK_CARD} ${DARK_BORDER} ${accent ? accentClasses[accent] ?? '' : ''} ${onClick ? 'cursor-pointer hover:-translate-y-0.5 transition-all duration-200' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

export default Card
