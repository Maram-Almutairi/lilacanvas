import type { Asset, Board, Collection, FrameObj, ImageObj, NoteObj, Obj, Palette, PaletteObj, ShapeObj, SwatchObj, TextObj } from '../types'
import { BODONI, INTER, MANROPE, MONO, uid } from '../lib/util'

/* Photographs from Unsplash (free licence), stored locally in /public/img. [width, height, tags] */
export const PHOTOS: Record<string, [number, number, string, ('photo' | 'texture')?]> = {
  pannacotta: [900, 1350, 'food,pastel,pink,dessert'],
  strawberries: [900, 600, 'food,red,fruit'],
  'cactus-blush': [900, 1102, 'plant,pastel,pink,minimal'],
  'portrait-blush': [900, 1350, 'portrait,pastel,pink,fashion'],
  'suede-shoe': [900, 1125, 'product,pastel,still life'],
  cupcakes: [900, 600, 'food,pastel,dessert'],
  'soft-serve': [900, 1350, 'food,yellow,summer'],
  'portrait-noir': [900, 1350, 'portrait,dark,editorial'],
  'portrait-blue': [900, 1125, 'portrait,dark,blue,editorial'],
  'wall-light': [900, 600, 'dark,blue,architecture,minimal'],
  'night-ridge': [900, 601, 'dark,landscape,night'],
  'street-coat': [900, 1354, 'fashion,street,editorial'],
  'skyline-dusk': [900, 546, 'city,blue,night'],
  'stage-haze': [900, 600, 'dark,music,night'],
  'yellow-chair': [900, 794, 'interior,yellow,furniture'],
  'green-sofa': [900, 600, 'interior,green,furniture,minimal'],
  'quiet-room': [900, 601, 'interior,minimal,white'],
  'sage-wall': [900, 603, 'interior,green,minimal'],
  'studio-lounge': [900, 600, 'interior,workspace,light'],
  'long-room': [900, 475, 'interior,warm,architecture'],
  'plant-flat': [900, 670, 'interior,plant,warm'],
  'fern-canopy': [900, 600, 'plant,green,nature'],
  succulents: [900, 1363, 'plant,green,pattern'],
  ficus: [900, 676, 'plant,green,minimal,white'],
  seedlings: [900, 600, 'plant,green,growth'],
  'desk-light': [900, 600, 'workspace,web,light'],
  'app-study': [900, 900, 'web,interface,workspace'],
  'phone-ui': [900, 675, 'web,interface,mobile'],
  'cactus-fog': [900, 570, 'plant,minimal,grey'],
  'mint-pot': [900, 599, 'plant,minimal,white'],
  'red-peak': [900, 600, 'landscape,warm,mountain'],
  'alpine-lake': [900, 600, 'landscape,blue,mountain'],
  'valley-mist': [900, 601, 'landscape,blue,forest'],
  shoreline: [900, 598, 'landscape,sea,pastel'],
  'cliff-chair': [900, 600, 'sea,blue,furniture'],
  lattes: [900, 600, 'food,warm,coffee'],
  'instant-camera': [900, 600, 'product,minimal,white'],
  typewriter: [900, 600, 'still life,vintage,green'],
  'denim-chair': [900, 1350, 'fashion,still life,blue'],
  'linen-rail': [900, 600, 'fashion,minimal,white'],
  'marble-wash': [900, 1270, 'pastel,paper,ink', 'texture'],
  'ink-bloom': [900, 675, 'dark,purple,gradient', 'texture'],
  'ink-smoke': [900, 600, 'ink,blue,red', 'texture'],
  'oil-drops': [900, 600, 'colour,liquid,bright', 'texture'],
  spectrum: [900, 600, 'gradient,colour,soft', 'texture'],
  wave: [900, 684, 'gradient,blue,purple', 'texture'],
  'still-water': [900, 600, 'water,blue,calm', 'texture'],
  confetti: [900, 600, 'blue,paper,bright', 'texture'],
}
export const photoSrc = (n: string) => `img/${n}.jpg`
const title = (n: string) => n.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')

