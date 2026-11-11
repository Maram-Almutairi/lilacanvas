import { useEffect, useRef, useState } from 'react'
import { Copy, Heart, ImageUp, Plus, Trash2, X } from 'lucide-react'
import { useStore } from '../store'
import { Img, Menu, nav, Tip } from '../ui'
import { copyText, fileToImage } from '../lib/util'
import { contrast, extractPalette, fmtHsl, fmtRgb, harmonies, hexToHsl, hslToHex, inkOn, normHex } from '../lib/color'
import { pal } from '../data/seed'

const Strip = ({ colors, className = '' }: { colors: string[]; className?: string }) => (
  <span className={`flex overflow-hidden rounded-[3px] ${className}`}>{colors.map((c, i) => <i key={i} className="flex-1" style={{ background: c }} />)}</span>
)
function Value({ label, value }: { label: string; value: string }) {
  const toast = useStore((s) => s.toast)
  return (
    <button className="group flex items-center gap-3 h-9 px-3 rounded-md bg-bg hover:bg-raised transition-colors w-full text-left" onClick={() => copyText(value).then(() => toast(`${label} copied to clipboard`))}>
      <span className="mono text-[10.5px] text-muted w-8">{label}</span><span className="mono text-[12.5px] flex-1 truncate">{value}</span>
      <Copy size={13} className="text-muted group-hover:text-accent transition-colors" />
    </button>
  )
}

