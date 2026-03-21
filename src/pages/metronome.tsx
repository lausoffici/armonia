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

  // Restart interval when bpm changes while playing
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

  return (
    <div className="flex flex-col items-center p-4 space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Metrónomo</h1>
        <p className="text-sm text-muted-foreground">Mantené el tempo en tu ensayo</p>
      </div>

      {/* BPM Display */}
      <div className="flex flex-col items-center">
        <span className="text-7xl font-mono font-bold tabular-nums">{bpm}</span>
        <span className="text-sm text-muted-foreground mt-1">BPM</span>
      </div>

      {/* BPM Slider */}
      <input
        type="range"
        min="30"
        max="300"
        value={bpm}
        onChange={(e) => setBpm(Number(e.target.value))}
        className="w-full max-w-xs accent-primary"
      />

      {/* Quick BPM buttons */}
      <div className="flex gap-2">
        {[-10, -1, 1, 10].map((delta) => (
          <button
            key={delta}
            onClick={() => setBpm(Math.max(30, Math.min(300, bpm + delta)))}
            className="w-12 h-10 rounded-lg border border-border text-sm font-mono hover:bg-accent transition-colors"
          >
            {delta > 0 ? `+${delta}` : delta}
          </button>
        ))}
      </div>

      {/* Beat indicator */}
      <div className="flex gap-3">
        {Array.from({ length: beatsPerMeasure }).map((_, i) => (
          <div
            key={i}
            className={`w-8 h-8 rounded-full border-2 transition-all duration-75 ${
              currentBeat === i && isPlaying
                ? i === 0
                  ? 'bg-primary border-primary scale-110'
                  : 'bg-muted-foreground border-muted-foreground scale-110'
                : 'border-border'
            }`}
          />
        ))}
      </div>

      {/* Time signature */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Compás:</span>
        {[2, 3, 4, 6].map((beats) => (
          <button
            key={beats}
            onClick={() => setBeatsPerMeasure(beats)}
            className={`w-10 h-10 rounded-lg text-sm font-mono transition-colors ${
              beatsPerMeasure === beats
                ? 'bg-primary text-primary-foreground'
                : 'border border-border hover:bg-accent'
            }`}
          >
            {beats}/4
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-3 w-full max-w-xs">
        <button
          onClick={isPlaying ? stop : start}
          className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
            isPlaying
              ? 'bg-destructive text-white hover:bg-destructive/90'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {isPlaying ? 'Detener' : 'Iniciar'}
        </button>
        <button
          onClick={handleTap}
          className="flex-1 py-3 rounded-lg font-medium border border-border hover:bg-accent transition-colors"
        >
          Tap tempo
        </button>
      </div>
    </div>
  )
}