const base = (x: number, y: number, width: number, height: number) => ({ id: uid(), x, y, width, height, rotation: 0, opacity: 1 })
export const img = (name: string, x: number, y: number, w: number, o: Partial<ImageObj> = {}): ImageObj => ({
  ...base(x, y, w, Math.round((w * PHOTOS[name][1]) / PHOTOS[name][0])), type: 'image', src: photoSrc(name), radius: 2, fit: 'cover', mat: 0, cropX: 0.5, cropY: 0.5, ...o,
})
export const imgFrom = (src: string, w: number, h: number, x = 0, y = 0, width = 360): ImageObj => ({
  ...base(x, y, width, Math.round((width * h) / w)), type: 'image', src, radius: 2, fit: 'cover', mat: 0, cropX: 0.5, cropY: 0.5,
})
export const txt = (text: string, x: number, y: number, w: number, o: Partial<TextObj> = {}): TextObj => ({
  ...base(x, y, w, 40), type: 'text', text, fontFamily: INTER, fontSize: 16, fontWeight: 400, letterSpacing: 0, lineHeight: 1.3, align: 'left', fill: '#211D2B', ...o,
})
export const mono = (text: string, x: number, y: number, w: number, fill: string, o: Partial<TextObj> = {}) =>
  txt(text, x, y, w, { fontFamily: MONO, fontSize: 11, fontWeight: 400, letterSpacing: 1.4, fill, ...o })
export const chip = (color: string, label: string, x: number, y: number, o: Partial<SwatchObj> = {}): SwatchObj => ({
  ...base(x, y, 104, 136), type: 'swatch', color, label, shape: 'chip', ...o,
})
export const pal = (colors: string[], x: number, y: number, w: number, h: number): PaletteObj => ({ ...base(x, y, w, h), type: 'palette', colors })
export const note = (text: string, x: number, y: number, color: string, o: Partial<NoteObj> = {}): NoteObj => ({
  ...base(x, y, 200, 150), type: 'note', text, color, ...o,
})
export const frame = (label: string, x: number, y: number, w: number, h: number, fill: string): FrameObj => ({
  ...base(x, y, w, h), type: 'frame', label, fill, layout: 'free', spacing: 16,
})
export const shape = (x: number, y: number, w: number, h: number, fill: string, o: Partial<ShapeObj> = {}): ShapeObj => ({
  ...base(x, y, w, h), type: 'shape', kind: 'rect', fill, stroke: '', strokeWidth: 0, radius: 0, ...o,
})

const H = 3600_000
const now = Date.now()

function strawberry(): Obj[] {
  const ink = '#C93F5A'
  return [
    frame('Logo lockups', 430, 850, 520, 236, '#FFF8F5'),
    txt('Strawberry\nMilk', 90, 64, 540, { fontFamily: BODONI, fontSize: 108, fontWeight: 500, italic: true, lineHeight: 0.94, letterSpacing: -2, fill: ink }),
    mono('BRAND MOODBOARD · DAIRY BAR & PÂTISSERIE · SS26', 96, 290, 460, '#7A5F68'),
    img('pannacotta', 90, 340, 290, { mat: 10, rotation: -2.5 }),
    img('portrait-blush', 432, 330, 322, { radius: 3 }),
    img('strawberries', 800, 84, 400, { rotation: 1.5, tape: true }),
    img('cupcakes', 832, 392, 330),
    img('suede-shoe', 1244, 70, 280, { mat: 10, rotation: 2 }),
    img('cactus-blush', 1290, 462, 226, { rotation: -3, tape: true }),
    img('soft-serve', 1570, 150, 190, { radius: 95 }),
    pal(['#FFF4EC', '#F6C9D2', '#E98AA2', ink, '#BFE0CF', '#4A2F36'], 800, 654, 420, 118),
    txt('strawberry milk', 470, 912, 440, { fontFamily: BODONI, fontSize: 54, fontWeight: 500, italic: true, align: 'center', fill: ink, letterSpacing: -1 }),
    mono('DAIRY BAR — EST. 2026', 470, 996, 440, '#7A5F68', { align: 'center' }),
    shape(872, 870, 52, 52, ink, { kind: 'ellipse' }),
    chip('#F6C9D2', 'Milk', 1000, 822),
    chip('#E98AA2', 'Blush', 1118, 834, { rotation: 2 }),
    chip(ink, 'Jam', 1236, 818, { rotation: -2 }),
    chip('#BFE0CF', 'Mint leaf', 1354, 830, { rotation: 1 }),
    txt('Soft, sweet,\na little bit loud.', 1006, 996, 400, { fontFamily: MANROPE, fontSize: 32, fontWeight: 700, lineHeight: 1.1, letterSpacing: -0.8, fill: '#3D2A30' }),
    mono('BODONI MODA ITALIC / MANROPE BOLD', 1008, 1080, 400, '#7A5F68'),
    note('Wordmark should feel hand-poured — try a rounder “k”. Ask Inès about the ribbon script.', 104, 812, '#F9D5DC', { rotation: 2.5, width: 214, height: 150 }),
    note('Packaging: matte carton, gloss spot-UV on the pink. Foil sample lands Thursday.', 1562, 470, '#D3EBDD', { rotation: -2, height: 158 }),
  ]
}

