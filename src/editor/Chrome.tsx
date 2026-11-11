import { useRef } from 'react'
import {
  AlignCenterHorizontal, AlignCenterVertical, AlignEndHorizontal, AlignEndVertical, AlignHorizontalSpaceAround, AlignStartHorizontal, AlignStartVertical, AlignVerticalSpaceAround,
  BookmarkPlus, BringToFront, Copy, Frame, Group, Hand, ImagePlus, Maximize, Minus, MousePointer2, Pipette, Plus, SendToBack, Square, StickyNote, Trash2, Type, Ungroup,
} from 'lucide-react'
import type { Obj, Tool } from '../types'
import { useStore } from '../store'
import { Menu, Tip, useOutside } from '../ui'
import { bounds, copyText } from '../lib/util'
import { note, txt } from '../data/seed'
import { isDark } from '../lib/color'
import type { View } from './Canvas'

const TOOLS: { id: Tool; label: string; keys: string; icon: typeof Hand }[] = [
  { id: 'move', label: 'Move', keys: 'V', icon: MousePointer2 },
  { id: 'frame', label: 'Frame', keys: 'F', icon: Frame },
  { id: 'text', label: 'Text', keys: 'T', icon: Type },
  { id: 'shape', label: 'Shape', keys: 'R', icon: Square },
  { id: 'note', label: 'Sticky note', keys: 'N', icon: StickyNote },
  { id: 'hand', label: 'Hand', keys: 'H', icon: Hand },
]

export function BottomBar({ zoom, zoomIn, zoomOut, zoomTo, fit, upload }: { zoom: number; zoomIn: () => void; zoomOut: () => void; zoomTo: (s: number) => void; fit: () => void; upload: () => void }) {
  const tool = useStore((s) => s.tool)
  const setTool = useStore((s) => s.setTool)
  const btn = (t: (typeof TOOLS)[number]) => (
    <Tip key={t.id} label={t.label} keys={t.keys}>
      <button onClick={() => setTool(t.id)} aria-label={t.label} aria-pressed={tool === t.id}
        className={`relative grid place-items-center w-9 h-9 rounded-md transition-colors ${tool === t.id ? 'text-accent bg-[var(--accent-wash)]' : 'text-muted hover:text-ink hover:bg-hover'}`}>
        <t.icon size={17} strokeWidth={1.75} />
        <span className={`absolute -bottom-[5px] h-[2px] rounded-full bg-accent transition-all duration-300 ${tool === t.id ? 'w-4 opacity-100' : 'w-0 opacity-0'}`} />
      </button>
    </Tip>
  )
  return (
    <div className="absolute left-1/2 -translate-x-1/2 bottom-4 max-sm:bottom-3 flex items-center gap-2 max-w-[calc(100%-16px)]" onPointerDown={(e) => e.stopPropagation()}>
      <div className="pop !animate-none flex items-center gap-0.5 px-1.5 h-12 !rounded-xl">
        {TOOLS.slice(0, 2).map(btn)}
        <Tip label="Image" keys="I"><button onClick={upload} aria-label="Place image" className="grid place-items-center w-9 h-9 rounded-md text-muted hover:text-ink hover:bg-hover transition-colors"><ImagePlus size={17} strokeWidth={1.75} /></button></Tip>
        {TOOLS.slice(2, 5).map(btn)}
        <span className="w-px h-5 bg-line mx-1" />
        {btn(TOOLS[5])}
      </div>
      <div className="pop !animate-none flex items-center px-1 h-12 !rounded-xl max-sm:hidden">
        <Tip label="Zoom out" keys="Ctrl −"><button className="iconbtn" onClick={zoomOut} aria-label="Zoom out"><Minus size={15} /></button></Tip>
        <Menu up align="right" width={170} trigger={(_, toggle) => <button onClick={toggle} className="mono text-[11.5px] w-[52px] h-8 rounded-md hover:bg-hover" aria-label="Zoom level">{Math.round(zoom * 100)}%</button>}>
          {(close) => <>
            {[0.5, 1, 2].map((z) => <button key={z} className="menuitem" onClick={() => { zoomTo(z); close() }}>Zoom to {z * 100}%{z === 1 && <kbd>Ctrl 0</kbd>}</button>)}
            <div className="menusep" />
            <button className="menuitem" onClick={() => { fit(); close() }}>Fit board<kbd>Ctrl 1</kbd></button>
          </>}
        </Menu>
        <Tip label="Zoom in" keys="Ctrl +"><button className="iconbtn" onClick={zoomIn} aria-label="Zoom in"><Plus size={15} /></button></Tip>
        <Tip label="Fit board" keys="Ctrl 1"><button className="iconbtn" onClick={fit} aria-label="Fit board"><Maximize size={14} /></button></Tip>
      </div>
    </div>
  )
}

