import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type PlayerSkin = 'cassette' | 'vinyl' | 'turntable' | 'jukebox' | 'radio' | 'scope' | 'boombox'

const STORAGE_KEY = 'player_skin'
const SKINS: PlayerSkin[] = ['cassette', 'vinyl', 'turntable', 'jukebox', 'radio', 'scope', 'boombox']

interface PlayerSkinContextValue {
  skin: PlayerSkin
  setSkin: (skin: PlayerSkin) => Promise<void>
  cycleSkin: () => Promise<void>
}

const PlayerSkinContext = createContext<PlayerSkinContextValue | null>(null)

export function PlayerSkinProvider({ children }: { children: React.ReactNode }) {
  const [skin, setSkinState] = useState<PlayerSkin>('cassette')

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(saved => {
        if (saved && SKINS.includes(saved as PlayerSkin)) {
          setSkinState(saved as PlayerSkin)
        }
      })
      .catch(() => {})
  }, [])

  const setSkin = useCallback(async (name: PlayerSkin) => {
    setSkinState(name)
    try {
      await AsyncStorage.setItem(STORAGE_KEY, name)
    } catch {
      // sin persistencia la app sigue funcionando
    }
  }, [])

  const cycleSkin = useCallback(async () => {
    const idx = SKINS.indexOf(skin)
    const next = SKINS[(idx + 1) % SKINS.length]
    await setSkin(next)
  }, [skin, setSkin])

  const value = useMemo<PlayerSkinContextValue>(
    () => ({ skin, setSkin, cycleSkin }),
    [skin, setSkin, cycleSkin]
  )

  return (
    <PlayerSkinContext.Provider value={value}>
      {children}
    </PlayerSkinContext.Provider>
  )
}

export function usePlayerSkin(): PlayerSkinContextValue {
  const ctx = useContext(PlayerSkinContext)
  if (!ctx) throw new Error('usePlayerSkin debe usarse dentro de <PlayerSkinProvider>')
  return ctx
}
