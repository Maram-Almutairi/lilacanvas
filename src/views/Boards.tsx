import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ArrowUpRight, Copy, FolderInput, FolderPlus, Heart, MoreHorizontal, Pencil, Plus, RotateCcw, Trash2, Upload } from 'lucide-react'
import type { Board } from '../types'
import { useStore } from '../store'
import { BoardThumb, Img, Menu, nav } from '../ui'
import { timeAgo } from '../lib/util'
import { extractPalette, inkOn } from '../lib/color'
import { TEMPLATES } from '../data/seed'
import { importFile, newBoard } from '../Shell'

const KINDS: Board['kind'][] = ['Branding', 'Editorial', 'Interior', 'Web', 'Photography', 'Other']
type Sort = 'recent' | 'alpha'

/** A board shown as a print with a caption — not a card. */
export function BoardFigure({ board, aspect = '4 / 3', big, delay = 0 }: { board: Board; aspect?: string; big?: boolean; delay?: number }) {
  const st = useStore.getState()
  const collections = useStore((s) => s.collections)
  const [renaming, setRenaming] = useState(false)
  const open = () => nav('board/' + board.id)
  return (
    <figure className="group m-0 min-w-0 rise" style={{ animationDelay: `${delay}ms` }}>
      <div className="relative">
        <button onClick={open} aria-label={`Open ${board.name}`} className="block w-full rounded-[5px] overflow-hidden border border-line thumb-hover" style={{ aspectRatio: aspect }} disabled={board.trashed}>
          <BoardThumb board={board} className="w-full h-full" />
        </button>
        <button aria-label={board.favorite ? 'Remove from favorites' : 'Add to favorites'} aria-pressed={board.favorite} onClick={() => st.updateBoard(board.id, { favorite: !board.favorite })}
          className={`absolute top-2.5 right-2.5 w-7 h-7 grid place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-opacity ${board.favorite ? '' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'}`}>
          <Heart size={13} fill={board.favorite ? 'currentColor' : 'none'} />
        </button>
      </div>
      <figcaption className="mt-2.5 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          {renaming
            ? <input autoFocus defaultValue={board.name} aria-label="Board name" className="field !h-6 font-display font-semibold" onBlur={(e) => { st.updateBoard(board.id, { name: e.target.value.trim() || board.name }); setRenaming(false) }} onKeyDown={(e) => (e.key === 'Enter' || e.key === 'Escape') && e.currentTarget.blur()} />
            : <button onClick={open} disabled={board.trashed} className={`font-display font-semibold tracking-[-0.01em] truncate block max-w-full text-left hover:text-accent transition-colors ${big ? 'text-[19px]' : 'text-[14.5px]'}`}>{board.name}</button>}
          <div className="mono text-[10.5px] text-muted mt-1 uppercase tracking-[0.06em] truncate">
            {board.kind} · {board.objects.length} objects · {board.shared ? `from ${board.shared}` : timeAgo(board.updatedAt)}
          </div>
          {big && <p className="text-[13px] text-muted mt-1.5">{board.description}</p>}
        </div>
        <Menu width={206} trigger={(_, toggle) => <button className="iconbtn -mr-1" aria-label={`Actions for ${board.name}`} onClick={toggle}><MoreHorizontal size={15} /></button>}>
          {(close) => board.trashed ? <>
            <button className="menuitem" onClick={() => { st.updateBoard(board.id, { trashed: false }); st.toast(`“${board.name}” restored`); close() }}><RotateCcw size={14} /> Restore</button>
            <button className="menuitem" onClick={() => { if (confirm(`Delete “${board.name}” for good? This cannot be undone.`)) st.deleteBoard(board.id); close() }}><Trash2 size={14} /> Delete forever</button>
          </> : <>
            <button className="menuitem" onClick={open}><ArrowUpRight size={14} /> Open</button>
            <button className="menuitem" onClick={() => { setRenaming(true); close() }}><Pencil size={14} /> Rename</button>
            <button className="menuitem" onClick={() => { st.duplicateBoard(board.id); st.toast('Board duplicated'); close() }}><Copy size={14} /> Duplicate</button>
            <div className="menusep" />
            <div className="label px-2.5 py-1">Collection</div>
            {collections.map((c) => <button key={c.id} className="menuitem" onClick={() => { st.updateBoard(board.id, { collectionId: board.collectionId === c.id ? undefined : c.id }); close() }}><FolderInput size={14} className={board.collectionId === c.id ? 'text-accent' : 'text-muted'} /> {c.name}{board.collectionId === c.id && <kbd>✓</kbd>}</button>)}
            <div className="menusep" />
            <button className="menuitem" onClick={() => { st.updateBoard(board.id, { trashed: true }); st.toast(`“${board.name}” moved to Trash`, { label: 'Undo', run: () => st.updateBoard(board.id, { trashed: false }) }); close() }}><Trash2 size={14} /> Move to Trash</button>
          </>}
        </Menu>
      </figcaption>
    </figure>
  )
}

