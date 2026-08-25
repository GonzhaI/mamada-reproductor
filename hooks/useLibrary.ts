import { useCallback, useEffect, useState } from 'react'
import { getLibrary } from '@/services/jamendoApi'
import type { Playlist, Track } from '@/services/types'

interface UseLibraryResult {
  favorites: Track[]
  playlists: Playlist[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useLibrary(): UseLibraryResult {
  const [favorites, setFavorites] = useState<Track[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { playlists: genrePlaylists, curated } = await getLibrary()
      setFavorites(curated)
      setPlaylists(genrePlaylists)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la biblioteca')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { favorites, playlists, loading, error, refresh: load }
}
