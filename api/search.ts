import type { VercelRequest, VercelResponse } from '@vercel/node'

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
}

const CIFRACLUB_BASE = 'https://www.cifraclub.com.br'
const SOLR_BASE = 'https://solr.sscdn.co/cc/1/search'

interface SearchResult {
  id: string
  title: string
  artist: string
  url: string
  artistSlug: string
  songSlug: string
  image: string | null
  hits: number
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const query = req.query.q as string
  if (!query || query.trim().length < 2) {
    return res.json({ results: [] })
  }

  try {
    const url = `${SOLR_BASE}/?q=${encodeURIComponent(query)}&rows=20`
    const response = await fetch(url, { headers: HEADERS })
    const text = await response.text()

    const match = text.match(/^[a-zA-Z_]+\(([\s\S]*)\);?\s*$/)
    if (!match) {
      return res.json({ results: [] })
    }
    const data = JSON.parse(match[1])
    const docs = data?.response?.docs ?? []

    const results: SearchResult[] = docs
      .filter((d: any) => d.t === '2')
      .map((d: any) => ({
        id: String(d.imu),
        title: d.txt,
        artist: d.art,
        url: `${CIFRACLUB_BASE}/${d.dns}/${d.url}/`,
        artistSlug: d.dns,
        songSlug: d.url,
        image: d.imgm || null,
        hits: d.h ?? 0,
      }))

    return res.json({ results })
  } catch (error) {
    console.error('Search error:', error)
    return res.status(500).json({ error: 'Error al buscar' })
  }
}
