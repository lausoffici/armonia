export interface SearchResult {
  id: string
  title: string
  artist: string
  url: string
  artistSlug: string
  songSlug: string
  image: string | null
  hits: number
}

export interface SongSection {
  name: string
  type: 'intro' | 'verse' | 'chorus' | 'pre-chorus' | 'bridge' | 'solo' | 'outro' | 'instrumental' | 'other'
  chords: string[]
  content: string
}

export interface TabDetail {
  title: string
  artist: string
  chords: string[]
  sections: SongSection[]
  content: string
  capo: number | null
  key: string | null
}

import { isNative } from './capacitor'

const API_BASE = isNative
  ? 'https://armonia-blond.vercel.app/api'
  : '/api'

export async function searchSongs(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return []

  const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error('Error al buscar')

  const data = await res.json()
  return data.results
}

export async function getTabDetail(url: string): Promise<TabDetail> {
  const res = await fetch(`${API_BASE}/tab?url=${encodeURIComponent(url)}`)
  if (!res.ok) throw new Error('Error al obtener acordes')

  return res.json()
}