function midnight(): Obj[] {
  const paper = '#EFEAF6'
  return [
    txt('MIDNIGHT', 88, 56, 980, { fontFamily: BODONI, fontSize: 136, fontWeight: 500, letterSpacing: 12, lineHeight: 1, fill: paper }),
    mono('EDITORIAL — ISSUE 07 · AFTER HOURS · SHOT ON LOCATION', 96, 206, 560, '#8D85A0'),
    img('portrait-noir', 90, 258, 380),
    img('portrait-blue', 510, 258, 330),
    img('skyline-dusk', 510, 708, 480),
    img('street-coat', 882, 190, 268, { mat: 10, rotation: 2, tape: true }),
    img('wall-light', 1196, 84, 380),
    img('night-ridge', 1236, 376, 336, { mat: 8, rotation: -1.5 }),
    img('ink-bloom', 1030, 640, 224, { height: 224, radius: 112 }),
    txt('“The city only tells the truth after midnight.”', 1296, 652, 330, { fontFamily: BODONI, fontSize: 34, fontWeight: 400, italic: true, lineHeight: 1.16, fill: '#E8DFFC' }),
    mono('— PULL QUOTE, P. 34', 1298, 826, 300, '#8D85A0'),
    pal(['#0D0C13', '#1C2740', '#34467E', '#8C7AE6', '#E8DFFC', '#C39A73'], 90, 866, 380, 96),
    note('Grade: crushed blacks, keep the skin warm. No teal & orange.', 1040, 904, '#B7A0F4', { rotation: -2, width: 206, height: 132 }),
    note('Cover option B → portrait two, masthead in pale lavender.', 1290, 892, '#E8DFFC', { rotation: 1.5, width: 206, height: 132 }),
  ]
}

function living(): Obj[] {
  const ink = '#262522'
  return [
    frame('Materials & finishes', 668, 782, 624, 232, '#F3EFE9'),
    txt('Modern\nLiving', 88, 62, 420, { fontFamily: MANROPE, fontSize: 98, fontWeight: 800, lineHeight: 0.94, letterSpacing: -4, fill: ink }),
    mono('APARTMENT 4B · LIVING ROOM CONCEPT · 38 M²', 96, 268, 380, '#6E685F'),
    txt('Warm minimal. Low furniture, long light, and one loud piece per room.', 96, 304, 320, { fontSize: 15, lineHeight: 1.5, fill: '#4A4640' }),
    img('yellow-chair', 480, 88, 420),
    img('green-sofa', 932, 58, 460, { mat: 10, rotation: 1.5 }),
    img('sage-wall', 90, 420, 350),
    img('quiet-room', 478, 494, 384, { mat: 10, rotation: -1.5, tape: true }),
    img('studio-lounge', 934, 404, 360),
    img('plant-flat', 1326, 396, 244, { height: 330, radius: 122 }),
    img('long-room', 90, 692, 540),
    chip('#D8C3A5', 'White oak', 698, 816),
    chip('#EDE8E0', 'Bouclé', 814, 816),
    chip('#8A9A85', 'Sage plaster', 930, 816),
    chip('#2F4A3C', 'Forest velvet', 1046, 816),
    chip('#D9A62E', 'Ochre', 1162, 816),
    note('Sofa: forest velvet, 220 cm. Lead time is 9 weeks — order by the 14th.', 1336, 776, '#F3E3A1', { rotation: 2, height: 156 }),
    pal(['#E9E4DC', '#C9B79C', '#8A9A85', '#2F4A3C', '#D9A62E', ink], 1330, 962, 250, 56),
  ]
}

