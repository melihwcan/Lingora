import { useState, useEffect, useRef } from 'react'

function fisherYates(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildShuffledLists(pairs) {
  const english = fisherYates(pairs.map((p) => ({ id: p.word, text: p.word })))
  const turkish = fisherYates(pairs.map((p) => ({ id: p.word, text: p.meaning })))
  return { english, turkish }
}

const WordMatch = ({ pairs = [], onRestart }) => {
  const [englishItems, setEnglishItems] = useState([])
  const [turkishItems, setTurkishItems] = useState([])
  const [selectedEnglish, setSelectedEnglish] = useState(null)
  const [selectedTurkish, setSelectedTurkish] = useState(null)
  const [matched, setMatched] = useState(new Set())
  const [wrongPair, setWrongPair] = useState(null)
  const [lives, setLives] = useState(3)
  const [fadingOut, setFadingOut] = useState(new Set())
  const [matchedHistory, setMatchedHistory] = useState([])
  const [replayKey, setReplayKey] = useState(0)

  // Track pending timeouts so we can clear them on unmount
  const timeoutsRef = useRef([])
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout)
    }
  }, [])

  // Re-run whenever pairs change OR replay is triggered
  useEffect(() => {
    if (!pairs || pairs.length === 0) return
    const { english, turkish } = buildShuffledLists(pairs)
    setEnglishItems(english)
    setTurkishItems(turkish)
  }, [pairs, replayKey])

  const resetGame = () => {
    if (onRestart) {
      onRestart()
      return
    }
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
    setLives(3)
    setMatched(new Set())
    setFadingOut(new Set())
    setMatchedHistory([])
    setSelectedEnglish(null)
    setSelectedTurkish(null)
    setWrongPair(null)
    setReplayKey((k) => k + 1)
  }

  if (!pairs || pairs.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
        Kelime bulunamadı.
      </div>
    )
  }

  // Game Over screen
  if (lives === 0) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-8 text-center">
        <div className="text-5xl mb-4">😢</div>
        <h2 className="text-2xl font-bold text-red-700 dark:text-red-300 mb-2">
          Oyun Bitti!
        </h2>
        <p className="text-red-600 dark:text-red-400 mb-6">Hakların tükendi.</p>
        <button
          onClick={resetGame}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors"
        >
          Tekrar Dene
        </button>
      </div>
    )
  }

  // Success screen
  if (matched.size === pairs.length) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-8 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-green-700 dark:text-green-300 mb-2">
          Tebrikler!
        </h2>
        <p className="text-green-600 dark:text-green-400 mb-6">
          Tüm kelimeleri eşleştirdin!
        </p>
        <button
          onClick={resetGame}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors"
        >
          Yeniden Oyna
        </button>
      </div>
    )
  }

  const handleEnglishClick = (itemId) => {
    if (matched.has(itemId) || fadingOut.has(itemId) || wrongPair) return
    setSelectedEnglish(itemId)
    setSelectedTurkish(null)
  }

  const handleTurkishClick = (itemId) => {
    if (matched.has(itemId) || fadingOut.has(itemId) || wrongPair) return
    if (!selectedEnglish) return

    const isCorrect = selectedEnglish === itemId

    if (isCorrect) {
      const wordId = itemId
      const englishWord = selectedEnglish
      const turkishText = turkishItems.find((t) => t.id === itemId)?.text ?? itemId

      setMatchedHistory((prev) => [...prev, { word: englishWord, meaning: turkishText }])

      // Start fade-out
      setFadingOut((prev) => {
        const next = new Set(prev)
        next.add(wordId)
        return next
      })
      setSelectedEnglish(null)
      setSelectedTurkish(null)

      const tid = setTimeout(() => {
        setMatched((prev) => {
          const next = new Set(prev)
          next.add(wordId)
          return next
        })
        setFadingOut((prev) => {
          const next = new Set(prev)
          next.delete(wordId)
          return next
        })
      }, 400)
      timeoutsRef.current.push(tid)
    } else {
      setSelectedTurkish(itemId)
      setWrongPair({ english: selectedEnglish, turkish: itemId })

      const tid = setTimeout(() => {
        setSelectedEnglish(null)
        setSelectedTurkish(null)
        setWrongPair(null)
        setLives((prev) => prev - 1)
      }, 600)
      timeoutsRef.current.push(tid)
    }
  }

  const getEnglishClass = (itemId) => {
    const base =
      'rounded-xl border-2 px-4 py-3 text-sm font-medium w-full text-left'
    if (fadingOut.has(itemId)) {
      return `${base} opacity-0 scale-95 transition-all duration-[400ms] pointer-events-none border-green-400 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400`
    }
    if (wrongPair?.english === itemId) {
      return `${base} border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 animate-shake`
    }
    if (selectedEnglish === itemId) {
      return `${base} border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-300 cursor-pointer transition-all duration-200`
    }
    return `${base} bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-indigo-400 dark:hover:border-indigo-500 cursor-pointer transition-all duration-200`
  }

  const getTurkishClass = (itemId) => {
    const base =
      'rounded-xl border-2 px-4 py-3 text-sm font-medium w-full text-left'
    if (fadingOut.has(itemId)) {
      return `${base} opacity-0 scale-95 transition-all duration-[400ms] pointer-events-none border-green-400 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400`
    }
    if (wrongPair?.turkish === itemId) {
      return `${base} border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 animate-shake`
    }
    if (selectedTurkish === itemId) {
      return `${base} border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-300 cursor-pointer transition-all duration-200`
    }
    const isSelectable = !!selectedEnglish
    return `${base} bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 ${
      isSelectable
        ? 'hover:border-indigo-400 dark:hover:border-indigo-500 cursor-pointer'
        : 'cursor-default opacity-70'
    } transition-all duration-200`
  }

  // Matched items are removed from the grid; fadingOut items remain briefly for animation
  const visibleEnglish = englishItems.filter((item) => !matched.has(item.id))
  const visibleTurkish = turkishItems.filter((item) => !matched.has(item.id))

  return (
    <div>
      {/* Lives indicator */}
      <div className="flex gap-2 justify-center mb-4">
        {Array.from({ length: 3 }, (_, i) => (
          <span key={i} className="text-2xl select-none">
            {i < lives ? '❤️' : '🤍'}
          </span>
        ))}
      </div>

      {/* Game grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 text-center">
            🇬🇧 İngilizce
          </p>
          {visibleEnglish.map((item) => (
            <button
              key={item.id}
              onClick={() => handleEnglishClick(item.id)}
              disabled={fadingOut.has(item.id) || !!wrongPair}
              className={getEnglishClass(item.id)}
            >
              {item.text}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 text-center">
            🇹🇷 Türkçe
          </p>
          {turkishItems
            .filter((item) => !matched.has(item.id))
            .map((item) => (
              <button
                key={item.id}
                onClick={() => handleTurkishClick(item.id)}
                disabled={fadingOut.has(item.id) || !!wrongPair || !selectedEnglish}
                className={getTurkishClass(item.id)}
              >
                {item.text}
              </button>
            ))}
        </div>
      </div>

      {/* Matched history table */}
      {matchedHistory.length > 0 && (
        <div className="mt-6 rounded-xl border border-green-200 dark:border-green-800 overflow-hidden">
          <div className="bg-green-50 dark:bg-green-900/30 px-4 py-2 text-sm font-semibold text-green-700 dark:text-green-400">
            ✅ Başarıyla Eşleşenler
          </div>
          {matchedHistory.map((entry, idx) => (
            <div
              key={idx}
              className="flex justify-between px-4 py-2 text-sm border-t border-green-100 dark:border-green-900 bg-white dark:bg-gray-800 animate-fadeIn"
            >
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {entry.word}
              </span>
              <span className="text-gray-500 dark:text-gray-400">→ {entry.meaning}</span>
            </div>
          ))}
        </div>
      )}

      {/* Progress counter */}
      <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-4">
        {matched.size} / {pairs.length} eşleştirildi
      </p>
    </div>
  )
}

export default WordMatch
