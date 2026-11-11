import { AlignCenter, AlignLeft, AlignRight, ArrowDown, ArrowDownToLine, ArrowUp, ArrowUpToLine, Copy, Heart, Italic, Link2, Plus, X } from 'lucide-react'
import type { Board, Obj } from '../types'
import { useStore } from '../store'
import { ColorField, Menu, Num, Seg, Tip } from '../ui'
import { copyText, FONTS, round } from '../lib/util'
import { fmtHsl, fmtRgb } from '../lib/color'
import { editor } from './Canvas'

const Section = ({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) => (
  <section className="px-3.5 py-3 border-b border-line">
    <div className="flex items-center justify-between h-5 mb-2"><h3 className="label !font-sans">{title}</h3>{action}</div>
    <div className="grid gap-1.5">{children}</div>
  </section>
)
const Row = ({ children }: { children: React.ReactNode }) => <div className="grid grid-cols-2 gap-1.5">{children}</div>
const Line = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="grid grid-cols-[76px_1fr] items-center gap-1.5"><span className="text-[11.5px] text-muted">{label}</span>{children}</div>
)
const CANVASES = ['#D5D0DC', '#EADFE3', '#E2DDD6', '#E4E8E1', '#DCE3E6', '#F6F2F8', '#2A2633', '#16141C']
const NOTES = ['#F3E3A1', '#F9D5DC', '#D9CCFA', '#CFE3C4', '#CFE2EE', '#FBFAF6']

function CopyRow({ label, value }: { label: string; value: string }) {
  const toast = useStore((s) => s.toast)
  return (
    <button className="field flex items-center gap-2 text-left group" onClick={() => copyText(value).then(() => toast(`${label} copied`))} title={`Copy ${label}`}>
      <span className="mono text-[10.5px] text-muted w-7 shrink-0">{label}</span>
      <span className="mono text-[11.5px] truncate flex-1">{value}</span>
      <Copy size={12} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  )
}

