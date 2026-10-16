import { useCallback, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const PARTY_KEY = 'party_mode'
const XFADE_KEY = 'crossfade_enabled'
const XFADE_SEC_KEY = 'crossfade_sec'

/** Cache síncrona para que usePlayer lea party/crossfade sin async */
export const partyCrossfadeConfig = { party: false, crossfade: true, sec: 2.5 }

/**
 * Hidratación temprana de la cache (llamar al arranque, p.ej. PlayerProvider).
 * El hook solo se monta al visitar SET — sin esto la config guardada no aplica
 * hasta entrar a ajustes una vez.
 */
export async function hydratePartyCrossfade(): Promise<void> {
  try {
    const entries = await AsyncStorage.multiGet([PARTY_KEY, XFADE_KEY, XFADE_SEC_KEY])
    const map = Object.fromEntries(entries) as Record<string, string | null>
    partyCrossfadeConfig.party = map[PARTY_KEY] === '1'
    partyCrossfadeConfig.crossfade = map[XFADE_KEY] !== '0'
    const s = Number(map[XFADE_SEC_KEY])
    if (Number.isFinite(s) && s >= 0 && s <= 8) partyCrossfadeConfig.sec = s
  } catch { /* defaults */ }
}

/**
 * Punto 3 — Party mode + crossfade (Jamendo).
 * Party: al terminar la cola, reshuffle y sigue (no se detiene).
 * Crossfade: rampa de volumen al cambiar de track (dip rápido 0->vol).
 */
export function usePartyCrossfade() {
  const [party, setPartyState] = useState(false)
  const [crossfade, setCrossfadeState] = useState(true)
  const [crossfadeSec, setCrossfadeSecState] = useState(2.5)

  useEffect(() => {
    AsyncStorage.multiGet([PARTY_KEY, XFADE_KEY, XFADE_SEC_KEY])
      .then(entries => {
        const map = Object.fromEntries(entries) as Record<string, string | null>
        if (map[PARTY_KEY] === '1') { setPartyState(true); partyCrossfadeConfig.party = true }
        if (map[XFADE_KEY] === '0') { setCrossfadeState(false); partyCrossfadeConfig.crossfade = false }
        const s = Number(map[XFADE_SEC_KEY])
        if (Number.isFinite(s) && s >= 0 && s <= 8) { setCrossfadeSecState(s); partyCrossfadeConfig.sec = s }
      })
      .catch(() => {})
  }, [])

  const toggleParty = useCallback(async () => {
    setPartyState(p => {
      const n = !p
      partyCrossfadeConfig.party = n
      void AsyncStorage.setItem(PARTY_KEY, n ? '1' : '0')
      return n
    })
  }, [])

  const toggleCrossfade = useCallback(async () => {
    setCrossfadeState(c => {
      const n = !c
      partyCrossfadeConfig.crossfade = n
      void AsyncStorage.setItem(XFADE_KEY, n ? '1' : '0')
      return n
    })
  }, [])

  const setCrossfadeSec = useCallback(async (sec: number) => {
    const v = Math.min(8, Math.max(0, sec))
    setCrossfadeSecState(v)
    partyCrossfadeConfig.sec = v
    try { await AsyncStorage.setItem(XFADE_SEC_KEY, String(v)) } catch { /* noop */ }
  }, [])

  return { party, crossfade, crossfadeSec, toggleParty, toggleCrossfade, setCrossfadeSec }
}

/** Single-flight: cada fade nuevo cancela al anterior (next rápido) */
let fadeGen = 0

/** Cancela un fade en curso (p.ej. el usuario movió el volumen a mano) */
export function cancelFade(): void {
  fadeGen++
}

/** Rampa de volumen 0 -> target en ms (crossfade de entrada). */
export function fadeVolumeIn(
  setVol: (v: number) => void,
  target: number,
  ms: number,
): void {
  const gen = ++fadeGen
  if (ms <= 0 || target <= 0) return
  const steps = 12
  let i = 0
  setVol(0.01)
  const id = setInterval(() => {
    if (gen !== fadeGen) { clearInterval(id); return }
    i += 1
    const v = target * (i / steps)
    if (i >= steps) {
      clearInterval(id)
      if (gen === fadeGen) setVol(target)
    } else {
      try { setVol(Number(v.toFixed(3))) } catch { clearInterval(id) }
    }
  }, Math.max(20, Math.round(ms / steps)))
}