function Filters({ sort, setSort, kind, setKind, favs, setFavs }: { sort: Sort; setSort: (s: Sort) => void; kind: string; setKind: (k: string) => void; favs: boolean; setFavs: (f: boolean) => void }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button className="btn !h-7" aria-pressed={favs} onClick={() => setFavs(!favs)} style={favs ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : undefined}><Heart size={12} fill={favs ? 'currentColor' : 'none'} /> Favorites</button>
      <select className="field !h-7 !w-auto !bg-transparent !border-line" aria-label="Project type" value={kind} onChange={(e) => setKind(e.target.value)}><option value="">All types</option>{KINDS.map((k) => <option key={k}>{k}</option>)}</select>
      <select className="field !h-7 !w-auto !bg-transparent !border-line" aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)}><option value="recent">Recently edited</option><option value="alpha">Alphabetical</option></select>
    </div>
  )
}
const useFilters = () => {
  const [sort, setSort] = useState<Sort>('recent'), [kind, setKind] = useState(''), [favs, setFavs] = useState(false)
  const apply = (list: Board[]) => list.filter((b) => (!kind || b.kind === kind) && (!favs || b.favorite)).sort((a, b) => (sort === 'alpha' ? a.name.localeCompare(b.name) : b.updatedAt - a.updatedAt))
  return { props: { sort, setSort, kind, setKind, favs, setFavs }, apply, active: !!kind || favs, clear: () => { setKind(''); setFavs(false) } }
}
const H2 = ({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) => (
  <div className="flex items-end justify-between gap-4 flex-wrap mt-16 mb-5"><h2 className="text-[19px] font-semibold tracking-[-0.015em]">{children}</h2>{right}</div>
)

/* ---------------- dashboard ---------------- */
export function Dashboard() {
  const boards = useStore((s) => s.boards)
  const collections = useStore((s) => s.collections)
  const assets = useStore((s) => s.assets)
  const recent = useStore((s) => s.recent)
  const st = useStore.getState()
  const f = useFilters()
  const live = boards.filter((b) => !b.trashed)
  const list = f.apply(live)
  const hour = new Date().getHours()
  const part = hour < 5 ? 'evening' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'
  const photos = assets.filter((a) => a.category === 'Photography')
  const daily = photos.length ? photos[Math.floor(Date.now() / 864e5) % photos.length] : undefined
  const [dailyColors, setDailyColors] = useState<string[]>([])
  useEffect(() => { if (daily?.src) extractPalette(daily.src, 5).then(setDailyColors) }, [daily?.src])
  const used = recent.map((id) => assets.find((a) => a.id === id)).filter((a) => a?.src) as typeof assets
  // editorial rhythm: wide lead, tall second, then an offset pair
  const spans = ['lg:col-span-7', 'lg:col-span-5', 'lg:col-span-4', 'lg:col-span-4', 'lg:col-span-4']
  const aspects = ['16 / 10', '8 / 7', '4 / 3', '4 / 3', '4 / 3']
  return (
    <div className="h-full overflow-y-auto bg-bg2">
      <div className="max-w-[1180px] mx-auto px-10 max-sm:px-4 pt-12 max-sm:pt-8 pb-28">
        <header className="flex items-end justify-between gap-6 flex-wrap rise">
          <div>
            <h1 className="text-[42px] max-sm:text-[30px] leading-[1.05] font-semibold tracking-[-0.03em]">Good {part}, Creator.</h1>
            <p className="text-muted text-[16px] mt-2.5">Your next idea starts here.</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="btn !h-9 !px-3.5 cursor-pointer"><Upload size={14} /> Import board<input type="file" accept=".moodspace,.json,application/json" hidden onChange={(e) => { const x = e.target.files?.[0]; if (x) importFile(x); e.target.value = '' }} /></label>
            <button className="btn btn-primary !h-9 !px-4 !text-[13px]" onClick={() => newBoard()}><Plus size={15} /> Create New Board</button>
          </div>
        </header>

        <H2 right={<Filters {...f.props} />}>Recent Projects</H2>
        {list.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-x-7 gap-y-10">
            {list.slice(0, 5).map((b, i) => <div key={b.id} className={`${spans[i]} ${i === 1 ? 'lg:mt-10' : ''}`}><BoardFigure board={b} aspect={aspects[i]} big={i === 0} delay={i * 60} /></div>)}
          </div>
        ) : (
          <div className="border border-dashed border-line rounded-lg py-14 text-center">
            <div className="font-display font-semibold text-[16px]">{f.active ? 'No projects match those filters.' : 'No boards yet.'}</div>
            <p className="text-muted mt-1">{f.active ? 'Try another type, or clear the filters.' : 'Start with a blank desk or one of the templates below.'}</p>
            <button className="btn mt-4" onClick={f.active ? f.clear : () => newBoard()}>{f.active ? 'Clear filters' : 'Create a board'}</button>
          </div>
        )}
        {list.length > 5 && <button className="btn btn-ghost mt-6 -ml-2.5 text-accent" onClick={() => nav('boards/recent')}>All {list.length} boards <ArrowRight size={14} /></button>}

        {daily && (
          <>
            <H2>Inspiration of the Day</H2>
            <section className="grid lg:grid-cols-[1.35fr_1fr] gap-x-10 gap-y-6 items-end">
              <Img src={daily.src!} alt={daily.name} className="w-full rounded-[5px] aspect-[16/10]" />
              <div className="pb-1">
                <div className="mono text-[10.5px] uppercase tracking-[0.08em] text-muted">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                <h3 className="font-serif text-[40px] max-sm:text-[30px] leading-[1.02] font-medium tracking-[-0.02em] mt-3 italic">{daily.name}</h3>
                <p className="text-muted text-[13.5px] mt-3 max-w-[38ch] leading-relaxed">Five colours pulled from today’s photograph. Take the palette, the picture, or both.</p>
                <div className="flex h-12 mt-5 rounded-[4px] overflow-hidden max-w-[380px]">
                  {(dailyColors.length ? dailyColors : ['var(--panel)']).map((c, i) => <div key={i} className="flex-1 flex items-end p-1.5 transition-[flex] duration-300 hover:flex-[1.6]" style={{ background: c }}>{dailyColors.length > 0 && <span className="mono text-[9px]" style={{ color: inkOn(c) }}>{c}</span>}</div>)}
                </div>
                <div className="flex gap-2 mt-5 flex-wrap">
                  <button className="btn" disabled={!dailyColors.length} onClick={() => { st.savePalette({ name: daily.name, colors: dailyColors, collection: 'Inspiration' }); st.toast('Palette saved', { label: 'Open Color Lab', run: () => nav('colors') }) }}>Save palette</button>
                  <button className="btn" onClick={() => { st.updateAsset(daily.id, { favorite: true }); st.toast('Added to your favorites') }}><Heart size={13} /> Keep the photo</button>
                </div>
              </div>
            </section>
          </>
        )}

        <H2 right={<button className="btn btn-ghost text-accent !h-7" onClick={() => nav('boards/collections')}>Manage <ArrowRight size={13} /></button>}>Your Collections</H2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-8">
          {collections.map((c) => {
            const mine = live.filter((b) => b.collectionId === c.id)
            return (
              <button key={c.id} onClick={() => nav('boards/collections')} className="group text-left">
                <div className="relative h-[132px]">
                  {mine.slice(0, 3).reverse().map((b, i, arr) => { const k = arr.length - 1 - i; return (
                    <div key={b.id} className="absolute top-0 bottom-0 w-[62%] rounded-[4px] overflow-hidden border border-line transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-x-[var(--dx)]" style={{ left: `${k * 19}%`, zIndex: 3 - k, transform: `rotate(${k * 1.5 - 1}deg)`, ['--dx' as string]: `${k * 8}px` }}><BoardThumb board={b} className="w-full h-full" /></div>) })}
                  {!mine.length && <div className="absolute inset-0 rounded-[4px] border border-dashed border-line grid place-items-center text-[12px] text-muted">Empty collection</div>}
                </div>
                <div className="mt-3 font-display font-semibold text-[14.5px] group-hover:text-accent transition-colors">{c.name}</div>
                <div className="mono text-[10.5px] text-muted uppercase tracking-[0.06em] mt-0.5">{mine.length} {mine.length === 1 ? 'board' : 'boards'}</div>
              </button>
            )
          })}
        </div>

        <H2 right={<button className="btn btn-ghost text-accent !h-7" onClick={() => nav('library/images')}>Open library <ArrowRight size={13} /></button>}>Recently Used Assets</H2>
        {used.length ? <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
          {used.map((a) => <button key={a.id} onClick={() => nav('library/' + encodeURIComponent('q:' + a.name))} className="shrink-0 group text-left" title={a.name}><Img src={a.src!} alt={a.name} className="h-[104px] rounded-[4px] thumb-hover" style={{ aspectRatio: `${a.w} / ${a.h}` }} /><div className="text-[11.5px] text-muted mt-1.5 truncate max-w-[140px] group-hover:text-ink transition-colors">{a.name}</div></button>)}
        </div> : <p className="text-muted">Assets you place on a board show up here.</p>}

        <H2 right={<button className="btn btn-ghost text-accent !h-7" onClick={() => nav('boards/templates')}>All templates <ArrowRight size={13} /></button>}>Templates</H2>
        <TemplateGrid />
      </div>
    </div>
  )
}

