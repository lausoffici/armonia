import type { VercelRequest, VercelResponse } from '@vercel/node'
import * as cheerio from 'cheerio'

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
}

const CHORD_RE =
  /^[A-G][#b]?(m|maj|min|dim|aug|sus[24]?|add|7|9|11|13|°|ø|\/[A-G][#b]?|\d|\(.*\))*$/

interface SongSection {
  name: string
  type:
    | 'intro'
    | 'verse'
    | 'chorus'
    | 'pre-chorus'
    | 'bridge'
    | 'solo'
    | 'outro'
    | 'instrumental'
    | 'other'
  chords: string[]
  content: string
}

interface TabDetail {
  title: string
  artist: string
  chords: string[]
  sections: SongSection[]
  content: string
  capo: number | null
  key: string | null
}

const SECTION_PATTERNS: {
  pattern: RegExp
  type: SongSection['type']
  label: string
}[] = [
  {
    pattern: /^\[?\s*intro(?:du[cç][ãa]o)?\s*\]?:?\s*$/i,
    type: 'intro',
    label: 'Intro',
  },
  {
    pattern: /^\[?\s*(?:verso?|estrofa|verse)\s*(\d*)\s*\]?:?\s*$/i,
    type: 'verse',
    label: 'Verso',
  },
  {
    pattern: /^\[?\s*(?:refr[ãa]o|estribillo|chorus|coro)\s*\]?:?\s*$/i,
    type: 'chorus',
    label: 'Estribillo',
  },
  {
    pattern:
      /^\[?\s*(?:pr[ée]-?\s*(?:refr[ãa]o|estribillo|chorus)|pre-?\s*chorus)\s*\]?:?\s*$/i,
    type: 'pre-chorus',
    label: 'Pre-Estribillo',
  },
  {
    pattern: /^\[?\s*(?:ponte|puente|bridge)\s*\]?:?\s*$/i,
    type: 'bridge',
    label: 'Puente',
  },
  { pattern: /^\[?\s*solo\s*\]?:?\s*$/i, type: 'solo', label: 'Solo' },
  {
    pattern: /^\[?\s*(?:outro|final|coda|fim)\s*\]?:?\s*$/i,
    type: 'outro',
    label: 'Outro',
  },
  {
    pattern:
      /^\[?\s*(?:instrumental|interl[uú]dio|interlud(?:e|io))\s*\]?:?\s*$/i,
    type: 'instrumental',
    label: 'Instrumental',
  },
  {
    pattern: /^\[?\s*(?:parte?\s+[a-z])\s*\]?:?\s*$/i,
    type: 'other',
    label: '',
  },
  {
    pattern:
      /^\[?\s*(?:primeira?|segunda?|terceira?|1[ªa]?|2[ªa]?|3[ªa]?)\s*(?:parte?|verso?|estrofa)\s*\]?:?\s*$/i,
    type: 'verse',
    label: 'Verso',
  },
]

function classifyLine(
  line: string
): { type: SongSection['type']; label: string } | null {
  const trimmed = line.trim()
  if (!trimmed) return null

  for (const sp of SECTION_PATTERNS) {
    const m = trimmed.match(sp.pattern)
    if (m) {
      let label = sp.label
      if (!label) label = trimmed.replace(/[\[\]:]/g, '').trim()
      if (m[1]) label = `${label} ${m[1]}`
      return { type: sp.type, label }
    }
  }
  return null
}

function extractChordsFromContent(
  text: string,
  validChords: Set<string>
): string[] {
  const chords: string[] = []
  const re = /\[([^\]]+)\]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    const chord = m[1]
    if (validChords.has(chord) && !chords.includes(chord)) {
      chords.push(chord)
    }
  }
  return chords
}

function parseSections(
  content: string,
  allChords: Set<string>
): SongSection[] {
  const lines = content.split('\n')
  const sections: SongSection[] = []
  let currentSection: {
    name: string
    type: SongSection['type']
    lines: string[]
  } | null = null
  let verseCount = 0
  let unnamedCount = 0

  const flushSection = () => {
    if (!currentSection) return
    const sectionContent = currentSection.lines.join('\n').trim()
    if (!sectionContent) return
    const chords = extractChordsFromContent(sectionContent, allChords)
    sections.push({
      name: currentSection.name,
      type: currentSection.type,
      chords,
      content: sectionContent,
    })
  }

  for (const line of lines) {
    const classified = classifyLine(line)

    if (classified) {
      flushSection()
      let name = classified.label
      if (classified.type === 'verse' && !name.match(/\d/)) {
        verseCount++
        name = `${name} ${verseCount}`
      }
      currentSection = { name, type: classified.type, lines: [] }
      continue
    }

    if (
      !line.trim() &&
      currentSection &&
      currentSection.lines.length > 0
    ) {
      currentSection.lines.push(line)
      continue
    }

    if (!currentSection) {
      const hasChords = /\[[^\]]+\]/.test(line)
      if (hasChords || line.trim()) {
        unnamedCount++
        currentSection = {
          name:
            unnamedCount === 1
              ? 'Intro'
              : `Parte ${String.fromCharCode(64 + unnamedCount)}`,
          type: unnamedCount === 1 ? 'intro' : 'other',
          lines: [],
        }
      }
    }

    if (currentSection) {
      currentSection.lines.push(line)
    }
  }

  flushSection()

  if (sections.length <= 1 && content.trim().length > 0) {
    return inferSections(content, allChords)
  }

  return sections
}

