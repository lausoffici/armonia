import { useState, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { searchSongs, getTabDetail, type SearchResult, type TabDetail, type SongSection } from '@/lib/api'

const SECTION_STYLES: Record<SongSection['type'], { icon: string; accent: string }> = {
  intro: { icon: '▸', accent: 'text-blue-400 border-blue-400/30 bg-blue-400/5' },
  verse: { icon: '¶', accent: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5' },
  chorus: { icon: '★', accent: 'text-primary border-primary/30 bg-primary/5' },
  'pre-chorus': { icon: '◆', accent: 'text-violet-400 border-violet-400/30 bg-violet-400/5' },
  bridge: { icon: '⌒', accent: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/5' },
  solo: { icon: '♪', accent: 'text-orange-400 border-orange-400/30 bg-orange-400/5' },
  outro: { icon: '◼', accent: 'text-rose-400 border-rose-400/30 bg-rose-400/5' },
  instrumental: { icon: '♫', accent: 'text-amber-400 border-amber-400/30 bg-amber-400/5' },
  other: { icon: '§', accent: 'text-muted-foreground border-border bg-card/40' },
}

function renderChordContent(content: string) {
  return content.split(/(\[[^\]]+\])/).map((part, i) => {
    const chordMatch = part.match(/^\[(.+)\]$/)
    if (chordMatch) {
      return (
        <span key={i} className="text-primary font-bold">
          {chordMatch[1]}
        </span>
      )
    }
    return <span key={i} className="text-muted-foreground">{part}</span>
  })
}

function SectionCard({ section, showLyrics }: { section: SongSection; showLyrics: boolean }) {
  const style = SECTION_STYLES[section.type] || SECTION_STYLES.other
  const accentParts = style.accent.split(' ')
  const textColor = accentParts[0]

  return (
    <div className="rounded-xl border border-border bg-card/30 overflow-hidden animate-fade-in-up">
      {/* Section header */}
      <div className={`px-4 py-2.5 border-b border-border flex items-center gap-2 ${style.accent}`}>
        <span className={`text-sm ${textColor}`}>{style.icon}</span>
        <span className={`text-sm font-medium ${textColor}`}>{section.name}</span>
        {section.type === 'chorus' && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium ml-auto">
            Estribillo
          </span>
        )}
      </div>

      {/* Chord pills for this section */}
      {section.chords.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 py-3 border-b border-border/50">
          {section.chords.map((chord, i) => (
            <div
              key={i}
              className="flex items-center justify-center px-2.5 py-1.5 rounded-lg bg-card border border-border text-xs font-mono font-bold text-foreground shadow-[inset_0_1px_0_oklch(1_0_0/5%)] hover:border-primary/30 hover:shadow-[0_0_12px_var(--amber-glow)] transition-all duration-300 cursor-default"
            >
              {chord}
            </div>
          ))}
        </div>
      )}

      {/* Lyrics content (expandable) */}
      {showLyrics && section.content && (
        <pre className="text-sm font-mono leading-relaxed whitespace-pre-wrap px-4 py-3 overflow-x-auto">
          {renderChordContent(section.content)}
        </pre>
      )}
    </div>
  )
}

