import { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import { Stack, SplashScreen } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { PlayerProvider } from '@/hooks/usePlayer'
import { YtProvider } from '@/hooks/useYt'
import { ThemeProvider, useTheme } from '@/hooks/useTheme'
import { useFonts } from '@/hooks/useFonts'
import { TitleBar } from '@/components/TitleBar'

import { PlayerSkinProvider } from '@/hooks/usePlayerSkin'

// Prevent the splash screen from auto-hiding before fonts are loaded
SplashScreen.preventAutoHideAsync()

function RootNavigator() {
  const { colors, themeName } = useTheme()

  return (
    <View style={styles.root}>
      <TitleBar />
      <StatusBar style={themeName === 'arena' ? 'dark' : 'light'} backgroundColor={colors.bg} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="playlist/[id]" />
      </Stack>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
})

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
        <PlayerSkinProvider>
          <PlayerProvider>
            <YtProvider>
              <RootNavigator />
            </YtProvider>
          </PlayerProvider>
        </PlayerSkinProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}
