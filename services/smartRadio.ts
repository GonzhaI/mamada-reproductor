import AsyncStorage from '@react-native-async-storage/async-storage'
import { GENRES, getGenreTracks } from '@/services/jamendoApi'
import type { Track } from '@/services/types'

export type SmartRadioPreset = 'auto' | 'focus' | 'night' | 'groove' | 'random'

export interface SmartRadioStation {
  preset: SmartRadioPreset
  label: string
  description: string
  genres: string[]
}

export const SMART_RADIO_STATIONS: SmartRadioStation[] = [
  { preset: 'auto', label: 'AUTO DJ', description: 'elige según la hora', genres: [] },
  { preset: 'focus', label: 'FOCUS', description: 'piano + ambient', genres: ['piano', 'ambient'] },
  { preset: 'night', label: 'NIGHT DRIVE', description: 'lofi + downtempo', genres: ['lofi', 'downtempo'] },
  { preset: 'groove', label: 'GROOVE', description: 'funk + lounge', genres: ['funk', 'lounge'] },
  { preset: 'random', label: 'WILDCARD', description: 'todo el dial', genres: GENRES.map(g => g.id) },
]

const LAST_PRESET_KEY = 'smart_radio_last_preset'

function autoPreset(hour = new Date().getHours()): SmartRadioPreset {
  if (hour >= 6 && hour < 12) return 'focus'
  if (hour >= 18 || hour < 6) return 'night'
  return 'groove'
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
  }
  return copy
}

export async function getSmartRadioQueue(preset: SmartRadioPreset): Promise<{
  tracks: Track[]
  station: SmartRadioStation
}> {
  const effectivePreset = preset === 'auto' ? autoPreset() : preset
  const station = SMART_RADIO_STATIONS.find(s => s.preset === effectivePreset) ?? SMART_RADIO_STATIONS[0]!
  const genreIds = station.genres.length > 0 ? station.genres : [effectivePreset === 'focus' ? 'piano' : 'lofi']
  const results = await Promise.all(genreIds.map(id => getGenreTracks(id)))
  const tracks = shuffle(results.flat())
  if (tracks.length === 0) throw new Error('RADIO EMPTY')
  await AsyncStorage.setItem(LAST_PRESET_KEY, preset)
  return { tracks, station }
}

export async function getLastSmartRadioPreset(): Promise<SmartRadioPreset | null> {
  const value = await AsyncStorage.getItem(LAST_PRESET_KEY)
  return value && SMART_RADIO_STATIONS.some(s => s.preset === value) ? value as SmartRadioPreset : null
}