export function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<TabDetail | null>(null)
  const [selectedMeta, setSelectedMeta] = useState<{ title: string; artist: string } | null>(null)
  const [loadingTab, setLoadingTab] = useState(false)
  const [showLyrics, setShowLyrics] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  const handleSearch = useCallback((value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (value.trim().length < 2) {
      setResults([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await searchSongs(value)
        setResults(data)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 400)
  }, [])

  const handleSelect = async (song: SearchResult) => {
    setSelectedMeta({ title: song.title, artist: song.artist })
    setLoadingTab(true)
    setShowLyrics(false)
    try {
      const detail = await getTabDetail(song.url)
      setSelected(detail)
    } catch {
      setSelected(null)
      setSelectedMeta(null)
    } finally {
      setLoadingTab(false)
    }
  }

  const handleBack = () => {
    setSelected(null)
    setSelectedMeta(null)
  }

  // Detail view
  if (selectedMeta) {
    return (
      <div className="flex flex-col h-full animate-fade-in-up">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border p-4 space-y-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-heading italic truncate">{selectedMeta.title}</h1>
              <p className="text-sm text-muted-foreground">{selectedMeta.artist}</p>
            </div>
          </div>
          {selected && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowLyrics(!showLyrics)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  showLyrics
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border hover:bg-accent text-muted-foreground hover:text-foreground'
                }`}
              >
                {showLyrics ? 'Solo acordes' : 'Con letra'}
              </button>
              {selected.capo != null && selected.capo > 0 && (
                <span className="text-xs px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground">
                  Capo {selected.capo}
                </span>
              )}
              {selected.key && (
                <span className="text-xs px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground">
                  Tono: {selected.key}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          {loadingTab ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-fade-in-up">
              <div className="text-3xl mb-3 animate-pulse">♪</div>
              <p className="text-sm">Cargando acordes...</p>
            </div>
          ) : selected ? (
            <>
              {/* Sections */}
              {selected.sections && selected.sections.length > 0 ? (
                <div className="space-y-4">
                  {selected.sections.map((section, si) => (
                    <SectionCard key={si} section={section} showLyrics={showLyrics} />
                  ))}
                </div>
              ) : (
                /* Fallback: all chords together */
                <div className="flex flex-wrap gap-2 mb-6">
                  {selected.chords.map((chord, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-center px-3 py-2 rounded-xl bg-card border border-border text-sm font-mono font-bold text-foreground shadow-[inset_0_1px_0_oklch(1_0_0/5%)] hover:border-primary/30 hover:shadow-[0_0_16px_var(--amber-glow)] transition-all duration-300 cursor-default"
                    >
                      {chord}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-8">
                <button className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-medium hover:shadow-[0_0_24px_var(--amber-glow)] transition-all duration-300 active:scale-[0.98]">
                  Analizar con IA
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-muted-foreground animate-fade-in-up">
              <p>No se pudieron cargar los acordes</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // List view
  return (
    <div className="p-4 space-y-5">
      {/* Hero header */}
      <div className="space-y-1 pt-2 animate-fade-in-up">
        <h1 className="text-4xl font-heading italic tracking-tight text-foreground">
          Armonía
        </h1>
        <p className="text-sm text-muted-foreground">
          Buscá una canción para ver sus acordes
        </p>
      </div>

      {/* Search input */}
      <div className="relative animate-fade-in-up" style={{ animationDelay: '80ms' }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <Input
          type="search"
          placeholder="Buscar canción o artista..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="h-12 text-base pl-10 rounded-xl bg-card/60 border-border focus-visible:border-primary/40 focus-visible:ring-primary/20"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground animate-fade-in-up">
          <div className="size-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          Buscando...
        </div>
      )}

      {/* Song list */}
      <div className="space-y-2 stagger-children">
        {results.map((song) => (
          <button
            key={song.id}
            className="w-full text-left group flex items-center gap-3 p-3 rounded-xl bg-card/40 border border-border hover:bg-card/80 hover:border-primary/20 transition-all duration-200 active:scale-[0.98]"
            onClick={() => handleSelect(song)}
          >
            {song.image && (
              <img
                src={song.image}
                alt={song.artist}
                className="w-11 h-11 rounded-lg object-cover flex-shrink-0 bg-muted"
              />
            )}
            {!song.image && (
              <div className="w-11 h-11 rounded-lg bg-muted/40 flex items-center justify-center flex-shrink-0 text-muted-foreground/40">
                ♪
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate group-hover:text-primary transition-colors">{song.title}</p>
              <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
            </div>
          </button>
        ))}

        {!loading && query.length >= 2 && results.length === 0 && (
          <div className="text-center py-16 text-muted-foreground animate-fade-in-up">
            <div className="text-4xl mb-3 opacity-30">♪</div>
            <p>No se encontraron resultados</p>
            <p className="text-sm mt-1 text-muted-foreground/60">Probá con otro nombre</p>
          </div>
        )}

        {query.length < 2 && (
          <div className="text-center py-16 text-muted-foreground/40 animate-fade-in-up">
            <div className="text-5xl mb-4 opacity-20">🎸</div>
            <p className="text-sm">Escribí al menos 2 letras para buscar</p>
          </div>
        )}
      </div>
    </div>
  )
}