export function ColorLab() {
  const palettes = useStore((s) => s.palettes)
  const favColors = useStore((s) => s.favColors)
  const assets = useStore((s) => s.assets)
  const boards = useStore((s) => s.boards).filter((b) => !b.trashed)
  const st = useStore.getState()
  const [activeId, setActiveId] = useState(palettes[0]?.id)
  const [idx, setIdx] = useState(2)
  const [source, setSource] = useState<string>('img/red-peak.jpg')
  const [extracted, setExtracted] = useState<string[]>([])
  const file = useRef<HTMLInputElement>(null)
  const p = palettes.find((x) => x.id === activeId) ?? palettes[0]
  const i = p ? Math.min(idx, p.colors.length - 1) : 0
  const color = p?.colors[i] ?? '#B7A0F4'
  const [h, s, l] = hexToHsl(color)
  useEffect(() => { extractPalette(source, 6).then(setExtracted) }, [source])

  const setColor = (hex: string) => p && st.updatePalette(p.id, { colors: p.colors.map((c, j) => (j === i ? hex : c)) })
  const saveNew = (name: string, colors: string[], collection = 'Unsorted') => { const id = st.savePalette({ name, colors, collection }); setActiveId(id); setIdx(0); st.toast(`“${name}” saved`) }
  const groups = [...new Set(palettes.map((x) => x.collection))]
  const photos = assets.filter((a) => a.src).slice(0, 14)
  const fav = favColors.includes(color)

  if (!p) return (
    <div className="h-full grid place-items-center bg-bg2 text-center p-6"><div><h1 className="text-[22px] font-semibold">No palettes yet.</h1><p className="text-muted mt-1.5">Start one and build it colour by colour.</p><button className="btn btn-primary mt-4" onClick={() => saveNew('New palette', ['#211D2B', '#9984CC', '#B7A0F4', '#E8DFFC', '#F6F2F8'])}><Plus size={14} /> New palette</button></div></div>
  )
  const [c0, c1, c2, c3] = [p.colors[0], p.colors[Math.min(1, p.colors.length - 1)], p.colors[Math.floor(p.colors.length / 2)], p.colors[p.colors.length - 1]]
  const byLum = [...p.colors].sort((a, b) => contrast(b, '#000') - contrast(a, '#000'))
  const paper = byLum[0], ink = byLum[byLum.length - 1], pop = c2 === paper || c2 === ink ? c1 : c2

  return (
    <div className="h-full flex min-h-0 bg-bg2 max-md:flex-col max-md:overflow-y-auto">
      {/* palettes */}
      <aside className="w-[248px] max-md:w-full shrink-0 border-r max-md:border-r-0 max-md:border-b border-line bg-bg flex flex-col min-h-0" aria-label="Palettes">
        <div className="h-12 px-4 flex items-center justify-between shrink-0"><h1 className="text-[14px] font-semibold">Color Lab</h1>
          <Tip down label="New palette"><button className="iconbtn" aria-label="New palette" onClick={() => saveNew('Untitled palette', ['#211D2B', '#9984CC', '#B7A0F4', '#E8DFFC', '#F6F2F8'])}><Plus size={16} /></button></Tip></div>
        <div className="flex-1 md:overflow-y-auto px-2 pb-3 max-md:max-h-[220px] max-md:overflow-y-auto">
          {groups.map((gname) => (
            <div key={gname} className="mb-3">
              <div className="label px-2 h-7 flex items-center">{gname}</div>
              {palettes.filter((x) => x.collection === gname).map((x) => (
                <button key={x.id} onClick={() => { setActiveId(x.id); setIdx(Math.min(2, x.colors.length - 1)) }} aria-current={x.id === p.id}
                  className={`w-full text-left px-2 py-2 rounded-md transition-colors ${x.id === p.id ? 'bg-[var(--accent-wash)]' : 'hover:bg-hover'}`}>
                  <Strip colors={x.colors} className="h-6" />
                  <span className={`block mt-1.5 text-[12px] truncate ${x.id === p.id ? 'font-medium' : 'text-muted'}`}>{x.name}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="border-t border-line p-4 shrink-0">
          <div className="label mb-2.5">Favorite colours</div>
          <div className="flex flex-wrap gap-1.5">
            {favColors.map((c) => <Tip key={c} label={c}><button aria-label={`Use ${c}`} onClick={() => setColor(c)} onContextMenu={(e) => { e.preventDefault(); st.toggleFavColor(c) }} className="w-6 h-6 rounded-full border border-line transition-transform hover:scale-110" style={{ background: c }} /></Tip>)}
            {!favColors.length && <span className="text-[12px] text-muted">Heart a colour to keep it.</span>}
          </div>
        </div>
      </aside>

      {/* workbench */}
      <main className="flex-1 min-w-0 md:overflow-y-auto">
        <div className="max-w-[900px] mx-auto px-8 max-sm:px-4 pt-7 pb-24">
          <div className="flex items-center gap-3 flex-wrap">
            <input value={p.name} aria-label="Palette name" onChange={(e) => st.updatePalette(p.id, { name: e.target.value })} className="font-display text-[24px] font-semibold tracking-[-0.02em] bg-transparent rounded-md px-1.5 -ml-1.5 h-10 min-w-0 flex-1 hover:bg-hover focus:bg-bg" />
            <select className="field !w-auto !bg-bg" aria-label="Collection" value={p.collection} onChange={(e) => { if (e.target.value === '+') { const n = prompt('Name the new collection'); if (n?.trim()) st.updatePalette(p.id, { collection: n.trim() }) } else st.updatePalette(p.id, { collection: e.target.value }) }}>
              {groups.map((gname) => <option key={gname}>{gname}</option>)}<option value="+">New collection…</option>
            </select>
            <Menu width={210} trigger={(_, toggle) => <button className="btn" onClick={toggle}><Plus size={13} /> Add to board</button>}>
              {(close) => <>{boards.map((b) => <button key={b.id} className="menuitem" onClick={() => { st.addToBoard(b.id, [pal(p.colors, 0, 0, 380, 104)]); st.toast(`Palette added to ${b.name}`, { label: 'Open', run: () => nav('board/' + b.id) }); close() }}><span className="w-3 h-3 rounded-sm border border-line" style={{ background: b.canvasColor }} /><span className="truncate">{b.name}</span></button>)}</>}
            </Menu>
            <button className="btn" onClick={() => copyText(p.colors.join(', ')).then(() => st.toast('All HEX codes copied'))}><Copy size={13} /> Copy all</button>
            <Tip down label="Delete palette"><button className="iconbtn" aria-label="Delete palette" onClick={() => { st.removePalette(p.id); setActiveId(''); st.toast('Palette deleted') }}><Trash2 size={15} /></button></Tip>
          </div>

          <div className="mt-5 flex h-[250px] max-sm:h-[180px] rounded-[6px] overflow-hidden border border-line" role="listbox" aria-label="Palette colours">
            {p.colors.map((c, j) => (
              <button key={j} role="option" aria-selected={j === i} onClick={() => setIdx(j)} className="relative min-w-0 flex flex-col justify-end items-start p-3 transition-[flex-grow] duration-500 ease-[cubic-bezier(.16,1,.3,1)]" style={{ background: c, color: inkOn(c), flexGrow: j === i ? 1.9 : 1, flexBasis: 0 }}>
                {j === i && <span className="absolute top-3 left-3 w-1.5 h-1.5 rounded-full" style={{ background: inkOn(c) }} />}
                <span className="mono text-[11px] truncate max-w-full">{c}</span>
              </button>
            ))}
            {p.colors.length < 10 && <button aria-label="Add colour" onClick={() => { st.updatePalette(p.id, { colors: [...p.colors, hslToHex([(h + 28) % 360, s, l])] }); setIdx(p.colors.length) }} className="w-11 shrink-0 grid place-items-center bg-bg text-muted hover:text-ink hover:bg-raised transition-colors"><Plus size={16} /></button>}
          </div>

          <div className="grid md:grid-cols-2 gap-x-8 gap-y-8 mt-8">
            <section>
              <div className="flex items-center justify-between h-7 mb-2"><h2 className="label !font-sans">Selected colour</h2>
                <div className="flex">
                  <Tip label={fav ? 'Remove favourite' : 'Save favourite'}><button className="iconbtn" data-on={fav} aria-pressed={fav} aria-label="Favourite colour" onClick={() => st.toggleFavColor(color)}><Heart size={14} fill={fav ? 'currentColor' : 'none'} /></button></Tip>
                  <Tip label="Remove from palette"><button className="iconbtn" aria-label="Remove colour" disabled={p.colors.length < 2} onClick={() => { st.updatePalette(p.id, { colors: p.colors.filter((_, j) => j !== i) }); setIdx(Math.max(0, i - 1)) }}><X size={15} /></button></Tip>
                </div>
              </div>
              <div className="flex gap-2 mb-2">
                <span className="relative w-9 h-9 rounded-md border border-line shrink-0 overflow-hidden" style={{ background: color }}><input type="color" value={color} aria-label="Pick colour" onChange={(e) => setColor(e.target.value.toUpperCase())} /></span>
                <HexInput key={color} value={color} onChange={setColor} />
              </div>
              <div className="grid gap-1.5"><Value label="HEX" value={color} /><Value label="RGB" value={fmtRgb(color)} /><Value label="HSL" value={fmtHsl(color)} /></div>
              <div className="mt-4 grid gap-2.5">
                {([['Hue', h, 360, `linear-gradient(90deg, ${[0, 60, 120, 180, 240, 300, 360].map((d) => hslToHex([d % 360, Math.max(s, 40), 55])).join(',')})`, (v: number) => [v, s, l]],
                  ['Saturation', s, 100, `linear-gradient(90deg, ${hslToHex([h, 0, l])}, ${hslToHex([h, 100, l])})`, (v: number) => [h, v, l]],
                  ['Lightness', l, 100, `linear-gradient(90deg, #000, ${hslToHex([h, s, 50])}, #fff)`, (v: number) => [h, s, v]]] as const).map(([name, val, max, bg, make]) => (
                  <label key={name} className="grid grid-cols-[76px_1fr_34px] items-center gap-2 text-[11.5px] text-muted">{name}
                    <span className="relative h-4 flex items-center"><span className="absolute inset-x-0 h-[6px] rounded-full" style={{ background: bg }} /><input type="range" min={0} max={max} value={val} className="relative [&::-webkit-slider-runnable-track]:!bg-transparent [&::-moz-range-track]:!bg-transparent" onChange={(e) => setColor(hslToHex(make(+e.target.value) as [number, number, number]))} /></span>
                    <span className="mono text-[11px] text-ink text-right">{val}</span>
                  </label>
                ))}
              </div>
            </section>

            <section>
              <h2 className="label !font-sans h-7 flex items-center mb-2">Preview</h2>
              <div className="rounded-[6px] overflow-hidden border border-line" style={{ background: paper, color: ink }}>
                <div className="p-5 pb-4">
                  <div className="mono text-[9.5px] uppercase tracking-[0.12em]" style={{ color: contrast(pop, paper) > 3 ? pop : ink }}>{p.collection} — vol. 01</div>
                  <div className="font-serif italic text-[34px] leading-[1] mt-2 tracking-[-0.02em]">{p.name}</div>
                  <p className="text-[12px] mt-2.5 leading-relaxed max-w-[34ch]" style={{ opacity: 0.78 }}>A palette is a promise about mood. This is how yours reads as a page.</p>
                  <span className="inline-flex items-center h-7 px-3 rounded-full text-[11.5px] font-semibold mt-3.5" style={{ background: pop, color: inkOn(pop) }}>Read the story</span>
                </div>
                <div className="flex h-9">{p.colors.map((c, j) => <i key={j} className="flex-1" style={{ background: c }} />)}</div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-1.5">
                {[[ink, paper], [paper, ink], [inkOn(pop), pop], [c3, c0]].map(([fg, bg], j) => { const r = contrast(fg, bg); return (
                  <div key={j} className="flex items-center gap-2 h-9 px-2.5 rounded-md border border-line" style={{ background: bg, color: fg }}>
                    <span className="font-display font-bold text-[14px]">Aa</span><span className="mono text-[10.5px] ml-auto">{r.toFixed(1)}:1</span>
                    <span className="mono text-[9px] px-1 rounded-sm" style={{ background: fg, color: bg }}>{r >= 4.5 ? 'AA' : r >= 3 ? 'AA LG' : 'FAIL'}</span>
                  </div>) })}
              </div>
            </section>
          </div>

          <h2 className="label !font-sans mt-10 mb-3">Harmonies from {color}</h2>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
            {harmonies(color).map((hm) => (
              <div key={hm.name} className="group">
                <div className="flex h-11 rounded-[4px] overflow-hidden">{hm.colors.map((c, j) => <Tip key={j} label={`Copy ${c}`} className="flex-1"><button aria-label={`Copy ${c}`} className="w-full h-full transition-transform hover:scale-y-110" style={{ background: c }} onClick={() => copyText(c).then(() => st.toast(`${c} copied`))} /></Tip>)}</div>
                <div className="flex items-center justify-between mt-1.5"><span className="text-[12px]">{hm.name}</span><button className="text-[11.5px] text-accent font-medium hover:underline" onClick={() => saveNew(`${p.name} — ${hm.name.toLowerCase()}`, hm.colors, p.collection)}>Save as palette</button></div>
              </div>
            ))}
          </div>

          <h2 className="label !font-sans mt-10 mb-3">Extract from an image</h2>
          <div className="grid md:grid-cols-[260px_1fr] gap-6 items-start">
            <div>
              <Img src={source} alt="Source for extraction" className="w-full aspect-[4/3] rounded-[5px]" />
              <button className="btn w-full mt-2" onClick={() => file.current?.click()}><ImageUp size={14} /> Upload an image</button>
              <input ref={file} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (!f) return; try { const im = await fileToImage(f, 1200); st.addAsset({ category: 'Uploads', name: f.name.replace(/\.[^.]+$/, ''), tags: ['upload'], ...im }); setSource(im.src) } catch (err) { st.toast((err as Error).message) } }} />
            </div>
            <div className="min-w-0">
              <div className="flex h-[92px] rounded-[5px] overflow-hidden border border-line">
                {extracted.length ? extracted.map((c, j) => <button key={j} aria-label={`Copy ${c}`} className="flex-1 flex items-end p-2 min-w-0" style={{ background: c, color: inkOn(c) }} onClick={() => copyText(c).then(() => st.toast(`${c} copied`))}><span className="mono text-[10px] truncate">{c}</span></button>) : <span className="skel flex-1" />}
              </div>
              <div className="flex gap-2 mt-2.5 flex-wrap">
                <button className="btn btn-primary" disabled={!extracted.length} onClick={() => saveNew('Extracted palette', extracted, 'Extracted')}>Save as palette</button>
                <button className="btn" disabled={!extracted.length} onClick={() => { st.updatePalette(p.id, { colors: [...p.colors, ...extracted].slice(0, 10) }); st.toast(`Added to ${p.name}`) }}>Add to “{p.name}”</button>
              </div>
              <div className="label mt-5 mb-2">Or pick from your library</div>
              <div className="flex gap-1.5 overflow-x-auto pb-1.5">
                {photos.map((a) => <button key={a.id} aria-label={`Extract from ${a.name}`} aria-pressed={source === a.src} onClick={() => setSource(a.src!)} className="shrink-0 rounded-[4px] overflow-hidden outline-offset-2" style={{ outline: source === a.src ? '1.5px solid var(--accent)' : undefined }}><Img src={a.src!} className="w-[62px] h-[62px]" /></button>)}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function HexInput({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const [t, setT] = useState(value)
  const bad = !normHex(t)
  return <input value={t} aria-label="HEX value" aria-invalid={bad} spellCheck={false} className="field !h-9 mono !text-[13px] uppercase" style={bad ? { borderColor: '#E0697A' } : undefined}
    onChange={(e) => { setT(e.target.value); const n = normHex(e.target.value); if (n && n !== value && e.target.value.replace('#', '').length === 6) onChange(n) }}
    onBlur={() => { const n = normHex(t); if (n) { if (n !== value) onChange(n) } else setT(value) }} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />
}