const B = ({ label, keys, onClick, children, on }: { label: string; keys?: string; onClick: () => void; children: React.ReactNode; on?: boolean }) => (
  <Tip label={label} keys={keys}><button className="iconbtn" data-on={on} onClick={onClick} aria-label={label}>{children}</button></Tip>
)
const Sep = () => <span className="w-px h-4 bg-line mx-1 shrink-0" />

export function SelectionBar({ objs, view, size }: { objs: Obj[]; view: View; size: { w: number; h: number } }) {
  const st = useStore.getState()
  if (!objs.length) return null
  const bb = bounds(objs)
  const many = objs.length > 1
  const one = many ? undefined : objs[0]
  const grouped = many && objs.every((o) => o.groupId && o.groupId === objs[0].groupId)
  const top = bb.y * view.s + view.y - 50
  const y = top < 8 ? Math.min(size.h - 120, (bb.y + bb.height) * view.s + view.y + 34) : top
  const x = Math.max(150, Math.min(size.w - 150, (bb.x + bb.width / 2) * view.s + view.x))
  const ids = objs.map((o) => o.id)
  return (
    <div className="absolute z-20 -translate-x-1/2 pop flex items-center h-9 px-1 !rounded-lg whitespace-nowrap" style={{ left: x, top: y }} onPointerDown={(e) => e.stopPropagation()}>
      <span className="mono text-[10.5px] text-muted px-2 uppercase tracking-wider">{many ? `${objs.length} selected` : one!.type}</span>
      <Sep />
      {one?.type === 'image' && <>
        <B label={one.fit === 'cover' ? 'Fit whole image' : 'Fill the frame'} onClick={() => st.patch(ids, { fit: one.fit === 'cover' ? 'contain' : 'cover' } as Partial<Obj>)}><Maximize size={14} /></B>
        <B label="Print border" on={one.mat > 0} onClick={() => st.patch(ids, { mat: one.mat ? 0 : 10 } as Partial<Obj>)}><Square size={14} /></B>
        <Sep />
      </>}
      {one?.type === 'text' && <>
        <B label="Smaller" onClick={() => st.patch(ids, { fontSize: Math.max(6, Math.round(one.fontSize * 0.9)) } as Partial<Obj>, 'fs')}><Minus size={14} /></B>
        <span className="mono text-[11px] w-7 text-center">{Math.round(one.fontSize)}</span>
        <B label="Larger" onClick={() => st.patch(ids, { fontSize: Math.round(one.fontSize * 1.1) + 1 } as Partial<Obj>, 'fs')}><Plus size={14} /></B>
        <Sep />
      </>}
      {one?.type === 'swatch' && <>
        <B label={`Copy ${one.color}`} onClick={() => copyText(one.color).then(() => st.toast(`${one.color} copied`))}><Pipette size={14} /></B>
        <Sep />
      </>}
      {many && <>
        <Menu align="left" width={196} trigger={(open, toggle) => <Tip label="Align"><button className="iconbtn" data-on={open} onClick={toggle} aria-label="Align"><AlignStartVertical size={14} /></button></Tip>}>
          {() => <div className="grid grid-cols-4 gap-0.5">
            {([['left', 'Align left', AlignStartVertical], ['hcenter', 'Align centres', AlignCenterVertical], ['right', 'Align right', AlignEndVertical], ['hspace', 'Distribute horizontally', AlignHorizontalSpaceAround],
              ['top', 'Align top', AlignStartHorizontal], ['vcenter', 'Align middles', AlignCenterHorizontal], ['bottom', 'Align bottom', AlignEndHorizontal], ['vspace', 'Distribute vertically', AlignVerticalSpaceAround]] as const).map(([k, label, Icon]) => (
              <button key={k} className="iconbtn !w-full !h-9" title={label} aria-label={label} onClick={() => st.align(k)}><Icon size={15} /></button>
            ))}
          </div>}
        </Menu>
        {grouped ? <B label="Ungroup" keys="Ctrl ⇧ G" onClick={() => st.ungroup()}><Ungroup size={14} /></B> : <B label="Group" keys="Ctrl G" onClick={() => st.group()}><Group size={14} /></B>}
        <Sep />
      </>}
      <B label="Bring to front" keys="Ctrl ]" onClick={() => st.order('front')}><BringToFront size={14} /></B>
      <B label="Send to back" keys="Ctrl [" onClick={() => st.order('back')}><SendToBack size={14} /></B>
      <B label="Duplicate" keys="Ctrl D" onClick={() => st.duplicate()}><Copy size={14} /></B>
      <B label="Save to library" onClick={() => saveElement(objs)}><BookmarkPlus size={14} /></B>
      <B label="Delete" keys="Del" onClick={() => st.remove()}><Trash2 size={14} /></B>
    </div>
  )
}

