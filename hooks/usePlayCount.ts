import { useEffect, useState } from 'react'
import { getPlays } from '@/services/playStats'

/**
 * Cantidad de reproducciones completadas del track (0 mientras carga).
 * Se usa para la patina: rayitas en el vinilo, etiqueta desgastada.
 */
export function usePlayCount(trackId: string | null | undefined): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!trackId) {
      setCount(0)
      return undefined
    }
    let alive = true
    void getPlays(trackId).then(n => {
      if (alive) setCount(n)
    })
    return () => {
      alive = false
    }
  }, [trackId])

  return count
}
