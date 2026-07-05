import { useCallback, useEffect, useState } from 'react'
import { getFavoriteTracks, getMe, getPlaylists, type TidalPlaylist, type TidalTrack } from '@/services/tidalApi'
import { useAuth } from './useAuth'

interface UseLibraryResult {
  favorites: TidalTrack[]
  playlists: TidalPlaylist[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useLibrary(): UseLibraryResult {
  const { status } = useAuth()
  const [favorites, setFavorites] = useState<TidalTrack[]>([])
  const [playlists, setPlaylists] = useState<TidalPlaylist[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const me = await getMe()
      const [favoriteTracks, userPlaylists] = await Promise.all([
        getFavoriteTracks(me.id),
        getPlaylists(me.id),
      ])
      setFavorites(favoriteTracks)
      setPlaylists(userPlaylists)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la biblioteca')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'signedIn') {
      load()
    }
  }, [status, load])

  return { favorites, playlists, loading, error, refresh: load }
}
