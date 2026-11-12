import { useMemo, useRef, useState } from 'react'
import { Heart, Plus, Search, Trash2, Upload, X } from 'lucide-react'
import type { Asset, Obj } from '../types'
import { useStore } from '../store'
import { BoardThumb, Img, Menu, nav, Tip } from '../ui'
import { bounds, copyText, fileToImage, uid } from '../lib/util'
import { chip, imgFrom, pal } from '../data/seed'
import { editor } from '../editor/Canvas'
import { useShell, type Tray } from '../Shell'

interface Item { id: string; name: string; tags: string[]; group: string; favorite?: boolean; src?: string; w?: number; h?: number; colors?: string[]; objects: () => Obj[]; asset?: Asset }
const CATS = ['Images', 'Photography', 'Textures', 'Typography', 'Color palettes', 'Shapes', 'Saved elements'] as const
type Cat = (typeof CATS)[number]

function useItems(): Item[] {
  const assets = useStore((s) => s.assets)
  const palettes = useStore((s) => s.palettes)
  return useMemo(() => [
    ...assets.map((a): Item => ({ id: a.id, name: a.name, tags: a.tags, group: a.category, favorite: a.favorite, src: a.src, w: a.w, h: a.h, asset: a, objects: () => (a.src ? [imgFrom(a.src, a.w ?? 4, a.h ?? 3)] : a.objects ?? []) })),
    ...palettes.map((p): Item => ({ id: p.id, name: p.name, tags: [p.collection.toLowerCase(), 'palette'], group: 'Color palettes', colors: p.colors, objects: () => [pal(p.colors, 0, 0, 380, 104)] })),
  ], [assets, palettes])
}
const inCat = (i: Item, c: Cat) => (c === 'Images' ? !!i.src : i.group === c)

export async function uploadToLibrary(files: File[]) {
  const st = useStore.getState()
  let n = 0
  for (const f of files) {
    try { const { src, w, h } = await fileToImage(f); st.addAsset({ category: 'Uploads', name: f.name.replace(/\.[^.]+$/, '') || 'Upload', tags: ['upload'], src, w, h }); n++ } catch (e) { st.toast((e as Error).message) }
  }
  if (n) st.toast(n > 1 ? `${n} images added to your library` : 'Image added to your library')
}

function place(item: Item) {
  const st = useStore.getState()
  const at = editor.center?.() ?? { x: 400, y: 300 }
  const src = item.objects()
  const bb = bounds(src)
  st.add(src.map((o) => ({ ...o, id: uid(), x: o.x - bb.x - bb.width / 2 + at.x, y: o.y - bb.y - bb.height / 2 + at.y })))
  if (item.asset) st.touchAsset(item.asset.id)
}

function Card({ item, compact }: { item: Item; compact?: boolean }) {
  const st = useStore.getState()
  const boards = useStore((s) => s.boards).filter((b) => !b.trashed)
  const a = item.asset
  const mine = a && !a.id.startsWith('a-')
  const preview = item.src
    ? <Img src={item.src} alt={item.name} className="w-full rounded-[4px]" style={{ aspectRatio: `${item.w} / ${item.h}` }} />
    : item.colors
      ? <div className="flex h-[72px] rounded-[4px] overflow-hidden">{item.colors.map((c, i) => <i key={i} className="flex-1" style={{ background: c }} />)}</div>
      : <BoardThumb board={{ objects: item.objects(), canvasColor: '#EFEAF3' }} fit="contain" pad={28} className="w-full aspect-[4/3] rounded-[4px]" />
  return (
    <figure className="group relative m-0 mb-3 break-inside-avoid">
      <div draggable className="relative cursor-grab active:cursor-grabbing rounded-[4px] outline-1 outline-transparent hover:outline-accent outline-offset-2 transition-[outline-color]"
        onDragStart={(e) => { e.dataTransfer.setData('application/x-lilacanvas', JSON.stringify(a ? { assetId: a.id } : { objects: item.objects() })); e.dataTransfer.effectAllowed = 'copy' }}
        onClick={() => compact && (place(item), st.toast(`${item.name} placed`))} role={compact ? 'button' : undefined} tabIndex={compact ? 0 : undefined}
        onKeyDown={(e) => compact && e.key === 'Enter' && place(item)} title={compact ? 'Click to place, or drag onto the board' : item.name}>
        {preview}
        <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
          {mine && <button className="iconbtn !w-6 !h-6 !bg-black/55 !text-white backdrop-blur-sm" aria-label={`Delete ${item.name}`} onClick={(e) => { e.stopPropagation(); st.removeAsset(a.id); st.toast('Removed from your library') }}><Trash2 size={12} /></button>}
          {a && <button className="iconbtn !w-6 !h-6 !bg-black/55 !text-white backdrop-blur-sm" aria-label="Favourite" aria-pressed={!!a.favorite} onClick={(e) => { e.stopPropagation(); st.updateAsset(a.id, { favorite: !a.favorite }) }}><Heart size={12} fill={a.favorite ? 'currentColor' : 'none'} /></button>}
        </div>
        {a?.favorite && <Heart size={11} fill="currentColor" className="absolute top-2.5 right-2.5 text-white drop-shadow group-hover:opacity-0 transition-opacity" />}
        {!compact && (
          <div className="absolute left-1.5 bottom-1.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
            <Menu align="left" up width={210} trigger={(_, toggle) => <button className="h-6 px-2 rounded-md bg-accent text-onaccent text-[11px] font-semibold flex items-center gap-1" onClick={toggle}><Plus size={12} /> Add to board</button>}>
              {(close) => <>{boards.map((b) => <button key={b.id} className="menuitem" onClick={() => { st.addToBoard(b.id, item.objects()); if (a) st.touchAsset(a.id); st.toast(`Added to ${b.name}`, { label: 'Open', run: () => nav('board/' + b.id) }); close() }}><span className="w-3 h-3 rounded-sm border border-line shrink-0" style={{ background: b.canvasColor }} /><span className="truncate">{b.name}</span></button>)}</>}
            </Menu>
          </div>
        )}
      </div>
      {!compact && <figcaption className="mt-1.5 flex items-baseline gap-2"><span className="text-[12px] font-medium truncate">{item.name}</span><span className="mono text-[10px] text-muted truncate ml-auto">{item.tags.slice(0, 2).join(' · ')}</span></figcaption>}
    </figure>
  )
}

