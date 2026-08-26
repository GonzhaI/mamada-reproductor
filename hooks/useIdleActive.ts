import { useEffect, useState } from 'react'
import { Platform } from 'react-native'

const EVENTS: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'pointermove', 'wheel']

/**
 * true cuando no hay interacción del usuario desde `timeoutMs` (web/Tauri).
 * Cualquier evento resetea el timer. En nativo siempre false.
 */
export function useIdleActive(timeoutMs = 5 * 60 * 1000): boolean {
  const [idle, setIdle] = useState(false)

  useEffect(() => {
    if (Platform.OS !== 'web') return undefined
    let timer: ReturnType<typeof setTimeout> | null = null

    const reset = () => {
      setIdle(false)
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => setIdle(true), timeoutMs)
    }

    EVENTS.forEach(e => window.addEventListener(e, reset, { passive: true }))
    reset()

    return () => {
      EVENTS.forEach(e => window.removeEventListener(e, reset))
      if (timer) clearTimeout(timer)
    }
  }, [timeoutMs])

  return idle
}
