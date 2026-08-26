import { useEffect, useMemo, useState } from 'react'
import { StyleSheet, View, Text } from 'react-native'
import { useTheme } from '@/hooks/useTheme'
import type { ThemeColors } from '@/theme/themes'
import { usePlayer } from '@/hooks/usePlayer'

interface DesktopClockProps {
  visible: boolean
}

/**
 * Modo reloj de mesa: cuando la app queda sin interacción, se convierte en un
 * reloj digital gigante VT323 con el NOW PLAYING en marquee. Cualquier input
 * lo saca (el hook de idle corta al primer evento). No captura clicks.
 */
export function DesktopClock({ visible }: DesktopClockProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const { currentTrack } = usePlayer()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    if (!visible) return undefined
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [visible])

  if (!visible) return null

  const pad = (n: number) => String(n).padStart(2, '0')
  const hh = pad(now.getHours())
  const mm = pad(now.getMinutes())
  const ss = pad(now.getSeconds())
  const colonOn = now.getSeconds() % 2 === 0

  const dateLabel = new Intl.DateTimeFormat('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(now)

  const nowPlaying = currentTrack
    ? `${currentTrack.title} — ${currentTrack.artists.map(a => a.name).join(', ')}`
    : 'MAMADA REPRODUCTOR'

  return (
    <View pointerEvents="none" style={[styles.overlay]}>
      <Text style={styles.clock}>
        {hh}
        <Text style={[styles.colon, !colonOn && styles.colonOff]}>:</Text>
        {mm}
        <Text style={styles.seconds}>{ss}</Text>
      </Text>
      <Text style={styles.date}>{dateLabel.toUpperCase()}</Text>
      <View style={styles.nowWrap}>
        <Text style={styles.nowPlaying} numberOfLines={1}>
          ▶ {nowPlaying.toUpperCase()}
        </Text>
      </View>
    </View>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.bg,
      zIndex: 5000,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 14,
    },
    clock: {
      fontFamily: 'VT323_400Regular',
      fontSize: 96,
      lineHeight: 104,
      color: colors.text,
      letterSpacing: 4,
    },
    colon: {
      color: colors.text,
    },
    colonOff: {
      opacity: 0.25,
    },
    seconds: {
      fontSize: 40,
      color: colors.accent,
    },
    date: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 8,
      color: colors.textMuted,
      letterSpacing: 2,
    },
    nowWrap: {
      marginTop: 18,
      maxWidth: '80%',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 3,
    },
    nowPlaying: {
      fontFamily: 'VT323_400Regular',
      fontSize: 16,
      color: colors.accent,
      letterSpacing: 1,
    },
  })
