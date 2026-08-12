import { useCallback, useEffect, useRef, useState } from 'react'
import { searchTracks } from '@/services/jamendoApi'
import type { Track } from '@/services/types'

interface UseSearchResult {
  query: string
  setQuery: (q: string) => void
  results: Track[]
  loading: boolean
  error: string | null
}

export function useSearch(): UseSearchResult {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Track[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const tracks = await searchTracks(q)
      setResults(tracks)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en la búsqueda')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => doSearch(query), 300)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query, doSearch])

  return { query, setQuery, results, loading, error }
}
