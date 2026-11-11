export type ObjType = 'image' | 'text' | 'swatch' | 'palette' | 'frame' | 'note' | 'shape'

interface Base {
  id: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  groupId?: string
}
export interface ImageObj extends Base {
  type: 'image'
  src: string
  radius: number
  fit: 'cover' | 'contain'
  mat: number
  tape?: boolean
  cropX: number
  cropY: number
}
export interface TextObj extends Base {
  type: 'text'
  text: string
  fontFamily: string
  fontSize: number
  fontWeight: number
  italic?: boolean
  letterSpacing: number
  lineHeight: number
  align: 'left' | 'center' | 'right'
  fill: string
}
export interface SwatchObj extends Base {
  type: 'swatch'
  color: string
  label: string
  shape: 'chip' | 'dot'
}
export interface PaletteObj extends Base {
  type: 'palette'
  colors: string[]
}
export interface FrameObj extends Base {
  type: 'frame'
  fill: string
  label: string
  layout: 'free' | 'row' | 'grid'
  spacing: number
}
export interface NoteObj extends Base {
  type: 'note'
  text: string
  color: string
}
export interface ShapeObj extends Base {
  type: 'shape'
  kind: 'rect' | 'ellipse'
  fill: string
  stroke: string
  strokeWidth: number
  radius: number
}
export type Obj = ImageObj | TextObj | SwatchObj | PaletteObj | FrameObj | NoteObj | ShapeObj

export type BoardKind = 'Branding' | 'Editorial' | 'Interior' | 'Web' | 'Photography' | 'Other'
export interface Board {
  id: string
  name: string
  kind: BoardKind
  description: string
  favorite: boolean
  shared?: string
  trashed?: boolean
  collectionId?: string
  canvasColor: string
  updatedAt: number
  objects: Obj[]
}
export interface Collection { id: string; name: string }
export interface Palette { id: string; name: string; colors: string[]; collection: string }

export type AssetCategory = 'Photography' | 'Textures' | 'Uploads' | 'Typography' | 'Shapes' | 'Saved elements'
export interface Asset {
  id: string
  category: AssetCategory
  name: string
  tags: string[]
  favorite?: boolean
  src?: string
  w?: number
  h?: number
  objects?: Obj[]
}
export type Tool = 'move' | 'frame' | 'text' | 'shape' | 'note' | 'hand'
export interface Box { x: number; y: number; width: number; height: number }
