import { useState } from 'react'
import RichTextDisplay from '../common/RichTextDisplay'
import { splitTranscriptLine } from '../../utils/richText'

function TranscriptLine({ line }) {
  const [hovered, setHovered] = useState(false)
  const { english: englishText, turkish: turkishText, hasTranslation } = splitTranscriptLine(line)

  if (!hasTranslation) {
    return (
      <p className="text-slate-700 dark:text-gray-300 leading-relaxed py-1">
        <RichTextDisplay text={line} />
      </p>
    )
  }

  return (
    <p
      className={`leading-relaxed py-1.5 px-2 rounded-lg cursor-default transition-all duration-200 ${
        hovered
          ? 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30'
          : 'text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700/50'
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered ? <RichTextDisplay text={turkishText} /> : <RichTextDisplay text={englishText} />}
    </p>
  )
}

export default function TranscriptViewer({ transcript }) {
  if (!transcript) {
    return (
      <div className="text-slate-400 dark:text-gray-500 text-sm italic py-4 text-center">
        Transkript mevcut değil.
      </div>
    )
  }

  const lines = transcript
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)

  return (
    <div className="space-y-0.5">
      {lines.map((line, index) => (
        <TranscriptLine key={index} line={line} />
      ))}
    </div>
  )
}
