import { Platform } from 'react-native'
import { Audio } from 'expo-av'
import { webAudioEngine } from '@/services/webAudioEngine'

export type PlayerStatus = {
  position: number
  duration: number
  isPlaying: boolean
  isLoaded: boolean
  /** true solo en la notificación donde el track terminó naturalmente */
  didJustFinish: boolean
}

type PlayerListener = (status: PlayerStatus) => void

const POLL_INTERVAL_MS = 250
const IS_WEB = Platform.OS === 'web'

class AudioPlayer {
  // Nativo: expo-av. Web/Tauri: <audio> propio (permite AnalyserNode para el EQ real).
  private sound: Audio.Sound | null = null
  private listeners = new Set<PlayerListener>()
  private pollTimer: ReturnType<typeof setInterval> | null = null

  private _position = 0
  private _duration = 0
  private _isPlaying = false
  private _isLoaded = false
  private _didJustFinish = false
  private _volume = 1

  get position(): number {
    return this._position
  }
  get duration(): number {
    return this._duration
  }
  get isPlaying(): boolean {
    return this._isPlaying
  }
  get isLoaded(): boolean {
    return this._isLoaded
  }
  get volume(): number {
    return this._volume
  }

  subscribe(listener: PlayerListener): () => void {
    this.listeners.add(listener)
    listener(this.getStatus())
    return () => {
      this.listeners.delete(listener)
    }
  }

  private getStatus(): PlayerStatus {
    return {
      position: this._position,
      duration: this._duration,
      isPlaying: this._isPlaying,
      isLoaded: this._isLoaded,
      didJustFinish: this._didJustFinish,
    }
  }

  private notify() {
    const status = this.getStatus()
    this.listeners.forEach(l => l(status))
    this._didJustFinish = false // consume-on-read: un solo disparo por fin
  }

  async loadTrack(uri: string): Promise<void> {
    await this.unload()

    if (IS_WEB) {
      await webAudioEngine.load(uri)
      await webAudioEngine.setVolume(this._volume)
      this.startWebPolling()
      return
    }

    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: false, progressUpdateIntervalMillis: POLL_INTERVAL_MS, volume: this._volume }
    )
    this.sound = sound

    sound.setOnPlaybackStatusUpdate(status => {
      if (status.isLoaded) {
        this._position = status.positionMillis
        this._duration = status.durationMillis ?? 0
        this._isPlaying = status.isPlaying
        this._isLoaded = true
        this._didJustFinish = status.didJustFinish
        this.notify()
      }
    })

    const status = await sound.getStatusAsync()
    if (status.isLoaded) {
      this._position = status.positionMillis ?? 0
      this._duration = status.durationMillis ?? 0
      this._isLoaded = true
      this.notify()
    }
  }

  async play(): Promise<void> {
    if (IS_WEB) {
      await webAudioEngine.play()
      this.syncFromWebEngine()
      return
    }
    await this.sound?.playAsync()
    this._isPlaying = true
    this.notify()
  }

  async pause(): Promise<void> {
    if (IS_WEB) {
      webAudioEngine.pause()
      this.syncFromWebEngine()
      return
    }
    await this.sound?.pauseAsync()
    this._isPlaying = false
    this.notify()
  }

  async togglePlay(): Promise<void> {
    if (this._isPlaying) {
      await this.pause()
    } else {
      await this.play()
    }
  }

  async setVolume(volume: number): Promise<void> {
    this._volume = Math.min(1, Math.max(0, volume))
    if (IS_WEB) {
      await webAudioEngine.setVolume(this._volume)
      return
    }
    if (this.sound) {
      await this.sound.setVolumeAsync(this._volume)
    }
  }

  async seek(positionMs: number): Promise<void> {
    if (IS_WEB) {
      webAudioEngine.seek(positionMs)
      this._position = positionMs
      this.notify()
      return
    }
    await this.sound?.setPositionAsync(positionMs)
    this._position = positionMs
    this.notify()
  }

  async unload(): Promise<void> {
    this.stopWebPolling()
    if (IS_WEB) {
      webAudioEngine.unload()
    }
    if (this.sound) {
      await this.sound.unloadAsync()
      this.sound = null
    }
    this._position = 0
    this._duration = 0
    this._isPlaying = false
    this._isLoaded = false
    this._didJustFinish = false
    this.notify()
  }

  /**
   * Niveles por banda del AnalyserNode (solo web con stream CORS-ok).
   * null => el EQ usa su animación random de siempre.
   */
  getAudioLevels(bands: number): number[] | null {
    if (!IS_WEB || !this._isLoaded) return null
    return webAudioEngine.getLevels(bands)
  }

  /** Modo cinta gastada: lowpass + wow/flutter + velocidad con pitch (solo web) */
  setWornTape(enabled: boolean, speed = 1): void {
    if (!IS_WEB) return
    webAudioEngine.setWorn(enabled, speed)
  }

  /**
   * Forma de onda -1..1 del AnalyserNode (solo web con CORS-ok).
   * null => el osciloscopio dibuja su modo reposo.
   */
  getWaveform(points: number): Float32Array | null {
    if (!IS_WEB || !this._isLoaded) return null
    return webAudioEngine.getWaveform(points)
  }

  private startWebPolling() {
    this.stopWebPolling()
    this.syncFromWebEngine(true)
    this.pollTimer = setInterval(() => this.syncFromWebEngine(), POLL_INTERVAL_MS)
  }

  private stopWebPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
  }

  private syncFromWebEngine(forceLoaded = false) {
    this._position = webAudioEngine.position
    this._duration = webAudioEngine.duration
    this._isPlaying = webAudioEngine.isPlaying
    this._didJustFinish = webAudioEngine.consumeEnded()
    if (!this._isLoaded && forceLoaded) this._isLoaded = true
    this.notify()
  }
}

export const audioPlayer = new AudioPlayer()
