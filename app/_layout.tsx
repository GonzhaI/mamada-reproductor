import { Stack } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { colors } from '@/theme/colors'

function RootNavigator() {
  const { status } = useAuth()

  if (status === 'loading') {
    return <View style={styles.loading} />
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={status === 'signedIn'}>
        <Stack.Screen name="index" />
      </Stack.Protected>

      <Stack.Protected guard={status === 'signedOut'}>
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  )
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.bg,
  },
})