export function saveElement(objs: Obj[]) {
  const st = useStore.getState()
  const bb = bounds(objs)
  const first = objs[0]
  const name = objs.length > 1 ? `Group of ${objs.length}` : first.type === 'text' ? first.text.slice(0, 24) || 'Text' : first.type === 'note' ? 'Note' : first.type === 'swatch' ? first.label : first.type[0].toUpperCase() + first.type.slice(1)
  st.addAsset({ category: 'Saved elements', name, tags: ['saved'], objects: objs.map((o) => ({ ...o, x: o.x - bb.x, y: o.y - bb.y, groupId: undefined })) })
  st.toast('Saved to Elements in your library')
}

export function ContextMenu({ x, y, pt, onObj, onClose, fit, flip }: { x: number; y: number; pt: { x: number; y: number }; onObj: boolean; onClose: () => void; fit: () => void; flip?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useOutside(ref, onClose)
  const st = useStore.getState()
  const board = st.boards.find((b) => b.id === st.activeId)
  const sel = board?.objects.filter((o) => st.selection.includes(o.id)) ?? []
  const run = (fn: () => void) => () => { fn(); onClose() }
  const dark = isDark(board?.canvasColor ?? '#FFFFFF')
  return (
    <div ref={ref} className="pop absolute z-40 p-1 w-[212px]" style={{ left: x, top: y, transform: flip ? 'translateY(-100%)' : undefined }} onPointerDown={(e) => e.stopPropagation()} onContextMenu={(e) => e.preventDefault()}>
      {onObj && sel.length ? <>
        <button className="menuitem" onClick={run(() => st.copy())}>Copy<kbd>Ctrl C</kbd></button>
        <button className="menuitem" onClick={run(() => st.duplicate())}>Duplicate<kbd>Ctrl D</kbd></button>
        <div className="menusep" />
        <button className="menuitem" onClick={run(() => st.order('front'))}>Bring to front<kbd>Ctrl ]</kbd></button>
        <button className="menuitem" onClick={run(() => st.order('forward'))}>Bring forward<kbd>]</kbd></button>
        <button className="menuitem" onClick={run(() => st.order('backward'))}>Send backward<kbd>[</kbd></button>
        <button className="menuitem" onClick={run(() => st.order('back'))}>Send to back<kbd>Ctrl [</kbd></button>
        <div className="menusep" />
        <button className="menuitem" disabled={sel.length < 2} onClick={run(() => st.group())}>Group<kbd>Ctrl G</kbd></button>
        <button className="menuitem" disabled={!sel.some((o) => o.groupId)} onClick={run(() => st.ungroup())}>Ungroup<kbd>Ctrl ⇧ G</kbd></button>
        <button className="menuitem" onClick={run(() => saveElement(sel))}>Save to library</button>
        <div className="menusep" />
        <button className="menuitem" onClick={run(() => st.remove())}>Delete<kbd>Del</kbd></button>
      </> : <>
        <button className="menuitem" onClick={run(() => st.paste(pt))}>Paste here<kbd>Ctrl V</kbd></button>
        <div className="menusep" />
        <button className="menuitem" onClick={run(() => { const o = note('', pt.x - 100, pt.y - 75, '#F3E3A1'); st.add([o]); st.setEditing(o.id) })}>Add a note here<kbd>N</kbd></button>
        <button className="menuitem" onClick={run(() => { const o = txt('', pt.x, pt.y - 14, 280, { fontSize: 24, fontWeight: 600, fill: dark ? '#F5F1F8' : '#211D2B' }); st.add([o]); st.setEditing(o.id) })}>Add text here<kbd>T</kbd></button>
        <div className="menusep" />
        <button className="menuitem" onClick={run(() => st.select(board?.objects.map((o) => o.id) ?? []))}>Select all<kbd>Ctrl A</kbd></button>
        <button className="menuitem" onClick={run(fit)}>Fit board to screen<kbd>Ctrl 1</kbd></button>
      </>}
    </div>
  )
}
