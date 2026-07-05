import { useEffect } from 'react'
import { Stack, SplashScreen } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { StyleSheet, View } from 'react-native'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { PlayerProvider } from '@/hooks/usePlayer'
import { useFonts } from '@/hooks/useFonts'
import { colors } from '@/theme/colors'

// Prevent the splash screen from auto-hiding before fonts are loaded
SplashScreen.preventAutoHideAsync()

function RootNavigator() {
  const { status } = useAuth()

  if (status === 'loading') {
    return <View style={styles.loading} />
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={status === 'signedIn'}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>

      <Stack.Protected guard={status === 'signedOut'}>
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
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
    <AuthProvider>
      <PlayerProvider>
        <StatusBar style="light" backgroundColor={colors.bg} />
        <RootNavigator />
      </PlayerProvider>
    </AuthProvider>
  )
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.bg,
  },
})