export function Properties({ board }: { board: Board }) {
  const selection = useStore((s) => s.selection)
  const palettes = useStore((s) => s.palettes)
  const favColors = useStore((s) => s.favColors)
  const st = useStore.getState()
  const sel = board.objects.filter((o) => selection.includes(o.id))
  const o = sel.length === 1 ? sel[0] : undefined
  const ids = sel.map((x) => x.id)
  const set = (p: Partial<Obj> | Record<string, unknown>, key?: string) => st.patch(ids, p as Partial<Obj>, key ?? 'prop:' + Object.keys(p).join())

  if (!sel.length) {
    const used = [...new Set(board.objects.flatMap((x) => (x.type === 'palette' ? x.colors : x.type === 'swatch' ? [x.color] : [])))].slice(0, 12)
    return (
      <div>
        <Section title="Board">
          <input className="field" value={board.name} aria-label="Board name" onChange={(e) => st.updateBoard(board.id, { name: e.target.value })} />
          <Line label="Type">
            <select className="field" value={board.kind} onChange={(e) => st.updateBoard(board.id, { kind: e.target.value as Board['kind'] })}>
              {['Branding', 'Editorial', 'Interior', 'Web', 'Photography', 'Other'].map((k) => <option key={k}>{k}</option>)}
            </select>
          </Line>
          <Line label="Objects"><span className="mono text-[11.5px] px-2">{board.objects.length}</span></Line>
        </Section>
        <Section title="Desk surface">
          <div className="grid grid-cols-8 gap-1.5">
            {CANVASES.map((c) => <button key={c} aria-label={`Surface ${c}`} onClick={() => st.updateBoard(board.id, { canvasColor: c })} className="aspect-square rounded-[5px] border border-line transition-transform hover:scale-110" style={{ background: c, outline: board.canvasColor === c ? '1.5px solid var(--accent)' : undefined, outlineOffset: 2 }} />)}
          </div>
          <ColorField value={board.canvasColor} onChange={(c) => st.updateBoard(board.id, { canvasColor: c })} />
        </Section>
        {used.length > 0 && (
          <Section title="Colours on this board" action={<button className="text-[11px] text-accent font-medium hover:underline" onClick={() => { st.savePalette({ name: board.name, colors: used.slice(0, 8) }); st.toast('Saved as a palette in Color Lab') }}>Save palette</button>}>
            <div className="flex flex-wrap gap-1.5">
              {used.map((c) => <Tip key={c} label={c}><button aria-label={`Copy ${c}`} onClick={() => copyText(c).then(() => st.toast(`${c} copied`))} className="w-6 h-6 rounded-full border border-line transition-transform hover:scale-110" style={{ background: c }} /></Tip>)}
            </div>
          </Section>
        )}
        <div className="px-3.5 py-4 text-[12px] text-muted leading-relaxed">Select something on the board to edit it. Hold <kbd className="mono text-ink">Shift</kbd> to select several, or drag a marquee across the desk.</div>
      </div>
    )
  }

  const first = sel[0]
  const mixed = sel.length > 1
  return (
    <div>
      <Section title={mixed ? `${sel.length} objects` : first.type === 'swatch' ? 'Colour' : first.type}>
        <Row>
          <Num label="X" value={first.x} onChange={(v) => st.patch(ids, (x) => ({ x: x.x + v - first.x }), 'x')} />
          <Num label="Y" value={first.y} onChange={(v) => st.patch(ids, (x) => ({ y: x.y + v - first.y }), 'y')} />
        </Row>
        {o && <Row>
          <Num label="W" value={o.width} min={4} onChange={(v) => set(o.type === 'image' || (o.type === 'swatch' && o.shape === 'dot') ? { width: v, height: round((v * o.height) / o.width, 1) } : { width: v }, 'w')} />
          {o.type === 'text'
            ? <div className="field flex items-center gap-1.5 opacity-60" title="Text height follows its content"><span className="mono text-[10.5px] text-muted">H</span><span className="mono text-[11.5px]">{o.height}</span></div>
            : <Num label="H" value={o.height} min={4} onChange={(v) => set(o.type === 'image' ? { height: v, width: round((v * o.width) / o.height, 1) } : { height: v }, 'h')} />}
        </Row>}
        <Row>
          <Num label="R" value={first.rotation} suffix="°" precision={1} onChange={(v) => set({ rotation: ((v + 540) % 360) - 180 }, 'rot')} />
          <Num label="O" value={Math.round(first.opacity * 100)} suffix="%" min={0} max={100} onChange={(v) => set({ opacity: v / 100 }, 'op')} />
        </Row>
      </Section>

      {o?.type === 'image' && <Section title="Image">
        <Line label="Crop"><Seg value={o.fit} onChange={(v) => set({ fit: v })} options={[{ value: 'cover', label: 'Fill' }, { value: 'contain', label: 'Fit' }]} /></Line>
        {o.fit === 'cover' && <Row>
          <Num label="↔" value={Math.round(o.cropX * 100)} suffix="%" min={0} max={100} onChange={(v) => set({ cropX: v / 100 }, 'cx')} />
          <Num label="↕" value={Math.round(o.cropY * 100)} suffix="%" min={0} max={100} onChange={(v) => set({ cropY: v / 100 }, 'cy')} />
        </Row>}
        <Row>
          <Num label="Radius" value={o.radius} min={0} max={600} onChange={(v) => set({ radius: v }, 'rad')} />
          <Num label="Border" value={o.mat} min={0} max={60} onChange={(v) => set({ mat: v }, 'mat')} />
        </Row>
        <label className="flex items-center gap-2 text-[12px] h-7 cursor-pointer"><input type="checkbox" className="accent-[var(--accent)]" checked={!!o.tape} onChange={(e) => set({ tape: e.target.checked })} /> Masking tape</label>
      </Section>}

      {o?.type === 'text' && <Section title="Typography">
        <select className="field" value={o.fontFamily} aria-label="Font family" onChange={(e) => set({ fontFamily: e.target.value })}>{FONTS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}</select>
        <Row>
          <Num label="Size" value={o.fontSize} min={4} max={600} precision={1} onChange={(v) => set({ fontSize: v }, 'fs')} />
          <select className="field" value={o.fontWeight} aria-label="Font weight" onChange={(e) => set({ fontWeight: +e.target.value })}>
            {[[300, 'Light'], [400, 'Regular'], [500, 'Medium'], [600, 'Semibold'], [700, 'Bold'], [800, 'Extrabold']].map(([w, l]) => <option key={w} value={w}>{l}</option>)}
          </select>
        </Row>
        <Row>
          <Num label="Tracking" value={o.letterSpacing} step={0.1} precision={1} onChange={(v) => set({ letterSpacing: v }, 'ls')} />
          <Num label="Leading" value={o.lineHeight} step={0.01} min={0.6} max={3} precision={2} onChange={(v) => set({ lineHeight: v }, 'lh')} />
        </Row>
        <div className="grid grid-cols-[1fr_28px] gap-1.5">
          <Seg value={o.align} onChange={(v) => set({ align: v })} options={[{ value: 'left', label: <AlignLeft size={14} />, title: 'Align left' }, { value: 'center', label: <AlignCenter size={14} />, title: 'Align centre' }, { value: 'right', label: <AlignRight size={14} />, title: 'Align right' }]} />
          <button className="iconbtn" data-on={!!o.italic} aria-label="Italic" aria-pressed={!!o.italic} onClick={() => set({ italic: !o.italic })}><Italic size={14} /></button>
        </div>
        <Line label="Colour"><ColorField value={o.fill} onChange={(c) => set({ fill: c }, 'fill')} /></Line>
      </Section>}

      {o?.type === 'swatch' && <Section title="Values" action={<Tip label={favColors.includes(o.color) ? 'Remove favourite' : 'Save as favourite'}><button className="iconbtn !w-6 !h-6" aria-label="Favourite colour" data-on={favColors.includes(o.color)} onClick={() => st.toggleFavColor(o.color)}><Heart size={13} fill={favColors.includes(o.color) ? 'currentColor' : 'none'} /></button></Tip>}>
        <ColorField value={o.color} onChange={(c) => set({ color: c }, 'color')} />
        <CopyRow label="HEX" value={o.color} />
        <CopyRow label="RGB" value={fmtRgb(o.color)} />
        <CopyRow label="HSL" value={fmtHsl(o.color)} />
        <Line label="Name"><input className="field" value={o.label} onChange={(e) => set({ label: e.target.value }, 'label')} /></Line>
        <Line label="Style"><Seg value={o.shape} onChange={(v) => set(v === 'dot' ? { shape: v, height: o.width } : { shape: v, height: round(o.width * 1.3) })} options={[{ value: 'chip', label: 'Paint chip' }, { value: 'dot', label: 'Dab' }]} /></Line>
        <Menu align="left" width={200} trigger={(_, toggle) => <button className="btn w-full" onClick={toggle}><Plus size={13} /> Add to palette</button>}>
          {(close) => <>
            {palettes.map((p) => <button key={p.id} className="menuitem" onClick={() => { st.updatePalette(p.id, { colors: [...p.colors, o.color] }); st.toast(`Added to ${p.name}`); close() }}>
              <span className="flex h-3 w-9 rounded-sm overflow-hidden shrink-0">{p.colors.slice(0, 5).map((c, i) => <i key={i} className="flex-1" style={{ background: c }} />)}</span><span className="truncate">{p.name}</span>
            </button>)}
            <div className="menusep" />
            <button className="menuitem" onClick={() => { st.savePalette({ name: o.label || 'New palette', colors: [o.color] }); st.toast('New palette created'); close() }}><Plus size={13} /> New palette</button>
          </>}
        </Menu>
      </Section>}

      {o?.type === 'palette' && <Section title="Palette" action={<button className="text-[11px] text-accent font-medium hover:underline" onClick={() => { st.savePalette({ name: board.name + ' palette', colors: o.colors }); st.toast('Saved to Color Lab') }}>Save to Color Lab</button>}>
        {o.colors.map((c, i) => (
          <div key={i} className="grid grid-cols-[1fr_28px_28px] gap-1">
            <ColorField value={c} onChange={(v) => set({ colors: o.colors.map((x, j) => (j === i ? v : x)) }, 'pc' + i)} />
            <button className="iconbtn" aria-label={`Copy ${c}`} onClick={() => copyText(c).then(() => st.toast(`${c} copied`))}><Copy size={12} /></button>
            <button className="iconbtn" aria-label="Remove colour" disabled={o.colors.length < 2} onClick={() => set({ colors: o.colors.filter((_, j) => j !== i) })}><X size={13} /></button>
          </div>
        ))}
        <button className="btn w-full" disabled={o.colors.length >= 10} onClick={() => set({ colors: [...o.colors, '#B7A0F4'] })}><Plus size={13} /> Add colour</button>
      </Section>}

      {o?.type === 'frame' && <Section title="Frame">
        <Line label="Name"><input className="field" value={o.label} onChange={(e) => set({ label: e.target.value }, 'label')} /></Line>
        <Line label="Background"><ColorField value={o.fill} onChange={(c) => set({ fill: c }, 'fill')} /></Line>
        <Line label="Layout"><Seg value={o.layout} onChange={(v) => { set({ layout: v }); st.tidyFrame(o.id) }} options={[{ value: 'free', label: 'Free' }, { value: 'row', label: 'Row' }, { value: 'grid', label: 'Grid' }]} /></Line>
        <Line label="Spacing"><Num label="⇿" value={o.spacing} min={0} max={200} onChange={(v) => { set({ spacing: v }, 'sp'); st.tidyFrame(o.id) }} /></Line>
        {o.layout !== 'free' && <p className="text-[11px] text-muted leading-snug">Objects sitting inside the frame are arranged for you. Switch to Free to place them by hand.</p>}
      </Section>}

      {o?.type === 'note' && <Section title="Note">
        <div className="flex gap-1.5">{NOTES.map((c) => <button key={c} aria-label={`Paper ${c}`} onClick={() => set({ color: c })} className="w-7 h-7 rounded-[4px] border border-line transition-transform hover:scale-110" style={{ background: c, outline: o.color === c ? '1.5px solid var(--accent)' : undefined, outlineOffset: 2 }} />)}</div>
        <button className="btn w-full" onClick={() => st.setEditing(o.id)}>Edit text</button>
      </Section>}

      {o?.type === 'shape' && <Section title="Shape">
        <Line label="Form"><Seg value={o.kind} onChange={(v) => set({ kind: v })} options={[{ value: 'rect', label: 'Rectangle' }, { value: 'ellipse', label: 'Ellipse' }]} /></Line>
        <Line label="Fill"><ColorField value={o.fill} onChange={(c) => set({ fill: c }, 'fill')} /></Line>
        <Line label="Stroke"><ColorField value={o.stroke} onChange={(c) => set({ stroke: c, strokeWidth: o.strokeWidth || 2 }, 'stroke')} /></Line>
        <Row>
          <Num label="Stroke" value={o.strokeWidth} min={0} max={40} onChange={(v) => set({ strokeWidth: v, stroke: o.stroke || '#211D2B' }, 'sw')} />
          {o.kind === 'rect' && <Num label="Radius" value={o.radius} min={0} max={600} onChange={(v) => set({ radius: v }, 'rad')} />}
        </Row>
      </Section>}

      <Section title="Layer">
        <div className="grid grid-cols-4 gap-1">
          {([['front', 'To front', ArrowUpToLine], ['forward', 'Forward', ArrowUp], ['backward', 'Backward', ArrowDown], ['back', 'To back', ArrowDownToLine]] as const).map(([k, label, Icon]) => (
            <Tip key={k} label={label} className="w-full"><button className="btn !px-0 w-full" aria-label={label} onClick={() => st.order(k)}><Icon size={14} /></button></Tip>
          ))}
        </div>
        {o?.type === 'image' && <button className="btn w-full" onClick={() => editor.upload?.()}><Link2 size={13} /> Place another image</button>}
      </Section>
    </div>
  )
}
