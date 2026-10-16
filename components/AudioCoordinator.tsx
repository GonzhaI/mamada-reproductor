import { useEffect, useRef } from 'react'
import { usePlayer } from '@/hooks/usePlayer'
import { useYt } from '@/hooks/useYt'
import { audioPlayer } from '@/services/player'

/**
 * Punto 2 — Coordinador de motores duales (Jamendo <-> YouTube).
 * Exclusión mutua por flanco: el motor que EMPIEZA a sonar pausa al otro.
 * Sin esto ambos se solapaban (nota conocida en AGENTS.md).
 */
export function AudioCoordinator() {
  const player = usePlayer()
  const yt = useYt()
  const prevJam = useRef(false)
  const prevYt = useRef(false)
  const cooling = useRef(false)
  const coolTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const jamPlaying = player.isPlaying && player.isLoaded
  const ytPlaying = yt.playing && yt.mix !== null
  // estables: el efecto no debe re-correr en cada tick de position
  const setYtPlaying = yt.setPlaying

  useEffect(() => () => {
    if (coolTimer.current) clearTimeout(coolTimer.current)
  }, [])

  const cooldown = () => {
    cooling.current = true
    if (coolTimer.current) clearTimeout(coolTimer.current)
    coolTimer.current = setTimeout(() => { cooling.current = false }, 500)
  }

  // Jamendo empezó -> pausar YT
  useEffect(() => {
    const started = jamPlaying && !prevJam.current
    prevJam.current = jamPlaying
    if (started && ytPlaying && !cooling.current) {
      cooldown()
      setYtPlaying(false)
    }
  }, [jamPlaying, ytPlaying, setYtPlaying])

  // YT empezó -> pausar Jamendo
  useEffect(() => {
    const started = ytPlaying && !prevYt.current
    prevYt.current = ytPlaying
    if (started && jamPlaying && !cooling.current) {
      cooldown()
      try { void audioPlayer.pause() } catch { /* noop */ }
    }
  }, [ytPlaying, jamPlaying])

  return null
}