function garden(): Obj[] {
  const ink = '#143424'
  return [
    frame('Homepage — wireframe', 740, 704, 520, 330, '#FBFAF6'),
    txt('Digital Garden', 88, 60, 720, { fontFamily: BODONI, fontSize: 92, fontWeight: 500, letterSpacing: -2, lineHeight: 1, fill: ink }),
    mono('WEBSITE REFERENCES · PERSONAL KNOWLEDGE SITE · V0.3', 96, 172, 520, '#5F6F64'),
    img('fern-canopy', 90, 226, 440),
    img('succulents', 562, 206, 248, { mat: 10, rotation: 2 }),
    img('app-study', 842, 92, 300),
    img('phone-ui', 1172, 66, 380, { mat: 8, rotation: -1.5, tape: true }),
    img('ficus', 842, 420, 330),
    img('desk-light', 1202, 388, 350),
    img('cactus-fog', 90, 548, 300),
    img('seedlings', 410, 618, 292, { height: 292, radius: 146 }),
    pal(['#0F2A1D', '#2F6B4F', '#8FBF9A', '#DDE5DB', '#F4F1EA', '#D96C4A'], 90, 776, 300, 92),
    shape(760, 722, 480, 24, '#DDE5DB', { radius: 4 }),
    shape(760, 760, 300, 150, ink, { radius: 4 }),
    txt('Notes grow here.', 778, 800, 264, { fontFamily: BODONI, fontSize: 30, fontWeight: 500, fill: '#F4F1EA', lineHeight: 1.1 }),
    mono('INDEX · SEEDLINGS · EVERGREEN', 778, 874, 264, '#8FBF9A', { fontSize: 9 }),
    shape(1074, 760, 166, 70, '#8FBF9A', { radius: 4 }),
    shape(1074, 840, 166, 70, '#DDE5DB', { radius: 4 }),
    shape(760, 926, 150, 88, '#EDF1EA', { radius: 4 }),
    shape(925, 926, 150, 88, '#EDF1EA', { radius: 4 }),
    shape(1090, 926, 150, 88, '#EDF1EA', { radius: 4 }),
    note('Nav: index / seedlings / evergreen / about. No hamburger on desktop.', 96, 902, '#CFE3C4', { rotation: -2, width: 220, height: 138 }),
    note('Hover: the leaf unfurls, under 200 ms. Nothing bounces.', 1304, 668, '#FBFAF6', { rotation: 2, height: 132 }),
    txt('Aa', 1306, 838, 200, { fontFamily: BODONI, fontSize: 96, fontWeight: 500, fill: ink, lineHeight: 1 }),
    mono('DM MONO — METADATA, DATES, TAGS', 1308, 950, 260, ink),
  ]
}

function coastal(): Obj[] {
  return [
    txt('Coastal Notes', 90, 70, 560, { fontFamily: MANROPE, fontSize: 60, fontWeight: 700, letterSpacing: -2, lineHeight: 1, fill: '#1F3440' }),
    mono('LOOKBOOK OPENER · SELECTS FROM INÈS', 94, 144, 400, '#5A7480'),
    img('shoreline', 90, 190, 430),
    img('still-water', 552, 150, 360, { mat: 10, rotation: 2 }),
    img('cliff-chair', 300, 500, 390, { tape: true, rotation: -1 }),
    pal(['#1F3440', '#3F7C96', '#9CC7CF', '#F1E4D3', '#D98C6A'], 720, 470, 250, 70),
    note('Pick two for the opener — I lean towards the chair. Too playful?', 730, 580, '#F1E4D3', { rotation: 2 }),
  ]
}

