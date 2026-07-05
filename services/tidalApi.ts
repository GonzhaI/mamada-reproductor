import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { clearTokens, loadStoredTokens, refreshTokens } from './tidalAuth'

/**
 * Cliente para el TIDAL Open API v2 (JSON:API — https://openapi.tidal.com/v2).
 *
 * IMPORTANTE — igual que en tidalAuth.ts, no pude verificar estos paths contra la
 * documentación en vivo de developer.tidal.com (portal SPA, no fetcheable). Los paths
 * y la forma de las respuestas vienen de la spec pública JSON:API del Open API v2.
 * Confirmalos contra tu dashboard / Postman collection antes de dar por buena la Fase 3.
 *
 * RIESGO A VALIDAR ANTES DE LA FASE 4: el Open API v2 público expone catálogo
 * (búsqueda, tracks, álbumes, artistas, playlists, favoritos) pero, según lo reportado
 * por la comunidad de developer.tidal.com, NO incluye un endpoint de streaming/playback
 * para apps de terceros fuera de acuerdos de partner aprobados. `getTrackStreamUrl`
 * queda como stub explícito — no inventé un endpoint que "aparente" funcionar. Confirmá
 * esto en el dashboard antes de invertir tiempo en Fase 4 (reproducción de audio real).
 */

const BASE_URL = 'https://openapi.tidal.com/v2'

export const tidalApi = axios.create({
  baseURL: BASE_URL,
  headers: { Accept: 'application/vnd.api+json' },
})

// Permite que useAuth() reaccione (ej. forzar logout) si el refresh automático falla acá.
let onSessionExpired: (() => void) | null = null
export function setOnSessionExpired(handler: (() => void) | null): void {
  onSessionExpired = handler
}

tidalApi.interceptors.request.use(async config => {
  const stored = await loadStoredTokens()
  if (stored?.accessToken) {
    config.headers.set('Authorization', `Bearer ${stored.accessToken}`)
  }
  return config
})

// Coalesce refrescos concurrentes: si varias requests reciben 401 a la vez, solo se
// dispara un refreshTokens() y todas esperan el mismo resultado.
let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const stored = await loadStoredTokens()
  if (!stored?.refreshToken) return null
  const fresh = await refreshTokens(stored.refreshToken)
  return fresh.accessToken
}

tidalApi.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined

    if (error.response?.status !== 401 || !original || original._retry) {
      throw error
    }
    original._retry = true

    try {
      refreshPromise ??= refreshAccessToken()
      const accessToken = await refreshPromise
      refreshPromise = null
      if (!accessToken) throw error

      original.headers.set('Authorization', `Bearer ${accessToken}`)
      return tidalApi.request(original)
    } catch (refreshError) {
      refreshPromise = null
      await clearTokens()
      onSessionExpired?.()
      throw refreshError
    }
  }
)

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type TidalAudioQuality = 'LOW' | 'HIGH' | 'LOSSLESS' | 'HI_RES_LOSSLESS'

export interface TidalArtist {
  id: string
  name: string
}

export interface TidalAlbum {
  id: string
  title: string
  coverUrl: string | null
}

export interface TidalTrack {
  id: string
  title: string
  artists: TidalArtist[]
  album: TidalAlbum | null
  durationSeconds: number
  quality: TidalAudioQuality
}

export interface TidalPlaylist {
  id: string
  name: string
  trackCount: number
  imageUrl: string | null
}

export interface TidalUser {
  id: string
  username: string | null
  countryCode: string | null
}

export interface StreamUrl {
  url: string
  quality: TidalAudioQuality
  codec: string | null
}

// ---------------------------------------------------------------------------
// Mapeo JSON:API -> tipos planos de la app
// ---------------------------------------------------------------------------

interface JsonApiResource {
  id: string
  type: string
  attributes?: Record<string, unknown>
  relationships?: Record<string, { data?: JsonApiResourceRef | JsonApiResourceRef[] | null }>
}

interface JsonApiResourceRef {
  id: string
  type: string
}

interface JsonApiDocument<T = JsonApiResource | JsonApiResource[]> {
  data: T
  included?: JsonApiResource[]
}

function findIncluded(
  included: JsonApiResource[] | undefined,
  ref: JsonApiResourceRef | null | undefined
): JsonApiResource | undefined {
  if (!ref) return undefined
  return included?.find(r => r.type === ref.type && r.id === ref.id)
}

