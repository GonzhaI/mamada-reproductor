import { useCallback, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { audioPlayer } from '@/services/player'

const KEY_ENABLED = 'worn_tape_enabled'
const KEY_SPEED = 'worn_tape_speed'

/**
 * Modo cinta gastada: lowpass + wow/flutter + velocidad con pitch.
 * Preferencias persistidas; se aplican al motor de audio web al instante
 * (y en cada carga de track posterior — el motor las memoriza).
 */
export function useWornTape() {
  const [enabled, setEnabledState] = useState(false)
  const [speed, setSpeedState] = useState(1)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        const [en, sp] = await Promise.all([
          AsyncStorage.getItem(KEY_ENABLED),
          AsyncStorage.getItem(KEY_SPEED),
        ])
        if (!alive) return
        const e = en === '1'
        const n = sp == null ? NaN : parseFloat(sp)
        const s = Number.isFinite(n) ? Math.min(1.5, Math.max(0.5, n)) : 1
        setEnabledState(e)
        setSpeedState(s)
        audioPlayer.setWornTape(e, s)
      } catch {
        // defaults
      } finally {
        if (alive) setReady(true)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const setEnabled = useCallback(
    (v: boolean) => {
      setEnabledState(v)
      audioPlayer.setWornTape(v, speed)
      AsyncStorage.setItem(KEY_ENABLED, v ? '1' : '0').catch(() => {})
    },
    [speed]
  )

  const setSpeed = useCallback(
    (v: number) => {
      setSpeedState(v)
      audioPlayer.setWornTape(enabled, v)
      AsyncStorage.setItem(KEY_SPEED, String(v)).catch(() => {})
    },
    [enabled]
  )

  return { enabled, speed, setEnabled, setSpeed, ready }
}
