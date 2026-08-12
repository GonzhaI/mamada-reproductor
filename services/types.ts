export type AudioQuality = 'LOW' | 'HIGH' | 'LOSSLESS'

export interface Artist {
  id: string
  name: string
}

export interface Album {
  id: string
  title: string
  coverUrl: string | null
}

export interface Track {
  id: string
  title: string
  artists: Artist[]
  album: Album | null
  durationSeconds: number
  quality: AudioQuality
  audio: string | null
}

export interface Playlist {
  id: string
  name: string
  trackCount: number
  imageUrl: string | null
}
