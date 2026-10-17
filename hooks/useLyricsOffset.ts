import { useCallback, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const OFFSET_KEY_PREFIX = 'lyrics_offset:'
export const LYRICS_OFFSET_LIMIT = 15 // segundos por lado

/**
 * Desfase de letra sincronizada para un track (clave `artista|título`),
 * persistido en AsyncStorage. El LRC de LRCLIB matchea la grabación de
 * estudio; los uploads de YouTube pueden desviar ±1-2s y esto lo calibra.
 */
export function useLyricsOffset(trackKey: string | null | undefined): {
  offset: number
  setOffset: (v: number) => void
  nudgeOffset: (delta: number) => void
  ready: boolean
} {
  const [offset, setOffsetState] = useState(0)
  const [ready, setReady] = useState(!trackKey)

  const storageKey = trackKey ? `${OFFSET_KEY_PREFIX}${trackKey.toLowerCase()}` : null

  useEffect(() => {
    if (!storageKey) {
      setOffsetState(0)
      setReady(true)
      return undefined
    }
    let alive = true
    setReady(false)
    AsyncStorage.getItem(storageKey)
      .then(saved => {
        if (!alive) return
        const n = saved == null ? NaN : parseFloat(saved)
        setOffsetState(Number.isFinite(n) ? Math.min(LYRICS_OFFSET_LIMIT, Math.max(-LYRICS_OFFSET_LIMIT, n)) : 0)
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setReady(true)
      })
    return () => {
      alive = false
    }
  }, [storageKey])

  const setOffset = useCallback(
    (v: number) => {
      const clamped = Number((Math.min(LYRICS_OFFSET_LIMIT, Math.max(-LYRICS_OFFSET_LIMIT, v))).toFixed(1))
      setOffsetState(clamped)
      if (storageKey) {
        AsyncStorage.setItem(storageKey, String(clamped)).catch(() => {})
      }
    },
    [storageKey]
  )

  const nudgeOffset = useCallback(
    (delta: number) => {
      // durante la carga el offset del closure es del track anterior: ignorar
      if (!ready) return
      setOffset(offset + delta)
    },
    [offset, setOffset, ready]
  )

  return { offset, setOffset, nudgeOffset, ready }
}
