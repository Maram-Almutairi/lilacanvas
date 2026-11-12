import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { X } from 'lucide-react'
import type { Board, Obj } from './types'
import { useStore } from './store'
import { bounds, round } from './lib/util'
import { inkOn, isDark } from './lib/color'

/* ---------- routing (hash) ---------- */
const subscribeHash = (cb: () => void) => { window.addEventListener('hashchange', cb); return () => window.removeEventListener('hashchange', cb) }
export function useRoute() {
  const hash = useSyncExternalStore(subscribeHash, () => window.location.hash)
  const [view = 'home', param = ''] = hash.replace(/^#\/?/, '').split('/')
  return { view: view || 'home', param: decodeURIComponent(param) }
}
export const nav = (path: string) => { window.location.hash = '#/' + path }

/* ---------- brand ---------- */
export function Mark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="1.75" y="1.75" width="11" height="11" rx="1.75" stroke="var(--text)" strokeWidth="1.5" />
      <rect x="7" y="7" width="11.5" height="11.5" rx="1.75" fill="var(--accent)" />
    </svg>
  )
}
export function Logo({ compact }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <Mark />
      {!compact && (
        <span className="font-display text-[12.5px] leading-none tracking-[0.2em]">
          <span className="font-extrabold">LILA</span><span className="font-medium text-muted">CANVAS</span>
        </span>
      )}
    </span>
  )
}

/* ---------- small pieces ---------- */
export function Tip({ label, keys, down, children, className = '' }: { label: string; keys?: string; down?: boolean; children: ReactNode; className?: string }) {
  return (
    <span className={`tip ${down ? 'tip-down' : ''} inline-flex ${className}`}>
      {children}
      <span className="tiptext" role="tooltip">{label}{keys && <kbd>{keys}</kbd>}</span>
    </span>
  )
}

export function useOutside(ref: React.RefObject<HTMLElement | null>, onClose: () => void, active = true) {
  useEffect(() => {
    if (!active) return
    const down = (e: PointerEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('pointerdown', down, true)
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('pointerdown', down, true); document.removeEventListener('keydown', key) }
  }, [active]) // eslint-disable-line
}

