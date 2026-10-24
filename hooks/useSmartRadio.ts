import { useCallback, useEffect, useState } from 'react'
import { getLastSmartRadioPreset, getSmartRadioQueue, type SmartRadioPreset, type SmartRadioStation } from '@/services/smartRadio'
import { usePlayerActions } from '@/hooks/usePlayer'

export function useSmartRadio() {
  const { playTrack } = usePlayerActions()
  const [lastPreset, setLastPreset] = useState<SmartRadioPreset | null>(null)
  const [station, setStation] = useState<SmartRadioStation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void getLastSmartRadioPreset().then(setLastPreset).catch(() => {})
  }, [])

  const start = useCallback(async (preset: SmartRadioPreset) => {
    setLoading(true)
    setError(null)
    try {
      const result = await getSmartRadioQueue(preset)
      setStation(result.station)
      setLastPreset(preset)
      await playTrack(result.tracks[0]!, result.tracks, 0)
    } catch {
      setError('NO SE PUDO SINTONIZAR LA RADIO')
    } finally {
      setLoading(false)
    }
  }, [playTrack])

  return { lastPreset, station, loading, error, start }
}
