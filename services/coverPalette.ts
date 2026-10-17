// Extracción del color dominante de una carátula, sin dependencias.
// Solo web/Tauri (canvas 2D); en nativo devuelve null y el caller usa el
// accent del tema. Resultados cacheados por URL (los negativos por timeout
// no se cachean: se reintentan).

const SAMPLE = 24 // muestreo 24x24: suficiente y barato

const cache = new Map<string, string | null>()

interface Rgb {
  r: number
  g: number
  b: number
}

function rgbToHsv({ r, g, b }: Rgb): { h: number; s: number; v: number } {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const d = max - min
  let h = 0
  if (d > 0) {
    if (max === rn) h = ((gn - bn) / d) % 6
    else if (max === gn) h = (bn - rn) / d + 2
    else h = (rn - gn) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: max === 0 ? 0 : d / max, v: max }
}

function hsvToRgb(h: number, s: number, v: number): Rgb {
  const c = v * s
  const hp = ((h % 360) + 360) / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  let rgb: [number, number, number]
  if (hp < 1) rgb = [c, x, 0]
  else if (hp < 2) rgb = [x, c, 0]
  else if (hp < 3) rgb = [0, c, x]
  else if (hp < 4) rgb = [0, x, c]
  else if (hp < 5) rgb = [x, 0, c]
  else rgb = [c, 0, x]
  const m = v - c
  return {
    r: Math.round((rgb[0] + m) * 255),
    g: Math.round((rgb[1] + m) * 255),
    b: Math.round((rgb[2] + m) * 255),
  }
}

function toHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b].map(c => Math.min(255, Math.max(0, c)).toString(16).padStart(2, '0')).join('')}`
}

/** Bucket dominante por vivacidad, normalizado a un accent usable en UI oscura */
function extractFromPixels(data: Uint8ClampedArray): string | null {
  interface Bucket {
    pixels: number
    weight: number
    sumR: number
    sumG: number
    sumB: number
  }
  const buckets = new Map<number, Bucket>()
  let totalPixels = 0

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue
    totalPixels++
    const px: Rgb = { r: data[i], g: data[i + 1], b: data[i + 2] }
    const { s, v } = rgbToHsv(px)
    if (v < 0.12) continue // negro casi puro
    const key = ((px.r >> 5) << 6) | ((px.g >> 5) << 3) | (px.b >> 5)
    const entry =
      buckets.get(key) ?? { pixels: 0, weight: 0, sumR: 0, sumG: 0, sumB: 0 }
    entry.pixels += 1
    entry.weight += s * (0.25 + v)
    entry.sumR += px.r
    entry.sumG += px.g
    entry.sumB += px.b
    buckets.set(key, entry)
  }

  let best: Bucket | null = null
  for (const entry of buckets.values()) {
    if (!best || entry.weight > best.weight) best = entry
  }
  if (!best || best.pixels < 6 || totalPixels === 0) return null

  const avg: Rgb = {
    r: Math.round(best.sumR / best.pixels),
    g: Math.round(best.sumG / best.pixels),
    b: Math.round(best.sumB / best.pixels),
  }

  // Normalizar: saturación y brillo mínimos para que se lea como accent
  const hsv = rgbToHsv(avg)
  const s = Math.min(1, Math.max(hsv.s, 0.45))
  const v = Math.min(0.85, Math.max(hsv.v, 0.55))
  return toHex(hsvToRgb(hsv.h, s, v))
}

async function extractViaCanvas(url: string): Promise<string | null> {
  if (typeof document === 'undefined') return null
  try {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    await new Promise<void>((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout> | null = null
      img.onload = () => { if (timer) clearTimeout(timer); resolve() }
      img.onerror = () => { if (timer) clearTimeout(timer); reject(new Error('cover load error')) }
      timer = setTimeout(() => reject(new Error('cover load timeout')), 10000)
      img.src = url
    })
    const canvas = document.createElement('canvas')
    canvas.width = SAMPLE
    canvas.height = SAMPLE
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null
    ctx.drawImage(img, 0, 0, SAMPLE, SAMPLE)
    const { data } = ctx.getImageData(0, 0, SAMPLE, SAMPLE)
    return extractFromPixels(data)
  } catch (err) {
    // canvas tainted (sin CORS), imagen rota o timeout.
    // el timeout es transitorio (glitch de red): se re-lanza para NO cachear el negativo
    if (err instanceof Error && err.message === 'cover load timeout') throw err
    return null
  }
}

/**
 * Color accent dominante de la carátula (#rrggbb), o null si no se pudo.
 * Acepta URL https o asset require() (solo web: require resuelve a URL string).
 */
export async function extractCoverAccent(
  coverUrl?: string | number | null
): Promise<string | null> {
  const url = coverUrl == null ? null : String(coverUrl)
  if (!url || !/^https?:\/\//.test(url)) return null
  if (cache.has(url)) return cache.get(url) ?? null
  try {
    const color = await extractViaCanvas(url)
    cache.set(url, color)
    return color
  } catch {
    return null // timeout: no se cachea, el próximo intento lo reintenta
  }
}
