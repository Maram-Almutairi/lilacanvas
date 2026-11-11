export type RGB = [number, number, number]

export function normHex(input: string): string | null {
  let h = input.trim().replace(/^#/, '')
  if (/^[0-9a-f]{3}$/i.test(h)) h = h.split('').map((c) => c + c).join('')
  return /^[0-9a-f]{6}$/i.test(h) ? '#' + h.toUpperCase() : null
}
export function hexToRgb(hex: string): RGB {
  const h = (normHex(hex) ?? '#000000').slice(1)
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}
export function rgbToHex([r, g, b]: RGB): string {
  return '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('').toUpperCase()
}
export function rgbToHsl([r, g, b]: RGB): RGB {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0, s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
  }
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)]
}
export function hslToRgb([h, s, l]: RGB): RGB {
  s /= 100; l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)]
}
export const hexToHsl = (hex: string) => rgbToHsl(hexToRgb(hex))
export const hslToHex = (hsl: RGB) => rgbToHex(hslToRgb(hsl))
export const fmtRgb = (hex: string) => `rgb(${hexToRgb(hex).join(', ')})`
export const fmtHsl = (hex: string) => { const [h, s, l] = hexToHsl(hex); return `hsl(${h}, ${s}%, ${l}%)` }

export function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
export function contrast(a: string, b: string) {
  const la = luminance(a), lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}
export const isDark = (hex: string) => luminance(hex) < 0.32
export const inkOn = (hex: string) => (isDark(hex) ? '#F6F2F8' : '#211D2B')

const rot = (hex: string, deg: number, ds = 0, dl = 0) => {
  const [h, s, l] = hexToHsl(hex)
  return hslToHex([(h + deg + 360) % 360, Math.max(4, Math.min(96, s + ds)), Math.max(6, Math.min(94, l + dl))])
}
export function harmonies(hex: string): { name: string; colors: string[] }[] {
  const base = normHex(hex) ?? '#B7A0F4'
  return [
    { name: 'Complementary', colors: [rot(base, 0, 0, 14), base, rot(base, 0, 0, -18), rot(base, 180, 0, 12), rot(base, 180)] },
    { name: 'Analogous', colors: [rot(base, -40), rot(base, -20), base, rot(base, 20), rot(base, 40)] },
    { name: 'Triadic', colors: [base, rot(base, 0, -20, 22), rot(base, 120), rot(base, 240), rot(base, 240, -20, 22)] },
    { name: 'Split complementary', colors: [base, rot(base, 0, -15, -22), rot(base, 150), rot(base, 210), rot(base, 180, -30, 30)] },
    { name: 'Monochrome', colors: [rot(base, 0, -6, 30), rot(base, 0, -3, 15), base, rot(base, 0, 3, -15), rot(base, 0, 6, -30)] },
  ]
}

const cache = new Map<string, string[]>()
/** Dominant colours of an image: coarse histogram, then greedy picks kept apart in RGB space. */
export function extractPalette(src: string, count = 6): Promise<string[]> {
  const key = src.length > 200 ? src.slice(0, 80) + src.length + ':' + count : src + ':' + count
  if (cache.has(key)) return Promise.resolve(cache.get(key)!)
  return new Promise((resolve) => {
    const im = new Image()
    im.crossOrigin = 'anonymous'
    im.onload = () => {
      const N = 72
      const c = document.createElement('canvas')
      c.width = N; c.height = N
      const ctx = c.getContext('2d', { willReadFrequently: true })!
      ctx.drawImage(im, 0, 0, N, N)
      let data: Uint8ClampedArray
      try { data = ctx.getImageData(0, 0, N, N).data } catch { return resolve([]) }
      const buckets = new Map<number, [number, number, number, number]>()
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 128) continue
        const k = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4)
        const b = buckets.get(k) ?? [0, 0, 0, 0]
        b[0] += data[i]; b[1] += data[i + 1]; b[2] += data[i + 2]; b[3]++
        buckets.set(k, b)
      }
      const list = [...buckets.values()].map(([r, g, b, n]) => {
        const rgb: RGB = [r / n, g / n, b / n]
        const sat = rgbToHsl(rgb)[1] / 100
        return { rgb, score: n * (0.35 + sat) }
      }).sort((a, b) => b.score - a.score)
      const picks: RGB[] = []
      for (let min = 70; picks.length < count && min >= 10; min -= 20) {
        for (const c of list) {
          if (picks.length >= count) break
          if (picks.every((p) => Math.hypot(p[0] - c.rgb[0], p[1] - c.rgb[1], p[2] - c.rgb[2]) > min)) picks.push(c.rgb)
        }
      }
      const out = picks.sort((a, b) => luminance(rgbToHex(a)) - luminance(rgbToHex(b))).map(rgbToHex)
      cache.set(key, out)
      resolve(out)
    }
    im.onerror = () => resolve([])
    im.src = src
  })
}
