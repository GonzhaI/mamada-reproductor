import { useCallback, useEffect, useRef, useState } from 'react'
import { searchTracks, type TidalTrack } from '@/services/tidalApi'
import { useAuth } from './useAuth'

const DEMO_SEARCH_INDEX: TidalTrack[] = Array.from({ length: 24 }, (_, i) => ({
  id: `demo-search-${i + 1}`,
  title: [
    'BOHEMIAN RHAPSODY', 'STARWAY TO HEAVEN', 'HOTEL CALIFORNIA',
    'COMFORTABLY NUMB', 'WISH YOU WERE HERE', 'NOTHING ELSE MATTERS',
    'ENTER SANDMAN', 'WELCOME TO THE JUNGLE', 'SWEET CHILD O MINE',
    'BACK IN BLACK', 'THUNDERSTRUCK', 'HIGHWAY TO HELL',
    'BILLIE JEAN', 'BEAT IT', 'THRILLER',
    'LIKE A ROLLING STONE', 'SATISFACTION', 'PAINT IT BLACK',
    'SMELLS LIKE TEEN SPIRIT', 'COME AS YOU ARE', 'LITHIUM',
    'UNDER PRESSURE', 'WE WILL ROCK YOU', 'ANOTHER ONE BITES THE DUST',
  ][i] ?? `DEMO TRACK ${i + 1}`,
  artists: [{ id: `artist-${i}`, name: ['QUEEN', 'LED ZEPPELIN', 'EAGLES', 'PINK FLOYD', 'METALLICA', 'AC/DC', 'MICHAEL JACKSON', 'ROLLING STONES', 'NIRVANA'][i % 9] }],
  album: { id: `album-${i}`, title: 'ÁLBUM DEMO', coverUrl: null },
  durationSeconds: 180 + Math.floor(Math.random() * 240),
  quality: 'HIGH',
}))

interface UseSearchResult {
  query: string
  setQuery: (q: string) => void
  results: TidalTrack[]
  loading: boolean
  error: string | null
}

export function useSearch(): UseSearchResult {
  const { isGuest } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TidalTrack[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      return
    }
    if (isGuest) {
      const ql = q.toLowerCase()
      const filtered = DEMO_SEARCH_INDEX.filter(
        t => t.title.toLowerCase().includes(ql) || t.artists.some(a => a.name.toLowerCase().includes(ql))
      )
      setResults(filtered)
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
  }, [isGuest])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => doSearch(query), 300)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query, doSearch])

  return { query, setQuery, results, loading, error }
}
