// Contador de reproducciones completadas por track (patina del vinilo).
// Se persiste en AsyncStorage y se cachea en memoria por sesión.
import AsyncStorage from '@react-native-async-storage/async-storage'

const KEY_PREFIX = 'plays:'
const cache = new Map<string, number>()

function keyOf(id: string): string {
  return `${KEY_PREFIX}${id}`
}

async function readCount(id: string): Promise<number> {
  const cached = cache.get(id)
  if (cached != null) return cached
  try {
    const raw = await AsyncStorage.getItem(keyOf(id))
    const n = raw == null ? 0 : parseInt(raw, 10)
    const count = Number.isFinite(n) && n > 0 ? n : 0
    cache.set(id, count)
    return count
  } catch {
    return 0
  }
}

/** Incrementa el contador de plays completados del track. Devuelve el total nuevo. */
export async function bumpPlays(trackId: string): Promise<number> {
  try {
    const next = (await readCount(trackId)) + 1
    cache.set(trackId, next)
    await AsyncStorage.setItem(keyOf(trackId), String(next))
    return next
  } catch {
    return 0
  }
}

export async function getPlays(trackId: string): Promise<number> {
  return readCount(trackId)
}
