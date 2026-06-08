import { BRAND_FOOTER_LINE, BRAND_GRADIENT_TEXT, DARK_BORDER } from '../../utils/brandColors'

const Footer = () => {
  return (
    <footer className={`bg-white dark:bg-black border-t border-gray-200 py-6 mt-auto relative ${DARK_BORDER}`}>
      <div className={`absolute top-0 left-0 right-0 h-px ${BRAND_FOOTER_LINE}`} />
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <p>&copy; {new Date().getFullYear()} Lingora. Tüm hakları saklıdır.</p>
        <p className="mt-2 md:mt-0">
          <span className={`${BRAND_GRADIENT_TEXT} font-medium`}>
            Zei ve Toxyn
          </span>
          {' '}tarafından geliştirildi
        </p>
      </div>
    </footer>
  )
}

export default Footer
