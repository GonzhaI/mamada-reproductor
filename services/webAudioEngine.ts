// Motor de audio para web/Tauri: <audio> nativo del DOM + AnalyserNode opcional.
//
// Por qué no expo-av en web: envuelve un <audio> interno que no expone, y sin
// acceso al elemento no hay forma de colgarle un AnalyserNode para el EQ real.
//
// Estrategia CORS: el stream solo puede pasar por Web Audio si el CDN manda
// cabeceras ACAO. Se hace un probe previo (HEAD, luego GET con Range como
// plan B); si falla, se reproduce plano sin análisis y el EQ cae al modo random.

export interface WebPlaybackStatus {
  position: number // ms
  duration: number // ms
  isPlaying: boolean
}

async function probeCors(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD', mode: 'cors' })
    return res.ok
  } catch {
    try {
      const res = await fetch(url, { headers: { Range: 'bytes=0-1' }, mode: 'cors' })
      return res.ok
    } catch {
      return false
    }
  }
}

class WebAudioEngine {
  private el: HTMLAudioElement | null = null
  private ctx: AudioContext | null = null
  private source: MediaElementAudioSourceNode | null = null
  private analyser: AnalyserNode | null = null
  private freq: Uint8Array<ArrayBuffer> | null = null
  private smooth: number[] = []
  private analysable = false
  // Modo cinta gastada: filtro lowpass + wow/flutter + velocidad (pitch)
  private filter: BiquadFilterNode | null = null
  private wornEnabled = false
  private wornSpeed = 1
  private wowPhase = 0
  private wowTimer: ReturnType<typeof setInterval> | null = null

  get position(): number {
    return (this.el?.currentTime ?? 0) * 1000
  }

  get duration(): number {
    const d = this.el?.duration ?? 0
    return Number.isFinite(d) ? d * 1000 : 0
  }

  get isPlaying(): boolean {
    return !!this.el && !this.el.paused && !this.el.ended
  }

  /** true si hay AnalyserNode activo (=> getLevels devuelve datos reales) */
  get canAnalyse(): boolean {
    return this.analysable && !!this.analyser
  }

  /**
   * Configura el modo cinta gastada. Se aplica al elemento actual y queda
   * memorizado para las próximas cargas.
   */
  setWorn(enabled: boolean, speed: number): void {
    this.wornEnabled = enabled
    this.wornSpeed = Math.min(1.5, Math.max(0.5, speed))
    this.applyWorn()
  }

  private applyWorn(): void {
    const el = this.el
    if (!el) return
    try {
      // preservesPitch=false => la velocidad arrastra el tono, como cinta real
      ;(el as HTMLMediaElement & { webkitPreservesPitch?: boolean }).webkitPreservesPitch =
        !this.wornEnabled
      el.preservesPitch = !this.wornEnabled
    } catch {
      // navegador viejo sin la prop
    }
    if (this.filter) {
      try {
        this.filter.frequency.setTargetAtTime(
          this.wornEnabled ? 3200 : 20000,
          this.ensureCtx()?.currentTime ?? 0,
          0.05
        )
      } catch {
        // noop
      }
    }
    if (this.wornEnabled) this.startWow()
    else this.stopWow(true)
  }

  // Wow & flutter: ondulación lenta de la velocidad (~6Hz, ±0.7%) via rAF-less interval.
  // playbackRate no es AudioParam, así que se setea por tick — a esta profundidad es inaudible como pasos.
  private startWow(): void {
    if (this.wowTimer) return
    this.wowPhase = Math.random() * Math.PI * 2
    this.wowTimer = setInterval(() => {
      const el = this.el
      if (!el) return
      try {
        this.wowPhase += 0.36
        el.playbackRate = this.wornSpeed * (1 + 0.007 * Math.sin(this.wowPhase))
      } catch {
        // noop
      }
    }, 60)
  }

  private stopWow(resetRate: boolean): void {
    if (this.wowTimer) {
      clearInterval(this.wowTimer)
      this.wowTimer = null
    }
    if (resetRate && this.el) {
      try {
        this.el.playbackRate = this.wornSpeed
      } catch {
        // noop
      }
    }
  }

  async load(uri: string): Promise<void> {
    this.teardownElement()

    const el = new Audio()
    el.preload = 'auto'

    let corsOk = false
    try {
      corsOk = await probeCors(uri)
    } catch {
      corsOk = false
    }
    if (corsOk) el.crossOrigin = 'anonymous'

    this.analysable = false
    this.smooth = []
    this.el = el

    await new Promise<void>(resolve => {
      let settled = false
      const done = () => {
        if (settled) return
        settled = true
        resolve()
      }
      el.addEventListener('loadedmetadata', done, { once: true })
      el.addEventListener('canplay', done, { once: true })
      el.addEventListener('error', done, { once: true })
      setTimeout(done, 8000) // streams lentos: seguir igual
      el.src = uri
    })

    // El elemento ya cargó: recién ahora cablear el grafo (si el probe dio OK).
    if (corsOk) this.wireAnalyser(el)
    // Aplicar modo cinta (velocidad/pitch) al elemento fresco
    this.applyWorn()
  }

