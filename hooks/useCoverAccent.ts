import { useEffect, useState } from 'react'
import { extractCoverAccent } from '@/services/coverPalette'

/**
 * Color accent dinámico extraído de la carátula (#rrggbb) o null.
 * null = no hay análisis (nativo, CORS, error) => usar el accent del tema.
 */
export function useCoverAccent(coverUrl?: string | number | null): string | null {
  const [accent, setAccent] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    if (coverUrl == null) {
      setAccent(null)
      return undefined
    }
    extractCoverAccent(coverUrl).then(color => {
      if (alive) setAccent(color)
    })
    return () => {
      alive = false
    }
  }, [coverUrl])

  return accent
}
