const ProgressBar = ({ value = 0, max = 100, label, color = 'green', className = '' }) => {
  const percent = Math.min(Math.max((value / max) * 100, 0), 100)
  const colors = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-400',
    red: 'bg-red-500',
  }

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>{label}</span>
          <span>{Math.round(percent)}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colors[color] ?? colors.green}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

export default ProgressBar
