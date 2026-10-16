import { useMemo, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '@/hooks/useTheme'
import type { ThemeColors, ThemeName } from '@/theme/themes'
import { useWornTape } from '@/hooks/useWornTape'
import { usePartyCrossfade } from '@/hooks/usePartyCrossfade'
import { sfx } from '@/services/sfxEngine'

type SettingsRowProps = {
  label: string
  value?: string
  accent?: boolean
}

function SettingsRow({ label, value, accent }: SettingsRowProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, accent && styles.rowLabelAccent]}>{label}</Text>
      {value != null && <Text style={styles.rowValue}>{value}</Text>}
    </View>
  )
}

const THEME_OPTIONS: { name: ThemeName; label: string }[] = [
  { name: 'tierra', label: 'TIERRA' },
  { name: 'arena', label: 'ARENA' },
  { name: 'neon', label: 'NEON' },
]

const SPEED_OPTIONS: { value: number; label: string }[] = [
  { value: 0.85, label: 'LENTO' },
  { value: 1, label: 'NORMAL' },
  { value: 1.25, label: '45 RPM' },
]

export default function SettingsScreen() {
  const { colors, themeName, setTheme } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const worn = useWornTape()
  const partyX = usePartyCrossfade()
  const [sfxOn, setSfxOn] = useState(sfx.enabled)

  const toggleSfx = () => {
    sfx.play('switch')
    const next = !sfxOn
    sfx.setEnabled(next)
    setSfxOn(next)
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>SETTINGS</Text>
          <View style={styles.headerLine} />
        </View>

        {/* Theme card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>TEMA</Text>
          <View style={styles.cardSeparator} />
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map(option => {
              const isActive = option.name === themeName
              return (
                <TouchableOpacity
                  key={option.name}
                  style={[styles.themeBtn, isActive && styles.themeBtnActive]}
                  activeOpacity={0.7}
                  onPress={() => setTheme(option.name)}
                >
                  <Text style={[styles.themeBtnText, isActive && styles.themeBtnTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* Source card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>FUENTE DE MÚSICA</Text>
          <View style={styles.cardSeparator} />
          <View style={styles.accountInfo}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>♪</Text>
            </View>
            <View style={styles.accountText}>
              <Text style={styles.accountName}>JAMENDO</Text>
              <Text style={styles.accountEmail}>Catálogo Creative Commons · streaming directo</Text>
              <View style={styles.tierBadge}>
                <Text style={styles.tierText}>READ-ONLY</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Audio quality card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>REPRODUCCIÓN</Text>
          <View style={styles.cardSeparator} />
          <SettingsRow label="STREAMING" value="MP3 VBR" />
          <View style={styles.rowSep} />

          {/* Cinta gastada */}
          <TouchableOpacity
            style={styles.toggleRow}
            activeOpacity={0.7}
            onPress={() => {
              sfx.play('switch')
              worn.setEnabled(!worn.enabled)
            }}
          >
            <Text style={styles.rowLabel}>CINTA GASTADA</Text>
            <View style={[styles.toggle, worn.enabled && styles.toggleOn]}>
              <View
                style={[
                  styles.toggleKnob,
                  worn.enabled && styles.toggleKnobOn,
                  worn.enabled && { backgroundColor: colors.accent },
                ]}
              />
            </View>
          </TouchableOpacity>
          {worn.enabled && (
            <>
              <Text style={styles.hint}>LOWPASS + WOW/FLUTTER · EL PITCH SIGUE A LA VELOCIDAD</Text>
              <View style={styles.speedRow}>
                {SPEED_OPTIONS.map(option => {
                  const isActive = Math.abs(option.value - worn.speed) < 0.01
                  return (
                    <TouchableOpacity
                      key={option.label}
                      style={[styles.themeBtn, isActive && styles.themeBtnActive]}
                      activeOpacity={0.7}
                      onPress={() => {
                        sfx.play('tick')
                        worn.setSpeed(option.value)
                      }}
                    >
                      <Text style={[styles.themeBtnText, isActive && styles.themeBtnTextActive]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </>
          )}
          <View style={styles.rowSep} />

          {/* Foley mecánico */}
          <TouchableOpacity style={styles.toggleRow} activeOpacity={0.7} onPress={toggleSfx}>
            <Text style={styles.rowLabel}>SONIDO DE INTERFAZ</Text>
            <View style={[styles.toggle, sfxOn && styles.toggleOn]}>
              <View
                style={[
                  styles.toggleKnob,
                  sfxOn && styles.toggleKnobOn,
                  sfxOn && { backgroundColor: colors.accent },
                ]}
              />
            </View>
          </TouchableOpacity>
          <View style={styles.rowSep} />

          {/* Party mode */}
          <TouchableOpacity
            style={styles.toggleRow}
            activeOpacity={0.7}
            onPress={() => { sfx.play('switch'); void partyX.toggleParty() }}
          >
            <Text style={styles.rowLabel}>PARTY MODE ∞</Text>
            <View style={[styles.toggle, partyX.party && styles.toggleOn]}>
              <View style={[styles.toggleKnob, partyX.party && styles.toggleKnobOn, partyX.party && { backgroundColor: colors.accent }]} />
            </View>
          </TouchableOpacity>
          {partyX.party && <Text style={styles.hint}>AL TERMINAR LA COLA: RESHUFFLE Y SIGUE</Text>}
          <View style={styles.rowSep} />

          {/* Crossfade */}
          <TouchableOpacity
            style={styles.toggleRow}
            activeOpacity={0.7}
            onPress={() => { sfx.play('switch'); void partyX.toggleCrossfade() }}
          >
            <Text style={styles.rowLabel}>CROSSFADE</Text>
            <View style={[styles.toggle, partyX.crossfade && styles.toggleOn]}>
              <View style={[styles.toggleKnob, partyX.crossfade && styles.toggleKnobOn, partyX.crossfade && { backgroundColor: colors.accent }]} />
            </View>
          </TouchableOpacity>
          {partyX.crossfade && (
            <View style={styles.speedRow}>
              {[1.5, 2.5, 4].map(sec => {
                const isActive = Math.abs(sec - partyX.crossfadeSec) < 0.01
                return (
                  <TouchableOpacity
                    key={sec}
                    style={[styles.themeBtn, isActive && styles.themeBtnActive]}
                    activeOpacity={0.7}
                    onPress={() => { sfx.play('tick'); void partyX.setCrossfadeSec(sec) }}
                  >
                    <Text style={[styles.themeBtnText, isActive && styles.themeBtnTextActive]}>{sec}S</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          )}
        </View>

        {/* About card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ACERCA DE</Text>
          <View style={styles.cardSeparator} />
          <SettingsRow label="VERSIÓN" value="0.2.0" />
          <View style={styles.rowSep} />
          <SettingsRow label="BUILD" value="DEV" />
        </View>

        <Text style={styles.footer}>MAMADA REPRODUCTOR · v0.2</Text>

      </ScrollView>
    </SafeAreaView>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
    // Theme picker
    themeRow: {
      flexDirection: 'row',
      gap: 8,
    },
    themeBtn: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 10,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.bg,
    },
    themeBtnActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accent,
    },
    themeBtnText: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 6,
      color: colors.textMuted,
      letterSpacing: 0.5,
    },
    themeBtnTextActive: {
      color: colors.bg,
    },
    // Source
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
      marginVertical: 4,
    },
    toggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
    },
    toggle: {
      width: 40,
      height: 20,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      justifyContent: 'center',
      paddingHorizontal: 2,
    },
    toggleOn: {
      borderColor: colors.accent,
    },
    toggleKnob: {
      width: 14,
      height: 12,
      backgroundColor: colors.textMuted,
    },
    toggleKnobOn: {
      alignSelf: 'flex-end',
    },
    hint: {
      fontFamily: 'VT323_400Regular',
      fontSize: 12,
      color: colors.textMuted,
      letterSpacing: 0.5,
      marginBottom: 8,
      marginTop: -2,
    },
    speedRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 6,
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
