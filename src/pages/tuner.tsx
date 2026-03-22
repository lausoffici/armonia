import { useState, useEffect, useRef, useCallback } from 'react'

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

function frequencyToNote(frequency: number) {
  const noteNum = 12 * (Math.log2(frequency / 440))
  const noteIndex = Math.round(noteNum) + 69
  const noteName = NOTE_NAMES[noteIndex % 12]
  const octave = Math.floor(noteIndex / 12) - 1
  const cents = Math.round((noteNum - Math.round(noteNum)) * 100)
  return { noteName, octave, cents }
}

function autoCorrelate(buf: Float32Array, sampleRate: number) {
  let size = buf.length
  let rms = 0
  for (let i = 0; i < size; i++) rms += buf[i] * buf[i]
  rms = Math.sqrt(rms / size)
  if (rms < 0.01) return -1

  let r1 = 0, r2 = size - 1
  const threshold = 0.2
  for (let i = 0; i < size / 2; i++) {
    if (Math.abs(buf[i]) < threshold) { r1 = i; break }
  }
  for (let i = 1; i < size / 2; i++) {
    if (Math.abs(buf[size - i]) < threshold) { r2 = size - i; break }
  }

  buf = buf.slice(r1, r2)
  size = buf.length

  const c = new Array(size).fill(0)
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size - i; j++) {
      c[i] += buf[j] * buf[j + i]
    }
  }

  let d = 0
  while (c[d] > c[d + 1]) d++

  let maxval = -1, maxpos = -1
  for (let i = d; i < size; i++) {
    if (c[i] > maxval) { maxval = c[i]; maxpos = i }
  }

  let t0 = maxpos
  const x1 = c[t0 - 1], x2 = c[t0], x3 = c[t0 + 1]
  const a = (x1 + x3 - 2 * x2) / 2
  const b = (x3 - x1) / 2
  if (a) t0 = t0 - b / (2 * a)

  return sampleRate / t0
}

// Smoothing constants
const SMOOTHING_FACTOR = 0.15
const NOTE_STABILITY_FRAMES = 6

