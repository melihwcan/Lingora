import { BRAND_CTA } from '../../utils/brandColors'

const Button = ({ children, onClick, variant = 'primary', disabled = false, className = '' }) => {
  const base = 'inline-flex items-center justify-center px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: `${BRAND_CTA} text-white focus:ring-indigo-500`,
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-400',
    danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-300',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant] ?? variants.primary} ${className}`}
    >
      {children}
    </button>
  )
}

export default Button