export function seedBoards(): Board[] {
  return [
    { id: 'strawberry-milk', name: 'Strawberry Milk', kind: 'Branding', description: 'Pastel branding inspiration', favorite: true, collectionId: 'c-client', canvasColor: '#EADFE3', updatedAt: now - 0.6 * H, objects: strawberry() },
    { id: 'midnight-editorial', name: 'Midnight Editorial', kind: 'Editorial', description: 'Dark editorial photography', favorite: true, collectionId: 'c-editorial', canvasColor: '#16141C', updatedAt: now - 5 * H, objects: midnight() },
    { id: 'modern-living', name: 'Modern Living', kind: 'Interior', description: 'Interior design inspiration', favorite: false, collectionId: 'c-client', canvasColor: '#E2DDD6', updatedAt: now - 27 * H, objects: living() },
    { id: 'digital-garden', name: 'Digital Garden', kind: 'Web', description: 'Creative website references', favorite: false, collectionId: 'c-personal', canvasColor: '#E4E8E1', updatedAt: now - 3 * 24 * H, objects: garden() },
    { id: 'coastal-notes', name: 'Coastal Notes', kind: 'Photography', description: 'Lookbook selects', favorite: false, shared: 'Inès Moreau', canvasColor: '#DCE3E6', updatedAt: now - 6 * 24 * H, objects: coastal() },
    { id: 'untitled-sketch', name: 'Untitled sketch', kind: 'Other', description: 'Scratch board', favorite: false, trashed: true, canvasColor: '#D5D0DC', updatedAt: now - 12 * 24 * H,
      objects: [note('Ideas for the spring zine — nothing here yet.', 120, 120, '#F3E3A1'), shape(360, 130, 130, 130, '#B7A0F4', { kind: 'ellipse' })] },
  ]
}
export const seedCollections = (): Collection[] => [
  { id: 'c-client', name: 'Client work' },
  { id: 'c-editorial', name: 'Editorial' },
  { id: 'c-personal', name: 'Personal' },
]
export const seedPalettes = (): Palette[] => [
  { id: 'p-straw', name: 'Strawberry Milk', collection: 'Brand', colors: ['#FFF4EC', '#F6C9D2', '#E98AA2', '#C93F5A', '#BFE0CF', '#4A2F36'] },
  { id: 'p-space', name: 'Lilacanvas', collection: 'Brand', colors: ['#211D2B', '#393343', '#9984CC', '#B7A0F4', '#E8DFFC', '#F6F2F8'] },
  { id: 'p-night', name: 'After Hours', collection: 'Editorial', colors: ['#0D0C13', '#1C2740', '#34467E', '#8C7AE6', '#E8DFFC', '#C39A73'] },
  { id: 'p-living', name: 'Apartment 4B', collection: 'Interiors', colors: ['#E9E4DC', '#C9B79C', '#8A9A85', '#2F4A3C', '#D9A62E', '#262522'] },
  { id: 'p-garden', name: 'Evergreen', collection: 'Web', colors: ['#0F2A1D', '#2F6B4F', '#8FBF9A', '#DDE5DB', '#F4F1EA', '#D96C4A'] },
  { id: 'p-coast', name: 'Low Tide', collection: 'Editorial', colors: ['#1F3440', '#3F7C96', '#9CC7CF', '#F1E4D3', '#D98C6A'] },
]

