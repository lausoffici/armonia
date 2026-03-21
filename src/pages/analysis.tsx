import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const LEVELS = [
  { id: 'basic', label: 'Básico', description: 'Tonalidad y acordes principales' },
  { id: 'intermediate', label: 'Intermedio', description: 'Funciones armónicas y cadencias' },
  { id: 'advanced', label: 'Avanzado', description: 'Modulaciones, préstamos modales y rearmonización' },
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
        '• Tonalidad detectada\n• Funciones de cada acorde\n• Cadencias identificadas\n• Sugerencias de rearmonización'
      )
      setIsLoading(false)
    }, 1500)
  }

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Análisis con IA</h1>
        <p className="text-sm text-muted-foreground">
          Ingresá acordes y obtené un análisis armónico detallado
        </p>
      </div>

      <div className="space-y-3">
        <Input
          placeholder="Ej: Am  G  F  E"
          value={chords}
          onChange={(e) => setChords(e.target.value)}
          className="h-12 text-base font-mono"
        />

        {/* Analysis level */}
        <div className="space-y-2">
          {LEVELS.map((l) => (
            <button
              key={l.id}
              onClick={() => setLevel(l.id)}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                level === l.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-accent/50'
              }`}
            >
              <p className="font-medium text-sm">{l.label}</p>
              <p className="text-xs text-muted-foreground">{l.description}</p>
            </button>
          ))}
        </div>

        <button
          onClick={handleAnalyze}
          disabled={!chords.trim() || isLoading}
          className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Analizando...' : 'Analizar progresión'}
        </button>
      </div>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm whitespace-pre-wrap font-sans text-muted-foreground">
              {result}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
