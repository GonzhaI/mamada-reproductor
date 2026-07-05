import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/hooks/useAuth'
import { colors } from '@/theme/colors'

// Mock — pendiente reemplazar con datos reales del perfil de Tidal
const mockUser = {
  name: 'GONZALO',
  email: 'user@example.com',
  tier: 'HiFi Plus',
}

type SettingsRowProps = {
  label: string
  value?: string
  accent?: boolean
  onPress?: () => void
}

function SettingsRow({ label, value, accent, onPress }: SettingsRowProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
    >
      <Text style={[styles.rowLabel, accent && styles.rowLabelAccent]}>{label}</Text>
      {value != null && <Text style={styles.rowValue}>{value}</Text>}
    </TouchableOpacity>
  )
}

export default function SettingsScreen() {
  const { logout } = useAuth()

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>SETTINGS</Text>
          <View style={styles.headerLine} />
        </View>

        {/* Account card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>CUENTA TIDAL</Text>
          <View style={styles.cardSeparator} />
          <View style={styles.accountInfo}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{mockUser.name.charAt(0)}</Text>
            </View>
            <View style={styles.accountText}>
              <Text style={styles.accountName}>{mockUser.name}</Text>
              <Text style={styles.accountEmail}>{mockUser.email}</Text>
              <View style={styles.tierBadge}>
                <Text style={styles.tierText}>{mockUser.tier.toUpperCase()}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Audio quality card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>CALIDAD DE AUDIO</Text>
          <View style={styles.cardSeparator} />
          <SettingsRow label="STREAMING"   value="HiFi"   />
          <View style={styles.rowSep} />
          <SettingsRow label="DESCARGA"    value="Master" />
          <View style={styles.rowSep} />
          <SettingsRow label="NORMALIZAR VOLUMEN" value="ON" />
        </View>

        {/* About card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ACERCA DE</Text>
          <View style={styles.cardSeparator} />
          <SettingsRow label="VERSIÓN"     value="0.1.0"   />
          <View style={styles.rowSep} />
          <SettingsRow label="BUILD"       value="DEV"     />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.8} onPress={logout}>
          <Text style={styles.logoutText}>⏏ CERRAR SESIÓN</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>MAMADA REPRODUCTOR · v0.1</Text>

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 16,
  },
  header: {
    marginBottom: 4,
    gap: 8,
  },
  headerTitle: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 10,
    color: colors.text,
    letterSpacing: 2,
  },
  headerLine: {
    height: 2,
    backgroundColor: colors.accent,
    width: 40,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 0,
  },
  cardTitle: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 6,
    color: colors.accent,
    letterSpacing: 1,
    marginBottom: 10,
  },
  cardSeparator: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 12,
  },
  // Account
  accountInfo: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 16,
    color: colors.bg,
  },
  accountText: {
    flex: 1,
    gap: 4,
  },
  accountName: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 8,
    color: colors.text,
  },
  accountEmail: {
    fontFamily: 'VT323_400Regular',
    fontSize: 14,
    color: colors.textMuted,
  },
  tierBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  tierText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 5,
    color: colors.bg,
    letterSpacing: 0.5,
  },
  // Rows
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  rowLabel: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 6,
    color: colors.text,
    letterSpacing: 0.3,
  },
  rowLabelAccent: {
    color: colors.accent,
  },
  rowValue: {
    fontFamily: 'VT323_400Regular',
    fontSize: 16,
    color: colors.textMuted,
    letterSpacing: 1,
  },
  rowSep: {
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.4,
  },
  // Logout
  logoutBtn: {
    borderWidth: 2,
    borderColor: '#8B3A3A',
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 7,
    color: '#C45A5A',
    letterSpacing: 1,
  },
  footer: {
    fontFamily: 'VT323_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    letterSpacing: 1,
    opacity: 0.5,
  },
})
