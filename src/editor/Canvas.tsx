import { useCallback, useEffect, useRef, useState } from 'react'
import Konva from 'konva'
import { Layer, Rect, Stage, Transformer } from 'react-konva'
import { ImagePlus } from 'lucide-react'
import type { Board, Box, Obj, TextObj, NoteObj } from '../types'
import { getBoard, useStore } from '../store'
import { useSize } from '../ui'
import { aabb, bounds, clamp, download, fileToImage, intersects, INTER, MANROPE, round, uid } from '../lib/util'
import { isDark } from '../lib/color'
import { frame, imgFrom, note, shape, txt } from '../data/seed'
import { sanitizeObjects } from '../lib/sanitize'
import { ObjNode } from './nodes'
import { BottomBar, ContextMenu, SelectionBar } from './Chrome'

export interface View { s: number; x: number; y: number }
/** Imperative handle so the top bar and menus can reach the open canvas. */
export const editor: { exportPNG?: () => void; fit?: () => void; upload?: () => void; center?: () => { x: number; y: number } } = {}

type Gesture =
  | { kind: 'pan'; cx: number; cy: number; vx: number; vy: number }
  | { kind: 'marquee' | 'draw'; start: { x: number; y: number }; rect?: Box; add: string[] }
  | { kind: 'pinch'; d: number; s: number; cx: number; cy: number; vx: number; vy: number }

const editable = (t: EventTarget | null) => t instanceof HTMLElement && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)

export async function addFiles(files: File[], at: { x: number; y: number }) {
  const s = useStore.getState()
  const made: Obj[] = []
  for (const [i, f] of files.filter((f) => f.type.startsWith('image/')).entries()) {
    try {
      const { src, w, h } = await fileToImage(f)
      const a = s.addAsset({ category: 'Uploads', name: f.name.replace(/\.[^.]+$/, '') || 'Upload', tags: ['upload'], src, w, h })
      s.touchAsset(a.id)
      const width = Math.min(380, w)
      made.push(imgFrom(src, w, h, at.x - width / 2 + i * 28, at.y - (width * h) / w / 2 + i * 28, width))
    } catch (e) { s.toast((e as Error).message) }
  }
  if (made.length) { s.add(made); s.toast(made.length > 1 ? `${made.length} images placed` : 'Image placed') }
  else if (files.length) s.toast('Only image files can be placed on a board.')
}

