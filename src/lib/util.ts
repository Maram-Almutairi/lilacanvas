import Konva from 'konva'
import type { Box, Obj, TextObj } from '../types'

export const uid = () => Math.random().toString(36).slice(2, 10)
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
export const round = (v: number, p = 0) => { const m = 10 ** p; return Math.round(v * m) / m }

export const FONTS = [
  { label: 'Manrope', value: 'Manrope Variable' },
  { label: 'Inter', value: 'Inter Variable' },
  { label: 'Bodoni Moda', value: 'Bodoni Moda Variable' },
  { label: 'DM Mono', value: 'DM Mono' },
]
export const MANROPE = 'Manrope Variable', INTER = 'Inter Variable', BODONI = 'Bodoni Moda Variable', MONO = 'DM Mono'

export function timeAgo(t: number) {
  const s = (Date.now() - t) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`
  if (s < 86400 * 2) return 'yesterday'
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} days ago`
  return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function download(href: string, name: string) {
  const a = document.createElement('a')
  a.href = href; a.download = name
  document.body.appendChild(a); a.click(); a.remove()
}
export async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); return true } catch {
    const t = document.createElement('textarea')
    t.value = text; document.body.appendChild(t); t.select()
    const ok = document.execCommand('copy'); t.remove(); return ok
  }
}

export const fontStyle = (o: Pick<TextObj, 'fontWeight' | 'italic'>) => `${o.italic ? 'italic ' : ''}${o.fontWeight}`
export function measureText(o: TextObj) {
  const t = new Konva.Text({ text: o.text || ' ', width: o.width, fontFamily: o.fontFamily, fontSize: o.fontSize, fontStyle: fontStyle(o), letterSpacing: o.letterSpacing, lineHeight: o.lineHeight })
  const h = Math.ceil(t.height())
  t.destroy()
  return h
}

/** Axis-aligned bounds of an object, rotation (about its centre) included. */
export function aabb(o: Obj): Box {
  if (!o.rotation) return { x: o.x, y: o.y, width: o.width, height: o.height }
  const r = (o.rotation * Math.PI) / 180
  const c = Math.abs(Math.cos(r)), s = Math.abs(Math.sin(r))
  const w = o.width * c + o.height * s, h = o.width * s + o.height * c
  return { x: o.x + o.width / 2 - w / 2, y: o.y + o.height / 2 - h / 2, width: w, height: h }
}
export function bounds(objs: Obj[]): Box {
  if (!objs.length) return { x: 0, y: 0, width: 1200, height: 800 }
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity
  for (const o of objs) {
    const b = aabb(o)
    x1 = Math.min(x1, b.x); y1 = Math.min(y1, b.y); x2 = Math.max(x2, b.x + b.width); y2 = Math.max(y2, b.y + b.height)
  }
  return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 }
}
export const intersects = (a: Box, b: Box) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y

/** Read an image file, downscale it, and return a data URL safe to keep in local storage. */
export function fileToImage(file: File, max = 1600): Promise<{ src: string; w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const im = new Image()
    im.onload = () => {
      const k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight))
      const w = Math.round(im.naturalWidth * k), h = Math.round(im.naturalHeight * k)
      const c = document.createElement('canvas')
      c.width = w; c.height = h
      c.getContext('2d')!.drawImage(im, 0, 0, w, h)
      URL.revokeObjectURL(url)
      const png = file.type === 'image/png' || file.type === 'image/svg+xml' || file.type === 'image/webp'
      resolve({ src: c.toDataURL(png ? 'image/png' : 'image/jpeg', 0.88), w, h })
    }
    im.onerror = () => { URL.revokeObjectURL(url); reject(new Error('This file could not be read as an image.')) }
    im.src = url
  })
}
