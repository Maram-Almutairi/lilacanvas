import { useEffect, useRef, useState } from 'react'
import { create } from 'zustand'
import {
  Check, ChevronDown, Clock, Download, FileImage, FileJson, FolderClosed, Heart, House, Image as ImageIcon, Keyboard, LayoutGrid, LayoutTemplate, Layers, Link2, Menu as MenuIcon, Moon, Palette,
  PanelRight, Plus, Redo2, RotateCcw, Search, Share2, Shapes, Sun, Trash2, Type, Undo2, Users,
} from 'lucide-react'
import { useStore } from './store'
import { Dialog, Logo, Mark, Menu, nav, Tip, useOutside, useRoute } from './ui'
import { copyText, download, timeAgo } from './lib/util'
import { editor } from './editor/Canvas'

export type Tray = 'images' | 'colors' | 'typography' | 'elements' | null
export const useShell = create<{ side: boolean; props: boolean; focus: boolean; tray: Tray; sideW: number; propsW: number; shortcuts: boolean; set: (p: Partial<{ side: boolean; props: boolean; focus: boolean; tray: Tray; sideW: number; propsW: number; shortcuts: boolean }>) => void }>((set) => ({
  side: false, props: false, focus: false, tray: null, sideW: 240, propsW: 264, shortcuts: false, set: (p) => set(p),
}))