export function Library({ param }: { param: string }) {
  const items = useItems()
  const query0 = param.startsWith('q:') ? param.slice(2) : ''
  const start: Cat = param === 'typography' ? 'Typography' : param === 'elements' ? 'Saved elements' : 'Images'
  const [cat, setCat] = useState<Cat>(start)
  const [seen, setSeen] = useState(param)
  const [q, setQ] = useState(query0)
  const [tag, setTag] = useState('')
  const [favs, setFavs] = useState(false)
  const file = useRef<HTMLInputElement>(null)
  if (seen !== param) { setSeen(param); setCat(start); setQ(query0); setTag('') }
  const ql = q.trim().toLowerCase()
  const pool = items.filter((i) => (ql ? true : inCat(i, cat)))
  const tags = useMemo(() => { const n = new Map<string, number>(); pool.forEach((i) => i.tags.forEach((t) => n.set(t, (n.get(t) ?? 0) + 1))); return [...n].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([t]) => t) }, [pool.length, cat, ql]) // eslint-disable-line
  const list = pool.filter((i) => (!ql || (i.name + ' ' + i.tags.join(' ') + ' ' + i.group).toLowerCase().includes(ql)) && (!tag || i.tags.includes(tag)) && (!favs || i.favorite))
  return (
    <div className="h-full overflow-y-auto bg-bg2">
      <div className="max-w-[1240px] mx-auto px-8 max-sm:px-4 pt-9 pb-24">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
          <div className="mr-auto">
            <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Library</h1>
            <p className="text-muted text-[13px] mt-1">Everything you can put on a board. Drag assets straight onto an open canvas.</p>
          </div>
          <label className="field flex items-center gap-2 !w-[240px] !h-[30px] !bg-bg max-sm:!w-full"><Search size={13} className="text-muted" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or tag" aria-label="Search library" className="bg-transparent w-full placeholder:text-muted" />{q && <button aria-label="Clear search" onClick={() => setQ('')}><X size={13} className="text-muted" /></button>}</label>
          <button className="btn" aria-pressed={favs} data-on={favs} onClick={() => setFavs(!favs)} style={favs ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : undefined}><Heart size={13} fill={favs ? 'currentColor' : 'none'} /> Favorites</button>
          <button className="btn btn-primary" onClick={() => file.current?.click()}><Upload size={14} /> Upload</button>
          <input ref={file} type="file" accept="image/*" multiple hidden onChange={(e) => { uploadToLibrary([...(e.target.files ?? [])]); setCat('Images'); e.target.value = '' }} />
        </div>

        <div className="mt-7 flex gap-5 border-b border-line overflow-x-auto" role="tablist">
          {CATS.map((c) => { const n = items.filter((i) => inCat(i, c)).length; const on = !ql && c === cat; return (
            <button key={c} role="tab" aria-selected={on} onClick={() => { setCat(c); setTag(''); setQ('') }} className={`relative h-9 text-[12.5px] whitespace-nowrap transition-colors ${on ? 'text-ink font-medium' : 'text-muted hover:text-ink'}`}>
              {c}<span className="mono text-[10px] text-muted ml-1.5">{n}</span>
              {on && <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-accent rounded-full" />}
            </button>) })}
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {tags.map((t) => <button key={t} aria-pressed={tag === t} onClick={() => setTag(tag === t ? '' : t)} className={`h-6 px-2.5 rounded-full text-[11.5px] border transition-colors ${tag === t ? 'bg-accent border-accent text-onaccent font-medium' : 'border-line text-muted hover:text-ink hover:border-muted'}`}>{t}</button>)}
        </div>

        {list.length === 0 ? (
          <div className="mt-20 text-center">
            <div className="font-display text-[17px] font-semibold">{ql || tag || favs ? 'Nothing matches those filters.' : cat === 'Saved elements' ? 'No saved elements yet.' : 'Nothing here yet.'}</div>
            <p className="text-muted mt-1.5">{ql || tag || favs ? 'Clear the search or pick another tag.' : 'Upload images, or save a selection from a board with “Save to library”.'}</p>
            {(ql || tag || favs) && <button className="btn mt-4" onClick={() => { setQ(''); setTag(''); setFavs(false) }}>Clear filters</button>}
          </div>
        ) : <div className="mt-6 columns-2 md:columns-3 xl:columns-4 gap-4">{list.map((i) => <Card key={i.id} item={i} />)}</div>}
      </div>
    </div>
  )
}

