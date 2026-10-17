// Motor de efectos de sonido físicos: samples CC0 de Kenney (interface-sounds)
// + síntesis Web Audio para lo que no tiene sample (motor DC, estática de radio).
//
// Solo web/Tauri; en nativo todas las llamadas son no-op (el destino es desktop).
// Los buffers se decodifican lazy: el primer play de cada sonido carga y queda
// listo para siempre. Todo corre en su PROPIO AudioContext, separado del grafo
// de música (webAudioEngine), para no tocar la cadena del EQ.

import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type SfxName =
  | 'clack' // play/pause — relé mecánico
  | 'switch' // cambio de skin / toggles — switch físico
  | 'tick' // seek suelto / botones menores
  | 'track' // next/prev — cambio de pista
  | 'eject' // cerrar mini player / expulsar cinta
  | 'load' // arrancar un mix/playlista
  | 'scratch' // rayado de vinilo real (Kenney scratch_001)

const SOURCES: Record<SfxName, number> = {
  clack: require('../assets/sfx/clack.ogg'),
  switch: require('../assets/sfx/switch.ogg'),
  tick: require('../assets/sfx/tick.ogg'),
  track: require('../assets/sfx/track.ogg'),
  eject: require('../assets/sfx/eject.ogg'),
  load: require('../assets/sfx/load.ogg'),
  scratch: require('../assets/sfx/scratch.ogg'),
}

const PREF_ENABLED = 'sfx_enabled'
const PREF_VOLUME = 'sfx_volume'

class SfxEngine {
  private ctx: AudioContext | null = null
  private buffers = new Map<SfxName, AudioBuffer>()
  private loading = new Set<SfxName>()
  private _enabled = true
  private _volume = 0.55
  private prefsLoaded = false

  /** Lee preferencias y precarga los buffers. Idempotente. */
  async init(): Promise<void> {
    if (Platform.OS !== 'web') return
    try {
      const [en, vol] = await Promise.all([
        AsyncStorage.getItem(PREF_ENABLED),
        AsyncStorage.getItem(PREF_VOLUME),
      ])
      if (en != null) this._enabled = en === '1'
      if (vol != null) {
        const n = parseFloat(vol)
        if (Number.isFinite(n)) this._volume = Math.min(1, Math.max(0, n))
      }
    } catch {
      // sin prefs: defaults
    }
    this.prefsLoaded = true
    ;(Object.keys(SOURCES) as SfxName[]).forEach(n => void this.loadBuffer(n))
  }

