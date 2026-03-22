import { useState } from 'react'
import { Input } from '@/components/ui/input'

const LEVELS = [
  { id: 'basic', label: 'Básico', description: 'Tonalidad y acordes principales', icon: '♩' },
  { id: 'intermediate', label: 'Intermedio', description: 'Funciones armónicas y cadencias', icon: '♪' },
  { id: 'advanced', label: 'Avanzado', description: 'Modulaciones, préstamos modales y rearmonización', icon: '♬' },
] as const

export function AnalysisPage() {
  const [chords, setChords] = useState('')
  const [level, setLevel] = useState<string>('basic')
  const [result, setResult] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleAnalyze = async () => {
    if (!chords.trim()) return
    setIsLoading(true)
    // TODO: integrate with Anthropic API
    setTimeout(() => {
      setResult(
        `Análisis ${level} de la progresión: ${chords}\n\n` +
        'Esta funcionalidad se conectará con la API de Claude para generar un análisis armónico detallado.\n\n' +
        '● Tonalidad detectada\n● Funciones de cada acorde\n● Cadencias identificadas\n● Sugerencias de rearmonización'
      )
      setIsLoading(false)
    }, 1500)
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="space-y-1 pt-2 animate-fade-in-up">
        <h1 className="text-3xl font-heading italic tracking-tight">
          Análisis <span className="text-primary">IA</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Ingresá acordes y obtené un análisis armónico detallado
        </p>
      </div>

      <div className="space-y-4">
        {/* Chord input */}
        <div className="animate-fade-in-up" style={{ animationDelay: '60ms' }}>
          <label className="text-[10px] text-muted-foreground/50 uppercase tracking-[0.15em] font-medium mb-2 block">
            Progresión de acordes
          </label>
          <Input
            placeholder="Ej: Am  G  F  E"
            value={chords}
            onChange={(e) => setChords(e.target.value)}
            className="h-12 text-base font-mono rounded-xl bg-card/60 border-border focus-visible:border-primary/40 focus-visible:ring-primary/20"
          />
        </div>

        {/* Analysis level */}
        <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '120ms' }}>
          <label className="text-[10px] text-muted-foreground/50 uppercase tracking-[0.15em] font-medium block">
            Nivel de análisis
          </label>
          {LEVELS.map((l) => {
            const isActive = level === l.id
            return (
              <button
                key={l.id}
                onClick={() => setLevel(l.id)}
                className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-200 flex items-start gap-3 ${
                  isActive
                    ? 'border-primary/40 bg-primary/5 shadow-[0_0_16px_var(--amber-glow)]'
                    : 'border-border bg-card/30 hover:bg-card/60 hover:border-border'
                }`}
              >
                <span className={`text-lg mt-0.5 transition-all ${isActive ? 'text-primary' : 'text-muted-foreground/40'}`}>
                  {l.icon}
                </span>
                <div>
                  <p className={`font-medium text-sm transition-colors ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {l.label}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">{l.description}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Analyze button */}
        <button
          onClick={handleAnalyze}
          disabled={!chords.trim() || isLoading}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-medium hover:shadow-[0_0_24px_var(--amber-glow)] transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none active:scale-[0.98] animate-fade-in-up"
          style={{ animationDelay: '180ms' }}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Analizando...
            </span>
          ) : (
            'Analizar progresión'
          )}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="rounded-xl border border-border bg-card/40 overflow-hidden animate-fade-in-up">
          <div className="px-4 py-3 border-b border-border bg-card/60 flex items-center gap-2">
            <span className="text-primary text-sm">✦</span>
            <span className="text-sm font-medium">Resultado</span>
          </div>
          <div className="p-4">
            <pre className="text-sm whitespace-pre-wrap font-sans text-muted-foreground leading-relaxed">
              {result}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
