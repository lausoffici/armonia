import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { hapticTap, isNative } from '@/lib/capacitor'

const navItems = [
  { path: '/', label: 'Buscar', icon: SearchIcon },
  { path: '/tuner', label: 'Afinador', icon: TunerIcon },
  { path: '/metronome', label: 'Metrónomo', icon: MetronomeIcon },
  { path: '/analysis', label: 'Análisis', icon: AnalysisIcon },
]

export function MobileLayout({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()

  const handleNavTap = (path: string) => {
    if (location.pathname !== path) {
      hapticTap()
      navigate(path)
    }
  }

  return (
    <div className="flex flex-col h-dvh bg-background">
      {/* Status bar spacer for native platforms */}
      {isNative && <div className="safe-top flex-shrink-0" />}

      <main className="flex-1 overflow-y-auto pb-4">{children}</main>

      {/* Floating glass nav */}
      <nav className="sticky bottom-0 px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1">
        <div className="flex items-center justify-around h-16 max-w-md mx-auto rounded-2xl bg-card/80 backdrop-blur-xl border border-border shadow-[0_-4px_32px_oklch(0_0_0/30%)]">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => handleNavTap(item.path)}
                className={cn(
                  'relative flex flex-col items-center gap-1 px-4 py-2 text-[11px] font-medium transition-all duration-200',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {isActive && (
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary shadow-[0_0_8px_var(--amber-glow)]" />
                )}
                <item.icon className={cn('size-5 transition-all', isActive && 'stroke-[2.5] drop-shadow-[0_0_6px_var(--amber-glow)]')} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function TunerIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 12h5" />
      <path d="M17 12h5" />
      <circle cx="12" cy="12" r="5" />
      <path d="M12 7v-4" />
    </svg>
  )
}

function MetronomeIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2v10" />
      <path d="M5 21h14" />
      <path d="M7 21l3-16h4l3 16" />
      <path d="m12 12 4-4" />
    </svg>
  )
}

function AnalysisIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 2h6v2H9z" />
      <path d="M4 6h16v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z" />
      <path d="M9 14l2 2 4-4" />
    </svg>
  )
}
