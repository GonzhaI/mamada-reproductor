// Punto 5 — stats de Awesome Mixes: duraciones m:ss -> total, formato, shuffle.
export function parseDuration(d: string): number {
  const m = d.trim().match(/^(?:(\d+):)?(\d{1,2}):(\d{2})$/)
  if (m) {
    const h = m[1] ? Number(m[1]) : 0
    return h * 3600 + Number(m[2]) * 60 + Number(m[3])
  }
  const m2 = d.trim().match(/^(\d+):(\d{2})$/)
  if (m2) return Number(m2[1]) * 60 + Number(m2[2])
  return 0
}

export function formatTotal(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  if (h > 0) return `${h}H ${m}M`
  return `${m} MIN`
}

/** Orden aleatorio de índices 0..n-1 (Fisher-Yates) para SHUFFLE del mix */
export function shuffledIndexes(n: number, startAt = 0): number[] {
  const rest: number[] = []
  for (let i = 0; i < n; i++) if (i !== startAt) rest.push(i)
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[rest[i], rest[j]] = [rest[j]!, rest[i]!]
  }
  return [startAt, ...rest]
}
