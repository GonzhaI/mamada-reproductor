import { useMemo } from 'react'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useTheme } from '@/hooks/useTheme'
import type { ThemeColors } from '@/theme/themes'
import { SMART_RADIO_STATIONS, type SmartRadioPreset } from '@/services/smartRadio'
import { useSmartRadio } from '@/hooks/useSmartRadio'
import { sfx } from '@/services/sfxEngine'

export function SmartRadioCard() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const { station, loading, error, start } = useSmartRadio()

  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <View>
          <Text style={styles.title}>SMART RADIO</Text>
          <Text style={styles.subtitle}>{station ? `${station.label} · ${station.description}` : 'UNA COLA NUEVA CADA VEZ'}</Text>
        </View>
        <Text style={styles.live}>● LIVE</Text>
      </View>
      <View style={styles.grid}>
        {SMART_RADIO_STATIONS.map(option => (
          <TouchableOpacity
            key={option.preset}
            style={styles.button}
            activeOpacity={0.75}
            disabled={loading}
            onPress={() => {
              sfx.play('switch')
              void start(option.preset as SmartRadioPreset)
            }}
          >
            <Text style={styles.buttonLabel}>{option.label}</Text>
            <Text style={styles.buttonHint}>{option.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading && <ActivityIndicator color={colors.accent} style={styles.loader} />}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: { borderWidth: 1, borderColor: colors.accent, backgroundColor: colors.surface, padding: 12, gap: 12 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontFamily: 'PressStart2P_400Regular', fontSize: 8, color: colors.accent, letterSpacing: 1 },
  subtitle: { fontFamily: 'VT323_400Regular', fontSize: 16, color: colors.textMuted, marginTop: 5 },
  live: { fontFamily: 'PressStart2P_400Regular', fontSize: 6, color: colors.accent },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: { width: '31%', minWidth: 88, borderWidth: 1, borderColor: colors.border, padding: 8, backgroundColor: colors.bg },
  buttonLabel: { fontFamily: 'PressStart2P_400Regular', fontSize: 6, color: colors.text },
  buttonHint: { fontFamily: 'VT323_400Regular', fontSize: 13, color: colors.textMuted, marginTop: 4 },
  loader: { alignSelf: 'flex-start' },
  error: { fontFamily: 'VT323_400Regular', fontSize: 16, color: colors.accent },
})