/* Asset tray that slides over the canvas while a board is open. */
export function AssetTray({ tray }: { tray: Exclude<Tray, null> }) {
  const items = useItems()
  const shell = useShell()
  const favColors = useStore((s) => s.favColors)
  const st = useStore.getState()
  const [q, setQ] = useState('')
  const file = useRef<HTMLInputElement>(null)
  const ql = q.trim().toLowerCase()
  const groups: Record<Exclude<Tray, null>, string[]> = { images: ['Uploads', 'Photography', 'Textures'], colors: ['Color palettes'], typography: ['Typography'], elements: ['Saved elements', 'Shapes'] }
  const title = { images: 'Images', colors: 'Colors', typography: 'Typography', elements: 'Elements' }[tray]
  return (
    <aside aria-label={`${title} tray`} className="absolute left-0 top-0 bottom-0 z-30 w-[288px] max-w-[86vw] bg-panel border-r border-line flex flex-col shadow-2xl" style={{ animation: 'tray .28s cubic-bezier(.16,1,.3,1)' }} onPointerDown={(e) => e.stopPropagation()}>
      <style>{'@keyframes tray{from{transform:translateX(-16px);opacity:0}}'}</style>
      <div className="h-11 pl-3.5 pr-2 flex items-center gap-2 border-b border-line shrink-0">
        <h2 className="text-[13px] font-semibold mr-auto">{title}</h2>
        {tray === 'images' && <Tip down label="Upload images"><button className="iconbtn" aria-label="Upload images" onClick={() => file.current?.click()}><Upload size={14} /></button></Tip>}
        <button className="iconbtn" aria-label="Close tray" onClick={() => shell.set({ tray: null })}><X size={15} /></button>
        <input ref={file} type="file" accept="image/*" multiple hidden onChange={(e) => { uploadToLibrary([...(e.target.files ?? [])]); e.target.value = '' }} />
      </div>
      <div className="p-3 pb-0"><label className="field flex items-center gap-2"><Search size={13} className="text-muted" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${title.toLowerCase()}`} aria-label={`Search ${title}`} className="bg-transparent w-full placeholder:text-muted" /></label></div>
      <div className="flex-1 overflow-y-auto p-3">
        {tray === 'colors' && !ql && <>
          <div className="label mb-2">Favorite colours</div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {favColors.map((c) => <Tip key={c} label={c}><button draggable aria-label={`Place ${c}`} className="w-7 h-7 rounded-full border border-line transition-transform hover:scale-110"
              style={{ background: c }} onDragStart={(e) => e.dataTransfer.setData('application/x-lilacanvas', JSON.stringify({ objects: [chip(c, 'Colour', 0, 0)] }))}
              onClick={(e) => { if (e.shiftKey) return void copyText(c).then(() => st.toast(`${c} copied`)); const at = editor.center?.() ?? { x: 0, y: 0 }; st.add([chip(c, 'Colour', at.x - 52, at.y - 68)]) }} /></Tip>)}
            {!favColors.length && <span className="text-[12px] text-muted">Heart a colour in Color Lab to keep it here.</span>}
          </div>
        </>}
        {groups[tray].map((gname) => {
          const list = items.filter((i) => i.group === gname && (!ql || (i.name + ' ' + i.tags.join(' ')).toLowerCase().includes(ql)))
          if (!list.length) return null
          return <div key={gname} className="mb-3"><div className="label mb-2">{gname}</div><div className={tray === 'colors' ? '' : 'columns-2 gap-2.5 [&_figure]:mb-2.5'}>{list.map((i) => <Card key={i.id} item={i} compact />)}</div></div>
        })}
        <p className="text-[11px] text-muted mt-2 leading-snug">Click to place at the centre of the view, or drag onto the board.</p>
      </div>
    </aside>
  )
}