export function Canvas({ board }: { board: Board }) {
  const [wrapRef, size] = useSize<HTMLDivElement>()
  const stageRef = useRef<Konva.Stage>(null)
  const layerRef = useRef<Konva.Layer>(null)
  const uiRef = useRef<Konva.Layer>(null)
  const trRef = useRef<Konva.Transformer>(null)
  const bgRef = useRef<Konva.Rect>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [view, setView] = useState<View>({ s: 1, x: 0, y: 0 })
  const vr = useRef(view); vr.current = view
  const selection = useStore((s) => s.selection)
  const tool = useStore((s) => s.tool)
  const editingId = useStore((s) => s.editingId)
  const [marquee, setMarquee] = useState<Box | null>(null)
  const [draft, setDraft] = useState<Box | null>(null)
  const [busy, setBusy] = useState(false)
  const [menu, setMenu] = useState<{ x: number; y: number; pt: { x: number; y: number }; onObj: boolean } | null>(null)
  const [space, setSpace] = useState(false)
  const [panning, setPanning] = useState(false)
  const [dropping, setDropping] = useState(false)
  const g = useRef<Gesture | null>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const dragStart = useRef(new Map<string, { n: Konva.Node; x: number; y: number }>())
  const dark = isDark(board.canvasColor)
  const objs = board.objects

  const toCanvas = useCallback((cx: number, cy: number) => {
    const r = wrapRef.current!.getBoundingClientRect(), v = vr.current
    return { x: (cx - r.left - v.x) / v.s, y: (cy - r.top - v.y) / v.s }
  }, [wrapRef])
  const center = useCallback(() => { const v = vr.current; return { x: (size.w / 2 - v.x) / v.s, y: (size.h / 2 - v.y) / v.s } }, [size.w, size.h])

  const fit = useCallback(() => {
    const b = getBoard()
    if (!b || !size.w) return
    const bb = bounds(b.objects)
    const s = clamp(Math.min((size.w - 96) / bb.width, (size.h - 170) / bb.height), 0.08, 1.4)
    setView({ s, x: (size.w - bb.width * s) / 2 - bb.x * s, y: (size.h - 44 - bb.height * s) / 2 - bb.y * s })
  }, [size.w, size.h])
  const zoomAt = useCallback((f: number, cx = size.w / 2, cy = size.h / 2) => setView((v) => {
    const s = clamp(v.s * f, 0.08, 5)
    return { s, x: cx - (cx - v.x) * (s / v.s), y: cy - (cy - v.y) * (s / v.s) }
  }), [size.w, size.h])
  const zoomTo = useCallback((s: number) => zoomAt(s / vr.current.s), [zoomAt])

  const ready = size.w > 0
  useEffect(() => { if (ready) fit() }, [board.id, ready]) // eslint-disable-line

  /* ----- export ----- */
  const exportPNG = useCallback(() => {
    const b = getBoard(), stage = stageRef.current, bg = bgRef.current, ui = uiRef.current
    const st = useStore.getState()
    if (!b || !stage || !bg || !ui || !b.objects.length) return st.toast('Nothing to export yet — add something to the board first.')
    const bb = bounds(b.objects), pad = 64, v = vr.current
    const box = { x: bb.x - pad, y: bb.y - pad, width: bb.width + pad * 2, height: bb.height + pad * 2 }
    bg.setAttrs({ ...box, fill: b.canvasColor, visible: true })
    ui.hide()
    try {
      const url = stage.toDataURL({ x: box.x * v.s + v.x, y: box.y * v.s + v.y, width: box.width * v.s, height: box.height * v.s, pixelRatio: Math.min(2, 4200 / box.width) / v.s, mimeType: 'image/png' })
      download(url, b.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.png')
      st.toast('Board exported as PNG')
    } catch { st.toast('Export failed — an image on this board blocks reading its pixels.') }
    bg.hide(); ui.show()
  }, [])
  useEffect(() => {
    Object.assign(editor, { exportPNG, fit, center, upload: () => fileRef.current?.click() })
    return () => { editor.exportPNG = editor.fit = editor.upload = editor.center = undefined }
  }, [exportPNG, fit, center])

  /* ----- transformer follows the selection ----- */
  useEffect(() => {
    const tr = trRef.current, layer = layerRef.current
    if (!tr || !layer) return
    const nodes = editingId ? [] : selection.map((id) => layer.findOne('#' + id)).filter(Boolean) as Konva.Node[]
    tr.nodes(nodes)
    tr.getLayer()?.batchDraw()
  }, [selection, objs, editingId])

  /* ----- gestures that outlive the canvas element ----- */
  useEffect(() => {
    const move = (ev: PointerEvent) => {
      if (pointers.current.has(ev.pointerId)) pointers.current.set(ev.pointerId, { x: ev.clientX, y: ev.clientY })
      const G = g.current
      if (!G) return
      if (G.kind === 'pinch') {
        const [a, b] = [...pointers.current.values()]
        if (!a || !b) return
        const r = wrapRef.current!.getBoundingClientRect()
        const d = Math.hypot(a.x - b.x, a.y - b.y), cx = (a.x + b.x) / 2 - r.left, cy = (a.y + b.y) / 2 - r.top
        const s = clamp((G.s * d) / G.d, 0.08, 5)
        setView({ s, x: cx - (G.cx - G.vx) * (s / G.s), y: cy - (G.cy - G.vy) * (s / G.s) })
      } else if (G.kind === 'pan') setView((v) => ({ ...v, x: G.vx + ev.clientX - G.cx, y: G.vy + ev.clientY - G.cy }))
      else {
        const p = toCanvas(ev.clientX, ev.clientY)
        const r = { x: Math.min(G.start.x, p.x), y: Math.min(G.start.y, p.y), width: Math.abs(p.x - G.start.x), height: Math.abs(p.y - G.start.y) }
        G.rect = r
        G.kind === 'marquee' ? setMarquee(r) : setDraft(r)
      }
    }
    const up = (ev: PointerEvent) => {
      pointers.current.delete(ev.pointerId)
      const G = g.current
      if (!G) return
      g.current = null
      const st = useStore.getState()
      const b = getBoard()
      if (G.kind === 'pan' || G.kind === 'pinch') setPanning(false)
      else if (G.kind === 'marquee') {
        setMarquee(null)
        if (b && G.rect && (G.rect.width > 3 || G.rect.height > 3)) {
          const hit = b.objects.filter((o) => intersects(aabb(o), G.rect!))
          const groups = new Set(hit.map((o) => o.groupId).filter(Boolean))
          st.select([...new Set([...G.add, ...b.objects.filter((o) => hit.includes(o) || (o.groupId && groups.has(o.groupId))).map((o) => o.id)])])
        } else if (!G.add.length) st.select([])
      } else {
        setDraft(null)
        const isFrame = st.tool === 'frame'
        const big = G.rect && G.rect.width > 8 && G.rect.height > 8
        const r = big ? G.rect! : isFrame ? { x: G.start.x - 180, y: G.start.y - 130, width: 360, height: 260 } : { x: G.start.x - 70, y: G.start.y - 70, width: 140, height: 140 }
        const dk = b ? isDark(b.canvasColor) : false
        const o = isFrame ? frame('Frame', r.x, r.y, r.width, r.height, dk ? '#262231' : '#FBFAFC') : shape(r.x, r.y, r.width, r.height, '#B7A0F4', { kind: ev.shiftKey ? 'ellipse' : 'rect' })
        if (isFrame) { st.mutate((cur) => [o, ...cur]); st.select([o.id]) } else st.add([o])
        st.setTool('move')
      }
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up) }
  }, [toCanvas, wrapRef])

  const onDown = (e: Konva.KonvaEventObject<PointerEvent>) => {
    const ev = e.evt
    setMenu(null)
    if (ev.button === 2 || editingId) return
    if (e.target.getLayer() === uiRef.current) return
    const st = useStore.getState()
    const hit = e.target === stageRef.current ? null : e.target.findAncestor('.obj', true)
    const pt = toCanvas(ev.clientX, ev.clientY)
    const v = vr.current
    if (pointers.current.size >= 2) return
    if (tool === 'hand' || space || ev.button === 1 || (ev.pointerType === 'touch' && !hit && tool === 'move')) {
      g.current = { kind: 'pan', cx: ev.clientX, cy: ev.clientY, vx: v.x, vy: v.y }
      setPanning(true)
      return
    }
    if (tool === 'move') {
      if (hit) {
        const id = hit.id()
        const o = objs.find((x) => x.id === id)
        const ids = o?.groupId ? objs.filter((x) => x.groupId === o.groupId).map((x) => x.id) : [id]
        if (ev.shiftKey) st.select(ids.every((i) => st.selection.includes(i)) ? st.selection.filter((i) => !ids.includes(i)) : [...new Set([...st.selection, ...ids])])
        else if (!st.selection.includes(id)) st.select(ids)
      } else g.current = { kind: 'marquee', start: pt, add: ev.shiftKey ? st.selection : [] }
    } else if (tool === 'frame' || tool === 'shape') g.current = { kind: 'draw', start: pt, add: [] }
    else {
      const o = tool === 'text'
        ? txt('', pt.x, pt.y - 14, 280, { fontFamily: MANROPE, fontSize: 24, fontWeight: 600, letterSpacing: -0.3, fill: dark ? '#F5F1F8' : '#211D2B' })
        : note('', pt.x - 100, pt.y - 75, '#F3E3A1')
      st.add([o]); st.setTool('move'); st.setEditing(o.id)
    }
  }
  /* two fingers: pinch to zoom, wherever they land */
  const onWrapDown = (ev: React.PointerEvent) => {
    if (ev.pointerType !== 'touch') return
    pointers.current.set(ev.pointerId, { x: ev.clientX, y: ev.clientY })
    if (pointers.current.size === 2) {
      layerRef.current?.find('.obj').forEach((n) => n.isDragging() && n.stopDrag())
      const [a, b] = [...pointers.current.values()]
      const r = wrapRef.current!.getBoundingClientRect(), v = vr.current
      g.current = { kind: 'pinch', d: Math.hypot(a.x - b.x, a.y - b.y) || 1, s: v.s, cx: (a.x + b.x) / 2 - r.left, cy: (a.y + b.y) / 2 - r.top, vx: v.x, vy: v.y }
      setMarquee(null); setDraft(null)
    }
  }
  const onWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    const ev = e.evt
    ev.preventDefault()
    const r = wrapRef.current!.getBoundingClientRect()
    if (ev.ctrlKey || ev.metaKey) zoomAt(Math.exp(-ev.deltaY * (ev.deltaMode ? 0.05 : 0.0035)), ev.clientX - r.left, ev.clientY - r.top)
    else setView((v) => ({ ...v, x: v.x - (ev.shiftKey ? ev.deltaY : ev.deltaX), y: v.y - (ev.shiftKey ? 0 : ev.deltaY) }))
  }

  /* ----- dragging: every selected object travels together ----- */
  const onDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (!e.target.hasName('obj')) return
    setBusy(true)
    const layer = layerRef.current!
    dragStart.current = new Map()
    for (const id of useStore.getState().selection) { const n = layer.findOne('#' + id); if (n) dragStart.current.set(id, { n, x: n.x(), y: n.y() }) }
  }
  const onDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    const me = dragStart.current.get(e.target.id())
    if (!me) return
    const dx = e.target.x() - me.x, dy = e.target.y() - me.y
    dragStart.current.forEach((o, id) => { if (id !== e.target.id()) o.n.position({ x: o.x + dx, y: o.y + dy }) })
  }
  const onDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (!e.target.hasName('obj')) return
    setBusy(false)
    const pos = new Map<string, { x: number; y: number }>()
    dragStart.current.forEach((o, id) => pos.set(id, o.n.position()))
    if (!pos.has(e.target.id())) pos.set(e.target.id(), e.target.position())
    useStore.getState().mutate((cur) => cur.map((o) => { const p = pos.get(o.id); return p ? { ...o, x: round(p.x - o.width / 2, 1), y: round(p.y - o.height / 2, 1) } : o }))
  }
  const onTransformEnd = () => {
    setBusy(false)
    const tr = trRef.current!
    const anchor = tr.getActiveAnchor() ?? ''
    const corner = ['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(anchor)
    const many = tr.nodes().length > 1
    const upd = new Map<string, Partial<Obj>>()
    for (const n of tr.nodes()) {
      const o = objs.find((x) => x.id === n.id())
      if (!o) continue
      const sx = Math.abs(n.scaleX()), sy = Math.abs(n.scaleY())
      const w = Math.max(4, o.width * sx), h = Math.max(4, o.height * sy)
      n.scale({ x: 1, y: 1 })
      const p: Record<string, unknown> = { width: round(w, 1), height: round(h, 1), x: round(n.x() - w / 2, 1), y: round(n.y() - h / 2, 1), rotation: round(n.rotation(), 1) }
      if (o.type === 'text' && (corner || many)) p.fontSize = round(o.fontSize * sy, 1)
      if (o.type === 'image' && o.radius > 2 && (corner || many)) p.radius = round(o.radius * sx, 1)
      upd.set(o.id, p as Partial<Obj>)
    }
    useStore.getState().mutate((cur) => cur.map((o) => (upd.has(o.id) ? ({ ...o, ...upd.get(o.id) } as Obj) : o)))
  }

  /* ----- keyboard ----- */
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (editable(e.target)) return
      const st = useStore.getState()
      const mod = e.ctrlKey || e.metaKey
      const k = e.key.toLowerCase()
      const stop = () => e.preventDefault()
      if (e.key === ' ') { stop(); setSpace(true); return }
      if (mod) {
        if (k === 'z') { stop(); e.shiftKey ? st.redo() : st.undo() }
        else if (k === 'y') { stop(); st.redo() }
        else if (k === 'd') { stop(); st.duplicate() }
        else if (k === 'g') { stop(); e.shiftKey ? st.ungroup() : st.group() }
        else if (k === 'a') { stop(); st.select(getBoard()?.objects.map((o) => o.id) ?? []) }
        else if (k === 'c') st.copy()
        else if (k === 'x') { st.copy(); st.remove() }
        else if (k === '0') { stop(); zoomTo(1) }
        else if (k === '1') { stop(); fit() }
        else if (k === '=' || k === '+') { stop(); zoomAt(1.25) }
        else if (k === '-') { stop(); zoomAt(0.8) }
        else if (k === ']') { stop(); st.order('front') }
        else if (k === '[') { stop(); st.order('back') }
        return
      }
      if (e.altKey) return
      const tools: Record<string, typeof tool> = { v: 'move', f: 'frame', t: 'text', r: 'shape', n: 'note', h: 'hand' }
      if (tools[k]) st.setTool(tools[k])
      else if (k === 'i') fileRef.current?.click()
      else if (k === 'delete' || k === 'backspace') { stop(); st.remove() }
      else if (k === 'escape') { st.select([]); st.setTool('move'); setMenu(null) }
      else if (k === ']') st.order('forward')
      else if (k === '[') st.order('backward')
      else if (k === 'enter' && st.selection.length === 1) { const o = getBoard()?.objects.find((x) => x.id === st.selection[0]); if (o && (o.type === 'text' || o.type === 'note')) { stop(); st.setEditing(o.id) } }
      else if (k.startsWith('arrow') && st.selection.length) {
        stop()
        const d = e.shiftKey ? 10 : 1
        const dx = k === 'arrowleft' ? -d : k === 'arrowright' ? d : 0, dy = k === 'arrowup' ? -d : k === 'arrowdown' ? d : 0
        st.patch(st.selection, (o) => ({ x: o.x + dx, y: o.y + dy }), 'nudge')
      }
    }
    const up = (e: KeyboardEvent) => { if (e.key === ' ') setSpace(false) }
    const paste = (e: ClipboardEvent) => {
      if (editable(e.target)) return
      const files = [...(e.clipboardData?.files ?? [])].filter((f) => f.type.startsWith('image/'))
      if (files.length) { e.preventDefault(); addFiles(files, center()) } else useStore.getState().paste()
    }
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('paste', paste)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('paste', paste) }
  }, [fit, zoomAt, zoomTo, center])

  /* ----- drop from the library or the desktop ----- */
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDropping(false)
    const pt = toCanvas(e.clientX, e.clientY)
    const st = useStore.getState()
    const raw = e.dataTransfer.getData('application/x-lilacanvas')
    if (raw) {
      let payload: { assetId?: unknown; objects?: unknown }
      try { payload = JSON.parse(raw) } catch { return }
      const a = st.assets.find((x) => x.id === payload.assetId)
      const src: Obj[] = payload.objects ? sanitizeObjects(payload.objects, 200) : (a?.src ? [imgFrom(a.src, a.w ?? 4, a.h ?? 3)] : a?.objects ?? [])
      if (!src.length) return
      if (a) st.touchAsset(a.id)
      const bb = bounds(src)
      st.add(src.map((o) => ({ ...o, id: uid(), x: o.x - bb.x - bb.width / 2 + pt.x, y: o.y - bb.y - bb.height / 2 + pt.y })))
    } else if (e.dataTransfer.files.length) addFiles([...e.dataTransfer.files], pt)
  }

  const editing = objs.find((o) => o.id === editingId) as TextObj | NoteObj | undefined
  const single = selection.length === 1 ? objs.find((o) => o.id === selection[0]) : undefined
  const cursor = panning ? 'grabbing' : tool === 'hand' || space ? 'grab' : tool === 'text' ? 'text' : tool === 'move' ? 'default' : 'crosshair'
  const dot = dark ? 'rgba(232,223,252,0.10)' : 'rgba(52,40,80,0.16)'
  const gridStep = 24 * view.s * (view.s < 0.4 ? 4 : view.s < 0.8 ? 2 : 1)
  const accent = '#9A7FF0'

  return (
    <div
      ref={wrapRef} className="absolute inset-0 overflow-hidden touch-none select-none" onPointerDown={onWrapDown}
      style={{ background: board.canvasColor, backgroundImage: `radial-gradient(${dot} 1.1px, transparent 1.1px)`, backgroundSize: `${gridStep}px ${gridStep}px`, backgroundPosition: `${view.x}px ${view.y}px`, cursor }}
      onDragOver={(e) => { e.preventDefault(); if (!dropping) setDropping(true) }} onDragLeave={() => setDropping(false)} onDrop={onDrop}
    >
      {ready && (
        <Stage ref={stageRef} width={size.w} height={size.h} x={view.x} y={view.y} scaleX={view.s} scaleY={view.s}
          onPointerDown={onDown} onWheel={onWheel}
          onDblClick={(e) => { const n = e.target.findAncestor('.obj', true); const o = objs.find((x) => x.id === n?.id()); if (o && (o.type === 'text' || o.type === 'note')) useStore.getState().setEditing(o.id) }}
          onDblTap={(e) => { const n = e.target.findAncestor('.obj', true); const o = objs.find((x) => x.id === n?.id()); if (o && (o.type === 'text' || o.type === 'note')) useStore.getState().setEditing(o.id) }}
          onContextMenu={(e) => {
            e.evt.preventDefault()
            const n = e.target === stageRef.current ? null : e.target.findAncestor('.obj', true)
            const st = useStore.getState()
            if (n && !st.selection.includes(n.id())) { const o = objs.find((x) => x.id === n.id()); st.select(o?.groupId ? objs.filter((x) => x.groupId === o.groupId).map((x) => x.id) : [n.id()]) }
            const r = wrapRef.current!.getBoundingClientRect()
            setMenu({ x: e.evt.clientX - r.left, y: e.evt.clientY - r.top, pt: toCanvas(e.evt.clientX, e.evt.clientY), onObj: !!n || (e.target.getLayer() === uiRef.current && st.selection.length > 0) })
          }}
        >
          <Layer ref={layerRef} listening={tool === 'move' || tool === 'hand'} onDragStart={onDragStart} onDragMove={onDragMove} onDragEnd={onDragEnd}>
            <Rect ref={bgRef} visible={false} listening={false} />
            {objs.map((o) => <ObjNode key={o.id} o={o} draggable={tool === 'move' && !space && !editingId} editing={o.id === editingId} dark={dark} />)}
          </Layer>
          <Layer ref={uiRef}>
            {marquee && <Rect {...marquee} fill="rgba(154,127,240,0.12)" stroke={accent} strokeWidth={1 / view.s} listening={false} />}
            {draft && <Rect {...draft} fill="rgba(154,127,240,0.10)" stroke={accent} strokeWidth={1 / view.s} dash={[4 / view.s, 3 / view.s]} listening={false} />}
            <Transformer ref={trRef} rotateEnabled flipEnabled={false} ignoreStroke padding={0}
              keepRatio={!single || single.type === 'image' || (single.type === 'swatch' && single.shape === 'dot')}
              enabledAnchors={single?.type === 'text' ? ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right'] : undefined}
              anchorSize={8} anchorCornerRadius={2} anchorStroke={accent} anchorFill="#FFFFFF" anchorStrokeWidth={1.25}
              borderStroke={accent} borderStrokeWidth={1.25} rotateAnchorOffset={22} rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]} rotationSnapTolerance={4}
              boundBoxFunc={(a, b) => (Math.abs(b.width) < 6 || Math.abs(b.height) < 6 ? a : b)}
              onTransformStart={() => setBusy(true)} onTransformEnd={onTransformEnd} />
          </Layer>
        </Stage>
      )}

      {editing && <InlineEditor key={editing.id} o={editing} view={view} />}
      {!busy && !editingId && selection.length > 0 && !marquee && <SelectionBar objs={objs.filter((o) => selection.includes(o.id))} view={view} size={size} />}
      {menu && <ContextMenu {...menu} x={Math.max(8, Math.min(menu.x, size.w - 224))} flip={menu.y > size.h - 390} onClose={() => setMenu(null)} fit={fit} />}

      {objs.length === 0 && !dropping && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <div className="text-center max-w-[300px] pointer-events-auto" style={{ color: dark ? '#F5F1F8' : '#211D2B' }}>
            <div className="font-display text-[19px] font-semibold tracking-tight">A clear desk.</div>
            <p className="mt-1.5 text-[13px] opacity-70">Drop images anywhere, press <kbd className="mono">T</kbd> for text or <kbd className="mono">N</kbd> for a note.</p>
            <button className="btn btn-primary mt-4" onClick={() => fileRef.current?.click()}><ImagePlus size={14} /> Upload images</button>
          </div>
        </div>
      )}
      {dropping && <div className="absolute inset-3 rounded-lg border-[1.5px] border-dashed pointer-events-none grid place-items-end justify-center pb-24" style={{ borderColor: accent, background: 'rgba(154,127,240,0.07)' }}><span className="px-3 h-7 grid place-items-center rounded-md text-[12px] font-semibold" style={{ background: accent, color: '#fff' }}>Drop to place on the board</span></div>}

      <BottomBar zoom={view.s} zoomIn={() => zoomAt(1.25)} zoomOut={() => zoomAt(0.8)} zoomTo={zoomTo} fit={fit} upload={() => fileRef.current?.click()} />
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles([...(e.target.files ?? [])], center()); e.target.value = '' }} />
    </div>
  )
}

