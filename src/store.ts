import { create } from 'zustand'
import { get as idbGet, set as idbSet } from 'idb-keyval'
import type { Asset, Board, Collection, Obj, Palette, Tool } from './types'
import { aabb, bounds, measureText, uid } from './lib/util'
import { sanitizeBoard } from './lib/sanitize'
import { seedAssets, seedBoards, seedCollections, seedPalettes, seedRecent, TEMPLATES } from './data/seed'

export interface Toast { id: string; text: string; action?: { label: string; run: () => void } }
type Theme = 'dark' | 'light'
type Patch = Partial<Obj> | ((o: Obj) => Partial<Obj>)

interface Data {
  boards: Board[]
  collections: Collection[]
  assets: Asset[]
  palettes: Palette[]
  favColors: string[]
  recent: string[]
  theme: Theme
}
interface State extends Data {
  ready: boolean
  activeId: string | null
  selection: string[]
  tool: Tool
  editingId: string | null
  past: Obj[][]
  future: Obj[][]
  saveStatus: 'saved' | 'saving'
  savedAt: number
  toasts: Toast[]

  open(id: string | null): void
  select(ids: string[]): void
  setTool(t: Tool): void
  setEditing(id: string | null): void
  mutate(fn: (objs: Obj[]) => Obj[], opts?: { key?: string; record?: boolean }): void
  patch(ids: string[], p: Patch, key?: string): void
  add(objs: Obj[], selectThem?: boolean): void
  remove(): void
  duplicate(): void
  copy(): void
  paste(at?: { x: number; y: number }): void
  group(): void
  ungroup(): void
  order(k: 'front' | 'back' | 'forward' | 'backward'): void
  align(k: 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom' | 'hspace' | 'vspace'): void
  tidyFrame(id: string): void
  undo(): void
  redo(): void

  updateBoard(id: string, p: Partial<Board>): void
  createBoard(templateId?: string): string
  duplicateBoard(id: string): string
  importBoard(b: unknown): string
  deleteBoard(id: string): void
  addToBoard(id: string, objs: Obj[]): void

  addAsset(a: Omit<Asset, 'id'>): Asset
  updateAsset(id: string, p: Partial<Asset>): void
  removeAsset(id: string): void
  touchAsset(id: string): void
  savePalette(p: Partial<Palette> & { colors: string[] }): string
  updatePalette(id: string, p: Partial<Palette>): void
  removePalette(id: string): void
  toggleFavColor(hex: string): void
  setTheme(t: Theme): void
  resetWorkspace(): void
  toast(text: string, action?: Toast['action']): void
  dismiss(id: string): void
}

const seed = (): Data => ({
  boards: seedBoards(), collections: seedCollections(), assets: seedAssets(), palettes: seedPalettes(),
  favColors: ['#B7A0F4', '#C93F5A', '#2F4A3C', '#D9A62E', '#34467E'], recent: seedRecent(), theme: 'dark',
})

let lastKey: string | undefined
let lastT = 0
let clipboard: Obj[] = []

function normalize(next: Obj[], prev: Obj[]) {
  const seen = new Set(prev)
  let changed = false
  const out = next.map((o) => {
    if (o.type !== 'text' || seen.has(o)) return o
    const h = measureText(o)
    if (h === o.height) return o
    changed = true
    return { ...o, height: h }
  })
  return changed ? out : next
}
const clone = (objs: Obj[], dx = 0, dy = 0): Obj[] => {
  const groups = new Map<string, string>()
  return objs.map((o) => {
    let groupId = o.groupId
    if (groupId) { if (!groups.has(groupId)) groups.set(groupId, uid()); groupId = groups.get(groupId) }
    return { ...o, id: uid(), x: o.x + dx, y: o.y + dy, groupId }
  })
}

export const useStore = create<State>((set, get) => ({
  ...seed(),
  ready: false, activeId: null, selection: [], tool: 'move', editingId: null, past: [], future: [],
  saveStatus: 'saved', savedAt: Date.now(), toasts: [],

  open: (id) => { if (get().activeId !== id) set({ activeId: id, selection: [], past: [], future: [], editingId: null, tool: 'move' }) },
  select: (ids) => set({ selection: ids }),
  setTool: (tool) => set({ tool }),
  setEditing: (editingId) => set({ editingId }),

  mutate: (fn, opts) => {
    const s = get()
    const b = s.boards.find((x) => x.id === s.activeId)
    if (!b) return
    const next = normalize(fn(b.objects), b.objects)
    if (next === b.objects) return
    const t = Date.now()
    const coalesce = !!opts?.key && opts.key === lastKey && t - lastT < 900
    let past = s.past
    if (opts?.record !== false && !coalesce) past = [...past.slice(-80), b.objects]
    lastKey = opts?.key; lastT = t
    set({ boards: s.boards.map((x) => (x.id === b.id ? { ...x, objects: next, updatedAt: t } : x)), past, future: [] })
  },
  patch: (ids, p, key) => get().mutate((objs) => objs.map((o) => (ids.includes(o.id) ? ({ ...o, ...(typeof p === 'function' ? p(o) : p) } as Obj) : o)), { key }),
  add: (objs, selectThem = true) => {
    get().mutate((cur) => [...cur, ...objs])
    if (selectThem) set({ selection: objs.map((o) => o.id) })
  },
  remove: () => {
    const { selection } = get()
    if (!selection.length) return
    get().mutate((objs) => objs.filter((o) => !selection.includes(o.id)))
    set({ selection: [] })
  },
  duplicate: () => {
    const s = get()
    const b = s.boards.find((x) => x.id === s.activeId)
    const src = b?.objects.filter((o) => s.selection.includes(o.id)) ?? []
    if (src.length) get().add(clone(src, 24, 24))
  },
  copy: () => {
    const s = get()
    const b = s.boards.find((x) => x.id === s.activeId)
    const src = b?.objects.filter((o) => s.selection.includes(o.id)) ?? []
    if (src.length) clipboard = src
  },
  paste: (at) => {
    if (!clipboard.length) return
    const bb = bounds(clipboard)
    const [dx, dy] = at ? [at.x - bb.x - bb.width / 2, at.y - bb.y - bb.height / 2] : [28, 28]
    const next = clone(clipboard, dx, dy)
    if (!at) clipboard = next
    get().add(next)
  },
  group: () => {
    const { selection } = get()
    if (selection.length < 2) return
    const g = uid()
    get().patch(selection, { groupId: g })
  },
  ungroup: () => get().patch(get().selection, { groupId: undefined }),
  order: (k) => {
    const sel = new Set(get().selection)
    get().mutate((objs) => {
      const a = [...objs]
      if (k === 'front') return [...a.filter((o) => !sel.has(o.id)), ...a.filter((o) => sel.has(o.id))]
      if (k === 'back') return [...a.filter((o) => sel.has(o.id)), ...a.filter((o) => !sel.has(o.id))]
      if (k === 'forward') { for (let i = a.length - 2; i >= 0; i--) if (sel.has(a[i].id) && !sel.has(a[i + 1].id)) [a[i], a[i + 1]] = [a[i + 1], a[i]] }
      else for (let i = 1; i < a.length; i++) if (sel.has(a[i].id) && !sel.has(a[i - 1].id)) [a[i], a[i - 1]] = [a[i - 1], a[i]]
      return a
    })
  },
  align: (k) => {
    const sel = get().selection
    get().mutate((objs) => {
      const items = objs.filter((o) => sel.includes(o.id)).map((o) => ({ o, b: aabb(o) }))
      if (items.length < 2) return objs
      const bb = bounds(items.map((i) => i.o))
      const move = new Map<string, [number, number]>()
      if (k === 'hspace' || k === 'vspace') {
        const h = k === 'hspace'
        const sorted = [...items].sort((a, b) => (h ? a.b.x - b.b.x : a.b.y - b.b.y))
        const total = sorted.reduce((n, i) => n + (h ? i.b.width : i.b.height), 0)
        const gap = ((h ? bb.width : bb.height) - total) / (sorted.length - 1)
        let cur = h ? bb.x : bb.y
        for (const i of sorted) { move.set(i.o.id, h ? [cur - i.b.x, 0] : [0, cur - i.b.y]); cur += (h ? i.b.width : i.b.height) + gap }
      } else for (const { o, b } of items) {
        const dx = k === 'left' ? bb.x - b.x : k === 'right' ? bb.x + bb.width - b.x - b.width : k === 'hcenter' ? bb.x + bb.width / 2 - b.x - b.width / 2 : 0
        const dy = k === 'top' ? bb.y - b.y : k === 'bottom' ? bb.y + bb.height - b.y - b.height : k === 'vcenter' ? bb.y + bb.height / 2 - b.y - b.height / 2 : 0
        move.set(o.id, [dx, dy])
      }
      return objs.map((o) => { const m = move.get(o.id); return m && (m[0] || m[1]) ? { ...o, x: o.x + m[0], y: o.y + m[1] } : o })
    })
  },
  tidyFrame: (id) => get().mutate((objs) => {
    const f = objs.find((o) => o.id === id)
    if (!f || f.type !== 'frame' || f.layout === 'free') return objs
    const kids = objs.filter((o) => o.type !== 'frame' && o.x + o.width / 2 > f.x && o.x + o.width / 2 < f.x + f.width && o.y + o.height / 2 > f.y && o.y + o.height / 2 < f.y + f.height)
      .sort((a, b) => (f.layout === 'row' ? a.x - b.x : a.y - b.y || a.x - b.x))
    if (!kids.length) return objs
    const pos = new Map<string, [number, number]>()
    const g = f.spacing
    if (f.layout === 'row') {
      let x = f.x + g
      for (const k of kids) { pos.set(k.id, [x, f.y + (f.height - k.height) / 2]); x += k.width + g }
    } else {
      const cols = Math.max(1, Math.ceil(Math.sqrt(kids.length)))
      let y = f.y + g
      for (let r = 0; r * cols < kids.length; r++) {
        const row = kids.slice(r * cols, r * cols + cols)
        let x = f.x + g
        for (const k of row) { pos.set(k.id, [x, y]); x += k.width + g }
        y += Math.max(...row.map((k) => k.height)) + g
      }
    }
    return objs.map((o) => { const p = pos.get(o.id); return p ? { ...o, x: Math.round(p[0]), y: Math.round(p[1]), rotation: 0 } : o })
  }),
  undo: () => {
    const s = get()
    const b = s.boards.find((x) => x.id === s.activeId)
    if (!b || !s.past.length) return
    const prev = s.past[s.past.length - 1]
    lastKey = undefined
    set({ past: s.past.slice(0, -1), future: [b.objects, ...s.future], selection: s.selection.filter((id) => prev.some((o) => o.id === id)), editingId: null,
      boards: s.boards.map((x) => (x.id === b.id ? { ...x, objects: prev, updatedAt: Date.now() } : x)) })
  },
  redo: () => {
    const s = get()
    const b = s.boards.find((x) => x.id === s.activeId)
    if (!b || !s.future.length) return
    const next = s.future[0]
    lastKey = undefined
    set({ future: s.future.slice(1), past: [...s.past, b.objects], selection: s.selection.filter((id) => next.some((o) => o.id === id)), editingId: null,
      boards: s.boards.map((x) => (x.id === b.id ? { ...x, objects: next, updatedAt: Date.now() } : x)) })
  },

  updateBoard: (id, p) => set((s) => ({ boards: s.boards.map((b) => (b.id === id ? { ...b, ...p } : b)) })),
  createBoard: (templateId) => {
    const t = TEMPLATES.find((x) => x.id === templateId)
    const names = new Set(get().boards.map((b) => b.name))
    let name = t ? t.name : 'Untitled board'
    for (let i = 2; names.has(name); i++) name = `${t ? t.name : 'Untitled board'} ${i}`
    const b: Board = { id: uid(), name, kind: t?.kind ?? 'Other', description: t?.blurb ?? '', favorite: false, canvasColor: t?.canvasColor ?? '#D5D0DC', updatedAt: Date.now(),
      objects: normalize(t ? t.build() : [], []) }
    set((s) => ({ boards: [b, ...s.boards] }))
    return b.id
  },
  duplicateBoard: (id) => {
    const src = get().boards.find((b) => b.id === id)
    if (!src) return id
    const b: Board = { ...src, id: uid(), name: src.name + ' copy', shared: undefined, trashed: false, favorite: false, updatedAt: Date.now(), objects: clone(src.objects) }
    set((s) => ({ boards: [b, ...s.boards] }))
    return b.id
  },
  importBoard: (raw) => {
    const safe = sanitizeBoard(raw)
    const b: Board = { id: uid(), ...safe, favorite: false, shared: 'Imported file', updatedAt: Date.now(), objects: normalize(safe.objects, []) }
    set((s) => ({ boards: [b, ...s.boards] }))
    return b.id
  },
  deleteBoard: (id) => set((s) => ({ boards: s.boards.filter((b) => b.id !== id) })),
  addToBoard: (id, objs) => set((s) => ({ boards: s.boards.map((b) => {
    if (b.id !== id) return b
    const bb = bounds(b.objects), ob = bounds(objs)
    const placed = clone(objs, bb.x + bb.width + 60 - ob.x, bb.y - ob.y)
    return { ...b, updatedAt: Date.now(), objects: [...b.objects, ...normalize(placed, [])] }
  }) })),

  addAsset: (a) => { const asset = { ...a, id: uid() }; set((s) => ({ assets: [asset, ...s.assets] })); return asset },
  updateAsset: (id, p) => set((s) => ({ assets: s.assets.map((a) => (a.id === id ? { ...a, ...p } : a)) })),
  removeAsset: (id) => set((s) => ({ assets: s.assets.filter((a) => a.id !== id), recent: s.recent.filter((r) => r !== id) })),
  touchAsset: (id) => set((s) => ({ recent: [id, ...s.recent.filter((r) => r !== id)].slice(0, 14) })),
  savePalette: (p) => {
    const pal: Palette = { id: uid(), name: p.name ?? 'Untitled palette', collection: p.collection ?? 'Unsorted', colors: p.colors }
    set((s) => ({ palettes: [pal, ...s.palettes] }))
    return pal.id
  },
  updatePalette: (id, p) => set((s) => ({ palettes: s.palettes.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
  removePalette: (id) => set((s) => ({ palettes: s.palettes.filter((x) => x.id !== id) })),
  toggleFavColor: (hex) => set((s) => ({ favColors: s.favColors.includes(hex) ? s.favColors.filter((c) => c !== hex) : [hex, ...s.favColors] })),
  setTheme: (theme) => { document.documentElement.dataset.theme = theme; set({ theme }) },
  resetWorkspace: () => { const d = seed(); set({ ...d, theme: get().theme, selection: [], past: [], future: [] }); normalizeAll() },
  toast: (text, action) => {
    const id = uid()
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, text, action }] }))
    setTimeout(() => get().dismiss(id), action ? 6000 : 3200)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export const useBoard = () => useStore((s) => s.boards.find((b) => b.id === s.activeId))
export const getBoard = () => { const s = useStore.getState(); return s.boards.find((b) => b.id === s.activeId) }

/** Text heights depend on loaded fonts, so they are re-measured once the faces are in. */
function normalizeAll() {
  useStore.setState((s) => ({ boards: s.boards.map((b) => ({ ...b, objects: normalize(b.objects, []) })), assets: s.assets.map((a) => (a.objects ? { ...a, objects: normalize(a.objects, []) } : a)) }))
}

const KEY = 'lilacanvas:workspace:v1'
const LEGACY_KEY = 'moodspace:workspace:v1'   // workspaces saved before the rename
const pick = (s: State): Data => ({ boards: s.boards, collections: s.collections, assets: s.assets, palettes: s.palettes, favColors: s.favColors, recent: s.recent, theme: s.theme })

export async function boot() {
  const faces = ['500 16px "Manrope Variable"', '800 16px "Manrope Variable"', '400 16px "Inter Variable"', '500 16px "Bodoni Moda Variable"', 'italic 500 16px "Bodoni Moda Variable"', '400 16px "DM Mono"']
  const [saved] = await Promise.all([
    idbGet<Data>(KEY).then((d) => d ?? idbGet<Data>(LEGACY_KEY)).catch(() => undefined),
    Promise.all(faces.map((f) => document.fonts.load(f).catch(() => null))),
  ])
  if (saved?.boards) useStore.setState({ ...saved })
  document.documentElement.dataset.theme = useStore.getState().theme
  normalizeAll()
  useStore.setState({ ready: true })

  let timer: ReturnType<typeof setTimeout> | undefined
  let prev = pick(useStore.getState())
  useStore.subscribe((s) => {
    const cur = pick(s)
    if ((Object.keys(cur) as (keyof Data)[]).every((k) => cur[k] === prev[k])) return
    prev = cur
    if (s.saveStatus !== 'saving') useStore.setState({ saveStatus: 'saving' })
    clearTimeout(timer)
    timer = setTimeout(() => {
      idbSet(KEY, pick(useStore.getState()))
        .then(() => useStore.setState({ saveStatus: 'saved', savedAt: Date.now() }))
        .catch(() => { useStore.setState({ saveStatus: 'saved' }); useStore.getState().toast('Could not save to this browser — storage may be full or blocked.') })
    }, 500)
  })
}
