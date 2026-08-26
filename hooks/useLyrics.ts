import { useEffect, useState } from 'react'
import { fetchSyncedLyrics, type SyncedLyrics } from '@/services/lrclibApi'

export interface UseLyricsResult {
  lyrics: SyncedLyrics | null
  loading: boolean
}

/**
 * Letra sincronizada (LRCLIB) para artista+título dados.
 * Con datos nulos devuelve { null, false } sin fetch.
 * `loading` solo es true mientras hay una búsqueda en curso con datos válidos.
 */
export function useLyrics(
  artist: string | null | undefined,
  title: string | null | undefined
): UseLyricsResult {
  const [lyrics, setLyrics] = useState<SyncedLyrics | null>(null)
  const [loading, setLoading] = useState(false)

  const hasData = !!(artist?.trim() && title?.trim())

  useEffect(() => {
    if (!hasData || !artist || !title) {
      setLyrics(null)
      setLoading(false)
      return undefined
    }
    let alive = true
    setLoading(true)
    setLyrics(null)
    fetchSyncedLyrics(artist, title)
      .then(result => {
        if (alive) setLyrics(result)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [hasData, artist, title])

  return { lyrics, loading }
}
