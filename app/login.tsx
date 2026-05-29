import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '@/theme/colors'

// Pantalla de login — Fase 1 (Gonzalo) implementará el OAuth real aquí
export default function LoginScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        <View style={styles.logoArea}>
          <Text style={styles.logoIcon}>▶</Text>
          <Text style={styles.logoTitle}>MAMADA{'\n'}REPRODUCTOR</Text>
          <View style={styles.logoDivider} />
          <Text style={styles.logoSub}>POWERED BY TIDAL</Text>
        </View>

        <TouchableOpacity style={styles.loginBtn} activeOpacity={0.8}>
          <Text style={styles.loginBtnText}>⏎ CONECTAR CON TIDAL</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          Necesitas una cuenta TIDAL activa{'\n'}para usar esta app.
        </Text>

      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  logoArea: {
    alignItems: 'center',
    gap: 12,
  },
  logoIcon: {
    fontSize: 48,
    color: colors.accent,
  },
  logoTitle: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 2,
  },
  logoDivider: {
    height: 2,
    width: 60,
    backgroundColor: colors.accent,
    marginVertical: 4,
  },
  logoSub: {
    fontFamily: 'VT323_400Regular',
    fontSize: 16,
    color: colors.textMuted,
    letterSpacing: 3,
  },
  loginBtn: {
    width: '100%',
    borderWidth: 2,
    borderColor: colors.accent,
    backgroundColor: colors.surface,
    paddingVertical: 16,
    alignItems: 'center',
  },
  loginBtnText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 7,
    color: colors.accent,
    letterSpacing: 1,
  },
  footer: {
    fontFamily: 'VT323_400Regular',
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    letterSpacing: 0.5,
  },
})