function InlineEditor({ o, view }: { o: TextObj | NoteObj; view: View }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [value, setValue] = useState(o.text)
  const done = useRef(false)
  const isNote = o.type === 'note'
  const s = view.s
  useEffect(() => { const el = ref.current!; el.focus(); el.setSelectionRange(el.value.length, el.value.length) }, [])
  useEffect(() => { const el = ref.current!; if (!isNote) { el.style.height = '0px'; el.style.height = el.scrollHeight + 'px' } }, [value, isNote, s])
  const born = useRef(performance.now())
  const commit = () => {
    if (done.current) return
    // the press that created this editor also moves focus away from it; take focus back instead of closing
    if (performance.now() - born.current < 350 && document.activeElement !== ref.current) return void requestAnimationFrame(() => ref.current?.focus())
    done.current = true
    const st = useStore.getState()
    st.setEditing(null)
    if (!value.trim() && !isNote) { st.mutate((cur) => cur.filter((x) => x.id !== o.id)); st.select([]) }
    else if (value !== o.text) st.patch([o.id], { text: value } as Partial<Obj>)
  }
  const type: React.CSSProperties = isNote
    ? { fontFamily: `"${INTER}"`, fontSize: 13.5 * s, lineHeight: 1.42, color: '#2B2633', padding: `${24 * s}px ${14 * s}px ${10 * s}px` }
    : { fontFamily: `"${o.fontFamily}"`, fontSize: o.fontSize * s, fontWeight: o.fontWeight, fontStyle: o.italic ? 'italic' : undefined, letterSpacing: o.letterSpacing * s, lineHeight: o.lineHeight, textAlign: o.align, color: o.fill, padding: 0 }
  return (
    <textarea ref={ref} value={value} placeholder={isNote ? 'Write a note…' : 'Type something'} spellCheck={false}
      onChange={(e) => setValue(e.target.value)} onBlur={commit}
      onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Escape' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) commit() }}
      onPointerDown={(e) => e.stopPropagation()}
      className="absolute resize-none bg-transparent border-0 overflow-hidden outline-none m-0 block"
      style={{ left: view.x + o.x * s, top: view.y + o.y * s, width: o.width * s, height: isNote ? o.height * s : undefined, minHeight: isNote ? undefined : o.height * s, transform: o.rotation ? `rotate(${o.rotation}deg)` : undefined, transformOrigin: 'center', boxShadow: '0 0 0 1.25px #9A7FF0', ...type }} />
  )
}
