import { useCallback, useEffect, useState } from 'react'
import { getFavoriteTracks, getMe, getPlaylists, type TidalPlaylist, type TidalTrack } from '@/services/tidalApi'
import { useAuth } from './useAuth'

const DEMO_TRACKS: TidalTrack[] = Array.from({ length: 12 }, (_, i) => ({
  id: `demo-${i + 1}`,
  title: `DEMO SONG ${i + 1}`,
  artists: [{ id: 'demo-artist', name: 'ARTISTA DEMO' }],
  album: {
    id: 'demo-album',
    title: 'ÁLBUM DEMO',
    coverUrl: null,
  },
  durationSeconds: 180 + Math.floor(Math.random() * 180),
  quality: 'HIGH',
}))

const DEMO_PLAYLISTS: TidalPlaylist[] = [
  { id: 'demo-playlist-1', name: 'TOP DEMO', trackCount: 12, imageUrl: null },
  { id: 'demo-playlist-2', name: 'MIX DEMO', trackCount: 8, imageUrl: null },
]

interface UseLibraryResult {
  favorites: TidalTrack[]
  playlists: TidalPlaylist[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useLibrary(): UseLibraryResult {
  const { status, isGuest } = useAuth()
  const [favorites, setFavorites] = useState<TidalTrack[]>([])
  const [playlists, setPlaylists] = useState<TidalPlaylist[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (isGuest) {
      setFavorites(DEMO_TRACKS)
      setPlaylists(DEMO_PLAYLISTS)
      return
    }
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
  }, [isGuest])

  useEffect(() => {
    if (status === 'signedIn') {
      load()
    }
  }, [status, load])

  return { favorites, playlists, loading, error, refresh: load }
}
