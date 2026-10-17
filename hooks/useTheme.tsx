import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { themes } from '@/theme/themes'
import type { ThemeColors, ThemeName } from '@/theme/themes'

const STORAGE_KEY = 'app_theme'

interface ThemeContextValue {
  colors: ThemeColors
  themeName: ThemeName
  setTheme: (name: ThemeName) => Promise<void>
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeName, setThemeName] = useState<ThemeName>('tierra')
  // race de mount: el getItem tardío no debe pisar una elección ya hecha
  const userChanged = useRef(false)

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(saved => {
        if (!userChanged.current && saved && saved in themes) setThemeName(saved as ThemeName)
      })
      .catch(() => {})
  }, [])

  const setTheme = useCallback(async (name: ThemeName) => {
    userChanged.current = true
    setThemeName(name)
    try {
      await AsyncStorage.setItem(STORAGE_KEY, name)
    } catch {
      // sin persistencia la app sigue funcionando (tema solo de sesión)
    }
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({ colors: themes[themeName], themeName, setTheme }),
    [themeName, setTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>')
  return ctx
}
