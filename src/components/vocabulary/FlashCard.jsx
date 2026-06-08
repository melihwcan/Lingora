import { useState } from 'react'

export default function FlashCard({ word, meaning, exampleSentence, exampleTranslation }) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div
      className="relative w-full h-52 cursor-pointer"
      style={{ perspective: '1000px' }}
      onClick={() => setFlipped(f => !f)}
    >
      <div
        className="relative w-full h-full"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: 'transform 500ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Front: English word */}
        <div
          className="absolute inset-0 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center p-6"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-3 font-medium">Kelime</p>
          <p className="text-3xl font-bold text-slate-900 text-center mb-3">{word}</p>
          {exampleSentence && (
            <p className="text-sm italic text-slate-500 text-center leading-relaxed mt-1">
              &ldquo;{exampleSentence}&rdquo;
            </p>
          )}
          <p className="text-xs text-slate-400 mt-4">Çeviriyi görmek için tıkla</p>
        </div>
        {/* Back: Turkish meaning */}
        <div
          className="absolute inset-0 bg-indigo-600 rounded-2xl shadow-sm flex flex-col items-center justify-center p-6"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <p className="text-xs text-indigo-200 uppercase tracking-wide mb-3 font-medium">Anlam</p>
          <p className="text-2xl font-bold text-white text-center mb-3">{meaning}</p>
          {exampleTranslation && (
            <p className="text-sm italic text-indigo-200 text-center leading-relaxed mt-1">
              &ldquo;{exampleTranslation}&rdquo;
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