  private ensureCtx(): AudioContext | null {
    try {
      if (!this.ctx) {
        const Ctor: typeof AudioContext | undefined =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (!Ctor) return null
        this.ctx = new Ctor()
      }
      return this.ctx
    } catch {
      return null
    }
  }

  private wireAnalyser(el: HTMLAudioElement): void {
    const ctx = this.ensureCtx()
    if (!ctx) return
    try {
      const source = ctx.createMediaElementSource(el)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.55 // respuesta rápida sin nerviosismo
      // Lowpass transparente (20kHz) para el modo cinta gastada
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = this.wornEnabled ? 3200 : 20000
      filter.Q.value = 0.4
      source.connect(filter)
      filter.connect(analyser)
      analyser.connect(ctx.destination)
      this.source = source
      this.filter = filter
      this.analyser = analyser
      this.freq = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount))
      this.analysable = true
    } catch {
      // Sin análisis (CORS tardío, límite de fuentes, etc.): reproducción normal.
      this.analysable = false
    }
  }

  async play(): Promise<void> {
    if (!this.el) return
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume()
      } catch {
        // seguir: si el ctx no reanuda y hay grafo, no habrá sonido;
        // pero todo nuestro flujo de play viene de un gesto de usuario.
      }
    }
    try {
      await this.el.play()
    } catch {
      // AbortError por cambios rápidos de pista: inofensivo
    }
  }

  pause(): void {
    this.el?.pause()
  }

  seek(ms: number): void {
    if (!this.el) return
    try {
      this.el.currentTime = ms / 1000
    } catch {
      // seek antes de metadata: ignorar
    }
  }

  async setVolume(volume: number): Promise<void> {
    if (this.el) this.el.volume = Math.min(1, Math.max(0, volume))
  }

  unload(): void {
    this.stopWow(false)
    this.teardownElement()
  }

  private teardownElement(): void {
    const el = this.el
    this.el = null
    if (this.source) {
      try {
        this.source.disconnect()
      } catch {
        // noop
      }
      this.source = null
    }
    // analyser/ctx son singletons: se reusan entre pistas
    this.analyser = null
    this.freq = null
    if (el) {
      try {
        el.pause()
        el.removeAttribute('src')
        el.load() // libera el stream
      } catch {
        // noop
      }
    }
  }

  /**
   * Niveles normalizados 0..1 por banda, con suavizado attack-instantáneo /
   * decay lento estilo VU. null si no hay análisis disponible.
   *
   * Curva afinada a oído+prueba: solo se mapean los bins con contenido
   * musical real (hasta ~9kHz; por encima casi no hay energía y desperdician
   * bandas), agregación mezcla pico+promedio para que las barras reaccionen,
   * y ganancia generosa porque los bytes de FFT crudos quedan bajos.
   */
  getLevels(bands: number): number[] | null {
    if (!this.analyser || !this.freq) return null
    this.analyser.getByteFrequencyData(this.freq)

    // Techo musical ~9kHz (binHz = sampleRate/2 / cantidad de bins)
    const binHz = this.analyser.context.sampleRate / 2 / this.freq.length
    const maxBin = Math.max(
      2,
      Math.min(this.freq.length - 1, Math.round(9000 / binHz))
    )

    const out: number[] = []
    for (let b = 0; b < bands; b++) {
      const lo = Math.max(1, Math.floor(Math.pow(maxBin, b / bands)))
      const hi = Math.max(lo + 1, Math.floor(Math.pow(maxBin, (b + 1) / bands)))
      let sum = 0
      let peak = 0
      for (let i = lo; i < hi; i++) {
        const v = this.freq[i]!
        sum += v
        if (v > peak) peak = v
      }
      const avg = sum / (hi - lo) / 255
      const agg = (peak / 255) * 0.65 + avg * 0.35 // el pico manda, el promedio da cuerpo
      // Graves levemente damped (saturan), agudos muy realzados (sin energía)
      const gain = 1.0 + 1.6 * (b / Math.max(bands - 1, 1))
      const v = Math.min(1, Math.sqrt(agg * gain) * 1.3)
      const prev = this.smooth[b] ?? 0
      const smoothed = v > prev ? v : prev * 0.86 // decay
      this.smooth[b] = smoothed
      out.push(smoothed)
    }
    return out
  }
}

export const webAudioEngine = new WebAudioEngine()
