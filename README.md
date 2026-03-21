# Armonía — Herramienta de Músico con IA

App mobile-first para ensayo, tocadas y análisis armónico.

## Features

### MVP (sin IA)
- **Buscador de canciones** — chord sheet instantáneo, sin/con letra
- **Afinador** — guitarra, bajo, ukelele con detección por micrófono
- **Metrónomo** — tap tempo, compases configurables (2/4, 3/4, 4/4, 6/4)
- **Transpositor** — cambiar tonalidad de un chord sheet con un click

### v1 (con IA)
- **Análisis armónico** en 3 niveles: básico, intermedio, avanzado
- **Detector de BPM** por micrófono
- **Setlist builder** — armar lista de temas para la tocada

### v2 (comunidad + IA avanzada)
- **Identificador de acordes** por micrófono
- **Sugeridor de progresiones**
- **Chord sheets compartidos** por la comunidad

## Stack
- Vite, React, TypeScript
- Tailwind CSS v4, shadcn-ui
- React Router
- Web Audio API (afinador, metrónomo)
- Anthropic API (claude-haiku-4-5) para análisis armónico

## Estructura

```
src/
├── components/
│   ├── layout/        # Mobile layout, bottom nav
│   └── ui/            # shadcn components
├── hooks/             # Custom hooks (audio, etc)
├── lib/               # Utilities
└── pages/
    ├── search.tsx      # Buscador + chord sheet
    ├── tuner.tsx       # Afinador
    ├── metronome.tsx   # Metrónomo
    └── analysis.tsx    # Análisis con IA
```

## Dev

```bash
npm install
npm run dev
```
