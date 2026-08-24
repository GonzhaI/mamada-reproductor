import { useEffect } from 'react'
import { Stack, SplashScreen } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { PlayerProvider } from '@/hooks/usePlayer'
import { ThemeProvider, useTheme } from '@/hooks/useTheme'
import { useFonts } from '@/hooks/useFonts'

// Prevent the splash screen from auto-hiding before fonts are loaded
SplashScreen.preventAutoHideAsync()

function RootNavigator() {
  const { colors, themeName } = useTheme()

  return (
    <>
      <StatusBar style={themeName === 'arena' ? 'dark' : 'light'} backgroundColor={colors.bg} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  )
}

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <PlayerProvider>
          <RootNavigator />
        </PlayerProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}