export function seedAssets(): Asset[] {
  const photos: Asset[] = Object.entries(PHOTOS).map(([n, [w, h, tags, sub]]) => ({
    id: 'a-' + n, category: sub === 'texture' ? 'Textures' : 'Photography', name: title(n), tags: tags.split(','), src: photoSrc(n), w, h,
    favorite: ['red-peak', 'portrait-blue', 'green-sofa', 'marble-wash'].includes(n),
  }))
  const type: Asset[] = [
    { name: 'Editorial display', tags: ['serif', 'display'], objects: [txt('Quiet luxury', 0, 0, 420, { fontFamily: BODONI, fontSize: 64, fontWeight: 500, letterSpacing: -1, lineHeight: 1 })] },
    { name: 'Italic headline', tags: ['serif', 'italic'], objects: [txt('after the rain', 0, 0, 420, { fontFamily: BODONI, fontSize: 56, fontWeight: 400, italic: true, lineHeight: 1 })] },
    { name: 'Bold statement', tags: ['sans', 'display'], objects: [txt('Make it\nlouder.', 0, 0, 360, { fontFamily: MANROPE, fontSize: 60, fontWeight: 800, letterSpacing: -2.4, lineHeight: 0.96 })] },
    { name: 'Section heading', tags: ['sans', 'heading'], objects: [txt('Direction 02 — Texture', 0, 0, 360, { fontFamily: MANROPE, fontSize: 24, fontWeight: 600, letterSpacing: -0.4 })] },
    { name: 'Body copy', tags: ['sans', 'body'], objects: [txt('A moodboard is an argument made with pictures. Keep what proves the point and let the rest go.', 0, 0, 320, { fontSize: 15, lineHeight: 1.5 })] },
    { name: 'Spec label', tags: ['mono', 'label'], objects: [txt('SPEC — 24 × 36 CM · UNCOATED · 170 GSM', 0, 0, 360, { fontFamily: MONO, fontSize: 11, letterSpacing: 1.4 })] },
  ].map((a, i) => ({ id: 'a-type-' + i, category: 'Typography' as const, ...a }))
  const shapes: Asset[] = [
    { name: 'Square', tags: ['basic'], objects: [shape(0, 0, 160, 160, '#B7A0F4')] },
    { name: 'Soft rectangle', tags: ['basic', 'rounded'], objects: [shape(0, 0, 220, 140, '#E8DFFC', { radius: 18 })] },
    { name: 'Circle', tags: ['basic', 'round'], objects: [shape(0, 0, 160, 160, '#211D2B', { kind: 'ellipse' })] },
    { name: 'Pill', tags: ['rounded'], objects: [shape(0, 0, 220, 72, '#9984CC', { radius: 36 })] },
    { name: 'Rule', tags: ['line'], objects: [shape(0, 0, 260, 2, '#211D2B')] },
    { name: 'Outline ring', tags: ['round', 'outline'], objects: [shape(0, 0, 150, 150, '', { kind: 'ellipse', stroke: '#211D2B', strokeWidth: 2 })] },
  ].map((a, i) => ({ id: 'a-shape-' + i, category: 'Shapes' as const, ...a }))
  const elements: Asset[] = [
    { name: 'Yellow note', tags: ['note'], objects: [note('Write the thought down before it leaves.', 0, 0, '#F3E3A1')] },
    { name: 'Lavender note', tags: ['note'], objects: [note('Ask: what is this board trying to prove?', 0, 0, '#D9CCFA')] },
    { name: 'Paint chip', tags: ['colour'], objects: [chip('#B7A0F4', 'Soft lavender', 0, 0)] },
    { name: 'Paint dab', tags: ['colour', 'round'], objects: [chip('#C93F5A', 'Jam', 0, 0, { shape: 'dot', width: 96, height: 96 })] },
    { name: 'A4 frame', tags: ['frame', 'print'], objects: [frame('A4 — portrait', 0, 0, 420, 594, '#FFFFFF')] },
    { name: 'Caption block', tags: ['type', 'label'], objects: [
      txt('Plate 04', 0, 0, 260, { fontFamily: MANROPE, fontSize: 18, fontWeight: 700 }),
      txt('FIG. 4 — MORNING LIGHT, NORTH WINDOW', 0, 30, 260, { fontFamily: MONO, fontSize: 10, letterSpacing: 1.2, fill: '#675E74' }),
    ] },
  ].map((a, i) => ({ id: 'a-el-' + i, category: 'Saved elements' as const, ...a }))
  return [...photos, ...type, ...shapes, ...elements]
}
export const seedRecent = () => ['a-strawberries', 'a-portrait-blue', 'a-green-sofa', 'a-fern-canopy', 'a-marble-wash', 'a-night-ridge', 'a-yellow-chair', 'a-phone-ui', 'a-shoreline']