export function TunerPage() {
  const [isListening, setIsListening] = useState(false)
  const [detectedNote, setDetectedNote] = useState<string | null>(null)
  const [cents, setCents] = useState(0)
  const [detectedFreq, setDetectedFreq] = useState<number | null>(null)

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number>(0)
  const streamRef = useRef<MediaStream | null>(null)

  // Smoothing refs
  const smoothedFreqRef = useRef<number>(0)
  const lastNoteRef = useRef<string | null>(null)
  const noteStreakRef = useRef<number>(0)
  const smoothedCentsRef = useRef<number>(0)

  const detect = useCallback(() => {
    if (!analyserRef.current) return
    const buf = new Float32Array(analyserRef.current.fftSize)
    analyserRef.current.getFloatTimeDomainData(buf)
    const freq = autoCorrelate(buf, audioContextRef.current!.sampleRate)

    if (freq > 0) {
      if (smoothedFreqRef.current === 0) {
        smoothedFreqRef.current = freq
      } else {
        smoothedFreqRef.current += SMOOTHING_FACTOR * (freq - smoothedFreqRef.current)
      }

      const note = frequencyToNote(smoothedFreqRef.current)
      const noteStr = `${note.noteName}${note.octave}`

      if (noteStr === lastNoteRef.current) {
        noteStreakRef.current++
      } else {
        noteStreakRef.current = 1
        lastNoteRef.current = noteStr
      }

      if (noteStreakRef.current >= NOTE_STABILITY_FRAMES) {
        setDetectedNote(noteStr)
        setDetectedFreq(Math.round(smoothedFreqRef.current * 10) / 10)
      }

      smoothedCentsRef.current += 0.25 * (note.cents - smoothedCentsRef.current)
      setCents(Math.round(smoothedCentsRef.current))
    }

    rafRef.current = requestAnimationFrame(detect)
  }, [])

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const ctx = new AudioContext()
      audioContextRef.current = ctx
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 2048
      analyserRef.current = analyser
      const source = ctx.createMediaStreamSource(stream)
      source.connect(analyser)
      setIsListening(true)
      rafRef.current = requestAnimationFrame(detect)
    } catch {
      alert('Se necesita acceso al micrófono para el afinador')
    }
  }, [detect])

  const stopListening = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    audioContextRef.current?.close()
    setIsListening(false)
    setDetectedNote(null)
    setCents(0)
    setDetectedFreq(null)
    smoothedFreqRef.current = 0
    lastNoteRef.current = null
    noteStreakRef.current = 0
    smoothedCentsRef.current = 0
  }, [])

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      audioContextRef.current?.close()
    }
  }, [])

  const centsAbs = Math.abs(cents)
  const inTune = centsAbs <= 5

  const ringRotation = detectedNote ? (cents / 50) * 180 : 0

  return (
    <div className="flex flex-col items-center px-4 py-6 space-y-6">
      {/* Header */}
      <div className="space-y-1 text-center animate-fade-in-up">
        <h1 className="text-3xl font-heading italic tracking-tight">Afinador</h1>
        <p className="text-sm text-muted-foreground">Afinador cromático universal</p>
      </div>

      {/* Note display - the hero element */}
      <div className="relative animate-fade-in-up" style={{ animationDelay: '80ms' }}>
        {/* Outer glow ring */}
        <div
          className="absolute inset-0 rounded-full transition-all duration-300"
          style={{
            background: detectedNote
              ? inTune
                ? 'conic-gradient(from 0deg, oklch(0.72 0.19 142), oklch(0.72 0.19 142 / 30%), oklch(0.72 0.19 142))'
                : `conic-gradient(from ${ringRotation}deg, var(--primary), oklch(0.79 0.16 75 / 20%), var(--primary))`
              : 'conic-gradient(from 0deg, oklch(1 0 0 / 6%), oklch(1 0 0 / 2%), oklch(1 0 0 / 6%))',
            padding: '3px',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />
        <div
          className={`flex flex-col items-center justify-center w-52 h-52 rounded-full border-[3px] transition-all duration-300 ${
            detectedNote
              ? inTune
                ? 'border-green-500/60 shadow-[0_0_40px_oklch(0.72_0.19_142/20%)]'
                : 'border-primary/40 shadow-[0_0_40px_var(--amber-glow)]'
              : 'border-border bg-card/30'
          }`}
        >
          {detectedNote ? (
            <>
              <span className={`text-6xl font-heading italic transition-colors duration-200 ${inTune ? 'text-green-400' : 'text-foreground'}`}>
                {detectedNote.replace(/\d/, '')}
              </span>
              <span className="text-sm text-muted-foreground mt-1 font-mono">
                {detectedNote.match(/\d/)?.[0] && `Oct ${detectedNote.match(/\d/)?.[0]}`}
              </span>
              <span className="text-[10px] text-muted-foreground/50 mt-0.5 font-mono">
                {detectedFreq} Hz
              </span>
            </>
          ) : (
            <span className="text-muted-foreground/60 text-sm text-center px-6">
              {isListening ? 'Tocá una nota...' : 'Presioná iniciar'}
            </span>
          )}
        </div>
      </div>

      {/* Cents indicator */}
      <div className="w-72 space-y-2 animate-fade-in-up" style={{ animationDelay: '140ms' }}>
        <div className="flex justify-between text-[10px] text-muted-foreground/50 font-mono">
          <span>-50</span>
          <span className={`transition-colors ${detectedNote && inTune ? 'text-green-400' : ''}`}>0</span>
          <span>+50</span>
        </div>
        <div className="h-1.5 bg-muted/40 rounded-full relative overflow-hidden">
          {/* Center mark */}
          <div className="absolute left-1/2 top-0 w-px h-full bg-muted-foreground/30 -translate-x-1/2" />
          {/* Indicator */}
          <div
            className={`absolute top-0 h-full w-3 rounded-full transition-all duration-100 ${
              inTune ? 'bg-green-400 shadow-[0_0_10px_oklch(0.72_0.19_142/50%)]' : 'bg-primary shadow-[0_0_10px_var(--amber-glow)]'
            }`}
            style={{ left: `${50 + cents}%`, transform: 'translateX(-50%)' }}
          />
        </div>
        <p className="text-center text-xs text-muted-foreground font-mono">
          {detectedNote
            ? inTune
              ? '● Afinado'
              : `${cents > 0 ? '+' : ''}${cents} cents`
            : '\u00A0'}
        </p>
      </div>

      {/* Start/Stop button */}
      <button
        onClick={isListening ? stopListening : startListening}
        className={`w-full max-w-xs py-3.5 rounded-xl font-medium transition-all duration-300 active:scale-[0.97] ${
          isListening
            ? 'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25'
            : 'bg-primary text-primary-foreground hover:shadow-[0_0_24px_var(--amber-glow)]'
        }`}
        style={{ animationDelay: '200ms' }}
      >
        {isListening ? 'Detener' : 'Iniciar afinador'}
      </button>
    </div>
  )
}
