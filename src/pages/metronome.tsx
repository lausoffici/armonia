import { useState, useRef, useCallback, useEffect } from 'react'

export function MetronomePage() {
  const [bpm, setBpm] = useState(120)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentBeat, setCurrentBeat] = useState(0)
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4)
  const [tapTimes, setTapTimes] = useState<number[]>([])

  const audioContextRef = useRef<AudioContext | null>(null)
  const intervalRef = useRef<number>(0)
  const beatRef = useRef(0)

  const playClick = useCallback((accent: boolean) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext()
    }
    const ctx = audioContextRef.current
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = accent ? 1000 : 800
    gain.gain.value = accent ? 1 : 0.5
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.1)
  }, [])

  const start = useCallback(() => {
    beatRef.current = 0
    setCurrentBeat(0)
    setIsPlaying(true)

    const tick = () => {
      const beat = beatRef.current % beatsPerMeasure
      setCurrentBeat(beat)
      playClick(beat === 0)
      beatRef.current++
    }

    tick()
    intervalRef.current = window.setInterval(tick, 60000 / bpm)
  }, [bpm, beatsPerMeasure, playClick])

  const stop = useCallback(() => {
    clearInterval(intervalRef.current)
    setIsPlaying(false)
    setCurrentBeat(0)
    beatRef.current = 0
  }, [])

  useEffect(() => {
    if (isPlaying) {
      clearInterval(intervalRef.current)
      intervalRef.current = window.setInterval(() => {
        const beat = beatRef.current % beatsPerMeasure
        setCurrentBeat(beat)
        playClick(beat === 0)
        beatRef.current++
      }, 60000 / bpm)
    }
    return () => clearInterval(intervalRef.current)
  }, [bpm, beatsPerMeasure, isPlaying, playClick])

  const handleTap = () => {
    const now = Date.now()
    const newTaps = [...tapTimes, now].filter((t) => now - t < 3000)
    setTapTimes(newTaps)

    if (newTaps.length >= 2) {
      const intervals = []
      for (let i = 1; i < newTaps.length; i++) {
        intervals.push(newTaps[i] - newTaps[i - 1])
      }
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length
      const detectedBpm = Math.round(60000 / avg)
      if (detectedBpm >= 30 && detectedBpm <= 300) {
        setBpm(detectedBpm)
      }
    }
  }

  // Tempo label
  const tempoLabel = bpm < 60 ? 'Largo' : bpm < 80 ? 'Adagio' : bpm < 100 ? 'Andante' : bpm < 120 ? 'Moderato' : bpm < 140 ? 'Allegro' : bpm < 180 ? 'Vivace' : 'Presto'

  return (
    <div className="flex flex-col items-center px-4 py-6 space-y-6">
      {/* Header */}
      <div className="space-y-1 text-center animate-fade-in-up">
        <h1 className="text-3xl font-heading italic tracking-tight">Metrónomo</h1>
        <p className="text-sm text-muted-foreground">Mantené el tempo en tu ensayo</p>
      </div>

      {/* BPM Display - the hero */}
      <div className="flex flex-col items-center animate-fade-in-up" style={{ animationDelay: '60ms' }}>
        <div className="relative">
          <span
            className={`text-8xl font-mono font-bold tabular-nums transition-all duration-100 ${
              isPlaying ? 'text-primary drop-shadow-[0_0_20px_var(--amber-glow)]' : 'text-foreground'
            }`}
          >
            {bpm}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground/50 uppercase tracking-wider">BPM</span>
          <span className="w-px h-3 bg-border" />
          <span className="text-xs text-primary/70 font-heading italic">{tempoLabel}</span>
        </div>
      </div>

      {/* BPM Slider */}
      <div className="w-full max-w-xs animate-fade-in-up" style={{ animationDelay: '120ms' }}>
        <input
          type="range"
          min="30"
          max="300"
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground/40 font-mono mt-1">
          <span>30</span>
          <span>300</span>
        </div>
      </div>

      {/* Quick BPM buttons */}
      <div className="flex gap-2 animate-fade-in-up" style={{ animationDelay: '140ms' }}>
        {[-10, -1, 1, 10].map((delta) => (
          <button
            key={delta}
            onClick={() => setBpm(Math.max(30, Math.min(300, bpm + delta)))}
            className="w-12 h-10 rounded-xl border border-border bg-card/40 text-sm font-mono text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all active:scale-95"
          >
            {delta > 0 ? `+${delta}` : delta}
          </button>
        ))}
      </div>

      {/* Beat indicator */}
      <div className="flex gap-3 animate-fade-in-up" style={{ animationDelay: '180ms' }}>
        {Array.from({ length: beatsPerMeasure }).map((_, i) => {
          const isActive = currentBeat === i && isPlaying
          const isAccent = i === 0
          return (
            <div
              key={i}
              className={`w-9 h-9 rounded-full border-2 transition-all duration-75 ${
                isActive
                  ? isAccent
                    ? 'bg-primary border-primary scale-125 shadow-[0_0_20px_var(--amber-glow)]'
                    : 'bg-foreground/80 border-foreground/80 scale-110'
                  : 'border-border/60 bg-card/30'
              } ${isActive ? 'animate-beat-pop' : ''}`}
            />
          )
        })}
      </div>

      {/* Time signature */}
      <div className="flex items-center gap-2 animate-fade-in-up" style={{ animationDelay: '220ms' }}>
        <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider mr-1">Compás</span>
        {[2, 3, 4, 6].map((beats) => (
          <button
            key={beats}
            onClick={() => setBeatsPerMeasure(beats)}
            className={`w-11 h-10 rounded-xl text-sm font-mono transition-all duration-200 ${
              beatsPerMeasure === beats
                ? 'bg-primary text-primary-foreground shadow-[0_0_12px_var(--amber-glow)]'
                : 'border border-border bg-card/40 text-muted-foreground hover:text-foreground hover:border-primary/20'
            }`}
          >
            {beats}/4
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-3 w-full max-w-xs animate-fade-in-up" style={{ animationDelay: '260ms' }}>
        <button
          onClick={isPlaying ? stop : start}
          className={`flex-1 py-3.5 rounded-xl font-medium transition-all duration-300 active:scale-[0.97] ${
            isPlaying
              ? 'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25'
              : 'bg-primary text-primary-foreground hover:shadow-[0_0_24px_var(--amber-glow)]'
          }`}
        >
          {isPlaying ? 'Detener' : 'Iniciar'}
        </button>
        <button
          onClick={handleTap}
          className="flex-1 py-3.5 rounded-xl font-medium border border-border bg-card/40 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all active:scale-[0.97]"
        >
          Tap tempo
        </button>
      </div>
    </div>
  )
}
