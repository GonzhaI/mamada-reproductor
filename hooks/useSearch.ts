import { useEffect, useState } from 'react'
import { searchTracks, type TidalTrack } from '@/services/tidalApi'

const DEBOUNCE_MS = 300

interface UseSearchResult {
  query: string
  setQuery: (query: string) => void
  results: TidalTrack[]
  loading: boolean
  error: string | null
}

export function useSearch(): UseSearchResult {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TidalTrack[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setResults([])
      setError(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    const timeout = setTimeout(async () => {
      try {
        const tracks = await searchTracks(trimmed)
        if (!cancelled) setResults(tracks)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error en la búsqueda')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [query])

  return { query, setQuery, results, loading, error }
}