export function newBoard(templateId?: string) {
  const id = useStore.getState().createBoard(templateId)
  nav('board/' + id)
}
export function exportFile(boardId: string) {
  const b = useStore.getState().boards.find((x) => x.id === boardId)
  if (!b) return
  const { name, kind, description, canvasColor, objects } = b
  download(URL.createObjectURL(new Blob([JSON.stringify({ lilacanvas: 1, name, kind, description, canvasColor, objects })], { type: 'application/json' })), name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.lilacanvas')
  useStore.getState().toast('Board file downloaded')
}
export function importFile(file: File) {
  const st = useStore.getState()
  if (file.size > 60 * 1024 * 1024) return st.toast('That file is too large to be a Lilacanvas board (60 MB limit).')
  file.text().then((t) => {
    const data = JSON.parse(t)
    if (!Array.isArray(data.objects)) throw new Error()
    nav('board/' + st.importBoard(data))
    st.toast(`Imported “${data.name ?? 'board'}”`)
  }).catch(() => st.toast('That file is not a Lilacanvas board. Choose a .lilacanvas file.'))
}

/* ---------------- top bar ---------------- */
export function TopBar() {
  const { view } = useRoute()
  const board = useStore((s) => s.boards.find((b) => b.id === s.activeId))
  const inEditor = view === 'board' && !!board
  const canUndo = useStore((s) => s.past.length > 0), canRedo = useStore((s) => s.future.length > 0)
  const status = useStore((s) => s.saveStatus), savedAt = useStore((s) => s.savedAt)
  const theme = useStore((s) => s.theme)
  const st = useStore.getState()
  const shell = useShell()
  const titles: Record<string, string> = { home: 'Home', boards: 'Boards', colors: 'Color Lab', library: 'Library' }
  const light = 'w-[11px] h-[11px] rounded-full bg-line transition-colors'
  return (
    <header className="h-[54px] shrink-0 flex items-center gap-3 pl-4 pr-3 bg-bg border-b border-line relative z-30">
      <div className="group flex items-center gap-[7px] max-lg:hidden">
        <Tip down label="Close to Home"><button aria-label="Close to Home" onClick={() => nav('home')} className={`${light} group-hover:bg-[#F2766B]`} /></Tip>
        <Tip down label={shell.focus ? 'Show panels' : 'Focus mode'}><button aria-label="Toggle focus mode" onClick={() => shell.set({ focus: !shell.focus })} className={`${light} group-hover:bg-[#E9B949]`} /></Tip>
        <Tip down label="Full screen"><button aria-label="Toggle full screen" onClick={() => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.())} className={`${light} group-hover:bg-[#62C277]`} /></Tip>
      </div>
      <button className="iconbtn lg:hidden" aria-label="Open navigation" onClick={() => shell.set({ side: true })}><MenuIcon size={17} /></button>
      <button onClick={() => nav('home')} aria-label="Lilacanvas home" className="lg:ml-2 flex items-center"><span className="max-sm:hidden"><Logo /></span><span className="sm:hidden"><Mark /></span></button>
      <span className="w-px h-5 bg-line max-sm:hidden" />

      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {inEditor ? <>
          <input value={board.name} aria-label="Board name" spellCheck={false} onChange={(e) => st.updateBoard(board.id, { name: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            className="font-display font-semibold text-[13.5px] bg-transparent rounded-[5px] px-1.5 h-7 min-w-0 hover:bg-hover focus:bg-bg2 focus:outline-1 focus:outline-accent" style={{ width: `${Math.max(6, board.name.length + 2)}ch`, maxWidth: '36vw' }} />
          <span className="flex items-center gap-1.5 text-[11.5px] text-muted whitespace-nowrap max-md:hidden" title={`Saved to this browser ${timeAgo(savedAt)}`} aria-live="polite">
            {status === 'saving' ? <><span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />Saving…</> : <><Check size={12} className="text-accent" />Saved</>}
          </span>
        </> : <span className="font-display font-semibold text-[13.5px] px-1.5">{titles[view] ?? 'Home'}</span>}
      </div>

      {inEditor ? <>
        <div className="flex items-center">
          <Tip down label="Undo" keys="Ctrl Z"><button className="iconbtn" disabled={!canUndo} onClick={st.undo} aria-label="Undo"><Undo2 size={16} /></button></Tip>
          <Tip down label="Redo" keys="Ctrl ⇧ Z"><button className="iconbtn" disabled={!canRedo} onClick={st.redo} aria-label="Redo"><Redo2 size={16} /></button></Tip>
        </div>
        <Menu width={286} trigger={(_, toggle) => <button className="btn max-sm:!px-2" onClick={toggle}><Share2 size={14} /><span className="max-sm:hidden">Share</span></button>}>
          {(close) => <div className="p-2">
            <div className="font-display font-semibold text-[13px]">Share “{board.name}”</div>
            <p className="text-[12px] text-muted mt-1 mb-3 leading-snug">Boards live in this browser. Send the board file and anyone can open an editable copy in their own Lilacanvas.</p>
            <button className="btn btn-primary w-full" onClick={() => { exportFile(board.id); close() }}><FileJson size={14} /> Download board file</button>
            <button className="btn w-full mt-1.5" onClick={() => { copyText(location.href).then(() => st.toast('Link copied — it opens this board on this device')); close() }}><Link2 size={14} /> Copy link</button>
          </div>}
        </Menu>
        <Menu width={232} trigger={(_, toggle) => <button className="btn btn-primary max-sm:!px-2" onClick={toggle}><Download size={14} /><span className="max-sm:hidden">Export</span><ChevronDown size={13} className="max-sm:hidden -mr-1" /></button>}>
          {(close) => <>
            <button className="menuitem" onClick={() => { editor.exportPNG?.(); close() }}><FileImage size={14} /> PNG image<kbd>2×</kbd></button>
            <button className="menuitem" onClick={() => { exportFile(board.id); close() }}><FileJson size={14} /> Board file<kbd>.lilacanvas</kbd></button>
          </>}
        </Menu>
        <Tip down label="Properties" className="lg:hidden"><button className="iconbtn" aria-label="Toggle properties" data-on={shell.props} onClick={() => shell.set({ props: !shell.props })}><PanelRight size={16} /></button></Tip>
      </> : <button className="btn btn-primary" onClick={() => newBoard()}><Plus size={14} /> New board</button>}

      <Menu width={236} trigger={(_, toggle) => (
        <button onClick={toggle} aria-label="Account menu" className="w-7 h-7 rounded-full grid place-items-center font-display text-[11px] font-bold text-onaccent shrink-0 transition-transform hover:scale-105" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }}>C</button>
      )}>
        {(close) => <>
          <div className="px-2.5 py-2"><div className="font-semibold text-[12.5px]">Creator</div><div className="text-[11.5px] text-muted">Local workspace · this browser</div></div>
          <div className="menusep" />
          <button className="menuitem" onClick={() => st.setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}{theme === 'dark' ? 'Light theme' : 'Dark theme'}</button>
          <button className="menuitem" onClick={() => { shell.set({ shortcuts: true }); close() }}><Keyboard size={14} /> Keyboard shortcuts</button>
          <button className="menuitem" onClick={() => { nav('promo'); close() }}><Share2 size={14} /> About Lilacanvas</button>
          <div className="menusep" />
          <button className="menuitem" onClick={() => { if (confirm('Reset the workspace to the sample projects? Your boards, uploads and palettes in this browser will be replaced.')) { st.resetWorkspace(); nav('home'); st.toast('Workspace reset to the sample projects') } close() }}><RotateCcw size={14} /> Reset sample workspace</button>
        </>}
      </Menu>
      {shell.shortcuts && <Shortcuts onClose={() => shell.set({ shortcuts: false })} />}
    </header>
  )
}

function Shortcuts({ onClose }: { onClose: () => void }) {
  const rows: [string, string][] = [
    ['Move', 'V'], ['Frame', 'F'], ['Text', 'T'], ['Shape (hold ⇧ for ellipse)', 'R'], ['Sticky note', 'N'], ['Place image', 'I'], ['Hand', 'H or hold Space'],
    ['Zoom', 'Ctrl + scroll · pinch'], ['Fit board', 'Ctrl 1'], ['Actual size', 'Ctrl 0'], ['Undo / Redo', 'Ctrl Z / Ctrl ⇧ Z'], ['Duplicate', 'Ctrl D'], ['Copy / Paste', 'Ctrl C / Ctrl V'],
    ['Group / Ungroup', 'Ctrl G / Ctrl ⇧ G'], ['Select all', 'Ctrl A'], ['Layer forward / backward', '] / ['], ['Nudge (×10 with ⇧)', 'Arrow keys'], ['Edit text', 'Enter or double-click'], ['Delete', 'Del'],
  ]
  return (
    <Dialog title="Keyboard shortcuts" onClose={onClose} width={520}>
      <dl className="grid sm:grid-cols-2 gap-x-6">
        {rows.map(([a, b]) => <div key={a} className="flex items-center justify-between h-8 border-b border-line/60 gap-3"><dt className="text-[12.5px] truncate">{a}</dt><dd className="mono text-[11px] text-muted whitespace-nowrap">{b}</dd></div>)}
      </dl>
    </Dialog>
  )
}

/* ---------------- sidebar ---------------- */
const NAV = [
  { title: 'Workspace', items: [
    { label: 'Home', to: 'home', icon: House }, { label: 'Recent', to: 'boards/recent', icon: Clock }, { label: 'My Boards', to: 'boards/mine', icon: LayoutGrid },
    { label: 'Shared with me', to: 'boards/shared', icon: Users }, { label: 'Favorites', to: 'boards/favorites', icon: Heart },
  ] },
  { title: 'Library', items: [
    { label: 'Images', to: 'library/images', icon: ImageIcon, tray: 'images' as Tray }, { label: 'Colors', to: 'colors', icon: Palette, tray: 'colors' as Tray }, { label: 'Typography', to: 'library/typography', icon: Type, tray: 'typography' as Tray },
    { label: 'Elements', to: 'library/elements', icon: Shapes, tray: 'elements' as Tray }, { label: 'Templates', to: 'boards/templates', icon: LayoutTemplate },
  ] },
  { title: 'Organization', items: [
    { label: 'Projects', to: 'boards/projects', icon: FolderClosed }, { label: 'Collections', to: 'boards/collections', icon: Layers }, { label: 'Trash', to: 'boards/trash', icon: Trash2 },
  ] },
]

export function Sidebar() {
  const { view, param } = useRoute()
  const shell = useShell()
  const boards = useStore((s) => s.boards)
  const assets = useStore((s) => s.assets)
  const [closed, setClosed] = useState<Record<string, boolean>>({})
  const [q, setQ] = useState('')
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  useOutside(searchRef, () => setQ(''), !!q)
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); shell.set({ side: true }); inputRef.current?.focus() } }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, []) // eslint-disable-line
  const inEditor = view === 'board'
  const here = view + (param ? '/' + param : '')
  const live = boards.filter((b) => !b.trashed)
  const counts: Record<string, number> = { 'boards/mine': live.filter((b) => !b.shared).length, 'boards/shared': live.filter((b) => b.shared).length, 'boards/favorites': live.filter((b) => b.favorite).length, 'boards/trash': boards.filter((b) => b.trashed).length }
  const ql = q.trim().toLowerCase()
  const hitBoards = ql ? live.filter((b) => (b.name + b.kind + b.description).toLowerCase().includes(ql)).slice(0, 5) : []
  const hitAssets = ql ? assets.filter((a) => (a.name + ' ' + a.tags.join(' ')).toLowerCase().includes(ql)).slice(0, 6) : []
  const go = (to: string) => { nav(to); shell.set({ side: false, tray: null }); setQ('') }

  return (
    <>
      {shell.side && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden fadein" onClick={() => shell.set({ side: false })} />}
      <nav aria-label="Workspace" style={{ width: shell.sideW }}
        className={`shrink-0 bg-bg border-r border-line flex flex-col min-h-0 relative z-40 transition-[transform,margin] duration-300 ease-[cubic-bezier(.16,1,.3,1)] max-lg:fixed max-lg:top-0 max-lg:bottom-0 max-lg:left-0 max-lg:!w-[264px] max-lg:shadow-2xl ${shell.side ? '' : 'max-lg:-translate-x-full'} ${shell.focus ? 'lg:hidden' : ''}`}>
        <div className="lg:hidden h-[54px] flex items-center px-4 border-b border-line shrink-0"><Logo /></div>
        <div ref={searchRef} className="p-3 pb-1 relative">
          <label className="field flex items-center gap-2 !h-8 !bg-bg2">
            <Search size={13} className="text-muted shrink-0" />
            <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label="Search boards and assets" className="bg-transparent w-full min-w-0 text-[12.5px] placeholder:text-muted" />
            <kbd className="mono text-[10px] text-muted whitespace-nowrap">Ctrl K</kbd>
          </label>
          {ql && (
            <div className="pop absolute left-3 right-3 top-[46px] z-50 p-1 max-h-[60vh] overflow-auto">
              {!hitBoards.length && !hitAssets.length && <div className="px-2.5 py-3 text-[12px] text-muted">Nothing matches “{q}”. Try a colour, a mood or a board name.</div>}
              {hitBoards.length > 0 && <div className="label px-2.5 pt-2 pb-1">Boards</div>}
              {hitBoards.map((b) => <button key={b.id} className="menuitem" onClick={() => go('board/' + b.id)}><span className="w-3 h-3 rounded-sm border border-line shrink-0" style={{ background: b.canvasColor }} /><span className="truncate">{b.name}</span><kbd>{b.kind}</kbd></button>)}
              {hitAssets.length > 0 && <div className="label px-2.5 pt-2 pb-1">Library</div>}
              {hitAssets.map((a) => <button key={a.id} className="menuitem" onClick={() => go('library/' + encodeURIComponent('q:' + a.name))}>{a.src ? <img src={a.src} alt="" className="w-5 h-5 rounded-sm object-cover shrink-0" /> : <Shapes size={14} className="text-muted" />}<span className="truncate">{a.name}</span><kbd>{a.category}</kbd></button>)}
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {NAV.map((sec) => (
            <div key={sec.title} className="mt-3">
              <button className="label flex items-center gap-1 w-full h-7 px-2 rounded-md hover:text-ink transition-colors" aria-expanded={!closed[sec.title]} onClick={() => setClosed((c) => ({ ...c, [sec.title]: !c[sec.title] }))}>
                {sec.title}<ChevronDown size={11} className={`ml-auto transition-transform duration-200 ${closed[sec.title] ? '-rotate-90' : ''}`} />
              </button>
              <div className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(.16,1,.3,1)]" style={{ gridTemplateRows: closed[sec.title] ? '0fr' : '1fr' }}>
                <div className="overflow-hidden">
                  {sec.items.map((it) => {
                    const tray = 'tray' in it ? it.tray : undefined
                    const active = inEditor && tray ? shell.tray === tray : !inEditor && (here === it.to || (it.to === 'home' && view === 'home'))
                    return (
                      <button key={it.label} aria-current={active ? 'page' : undefined}
                        onClick={() => (inEditor && tray ? shell.set({ tray: shell.tray === tray ? null : tray, side: false }) : go(it.to))}
                        className={`relative flex items-center gap-2.5 w-full h-8 px-2.5 rounded-md text-[12.5px] transition-colors ${active ? 'bg-[var(--accent-wash)] text-ink font-medium' : 'text-muted hover:text-ink hover:bg-hover'}`}>
                        <it.icon size={15} strokeWidth={1.75} className={active ? 'text-accent' : ''} />
                        {it.label}
                        {counts[it.to] > 0 && <span className="ml-auto mono text-[10.5px] text-muted">{counts[it.to]}</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 h-10 shrink-0 border-t border-line flex items-center gap-2 text-[11px] text-muted"><span className="w-1.5 h-1.5 rounded-full bg-[#62C277] shrink-0" /><span className="truncate">Autosaved locally</span><span className="ml-auto flex gap-2.5 shrink-0"><button className="hover:text-ink transition-colors" onClick={() => nav('terms')}>Terms</button><button className="hover:text-ink transition-colors" onClick={() => nav('privacy')}>Privacy</button></span></div>
        <Resizer side="right" value={shell.sideW} min={200} max={320} onChange={(v) => shell.set({ sideW: v })} />
      </nav>
    </>
  )
}

export function Resizer({ side, value, min, max, onChange }: { side: 'left' | 'right'; value: number; min: number; max: number; onChange: (v: number) => void }) {
  const d = useRef<{ x: number; v: number } | null>(null)
  return (
    <div role="separator" aria-orientation="vertical" aria-label="Resize panel"
      className={`absolute top-0 bottom-0 w-[7px] ${side === 'right' ? '-right-1' : '-left-1'} z-10 cursor-col-resize group/r max-lg:hidden touch-none`}
      onPointerDown={(e) => { d.current = { x: e.clientX, v: value }; e.currentTarget.setPointerCapture(e.pointerId) }}
      onPointerMove={(e) => { if (d.current) onChange(Math.max(min, Math.min(max, d.current.v + (e.clientX - d.current.x) * (side === 'right' ? 1 : -1)))) }}
      onPointerUp={() => (d.current = null)}>
      <div className="mx-auto w-px h-full bg-accent opacity-0 group-hover/r:opacity-100 transition-opacity" />
    </div>
  )
}
