import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MobileLayout } from '@/components/layout/mobile-layout'
import { SearchPage } from '@/pages/search'
import { TunerPage } from '@/pages/tuner'
import { MetronomePage } from '@/pages/metronome'
import { AnalysisPage } from '@/pages/analysis'

export default function App() {
  return (
    <BrowserRouter>
      <MobileLayout>
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/tuner" element={<TunerPage />} />
          <Route path="/metronome" element={<MetronomePage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
        </Routes>
      </MobileLayout>
    </BrowserRouter>
  )
}
