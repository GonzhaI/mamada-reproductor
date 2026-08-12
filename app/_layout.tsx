import { useEffect } from 'react'
import { Stack, SplashScreen } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { PlayerProvider } from '@/hooks/usePlayer'
import { useFonts } from '@/hooks/useFonts'
import { colors } from '@/theme/colors'

// Prevent the splash screen from auto-hiding before fonts are loaded
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const { fontsLoaded, fontError } = useFonts()

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, fontError])

  if (!fontsLoaded && !fontError) {
    return null
  }

  return (
    <PlayerProvider>
      <StatusBar style="light" backgroundColor={colors.bg} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </PlayerProvider>
  )
}