function mapArtist(resource: JsonApiResource): TidalArtist {
  return {
    id: resource.id,
    name: (resource.attributes?.name as string) ?? 'UNKNOWN ARTIST',
  }
}

function mapAlbum(resource: JsonApiResource | undefined): TidalAlbum | null {
  if (!resource) return null
  return {
    id: resource.id,
    title: (resource.attributes?.title as string) ?? '',
    coverUrl: (resource.attributes?.imageCoverUrl as string) ?? null,
  }
}

function mapTrack(resource: JsonApiResource, included: JsonApiResource[] | undefined): TidalTrack {
  const attrs = resource.attributes ?? {}
  const artistRefs = resource.relationships?.artists?.data
  const artistRefList = Array.isArray(artistRefs) ? artistRefs : artistRefs ? [artistRefs] : []
  const albumRef = resource.relationships?.albums?.data
  const albumRefSingle = Array.isArray(albumRef) ? albumRef[0] : albumRef

  return {
    id: resource.id,
    title: (attrs.title as string) ?? '',
    artists: artistRefList
      .map(ref => findIncluded(included, ref))
      .filter((r): r is JsonApiResource => Boolean(r))
      .map(mapArtist),
    album: mapAlbum(findIncluded(included, albumRefSingle)),
    durationSeconds: (attrs.duration as number) ?? 0,
    quality: ((attrs.audioQuality as string) ?? 'HIGH') as TidalAudioQuality,
  }
}

function mapPlaylist(resource: JsonApiResource): TidalPlaylist {
  const attrs = resource.attributes ?? {}
  return {
    id: resource.id,
    name: (attrs.name as string) ?? '',
    trackCount: (attrs.numberOfTracks as number) ?? 0,
    imageUrl: (attrs.imageCoverUrl as string) ?? null,
  }
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

export async function getMe(): Promise<TidalUser> {
  const { data } = await tidalApi.get<JsonApiDocument<JsonApiResource>>('/users/me')
  const attrs = data.data.attributes ?? {}
  return {
    id: data.data.id,
    username: (attrs.username as string) ?? null,
    countryCode: (attrs.country as string) ?? null,
  }
}

export async function getFavoriteTracks(userId: string): Promise<TidalTrack[]> {
  const { data } = await tidalApi.get<JsonApiDocument<JsonApiResource[]>>(
    `/userCollections/${userId}/relationships/tracks`,
    { params: { include: 'tracks.artists,tracks.albums' } }
  )
  return data.data.map(resource => mapTrack(resource, data.included))
}

export async function getPlaylists(userId: string): Promise<TidalPlaylist[]> {
  const { data } = await tidalApi.get<JsonApiDocument<JsonApiResource[]>>(
    `/userCollections/${userId}/relationships/playlists`
  )
  return data.data.map(mapPlaylist)
}

export async function getPlaylistTracks(playlistId: string): Promise<TidalTrack[]> {
  const { data } = await tidalApi.get<JsonApiDocument<JsonApiResource[]>>(
    `/playlists/${playlistId}/relationships/items`,
    { params: { include: 'items.artists,items.albums' } }
  )
  return data.data.map(resource => mapTrack(resource, data.included))
}

export async function searchTracks(query: string): Promise<TidalTrack[]> {
  if (!query.trim()) return []
  const { data } = await tidalApi.get<JsonApiDocument<JsonApiResource>>(
    `/searchResults/${encodeURIComponent(query)}`,
    { params: { include: 'tracks.artists,tracks.albums' } }
  )
  const trackRefs = data.data.relationships?.tracks?.data
  const refList = Array.isArray(trackRefs) ? trackRefs : trackRefs ? [trackRefs] : []
  return refList
    .map(ref => findIncluded(data.included, ref))
    .filter((r): r is JsonApiResource => Boolean(r))
    .map(resource => mapTrack(resource, data.included))
}

/**
 * STUB — ver nota al inicio del archivo. El Open API v2 público no confirmó exponer
 * streaming de audio completo para apps de terceros. No inventamos un path que
 * "aparente" andar: esto tira un error explícito hasta confirmar en el dashboard
 * si la app tiene (o puede solicitar) acceso a playback.
 */
export async function getTrackStreamUrl(_trackId: string): Promise<StreamUrl> {
  throw new Error(
    'getTrackStreamUrl: sin confirmar. El Open API v2 de TIDAL no documenta públicamente ' +
      'un endpoint de streaming para apps de terceros sin acuerdo de partner. Verificar en ' +
      'developer.tidal.com antes de construir la Fase 4 sobre esta función.'
  )
}
