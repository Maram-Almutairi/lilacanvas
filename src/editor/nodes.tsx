import { memo, useEffect, useState } from 'react'
import Konva from 'konva'
import { Ellipse, Group, Image as KImage, Rect, Text } from 'react-konva'
import type { ImageObj, Obj } from '../types'
import { fontStyle, INTER, MONO } from '../lib/util'
import { inkOn } from '../lib/color'

const images = new Map<string, HTMLImageElement>()
function useImg(src: string) {
  const [im, setIm] = useState<HTMLImageElement | undefined>(() => images.get(src))
  useEffect(() => {
    const hit = images.get(src)
    if (hit) return setIm(hit)
    setIm(undefined)
    let live = true
    const el = new window.Image()
    el.onload = () => { images.set(src, el); if (live) setIm(el) }
    el.src = src
    return () => { live = false }
  }, [src])
  return im
}

const SHADOW = { shadowColor: '#140E1E', shadowBlur: 16, shadowOffsetY: 6, shadowOpacity: 0.22 }

function ImageNode({ o }: { o: ImageObj }) {
  const im = useImg(o.src)
  const m = o.mat
  const iw = Math.max(1, o.width - m * 2), ih = Math.max(1, o.height - m * 2)
  const radius = Math.min(o.radius, iw / 2, ih / 2)
  let crop: { x: number; y: number; width: number; height: number } | undefined
  let dest = { x: m, y: m, width: iw, height: ih }
  if (im) {
    const r = iw / ih, ir = im.width / im.height
    if (o.fit === 'cover') {
      if (ir > r) { const cw = im.height * r; crop = { x: (im.width - cw) * o.cropX, y: 0, width: cw, height: im.height } }
      else { const ch = im.width / r; crop = { x: 0, y: (im.height - ch) * o.cropY, width: im.width, height: ch } }
    } else if (ir > r) { const h = iw / ir; dest = { x: m, y: m + (ih - h) / 2, width: iw, height: h } }
    else { const w = ih * ir; dest = { x: m + (iw - w) / 2, y: m, width: w, height: ih } }
  }
  return (
    <>
      <Rect width={o.width} height={o.height} fill={m ? '#FDFCFA' : o.fit === 'contain' || !im ? '#D9D4E0' : '#2A2630'} cornerRadius={m ? 1.5 : Math.min(o.radius, o.width / 2, o.height / 2)} {...SHADOW} />
      {im && <KImage image={im} {...dest} crop={crop} cornerRadius={o.fit === 'cover' ? radius : 0} />}
      {o.tape && <Rect x={o.width / 2 - 36} y={-11} width={72} height={24} rotation={-2.5} fill="rgba(244,236,214,0.82)" shadowColor="#140E1E" shadowBlur={3} shadowOffsetY={1} shadowOpacity={0.16} />}
    </>
  )
}

/** The transformer and marquee should measure the object's own box, not overhanging tape or labels. */
const ownBox = (g: Konva.Group | null) => {
  if (!g || (g as any).__own) return
  ;(g as any).__own = true
  g.getClientRect = function (this: Konva.Group, cfg: any = {}) {
    const r = { x: 0, y: 0, width: this.width(), height: this.height() }
    return cfg.skipTransform ? r : (this as any)._transformedRect(r, cfg.relativeTo)
  }
}

export const ObjNode = memo(function ObjNode({ o, draggable, editing, dark }: { o: Obj; draggable: boolean; editing: boolean; dark: boolean }) {
  const w = o.width, h = o.height
  let body: React.ReactNode = null
  switch (o.type) {
    case 'image': body = <ImageNode o={o} />; break
    case 'text':
      body = <Text width={w} text={o.text} fontFamily={o.fontFamily} fontSize={o.fontSize} fontStyle={fontStyle(o)} letterSpacing={o.letterSpacing} lineHeight={o.lineHeight} align={o.align} fill={o.fill} visible={!editing} />
      break
    case 'swatch':
      body = o.shape === 'dot'
        ? <Ellipse x={w / 2} y={h / 2} radiusX={w / 2} radiusY={h / 2} fill={o.color} shadowColor="#140E1E" shadowBlur={8} shadowOffsetY={3} shadowOpacity={0.16} />
        : <>
            <Rect width={w} height={h} fill="#FDFCFA" cornerRadius={3} {...SHADOW} shadowBlur={12} shadowOpacity={0.18} />
            <Rect width={w} height={Math.max(8, h - 38)} fill={o.color} cornerRadius={[3, 3, 0, 0]} />
            <Text x={9} y={h - 31} width={w - 16} text={o.label} fontFamily={INTER} fontStyle="600" fontSize={10.5} fill="#211D2B" wrap="none" ellipsis />
            <Text x={9} y={h - 16.5} width={w - 16} text={o.color} fontFamily={MONO} fontSize={9} fill="#7A7286" wrap="none" />
          </>
      break
    case 'palette': {
      const cw = w / Math.max(1, o.colors.length)
      body = <>
        <Rect width={w} height={h} fill="#fff" cornerRadius={4} {...SHADOW} shadowBlur={12} shadowOpacity={0.16} />
        <Group clipFunc={(ctx: any) => { ctx.roundRect ? ctx.roundRect(0, 0, w, h, 4) : ctx.rect(0, 0, w, h) }}>
          {o.colors.map((c, i) => <Rect key={i} x={i * cw} width={cw + 0.5} height={h} fill={c} />)}
          {cw > 52 && h > 40 && o.colors.map((c, i) => <Text key={'t' + i} x={i * cw + 8} y={h - 19} text={c} fontFamily={MONO} fontSize={9} fill={inkOn(c)} opacity={0.82} />)}
        </Group>
      </>
      break
    }
    case 'frame':
      body = <>
        <Rect width={w} height={h} fill={o.fill} cornerRadius={3} stroke={dark ? 'rgba(232,223,252,0.16)' : 'rgba(60,48,84,0.16)'} strokeWidth={1} />
        <Text y={-19} text={o.label} fontFamily={MONO} fontSize={11} letterSpacing={0.4} fill={dark ? '#A49BAF' : '#675E74'} />
      </>
      break
    case 'note':
      body = <>
        <Rect width={w} height={h} fill={o.color} {...SHADOW} shadowBlur={14} />
        <Rect width={w} height={16} fill="rgba(30,20,40,0.06)" />
        <Text x={14} y={24} width={Math.max(10, w - 28)} height={Math.max(10, h - 34)} text={o.text} fontFamily={INTER} fontSize={13.5} lineHeight={1.42} fill="#2B2633" ellipsis visible={!editing} />
      </>
      break
    case 'shape': {
      const style = { fill: o.fill || undefined, stroke: o.strokeWidth ? o.stroke : undefined, strokeWidth: o.strokeWidth, hitStrokeWidth: 12 }
      body = o.kind === 'ellipse'
        ? <Ellipse x={w / 2} y={h / 2} radiusX={w / 2} radiusY={h / 2} {...style} />
        : <Rect width={w} height={h} cornerRadius={Math.min(o.radius, w / 2, h / 2)} {...style} />
      if (!o.fill) body = <><Rect width={w} height={h} fill="rgba(0,0,0,0)" />{body}</>
    }
  }
  return (
    <Group ref={ownBox} id={o.id} name="obj" x={o.x + w / 2} y={o.y + h / 2} offsetX={w / 2} offsetY={h / 2} width={w} height={h} rotation={o.rotation} opacity={o.opacity} draggable={draggable}>
      {body}
    </Group>
  )
})