/** Button with an anchored popover menu. */
export function Menu({ trigger, children, align = 'right', width = 220, up }: { trigger: (open: boolean, toggle: () => void) => ReactNode; children: (close: () => void) => ReactNode; align?: 'left' | 'right'; width?: number; up?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useOutside(ref, () => setOpen(false), open)
  return (
    <div ref={ref} className="relative inline-flex">
      {trigger(open, () => setOpen((o) => !o))}
      {open && (
        <div className={`pop absolute z-50 p-1 ${up ? 'bottom-[calc(100%+6px)]' : 'top-[calc(100%+6px)]'} ${align === 'right' ? 'right-0' : 'left-0'}`} style={{ width }} role="menu">
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

export function Dialog({ title, onClose, children, width = 460 }: { title: string; onClose: () => void; children: ReactNode; width?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useOutside(ref, onClose)
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/45 p-4 fadein">
      <div ref={ref} className="pop w-full max-h-[86vh] overflow-auto" style={{ maxWidth: width }} role="dialog" aria-label={title}>
        <div className="flex items-center justify-between pl-4 pr-2 h-11 border-b border-line">
          <h2 className="text-[13px] font-semibold">{title}</h2>
          <button className="iconbtn" onClick={onClose} aria-label="Close"><X size={15} /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

export function Toasts() {
  const toasts = useStore((s) => s.toasts)
  const dismiss = useStore((s) => s.dismiss)
  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-[84px] z-[90] flex flex-col items-center gap-2 pointer-events-none" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast pointer-events-auto flex items-center gap-3 pl-3.5 pr-1.5 h-9 rounded-lg bg-ink text-bg text-[12.5px] font-medium shadow-lg">
          {t.text}
          {t.action ? <button className="h-6 px-2 rounded-md font-semibold underline underline-offset-2" onClick={() => { t.action!.run(); dismiss(t.id) }}>{t.action.label}</button> : <span className="w-2" />}
        </div>
      ))}
    </div>
  )
}

/** Image with a skeleton until it has loaded. */
export function Img({ src, alt = '', className = '', style }: { src: string; alt?: string; className?: string; style?: React.CSSProperties }) {
  const [ok, setOk] = useState(false)
  return (
    <span className={`relative block overflow-hidden ${className}`} style={style}>
      {!ok && <span className="skel absolute inset-0" />}
      <img src={src} alt={alt} draggable={false} loading="lazy" onLoad={() => setOk(true)} className="w-full h-full object-cover block transition-opacity duration-500" style={{ opacity: ok ? 1 : 0 }} />
    </span>
  )
}

export function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    setSize({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [])
  return [ref, size] as const
}

/* ---------- live board preview, drawn in the DOM ---------- */
function ThumbObj({ o }: { o: Obj }) {
  const box: React.CSSProperties = { position: 'absolute', left: o.x, top: o.y, width: o.width, height: o.height, transform: o.rotation ? `rotate(${o.rotation}deg)` : undefined, opacity: o.opacity }
  switch (o.type) {
    case 'image':
      return (
        <div style={{ ...box, background: o.mat ? '#fff' : undefined, padding: o.mat, boxShadow: '0 6px 18px rgba(20,14,30,.18)', borderRadius: o.mat ? 2 : o.radius }}>
          <img src={o.src} alt="" draggable={false} loading="lazy" style={{ width: '100%', height: '100%', objectFit: o.fit, objectPosition: `${o.cropX * 100}% ${o.cropY * 100}%`, borderRadius: o.radius, display: 'block' }} />
        </div>
      )
    case 'text':
      return <div style={{ ...box, height: 'auto', fontFamily: `"${o.fontFamily}"`, fontSize: o.fontSize, fontWeight: o.fontWeight, fontStyle: o.italic ? 'italic' : undefined, letterSpacing: o.letterSpacing, lineHeight: o.lineHeight, textAlign: o.align, color: o.fill, whiteSpace: 'pre-wrap' }}>{o.text}</div>
    case 'swatch':
      return o.shape === 'dot'
        ? <div style={{ ...box, background: o.color, borderRadius: '50%' }} />
        : <div style={{ ...box, background: '#fff', borderRadius: 3, boxShadow: '0 4px 12px rgba(20,14,30,.16)', overflow: 'hidden' }}><div style={{ height: o.height - 38, background: o.color }} /></div>
    case 'palette':
      return <div style={{ ...box, display: 'flex', borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 12px rgba(20,14,30,.14)' }}>{o.colors.map((c, i) => <div key={i} style={{ flex: 1, background: c }} />)}</div>
    case 'frame':
      return <div style={{ ...box, background: o.fill, borderRadius: 3, outline: '1px solid rgba(120,110,140,.25)' }} />
    case 'note':
      return <div style={{ ...box, background: o.color, padding: 14, fontSize: 13.5, lineHeight: 1.4, color: '#2B2633', boxShadow: '0 6px 14px rgba(20,14,30,.18)', overflow: 'hidden' }}>{o.text}</div>
    case 'shape':
      return <div style={{ ...box, background: o.fill || undefined, border: o.strokeWidth ? `${o.strokeWidth}px solid ${o.stroke}` : undefined, borderRadius: o.kind === 'ellipse' ? '50%' : o.radius }} />
  }
}
export function BoardThumb({ board, className = '', pad = 40, fit = 'cover' }: { board: Pick<Board, 'objects' | 'canvasColor'>; className?: string; pad?: number; fit?: 'cover' | 'contain' }) {
  const [ref, { w, h }] = useSize<HTMLDivElement>()
  const bb = bounds(board.objects)
  const bw = bb.width + pad * 2, bh = bb.height + pad * 2
  const s = w && h ? (fit === 'cover' ? Math.max(w / bw, h / bh) : Math.min(w / bw, h / bh)) : 0
  const dark = isDark(board.canvasColor)
  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`} style={{ background: board.canvasColor }}>
      <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(${dark ? 'rgba(255,255,255,.07)' : 'rgba(40,30,60,.1)'} 1px, transparent 1px)`, backgroundSize: '14px 14px' }} />
      {s > 0 && board.objects.length > 0 && (
        <div className="absolute fadein" style={{ left: fit === 'cover' ? 0 : (w - bw * s) / 2, top: fit === 'cover' ? 0 : (h - bh * s) / 2, width: bw, height: bh, transform: `scale(${s})`, transformOrigin: '0 0' }}>
          <div style={{ position: 'absolute', left: pad - bb.x, top: pad - bb.y }}>
            {board.objects.map((o) => <ThumbObj key={o.id} o={o} />)}
          </div>
        </div>
      )}
      {board.objects.length === 0 && <div className="absolute inset-0 grid place-items-center text-[11px] mono" style={{ color: inkOn(board.canvasColor), opacity: 0.5 }}>EMPTY BOARD</div>}
    </div>
  )
}

/* ---------- inputs ---------- */
export function Num({ label, value, onChange, step = 1, min = -1e6, max = 1e6, suffix, precision = 0 }: { label: string; value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number; suffix?: string; precision?: number }) {
  const [text, setText] = useState<string | null>(null)
  const drag = useRef<{ x: number; v: number } | null>(null)
  const set = (v: number) => { if (Number.isFinite(v)) onChange(round(Math.max(min, Math.min(max, v)), Math.max(precision, 2))) }
  return (
    <label className="field flex items-center gap-1.5 !px-0 overflow-hidden">
      <span
        className="mono text-[10.5px] text-muted pl-2 pr-0.5 h-full flex items-center cursor-ew-resize select-none touch-none shrink-0" title="Drag to adjust"
        onPointerDown={(e) => { drag.current = { x: e.clientX, v: value }; e.currentTarget.setPointerCapture(e.pointerId) }}
        onPointerMove={(e) => { if (drag.current) set(drag.current.v + Math.round(e.clientX - drag.current.x) * step * (e.shiftKey ? 10 : 1)) }}
        onPointerUp={() => (drag.current = null)}
      >{label}</span>
      <input
        className="mono text-[11.5px] bg-transparent w-full min-w-0 h-full pr-1" inputMode="decimal" aria-label={label}
        value={text ?? String(round(value, precision))}
        onFocus={(e) => { setText(String(round(value, precision))); e.currentTarget.select() }}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => { if (text !== null && text.trim() !== '') set(parseFloat(text)); setText(null) }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); const v = (text !== null ? parseFloat(text) || 0 : value) + (e.key === 'ArrowUp' ? 1 : -1) * step * (e.shiftKey ? 10 : 1); set(v); setText(String(round(v, precision))) }
        }}
      />
      {suffix && <span className="mono text-[10px] text-muted pr-2">{suffix}</span>}
    </label>
  )
}

