import axios from 'axios'
import type { AudioQuality, Playlist, Track } from './types'

/**
 * Cliente para la Jamendo API v3.0 (https://api.jamendo.com/v3.0).
 *
 * Plan "Read only" (sin OAuth): solo se necesita el client_id público.
 * - `/tracks` — catálogo, búsqueda y streaming (campo `audio`)
 * - Streaming: `audioformat=mp32` (VBR, buena calidad) es el valor por defecto pedido acá.
 * - Las "playlists" de la library se arman por género (tags), porque las playlists
 *   públicas de Jamendo no traen cover ni count en el listado y su endpoint de tracks
 *   resultó inestable.
 */

const BASE_URL = 'https://api.jamendo.com/v3.0'
const CLIENT_ID = process.env.EXPO_PUBLIC_JAMENDO_CLIENT_ID ?? ''

if (!CLIENT_ID) {
  console.warn('Falta EXPO_PUBLIC_JAMENDO_CLIENT_ID en .env — la API de Jamendo no va a funcionar')
}

export const jamendoApi = axios.create({
  baseURL: BASE_URL,
  params: { client_id: CLIENT_ID, format: 'json' },
})

// ---------------------------------------------------------------------------
// Forma de la respuesta de Jamendo
// ---------------------------------------------------------------------------

interface JamendoHeaders {
  status: string
  code: number
  error_message?: string
  results_count: number
}

interface JamendoResponse<T> {
  headers: JamendoHeaders
  results: T[]
}

interface JamendoTrack {
  id: string
  name: string
  duration: number
  artist_id: string
  artist_name: string
  album_id: string
  album_name: string
  album_image: string
  image: string
  audio: string
  audiodownload: string
  license_ccurl: string
  releasedate: string
}

function mapTrack(t: JamendoTrack, audioformat: string): Track {
  return {
    id: `jamendo-${t.id}`,
    title: t.name,
    artists: [{ id: `artist-${t.artist_id}`, name: t.artist_name }],
    album: {
      id: `album-${t.album_id}`,
      title: t.album_name,
      coverUrl: t.image || t.album_image || null,
    },
    durationSeconds: t.duration,
    quality: audioFormatQuality(audioformat),
    audio: t.audio || null,
  }
}

function audioFormatQuality(audioformat: string): AudioQuality {
  switch (audioformat) {
    case 'flac':
      return 'LOSSLESS'
    case 'mp31':
      return 'LOW'
    default:
      return 'HIGH'
  }
}

async function fetchTracks(params: Record<string, string | number>): Promise<Track[]> {
  if (!CLIENT_ID) {
    throw new Error('Falta EXPO_PUBLIC_JAMENDO_CLIENT_ID en .env')
  }
  const audioformat = (params.audioformat as string | undefined) ?? 'mp32'
  // Jamendo devuelve resultados vacíos al azar (~30% de las requests) → reintentar
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data } = await jamendoApi.get<JamendoResponse<JamendoTrack>>('/tracks/', { params })
    if (data.results.length > 0) {
      return data.results.map(t => mapTrack(t, audioformat))
    }
    await new Promise(resolve => setTimeout(resolve, 300))
  }
  return []
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

export const GENRES: ReadonlyArray<{ id: string; name: string; tags: string }> = [
  { id: 'lofi', name: 'LOFI CHILL', tags: 'lofi' },
  { id: 'piano', name: 'PIANO', tags: 'piano' },
  { id: 'downtempo', name: 'DOWNTEMPO', tags: 'downtempo' },
]

export async function getGenreTracks(genreId: string): Promise<Track[]> {
  const genre = GENRES.find(g => g.id === genreId)
  if (!genre) return []
  return fetchTracks({
    tags: genre.tags,
    audioformat: 'mp32',
    order: 'popularity_total_desc',
    limit: 100,
  })
}

/**
 * Descarga los tracks de cada género UNA sola vez y arma:
 * - `playlists`: metadata de las playlists de MUSIC
 * - `curated`: LOFI SELECT (primeros 30 del género lofi)
 */
export async function getLibrary(): Promise<{ playlists: Playlist[]; curated: Track[] }> {
  const tracksPerGenre = await Promise.all(GENRES.map(g => getGenreTracks(g.id)))
  const playlists = GENRES.map((g, i) => ({
    id: g.id,
    name: g.name,
    trackCount: tracksPerGenre[i].length,
    imageUrl: tracksPerGenre[i][0]?.album?.coverUrl ?? null,
  }) satisfies Playlist)
  return { playlists, curated: tracksPerGenre[0].slice(0, 30) }
}

export async function getPlaylistTracks(playlistId: string): Promise<Track[]> {
  return getGenreTracks(playlistId)
}
