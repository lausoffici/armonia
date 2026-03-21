import { useState, useEffect, useRef, useCallback } from 'react'

const TUNINGS = {
  guitar: { name: 'Guitarra', notes: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'] },
  bass: { name: 'Bajo', notes: ['E1', 'A1', 'D2', 'G2'] },
  ukulele: { name: 'Ukelele', notes: ['G4', 'C4', 'E4', 'A4'] },
}

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

type TuningKey = keyof typeof TUNINGS

export function TunerPage() {
  const [instrument, setInstrument] = useState<TuningKey>('guitar')
  const [isListening, setIsListening] = useState(false)
  const [detectedNote, setDetectedNote] = useState<string | null>(null)
  const [cents, setCents] = useState(0)

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number>(0)
  const streamRef = useRef<MediaStream | null>(null)

  const detect = useCallback(() => {
    if (!analyserRef.current) return
    const buf = new Float32Array(analyserRef.current.fftSize)
    analyserRef.current.getFloatTimeDomainData(buf)
    const freq = autoCorrelate(buf, audioContextRef.current!.sampleRate)

    if (freq > 0) {
      const note = frequencyToNote(freq)
      setDetectedNote(`${note.noteName}${note.octave}`)
      setCents(note.cents)
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
  }, [])

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      audioContextRef.current?.close()
    }
  }, [])

  const tuning = TUNINGS[instrument]
  const centsAbs = Math.abs(cents)
  const inTune = centsAbs <= 5

  return (
    <div className="flex flex-col items-center p-4 space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Afinador</h1>
        <p className="text-sm text-muted-foreground">Afiná tu instrumento con el micrófono</p>
      </div>

      {/* Instrument selector */}
      <div className="flex gap-2">
        {(Object.keys(TUNINGS) as TuningKey[]).map((key) => (
          <button
            key={key}
            onClick={() => setInstrument(key)}
            className={`px-4 py-2 rounded-full text-sm transition-colors ${
              instrument === key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {TUNINGS[key].name}
          </button>
        ))}
      </div>

      {/* Note display */}
      <div className="flex flex-col items-center justify-center w-48 h-48 rounded-full border-4 border-border relative">
        {detectedNote ? (
          <>
            <span className={`text-5xl font-mono font-bold ${inTune ? 'text-green-500' : 'text-foreground'}`}>
              {detectedNote.replace(/\d/, '')}
            </span>
            <span className="text-sm text-muted-foreground mt-1">
              {detectedNote.match(/\d/)?.[0] && `Octava ${detectedNote.match(/\d/)?.[0]}`}
            </span>
          </>
        ) : (
          <span className="text-muted-foreground text-sm">
            {isListening ? 'Tocá una nota...' : 'Presioná iniciar'}
          </span>
        )}
      </div>

      {/* Cents indicator */}
      <div className="w-64 space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>-50</span>
          <span>0</span>
          <span>+50</span>
        </div>
        <div className="h-2 bg-muted rounded-full relative overflow-hidden">
          <div
            className={`absolute top-0 h-full w-2 rounded-full transition-all duration-100 ${
              inTune ? 'bg-green-500' : 'bg-primary'
            }`}
            style={{ left: `${50 + cents}%`, transform: 'translateX(-50%)' }}
          />
        </div>
        <p className="text-center text-sm text-muted-foreground">
          {detectedNote
            ? inTune
              ? 'Afinado'
              : `${cents > 0 ? '+' : ''}${cents} cents`
            : '\u00A0'}
        </p>
      </div>

      {/* Start/Stop button */}
      <button
        onClick={isListening ? stopListening : startListening}
        className={`w-full max-w-xs py-3 rounded-lg font-medium transition-colors ${
          isListening
            ? 'bg-destructive text-white hover:bg-destructive/90'
            : 'bg-primary text-primary-foreground hover:bg-primary/90'
        }`}
      >
        {isListening ? 'Detener' : 'Iniciar afinador'}
      </button>

      {/* Reference notes */}
      <div className="w-full max-w-xs space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          Afinación estándar — {tuning.name}
        </p>
        <div className="flex justify-center gap-3">
          {tuning.notes.map((note, i) => (
            <div
              key={i}
              className={`flex items-center justify-center w-12 h-12 rounded-lg border text-sm font-mono font-semibold transition-colors ${
                detectedNote === note
                  ? 'border-green-500 bg-green-500/10 text-green-500'
                  : 'border-border bg-card'
              }`}
            >
              {note}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