export interface Template { id: string; name: string; kind: Board['kind']; blurb: string; canvasColor: string; build: () => Obj[] }
export const TEMPLATES: Template[] = [
  { id: 't-brand', name: 'Brand board', kind: 'Branding', blurb: 'Logo, palette, type and tone on one sheet.', canvasColor: '#E6E1EA', build: () => [
    frame('Logo', 80, 170, 420, 280, '#FFFFFF'), frame('Imagery', 530, 170, 640, 280, '#F3F0F6'), frame('Typography', 80, 520, 420, 250, '#F3F0F6'),
    txt('Brand name', 80, 60, 600, { fontFamily: MANROPE, fontSize: 56, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }),
    mono('BRAND BOARD · V1', 84, 128, 300, '#675E74'),
    txt('Wordmark', 110, 280, 360, { fontFamily: BODONI, fontSize: 48, fontWeight: 500, align: 'center' }),
    txt('Aa', 110, 550, 200, { fontFamily: BODONI, fontSize: 88, fontWeight: 500, lineHeight: 1 }),
    txt('Headline face / body face', 110, 670, 360, { fontSize: 15, fill: '#675E74' }),
    pal(['#211D2B', '#9984CC', '#B7A0F4', '#E8DFFC', '#F6F2F8'], 530, 520, 640, 120),
    note('Three words the brand should feel like:', 540, 670, '#F3E3A1', { rotation: -1.5 }),
  ] },
  { id: 't-editorial', name: 'Editorial spread', kind: 'Editorial', blurb: 'A masthead, a lead image and a pull quote.', canvasColor: '#1A1722', build: () => [
    txt('MASTHEAD', 80, 60, 900, { fontFamily: BODONI, fontSize: 112, fontWeight: 500, letterSpacing: 10, lineHeight: 1, fill: '#EFEAF6' }),
    mono('ISSUE 00 · STORY TITLE', 86, 184, 400, '#8D85A0'),
    frame('Lead image', 80, 230, 430, 560, '#262231'), frame('Second image', 540, 230, 330, 400, '#262231'), frame('Detail', 900, 230, 300, 240, '#262231'),
    txt('“A pull quote that carries the mood of the story.”', 900, 510, 300, { fontFamily: BODONI, fontSize: 30, italic: true, lineHeight: 1.18, fill: '#E8DFFC' }),
    pal(['#0D0C13', '#34467E', '#8C7AE6', '#E8DFFC'], 540, 670, 330, 80),
  ] },
  { id: 't-interior', name: 'Interior concept', kind: 'Interior', blurb: 'Room references with a materials tray.', canvasColor: '#E2DDD6', build: () => [
    txt('Room name', 80, 60, 600, { fontFamily: MANROPE, fontSize: 64, fontWeight: 800, letterSpacing: -2.5, lineHeight: 1, fill: '#262522' }),
    mono('CONCEPT · DIMENSIONS · CLIENT', 86, 136, 400, '#6E685F'),
    frame('Hero reference', 80, 180, 520, 360, '#EFEBE5'), frame('Furniture', 630, 180, 300, 360, '#EFEBE5'), frame('Light', 960, 180, 240, 360, '#EFEBE5'),
    frame('Materials & finishes', 80, 610, 620, 220, '#F3EFE9'),
    chip('#D8C3A5', 'Timber', 110, 644), chip('#EDE8E0', 'Textile', 226, 644), chip('#8A9A85', 'Wall', 342, 644), chip('#262522', 'Metal', 458, 644),
    note('One loud piece per room. Which one is it?', 740, 620, '#F3E3A1', { rotation: 2 }),
  ] },
  { id: 't-web', name: 'Web references', kind: 'Web', blurb: 'Collect screens, then sketch the page.', canvasColor: '#E4E8E1', build: () => [
    txt('Site name', 80, 60, 600, { fontFamily: BODONI, fontSize: 72, fontWeight: 500, letterSpacing: -1.5, lineHeight: 1, fill: '#143424' }),
    mono('WEBSITE REFERENCES · V0.1', 86, 146, 400, '#5F6F64'),
    frame('References', 80, 190, 560, 420, '#F1F3EE'), frame('Homepage — wireframe', 680, 190, 520, 420, '#FBFAF6'),
    shape(700, 210, 480, 24, '#DDE5DB', { radius: 4 }), shape(700, 248, 300, 160, '#143424', { radius: 4 }), shape(1014, 248, 166, 160, '#8FBF9A', { radius: 4 }),
    shape(700, 424, 150, 90, '#EDF1EA', { radius: 4 }), shape(865, 424, 150, 90, '#EDF1EA', { radius: 4 }), shape(1030, 424, 150, 90, '#EDF1EA', { radius: 4 }),
    pal(['#0F2A1D', '#2F6B4F', '#8FBF9A', '#F4F1EA', '#D96C4A'], 80, 650, 360, 84),
    note('What should a visitor do in the first ten seconds?', 480, 640, '#CFE3C4', { rotation: -2 }),
  ] },
]