function inferSections(
  content: string,
  allChords: Set<string>
): SongSection[] {
  const blocks = content.split(/\n\s*\n/).filter((b) => b.trim())
  if (blocks.length <= 1) {
    const chords = extractChordsFromContent(content, allChords)
    return [
      {
        name: 'Canción completa',
        type: 'other',
        chords,
        content: content.trim(),
      },
    ]
  }

  const sections: SongSection[] = []
  const chordSignatures = new Map<string, number[]>()

  blocks.forEach((block, i) => {
    const chords = extractChordsFromContent(block, allChords)
    const sig = chords.join('-')
    if (sig && sig.length > 0) {
      if (!chordSignatures.has(sig)) chordSignatures.set(sig, [])
      chordSignatures.get(sig)!.push(i)
    }
    sections.push({
      name: '',
      type: 'other',
      chords,
      content: block.trim(),
    })
  })

  let chorusSig = ''
  let maxRepeats = 0
  for (const [sig, indices] of chordSignatures) {
    if (indices.length > maxRepeats && sig.length > 0) {
      maxRepeats = indices.length
      chorusSig = sig
    }
  }

  let verseNum = 0
  let chorusNum = 0
  sections.forEach((section, i) => {
    const sig = section.chords.join('-')
    const hasChords = section.chords.length > 0
    const isFirstBlock = i === 0
    const hasLyrics =
      section.content.replace(/\[[^\]]+\]/g, '').trim().length > 20

    if (sig === chorusSig && maxRepeats >= 2 && hasChords) {
      chorusNum++
      section.type = 'chorus'
      section.name =
        maxRepeats > 1 ? 'Estribillo' : `Estribillo ${chorusNum}`
    } else if (isFirstBlock && !hasLyrics && hasChords) {
      section.type = 'intro'
      section.name = 'Intro'
    } else if (hasChords) {
      verseNum++
      section.type = 'verse'
      section.name = `Verso ${verseNum}`
    } else {
      verseNum++
      section.type = 'verse'
      section.name = `Parte ${verseNum}`
    }
  })

  return sections
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const tabUrl = req.query.url as string
  if (!tabUrl) {
    return res.status(400).json({ error: 'URL requerida' })
  }

  try {
    const response = await fetch(tabUrl, { headers: HEADERS })
    const html = await response.text()
    const $ = cheerio.load(html)

    const title =
      $('h1.t1').text().trim() ||
      $('meta[property="og:title"]').attr('content') ||
      ''
    const artist = $('h2.t3 a').text().trim() || ''

    const preEl = $('pre')
    const preHtml = preEl.html() || ''
    const preText = preEl.text() || ''

    const chordsSet = new Set<string>()
    preEl.find('b').each((_i, el) => {
      const chordText = $(el).text().trim()
      if (CHORD_RE.test(chordText)) {
        chordsSet.add(chordText)
      }
    })

    const content = preHtml
      .replace(/<b>([^<]+)<\/b>/g, '[$1]')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#x27;/g, "'")
      .replace(/&quot;/g, '"')

    const sections = parseSections(content, chordsSet)

    let capo: number | null = null
    const capoMatch =
      html.match(/capo[:\s]*(\d+)/i) || preText.match(/capo[:\s]*(\d+)/i)
    if (capoMatch) {
      capo = parseInt(capoMatch[1])
    }

    let key: string | null = null
    const keyEl = $('[class*="tone"]').first().text().trim()
    if (keyEl) key = keyEl

    const detail: TabDetail = {
      title: title.replace(/ - .*$/, ''),
      artist,
      chords: Array.from(chordsSet),
      sections,
      content,
      capo,
      key,
    }

    return res.json(detail)
  } catch (error) {
    console.error('Tab fetch error:', error)
    return res.status(500).json({ error: 'Error al obtener acordes' })
  }
}