function TemplateGrid() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8">
      {TEMPLATES.map((t) => (
        <button key={t.id} onClick={() => newBoard(t.id)} className="group text-left">
          <TemplateThumb id={t.id} />
          <div className="mt-2.5 font-display font-semibold text-[13.5px] group-hover:text-accent transition-colors">{t.name}</div>
          <div className="text-[12px] text-muted mt-0.5 leading-snug">{t.blurb}</div>
        </button>
      ))}
    </div>
  )
}
function TemplateThumb({ id }: { id: string }) {
  const t = TEMPLATES.find((x) => x.id === id)!
  const objects = useRef(t.build()).current
  return <div className="rounded-[5px] overflow-hidden border border-line thumb-hover"><BoardThumb board={{ objects, canvasColor: t.canvasColor }} fit="contain" pad={50} className="w-full aspect-[4/3]" /></div>
}

/* ---------------- board lists ---------------- */
const TITLES: Record<string, [string, string]> = {
  recent: ['Recent', 'Everything you have touched lately, newest first.'],
  mine: ['My Boards', 'Boards you started in this workspace.'],
  shared: ['Shared with me', 'Boards that arrived as files from other people.'],
  favorites: ['Favorites', 'The boards you keep coming back to.'],
  projects: ['Projects', 'Your boards, grouped by the kind of work they are.'],
  collections: ['Collections', 'Group boards by client, season or idea.'],
  trash: ['Trash', 'Boards stay here until you delete them for good.'],
  templates: ['Templates', 'A head start: structure without the content.'],
}
export function Boards({ filter }: { filter: string }) {
  const boards = useStore((s) => s.boards)
  const collections = useStore((s) => s.collections)
  const f = useFilters()
  const [title, sub] = TITLES[filter] ?? TITLES.recent
  const live = boards.filter((b) => !b.trashed)
  const base = filter === 'trash' ? boards.filter((b) => b.trashed) : filter === 'mine' ? live.filter((b) => !b.shared) : filter === 'shared' ? live.filter((b) => b.shared) : filter === 'favorites' ? live.filter((b) => b.favorite) : live
  const list = f.apply(base)
  const grid = (items: Board[]) => <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-7 gap-y-10">{items.map((b, i) => <BoardFigure key={b.id} board={b} delay={i * 40} />)}</div>
  const groups: [string, Board[]][] | null =
    filter === 'projects' ? KINDS.map((k): [string, Board[]] => [k, list.filter((b) => b.kind === k)]).filter(([, l]) => l.length)
    : filter === 'collections' ? [...collections.map((c): [string, Board[]] => [c.name, list.filter((b) => b.collectionId === c.id)]), ['Not in a collection', list.filter((b) => !collections.some((c) => c.id === b.collectionId))]]
    : null
  const empty: Record<string, string> = { shared: 'Nothing has been shared yet. Import a .moodspace file to open someone else’s board.', favorites: 'No favorites yet. Tap the heart on a board to keep it here.', trash: 'Trash is empty.' }
  return (
    <div className="h-full overflow-y-auto bg-bg2">
      <div className="max-w-[1180px] mx-auto px-10 max-sm:px-4 pt-9 pb-24">
        <div className="flex items-end justify-between gap-5 flex-wrap">
          <div><h1 className="text-[28px] font-semibold tracking-[-0.02em]">{title}</h1><p className="text-muted mt-1">{sub}</p></div>
          {filter === 'templates' ? null : (
            <div className="flex items-center gap-1.5 flex-wrap">
              {filter !== 'trash' && <Filters {...f.props} />}
              {filter === 'collections' && <button className="btn !h-7" onClick={() => { const name = prompt('Name the new collection'); if (name?.trim()) useStore.setState((s) => ({ collections: [...s.collections, { id: 'c-' + Date.now(), name: name.trim() }] })) }}><FolderPlus size={13} /> New collection</button>}
              {filter === 'shared' && <label className="btn !h-7 cursor-pointer"><Upload size={13} /> Import<input type="file" accept=".moodspace,.json" hidden onChange={(e) => { const x = e.target.files?.[0]; if (x) importFile(x); e.target.value = '' }} /></label>}
            </div>
          )}
        </div>
        <div className="mt-9">
          {filter === 'templates' ? <TemplateGrid />
            : groups ? groups.map(([name, items]) => (
              <section key={name} className="mb-12">
                <div className="flex items-baseline gap-3 mb-4 border-b border-line pb-2"><h2 className="text-[15px] font-semibold">{name}</h2><span className="mono text-[10.5px] text-muted">{items.length}</span></div>
                {items.length ? grid(items) : <p className="text-muted text-[12.5px]">No boards here yet — use a board’s menu to move it into this collection.</p>}
              </section>))
            : list.length ? grid(list)
            : <div className="border border-dashed border-line rounded-lg py-16 text-center">
                <div className="font-display font-semibold text-[16px]">{f.active ? 'No boards match those filters.' : empty[filter] ?? 'No boards yet.'}</div>
                {f.active ? <button className="btn mt-4" onClick={f.clear}>Clear filters</button> : !empty[filter] && <button className="btn btn-primary mt-4" onClick={() => newBoard()}><Plus size={14} /> Create New Board</button>}
              </div>}
        </div>
      </div>
    </div>
  )
}
