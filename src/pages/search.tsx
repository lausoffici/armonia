import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

const DEMO_SONGS = [
  { id: '1', title: 'Wonderwall', artist: 'Oasis', chords: ['Em7', 'G', 'Dsus4', 'A7sus4'] },
  { id: '2', title: 'Hotel California', artist: 'Eagles', chords: ['Bm', 'F#7', 'A', 'E9', 'G', 'D', 'Em7'] },
  { id: '3', title: 'De Música Ligera', artist: 'Soda Stereo', chords: ['A', 'D', 'E', 'F#m'] },
  { id: '4', title: 'Flaca', artist: 'Andrés Calamaro', chords: ['Am', 'G', 'F', 'E'] },
  { id: '5', title: 'La Flor Más Bella', artist: 'Vicente Fernández', chords: ['C', 'G7', 'F', 'Am'] },
]

export function SearchPage() {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<typeof DEMO_SONGS[0] | null>(null)
  const [showLyrics, setShowLyrics] = useState(false)

  const filtered = query.length > 0
    ? DEMO_SONGS.filter(
        (s) =>
          s.title.toLowerCase().includes(query.toLowerCase()) ||
          s.artist.toLowerCase().includes(query.toLowerCase())
      )
    : DEMO_SONGS

  if (selected) {
    return (
      <div className="flex flex-col h-full">
        <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-border p-4 space-y-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelected(null)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold truncate">{selected.title}</h1>
              <p className="text-sm text-muted-foreground">{selected.artist}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLyrics(!showLyrics)}
              className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-accent transition-colors"
            >
              {showLyrics ? 'Ocultar letra' : 'Mostrar letra'}
            </button>
          </div>
        </div>

        <div className="flex-1 p-4">
          <div className="flex flex-wrap gap-3">
            {selected.chords.map((chord, i) => (
              <div
                key={i}
                className="flex items-center justify-center w-16 h-16 rounded-lg bg-card border border-border text-lg font-mono font-semibold"
              >
                {chord}
              </div>
            ))}
          </div>

          {showLyrics && (
            <div className="mt-6 p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
              <p>La letra se cargará desde la API.</p>
              <p className="mt-2">Por ahora, esta vista muestra solo los acordes para referencia rápida en ensayo.</p>
            </div>
          )}

          <div className="mt-8">
            <button className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
              Analizar con IA
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Armonía</h1>
        <p className="text-sm text-muted-foreground">
          Buscá una canción para ver sus acordes
        </p>
      </div>

      <Input
        type="search"
        placeholder="Buscar canción o artista..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-12 text-base"
      />

      <div className="space-y-2">
        {filtered.map((song) => (
          <Card
            key={song.id}
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => setSelected(song)}
          >
            <CardContent className="flex items-center justify-between p-4">
              <div className="min-w-0">
                <p className="font-medium truncate">{song.title}</p>
                <p className="text-sm text-muted-foreground">{song.artist}</p>
              </div>
              <div className="flex gap-1.5 flex-shrink-0 ml-3">
                {song.chords.slice(0, 4).map((chord, i) => (
                  <span
                    key={i}
                    className="text-xs font-mono px-1.5 py-0.5 rounded bg-muted"
                  >
                    {chord}
                  </span>
                ))}
                {song.chords.length > 4 && (
                  <span className="text-xs text-muted-foreground">
                    +{song.chords.length - 4}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No se encontraron resultados</p>
            <p className="text-sm mt-1">Probá con otro nombre</p>
          </div>
        )}
      </div>
    </div>
  )
}
