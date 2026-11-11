import type { Obj } from '../types'
import { uid } from './util'

/* Board files and drag payloads come from outside the app. Nothing in them is trusted:
   every object is rebuilt field by field from a whitelist, so unknown keys, wrong types,
   remote image URLs and absurd sizes never reach the canvas or storage. */

const num = (v: unknown, d: number, min = -1e5, max = 1e5) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : d)
const str = (v: unknown, d = '', max = 4000) => (typeof v === 'string' ? v.slice(0, max) : d)
const color = (v: unknown, d: string, allowEmpty = false) => (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v.toUpperCase() : allowEmpty && v === '' ? '' : d)
const pick = <T extends string>(v: unknown, options: readonly T[], d: T) => (options.includes(v as T) ? (v as T) : d)
const FONTS = ['Manrope Variable', 'Inter Variable', 'Bodoni Moda Variable', 'DM Mono']

/** Only images that ship with the app or are embedded in the file itself. No remote requests. */
export const safeSrc = (v: unknown) => (typeof v === 'string' && (/^img\/[a-z0-9-]+\.jpg$/i.test(v) || /^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i.test(v)) ? v : null)

export function sanitizeObjects(input: unknown, limit = 1500): Obj[] {
  if (!Array.isArray(input)) return []
  const out: Obj[] = []
  for (const raw of input.slice(0, limit)) {
    if (!raw || typeof raw !== 'object') continue
    const r = raw as Record<string, unknown>
    const base = {
      id: uid(), x: num(r.x, 0), y: num(r.y, 0), width: num(r.width, 100, 1, 2e4), height: num(r.height, 100, 1, 2e4),
      rotation: num(r.rotation, 0, -360, 360), opacity: num(r.opacity, 1, 0, 1), groupId: typeof r.groupId === 'string' ? r.groupId.slice(0, 40) : undefined,
    }
    switch (r.type) {
      case 'image': {
        const src = safeSrc(r.src)
        if (!src) break
        out.push({ ...base, type: 'image', src, radius: num(r.radius, 0, 0, 1e4), fit: pick(r.fit, ['cover', 'contain'] as const, 'cover'), mat: num(r.mat, 0, 0, 200), tape: r.tape === true, cropX: num(r.cropX, 0.5, 0, 1), cropY: num(r.cropY, 0.5, 0, 1) })
        break
      }
      case 'text':
        out.push({ ...base, type: 'text', text: str(r.text), fontFamily: pick(r.fontFamily, FONTS, FONTS[1]), fontSize: num(r.fontSize, 16, 2, 2000), fontWeight: num(r.fontWeight, 400, 100, 900), italic: r.italic === true,
          letterSpacing: num(r.letterSpacing, 0, -100, 400), lineHeight: num(r.lineHeight, 1.3, 0.5, 4), align: pick(r.align, ['left', 'center', 'right'] as const, 'left'), fill: color(r.fill, '#211D2B') })
        break
      case 'swatch':
        out.push({ ...base, type: 'swatch', color: color(r.color, '#B7A0F4'), label: str(r.label, '', 80), shape: pick(r.shape, ['chip', 'dot'] as const, 'chip') })
        break
      case 'palette': {
        const colors = (Array.isArray(r.colors) ? r.colors : []).slice(0, 12).map((c) => color(c, '')).filter(Boolean)
        if (colors.length) out.push({ ...base, type: 'palette', colors })
        break
      }
      case 'frame':
        out.push({ ...base, type: 'frame', fill: color(r.fill, '#FBFAFC'), label: str(r.label, 'Frame', 80), layout: pick(r.layout, ['free', 'row', 'grid'] as const, 'free'), spacing: num(r.spacing, 16, 0, 400) })
        break
      case 'note':
        out.push({ ...base, type: 'note', text: str(r.text), color: color(r.color, '#F3E3A1') })
        break
      case 'shape':
        out.push({ ...base, type: 'shape', kind: pick(r.kind, ['rect', 'ellipse'] as const, 'rect'), fill: color(r.fill, '', true), stroke: color(r.stroke, '', true), strokeWidth: num(r.strokeWidth, 0, 0, 200), radius: num(r.radius, 0, 0, 1e4) })
        break
    }
  }
  return out
}

const KINDS = ['Branding', 'Editorial', 'Interior', 'Web', 'Photography', 'Other'] as const
export function sanitizeBoard(input: unknown) {
  const r = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  return { name: str(r.name, 'Imported board', 120).trim() || 'Imported board', kind: pick(r.kind, KINDS, 'Other'), description: str(r.description, '', 300), canvasColor: color(r.canvasColor, '#D5D0DC'), objects: sanitizeObjects(r.objects) }
}
