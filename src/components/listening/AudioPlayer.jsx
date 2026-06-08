import { useRef, useState } from 'react'
import { Play, Pause } from 'lucide-react'

function formatTime(secs) {
  if (!secs || isNaN(secs)) return '0:00'
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const THEMES = {
  default: {
    container: 'bg-gray-50 dark:bg-neutral-800/50 border border-slate-200 dark:border-neutral-700 rounded-xl p-4 flex flex-col gap-3',
    play: 'w-10 h-10 bg-green-500 hover:bg-green-600',
    progress: 'bg-green-500',
    track: 'bg-slate-200 dark:bg-neutral-700',
  },
  listening: {
    container: 'flex flex-col gap-3',
    play: 'w-12 h-12 bg-violet-600 hover:bg-violet-700',
    progress: 'bg-violet-500',
    track: 'bg-slate-200 dark:bg-neutral-700',
  },
}

const AudioPlayer = ({ src, title, variant = 'default', className = '' }) => {
  const audioRef = useRef(null)
  const trackRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const theme = THEMES[variant] ?? THEMES.default

  const seekToClientX = (clientX) => {
    const audio = audioRef.current
    const track = trackRef.current
    if (!audio || !track) return
    const dur = audio.duration || duration
    if (!dur || !isFinite(dur)) return
    const rect = track.getBoundingClientRect()
    const pct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    const time = pct * dur
    audio.currentTime = time
    setCurrentTime(time)
    setProgress(pct * 100)
  }

  const handleTrackMouseDown = (e) => {
    e.preventDefault()
    seekToClientX(e.clientX)
    const onMove = (ev) => seekToClientX(ev.clientX)
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const toggle = () => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setPlaying(!playing)
  }

  const handleTimeUpdate = () => {
    if (!audioRef.current) return
    const { currentTime: ct, duration: dur } = audioRef.current
    setCurrentTime(ct)
    setProgress(dur ? (ct / dur) * 100 : 0)
  }

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return
    setDuration(audioRef.current.duration)
  }

  const handleEnded = () => setPlaying(false)

  return (
    <div className={`${theme.container} ${className}`}>
      {title && <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</p>}
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        className="hidden"
      />
      <div className="flex items-center gap-4">
        <button
          onClick={toggle}
          className={`flex items-center justify-center text-white rounded-full transition-colors shrink-0 ${theme.play}`}
          aria-label={playing ? 'Duraklat' : 'Oynat'}
        >
          {playing ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
        </button>
        <div className="flex-1 flex flex-col gap-1.5 min-w-0">
          <div
            className="py-2 -my-2 cursor-pointer"
            onMouseDown={handleTrackMouseDown}
            role="slider"
            aria-valuemin={0}
            aria-valuemax={duration || 0}
            aria-valuenow={currentTime}
            aria-label="Ses konumu"
          >
            <div ref={trackRef} className={`${theme.track} rounded-full h-2`}>
              <div
                className={`${theme.progress} h-full rounded-full transition-all duration-200 pointer-events-none`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AudioPlayer