  private ensureCtx(): AudioContext | null {
    if (Platform.OS !== 'web') return null
    if (!this.ctx) {
      try {
        const Ctor: typeof AudioContext | undefined =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (!Ctor) return null
        this.ctx = new Ctor()
      } catch {
        return null
      }
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  private async loadBuffer(name: SfxName): Promise<void> {
    if (Platform.OS !== 'web' || this.loading.has(name)) return
    this.loading.add(name)
    try {
      const res = await fetch(String(SOURCES[name]))
      const ab = await res.arrayBuffer()
      const ctx = this.ensureCtx()
      if (!ctx) return
      const buf = await ctx.decodeAudioData(ab)
      this.buffers.set(name, buf)
    } catch {
      // sample roto o sin soporte: ese sonido no existe para esta sesión
    } finally {
      this.loading.delete(name)
    }
  }

  /** Dispara un sample. Fire-and-forget; si aún no cargó, carga para la próxima. */
  play(name: SfxName, opts?: { rate?: number; gain?: number }): void {
    if (Platform.OS !== 'web' || !this._enabled) return
    const ctx = this.ensureCtx()
    if (!ctx) return
    const buf = this.buffers.get(name)
    if (!buf) {
      void this.loadBuffer(name)
      return
    }
    try {
      const src = ctx.createBufferSource()
      src.buffer = buf
      src.playbackRate.value = opts?.rate ?? 1
      const g = ctx.createGain()
      g.gain.value = (opts?.gain ?? 1) * this._volume
      src.connect(g)
      g.connect(ctx.destination)
      src.start()
    } catch {
      // noop
    }
  }

  get enabled(): boolean {
    return this._enabled
  }

  setEnabled(v: boolean): void {
    this._enabled = v && Platform.OS === 'web'
    if (!this._enabled) {
      // apagar lo que ya está sonando (motor, estática)
      this.stopMotor()
      this.setStatic(0)
    }
    AsyncStorage.setItem(PREF_ENABLED, this._enabled ? '1' : '0').catch(() => {})
  }

  get volume(): number {
    return this._volume
  }

  setVolume(v: number): void {
    this._volume = Math.min(1, Math.max(0, v))
    AsyncStorage.setItem(PREF_VOLUME, String(this._volume)).catch(() => {})
  }

  // ------------------------------------------------------------------
  // Síntesis: motor DC del tocadiscos
  // ------------------------------------------------------------------
  private motor: {
    osc: OscillatorNode
    gain: GainNode
    filter: BiquadFilterNode
  } | null = null

  /** Arranca el zumbido de motor. `pitch` escala la frecuencia base (~52Hz). */
  startMotor(pitch = 1): void {
    if (Platform.OS !== 'web' || !this._enabled) return
    const ctx = this.ensureCtx()
    if (!ctx || this.motor) return
    try {
      const osc = ctx.createOscillator()
      osc.type = 'sawtooth'
      osc.frequency.value = 52 * pitch
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 260
      filter.Q.value = 1.2
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.0001, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.12 * this._volume * 1.8, ctx.currentTime + 0.35)
      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      this.motor = { osc, gain, filter }
    } catch {
      this.motor = null
    }
  }

  setMotorPitch(pitch: number): void {
    if (!this.motor || !this.ctx) return
    try {
      this.motor.osc.frequency.setTargetAtTime(52 * pitch, this.ctx.currentTime, 0.08)
    } catch {
      // noop
    }
  }

  stopMotor(): void {
    if (!this.motor || !this.ctx) return
    const { osc, gain } = this.motor
    this.motor = null
    try {
      gain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.12)
      osc.stop(this.ctx.currentTime + 0.5)
    } catch {
      // noop
    }
  }

  // ------------------------------------------------------------------
  // Síntesis: estática de radio (ruido blanco filtrado, continuo)
  // ------------------------------------------------------------------
  private staticNodes: {
    src: AudioBufferSourceNode
    gain: GainNode
  } | null = null

  /** Nivel de estática 0..0.25 (0 = apagada). */
  setStatic(level: number): void {
    if (Platform.OS !== 'web') return
    if (!this._enabled && level > 0) return // SFX apagados: no encender
    const ctx = this.ensureCtx()
    if (!ctx) return
    const target = Math.min(0.25, Math.max(0, level)) * this._volume * 1.4
    try {
      if (target <= 0) {
        if (this.staticNodes) {
          const { src, gain } = this.staticNodes
          this.staticNodes = null
          gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.05)
          src.stop(ctx.currentTime + 0.3)
        }
        return
      }
      if (!this.staticNodes) {
        const len = Math.floor(ctx.sampleRate * 2)
        const buf = ctx.createBuffer(1, len, ctx.sampleRate)
        const data = buf.getChannelData(0)
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
        const src = ctx.createBufferSource()
        src.buffer = buf
        src.loop = true
        const bp = ctx.createBiquadFilter()
        bp.type = 'bandpass'
        bp.frequency.value = 1600
        bp.Q.value = 0.5
        const gain = ctx.createGain()
        gain.gain.value = 0.0001
        src.connect(bp)
        bp.connect(gain)
        gain.connect(ctx.destination)
        src.start()
        this.staticNodes = { src, gain }
      }
      this.staticNodes.gain.gain.setTargetAtTime(target, ctx.currentTime, 0.06)
    } catch {
      // noop
    }
  }
}

export const sfx = new SfxEngine()
