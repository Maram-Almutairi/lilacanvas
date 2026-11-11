import { useEffect } from 'react'
import { useStore } from './store'
import { Mark, nav, Toasts, useRoute } from './ui'
import { Resizer, Sidebar, TopBar, useShell } from './Shell'
import { Canvas } from './editor/Canvas'
import { Properties } from './editor/Properties'
import { Boards, Dashboard } from './views/Boards'
import { Library, AssetTray } from './views/Library'
import { ColorLab } from './views/ColorLab'
import { Promo } from './views/Promo'
import { Legal } from './views/Legal'

function Editor({ id }: { id: string }) {
  const board = useStore((s) => s.boards.find((b) => b.id === id))
  const open = useStore((s) => s.open)
  const shell = useShell()
  useEffect(() => { open(id); return () => { open(null); useShell.getState().set({ tray: null, props: false }) } }, [id, open])
  useEffect(() => { if (board) document.title = `${board.name} — MOODSPACE`; return () => { document.title = 'MOODSPACE' } }, [board?.name]) // eslint-disable-line
  const active = useStore((s) => s.activeId === id)
  if (!board || board.trashed) return (
    <div className="h-full grid place-items-center bg-bg2 text-center p-6">
      <div><h1 className="text-[20px] font-semibold">{board ? 'This board is in the Trash.' : 'This board does not exist in this browser.'}</h1>
        <p className="text-muted mt-1.5">{board ? 'Restore it to keep working on it.' : 'It may have been deleted, or it lives on another device.'}</p>
        <div className="flex gap-2 justify-center mt-4">{board && <button className="btn btn-primary" onClick={() => useStore.getState().updateBoard(board.id, { trashed: false })}>Restore board</button>}<button className="btn" onClick={() => nav('home')}>Back to Home</button></div></div>
    </div>
  )
  return (
    <div className="h-full flex min-w-0">
      <div className="relative flex-1 min-w-0">
        {active && <Canvas board={board} />}
        {shell.tray && <AssetTray tray={shell.tray} />}
      </div>
      {shell.props && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden fadein" onClick={() => shell.set({ props: false })} />}
      <aside aria-label="Properties" style={{ width: shell.propsW }}
        className={`shrink-0 bg-panel border-l border-line overflow-y-auto relative z-30 transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)] max-lg:fixed max-lg:right-0 max-lg:top-[54px] max-lg:bottom-0 max-lg:!w-[272px] max-lg:shadow-2xl ${shell.props ? '' : 'max-lg:translate-x-full'} ${shell.focus ? 'lg:hidden' : ''}`}>
        <Resizer side="left" value={shell.propsW} min={232} max={360} onChange={(v) => shell.set({ propsW: v })} />
        {active && <Properties board={board} />}
      </aside>
    </div>
  )
}

export default function App() {
  const ready = useStore((s) => s.ready)
  const { view, param } = useRoute()
  if (!ready) return (
    <div className="h-full grid place-items-center bg-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-pulse"><Mark size={34} /></div>
        <div className="font-display text-[12.5px] tracking-[0.24em]"><span className="font-extrabold">MOOD</span><span className="text-muted font-medium">SPACE</span></div>
        <div className="w-28 h-[2px] rounded-full skel" />
      </div>
    </div>
  )
  if (view === 'promo') return <Promo />
  if (view === 'terms' || view === 'privacy') return <Legal page={view} />
  return (
    <div className="h-full flex flex-col">
      <TopBar />
      <div className="flex-1 flex min-h-0">
        <Sidebar />
        <main className="flex-1 min-w-0 min-h-0 relative" key={view === 'board' ? 'board' : view + param}>
          {view === 'board' ? <Editor id={param} />
            : view === 'boards' ? <Boards filter={param || 'recent'} />
            : view === 'colors' ? <ColorLab />
            : view === 'library' ? <Library param={param} />
            : <Dashboard />}
        </main>
      </div>
      <Toasts />
    </div>
  )
}