export function Seg<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode; title?: string }[] }) {
  return (
    <div className="flex h-7 p-0.5 rounded-[5px] bg-bg w-full" role="radiogroup">
      {options.map((o) => (
        <button key={o.value} role="radio" aria-checked={value === o.value} title={o.title} onClick={() => onChange(o.value)}
          className={`flex-1 grid place-items-center rounded-[4px] text-[11.5px] font-medium transition-colors ${value === o.value ? 'bg-raised text-ink shadow-sm' : 'text-muted hover:text-ink'}`}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function ColorField({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const [text, setText] = useState<string | null>(null)
  const valid = /^#[0-9a-f]{6}$/i.test(value)
  return (
    <div className="field flex items-center gap-2 !pl-1">
      <span className="relative w-5 h-5 rounded-[4px] border border-line shrink-0 overflow-hidden" style={{ background: valid ? value : 'repeating-conic-gradient(var(--border) 0 25%, transparent 0 50%) 0 0/8px 8px' }}>
        <input type="color" value={valid ? value : '#B7A0F4'} onChange={(e) => onChange(e.target.value.toUpperCase())} aria-label="Pick colour" />
      </span>
      <input className="mono text-[11.5px] bg-transparent w-full min-w-0 uppercase" aria-label="Hex colour" value={text ?? (value || 'NONE')}
        onFocus={(e) => { setText(value); e.currentTarget.select() }}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => { if (text !== null) { const h = text.trim().replace(/^#?/, '#'); if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(h)) onChange(h.length === 4 ? ('#' + [...h.slice(1)].map((c) => c + c).join('')).toUpperCase() : h.toUpperCase()) } setText(null) }}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />
    </div>
  )
}
