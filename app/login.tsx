import { Pressable, StyleSheet, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useAuth } from '@/hooks/useAuth'
import { colors } from '@/theme/colors'

export default function Login() {
  const { login } = useAuth()

  return (
    <View style={styles.container}>
      <Text style={styles.title}>REPRODUCTOR</Text>
      <Text style={styles.subtitle}>cassette retro para tu TIDAL</Text>
      <Pressable style={styles.button} onPress={login}>
        <Text style={styles.buttonText}>CONECTAR CON TIDAL</Text>
      </Pressable>
      <StatusBar style="light" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    padding: 24,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    letterSpacing: 2,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
  },
  button: {
    backgroundColor: colors.accent,
    borderColor: colors.border,
    borderWidth: 2,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: colors.black,
    fontSize: 14,
    letterSpacing: 1,
  },
})
