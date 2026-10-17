// Cliente LRCLIB (lrclib.net): letras sincronizadas en formato LRC.
// Gratis, sin API key, CORS abierto. La búsqueda es por METADATOS
// (artista + título), así que funciona igual para streams de Jamendo
// que para videos de YouTube (los Awesome Mixes traen artista/título
// verificados en awesomeMixData.ts).

export interface LyricLine {
  time: number // segundos desde el inicio
  text: string
}

export interface SyncedLyrics {
  lines: LyricLine[]
}

const cache = new Map<string, SyncedLyrics | null>()

function parseLrc(raw: string): LyricLine[] {
  const out: LyricLine[] = []
  // [mm:ss], [mm:ss.xx], [mm:ss.xxx]; varios timestamps por línea permitidos
  const re = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g
  for (const rawLine of raw.split('\n')) {
    re.lastIndex = 0
    const times: number[] = []
    let lastEnd = 0
    let match: RegExpExecArray | null
    while ((match = re.exec(rawLine)) !== null) {
      const min = parseInt(match[1]!, 10)
      const sec = parseInt(match[2]!, 10)
      const fracRaw = match[3] ?? '0'
      const frac = parseInt(fracRaw, 10) / Math.pow(10, fracRaw.length)
      times.push(min * 60 + sec + frac)
      lastEnd = re.lastIndex
    }
    if (!times.length) continue
    // strip de tags word-sync (<00:12.50>) que LRCLIB a veces inyecta
    const text = rawLine.slice(lastEnd).replace(/<[^>]+>/g, ' ').trim()
    for (const time of times) out.push({ time, text })
  }
  return out.sort((a, b) => a.time - b.time)
}

async function fetchSynced(artist: string, title: string): Promise<SyncedLyrics | null> {
  // 1) match exacto
  try {
    const res = await fetch(
      `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`
    )
    if (res.ok) {
      const data = await res.json()
      if (typeof data?.syncedLyrics === 'string' && data.syncedLyrics.trim()) {
        return { lines: parseLrc(data.syncedLyrics) }
      }
    }
  } catch {
    // seguir al fallback
  }
  // 2) búsqueda difusa: primer resultado con letra sincronizada
  try {
    const res = await fetch(
      `https://lrclib.net/api/search?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`
    )
    if (res.ok) {
      const arr = await res.json()
      const hit = Array.isArray(arr) ? arr.find(x => typeof x?.syncedLyrics === 'string' && x.syncedLyrics.trim()) : null
      if (hit) return { lines: parseLrc(hit.syncedLyrics) }
    }
  } catch {
    // sin letras
  }
  return null
}

/** Letra sincronizada o null si no hay / falló. Cacheada por clave artista|título. */
export async function fetchSyncedLyrics(
  artist: string,
  title: string
): Promise<SyncedLyrics | null> {
  const a = artist.trim()
  const t = title.trim()
  if (!a || !t) return null
  const key = `${a.toLowerCase()}|${t.toLowerCase()}`
  if (cache.has(key)) return cache.get(key) ?? null
  const lyrics = await fetchSynced(a, t)
  cache.set(key, lyrics)
  return lyrics
}

/** Índice de la línea activa en `position` segundos (-1 si aún no empieza ninguna) */
export function findActiveLine(lines: LyricLine[], position: number): number {
  let lo = 0
  let hi = lines.length - 1
  let ans = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (lines[mid]!.time <= position) {
      ans = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return ans
}
