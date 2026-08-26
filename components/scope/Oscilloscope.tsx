import { useEffect, useMemo, useRef, useState } from 'react'
import { StyleSheet, View, Text, Platform } from 'react-native'
import { useTheme } from '@/hooks/useTheme'
import type { ThemeColors } from '@/theme/themes'
import { audioPlayer } from '@/services/player'

interface OscilloscopeProps {
  isPlaying: boolean
  coverUrl?: string
  title?: string
  artist?: string
  accent?: string | null
}

const WAVE_POINTS = 192

/**
 * Skin OSCILOSCOPIO CRT: monitor analógico de banco con la forma de onda REAL
 * del stream (getByteTimeDomainData vía el grafo de Web Audio del EQ).
 * Canvas nativo del DOM inyectado bajo el View contenedor (mismo patrón que
 * YtEngine con el iframe). Persistencia de fósforo: en vez de clearRect se
 * pinta un velo translúcido que deja estela.
 * Sin análisis disponible (nativo / sin CORS): dibuja reposo con ruido leve.
 */
export function Oscilloscope({ isPlaying }: OscilloscopeProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const hostRef = useRef<View>(null)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)

  useEffect(() => {
    if (Platform.OS !== 'web' || !hostRef.current || !size) return undefined
    const host = hostRef.current as unknown as HTMLElement
    if (!host) return undefined

    const canvas = document.createElement('canvas')
    canvas.width = size.w * 2 // retina-ish
    canvas.height = size.h * 2
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.display = 'block'
    const ctx = canvas.getContext('2d')
    host.appendChild(canvas)

    let raf = 0
    let phase = 0
    const W = canvas.width
    const H = canvas.height

    const draw = () => {
      raf = requestAnimationFrame(draw)
      if (!ctx) return
      // Velo de fósforo (persistencia) en vez de limpiar
      ctx.fillStyle = 'rgba(3, 14, 6, 0.30)'
      ctx.fillRect(0, 0, W, H)

      // Retícula
      ctx.strokeStyle = 'rgba(74, 255, 106, 0.10)'
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let gx = 1; gx < 8; gx++) {
        const x = (W / 8) * gx
        ctx.moveTo(x, 0)
        ctx.lineTo(x, H)
      }
      for (let gy = 1; gy < 4; gy++) {
        const y = (H / 4) * gy
        ctx.moveTo(0, y)
        ctx.lineTo(W, y)
      }
      ctx.stroke()

      const wave = audioPlayer.getWaveform(WAVE_POINTS)
      ctx.beginPath()
      ctx.lineWidth = 3
      ctx.shadowColor = '#4AFF6A'
      ctx.shadowBlur = 12
      ctx.strokeStyle = '#5CFF7A'

      if (wave && isPlaying) {
        for (let i = 0; i < wave.length; i++) {
          const x = (i / (wave.length - 1)) * W
          const y = H / 2 - wave[i]! * H * 0.42
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
      } else {
        // Reposo: línea base con respiración leve
        phase += 0.05
        ctx.globalAlpha = 0.55
        for (let i = 0; i <= WAVE_POINTS; i++) {
          const x = (i / WAVE_POINTS) * W
          const idle = Math.sin(i * 0.09 + phase) * 1.5 + (Math.random() - 0.5) * 1.2
          const y = H / 2 + idle
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
      }
      ctx.stroke()
      ctx.shadowBlur = 0
      ctx.globalAlpha = 1
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      try {
        host.removeChild(canvas)
      } catch {
        // noop
      }
    }
  }, [size, isPlaying])

  return (
    <View style={styles.container}>
      <View style={styles.bezel}>
        <View
          ref={hostRef}
          style={styles.screen}
          onLayout={e => {
            const { width, height } = e.nativeEvent.layout
            setSize(prev =>
              prev && prev.w === width && prev.h === height ? prev : { w: width, h: height }
            )
          }}
        />
        {/* Reflejo curvo de vidrio */}
        <View pointerEvents="none" style={styles.glass} />
      </View>
      <View style={styles.plate}>
        <Text style={styles.plateText}>OSCILLOSCOPE · CH1 · 20kHz</Text>
      </View>
    </View>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      width: '100%',
    },
    bezel: {
      width: 280,
      height: 190,
      borderRadius: 18,
      backgroundColor: colors.surface,
      borderWidth: 3,
      borderColor: colors.border,
      padding: 10,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
      elevation: 8,
    },
    screen: {
      width: '100%',
      height: '100%',
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: '#03100A',
      borderWidth: 2,
      borderColor: '#0A2A14',
    },
    glass: {
      position: 'absolute',
      top: 8,
      left: 14,
      width: 90,
      height: 46,
      borderRadius: 45,
      backgroundColor: 'rgba(120, 255, 150, 0.06)',
      transform: [{ rotate: '-18deg' }],
    },
    plate: {
      marginTop: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 3,
    },
    plateText: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 6,
      color: colors.textMuted,
      letterSpacing: 1,
    },
  })
