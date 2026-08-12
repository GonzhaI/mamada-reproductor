import { Audio } from 'expo-av'

export type PlayerStatus = {
  position: number
  duration: number
  isPlaying: boolean
  isLoaded: boolean
}

type PlayerListener = (status: PlayerStatus) => void

const POLL_INTERVAL_MS = 250

class AudioPlayer {
  private sound: Audio.Sound | null = null
  private listeners = new Set<PlayerListener>()
  private pollTimer: ReturnType<typeof setInterval> | null = null

  private _position = 0
  private _duration = 0
  private _isPlaying = false
  private _isLoaded = false

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
    }
  }

  private notify() {
    const status = this.getStatus()
    this.listeners.forEach(l => l(status))
  }

  async loadTrack(uri: string): Promise<void> {
    await this.unload()

    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: false, progressUpdateIntervalMillis: POLL_INTERVAL_MS }
    )
    this.sound = sound

    sound.setOnPlaybackStatusUpdate(status => {
      if (status.isLoaded) {
        this._position = status.positionMillis
        this._duration = status.durationMillis ?? 0
        this._isPlaying = status.isPlaying
        this._isLoaded = true
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
    await this.sound?.playAsync()
    this._isPlaying = true
    this.notify()
  }

  async pause(): Promise<void> {
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

  async seek(positionMs: number): Promise<void> {
    await this.sound?.setPositionAsync(positionMs)
    this._position = positionMs
    this.notify()
  }

  async unload(): Promise<void> {
    if (this.sound) {
      await this.sound.unloadAsync()
      this.sound = null
    }
    this._position = 0
    this._duration = 0
    this._isPlaying = false
    this._isLoaded = false
    this.notify()
  }
}

export const audioPlayer = new AudioPlayer()
