import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ArrowUpRight, Copy, Frame, Hand, ImagePlus, MousePointer2, Square, StickyNote, Type } from 'lucide-react'
import { useStore } from '../store'
import { BoardThumb, Img, Logo, Mark, nav } from '../ui'
import { fmtHsl, fmtRgb, inkOn } from '../lib/color'

/** Fades a block up the first time it scrolls into view. Content stays visible without JS or motion. */
function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect() } }, { threshold: 0.12 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return <div ref={ref} className={`promo-reveal ${seen ? 'is-in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>
}

const CSS = `
.promo-reveal{opacity:0;transform:translateY(22px);filter:blur(6px);transition:opacity .9s cubic-bezier(.16,1,.3,1),transform .9s cubic-bezier(.16,1,.3,1),filter .9s cubic-bezier(.16,1,.3,1)}
.promo-reveal.is-in{opacity:1;transform:none;filter:none}
@keyframes promo-strip{to{transform:translateX(-50%)}}
.promo-strip{animation:promo-strip 70s linear infinite}
.promo-strip:hover{animation-play-state:paused}
@keyframes promo-cursor{0%,8%{transform:translate(64%,78%)}28%,46%{transform:translate(31%,52%)}66%,84%{transform:translate(44%,40%)}100%{transform:translate(64%,78%)}}
@keyframes promo-pick{0%,24%{opacity:0;transform:translate(0,0)}30%,46%{opacity:1;transform:translate(0,0)}66%,84%{opacity:1;transform:translate(13%,-12%)}92%,100%{opacity:0;transform:translate(13%,-12%)}}
@keyframes promo-float{0%,100%{transform:translateY(0) rotate(var(--r))}50%{transform:translateY(-9px) rotate(var(--r))}}
.promo-float{animation:promo-float 7s ease-in-out infinite}
@keyframes promo-word{from{opacity:0;transform:translateY(.5em);filter:blur(10px)}}
.promo-word{display:inline-block;animation:promo-word 1.1s cubic-bezier(.16,1,.3,1) backwards}
.promo-in{animation:promo-word 1.2s cubic-bezier(.16,1,.3,1) backwards}
@media (prefers-reduced-motion:reduce){.promo-reveal{opacity:1;transform:none;filter:none}.promo-strip,.promo-float,.promo-word,.promo-in{animation:none}.promo-cursor,.promo-pick{display:none}}
`

const TOOLS = [[MousePointer2, 'V', 'Move'], [Frame, 'F', 'Frame'], [ImagePlus, 'I', 'Image'], [Type, 'T', 'Text'], [Square, 'R', 'Shape'], [StickyNote, 'N', 'Note'], [Hand, 'H', 'Pan']] as const
const SHOTS = [['pannacotta', 'row-span-2'], ['wall-light', ''], ['succulents', 'row-span-2'], ['green-sofa', ''], ['portrait-blue', 'row-span-2'], ['red-peak', ''], ['marble-wash', 'row-span-2'], ['fern-canopy', '']] as const

export function Promo() {
  const boards = useStore((s) => s.boards).filter((b) => !b.trashed)
  const palettes = useStore((s) => s.palettes)
  const lead = boards.find((b) => b.id === 'strawberry-milk') ?? boards[0]
  const night = boards.find((b) => b.id === 'midnight-editorial') ?? boards[1] ?? lead
  const pal = palettes.find((p) => p.id === 'p-straw') ?? palettes[0]
  const [ci, setCi] = useState(3)
  const color = pal?.colors[Math.min(ci, (pal?.colors.length ?? 1) - 1)] ?? '#B7A0F4'
  const enter = () => nav('home')
  useEffect(() => { document.title = 'Lilacanvas — Your imagination, organized.'; return () => { document.title = 'Lilacanvas' } }, [])
  const words = (text: string, start = 0) => text.split(' ').map((w, i) => <span key={i} className="promo-word" style={{ animationDelay: `${start + i * 90}ms` }}>{w}&nbsp;</span>)

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden bg-bg text-ink scroll-smooth">
      <style>{CSS}</style>

      <header className="sticky top-0 z-40 h-16 flex items-center justify-between px-10 max-sm:px-5 bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] backdrop-blur-md border-b border-line/60">
        <Logo />
        <nav className="flex items-center gap-8 text-[13px] text-muted max-md:hidden" aria-label="Sections">
          <a href="#/promo" onClick={(e) => { e.preventDefault(); document.getElementById('canvas')?.scrollIntoView() }} className="hover:text-ink transition-colors">Canvas</a>
          <a href="#/promo" onClick={(e) => { e.preventDefault(); document.getElementById('colour')?.scrollIntoView() }} className="hover:text-ink transition-colors">Colour</a>
          <a href="#/promo" onClick={(e) => { e.preventDefault(); document.getElementById('library')?.scrollIntoView() }} className="hover:text-ink transition-colors">Library</a>
        </nav>
        <button className="btn btn-primary !h-9 !px-4 !text-[13px]" onClick={enter}>Open the studio <ArrowUpRight size={14} /></button>
      </header>

      {/* ---- opening ---- */}
      <section className="relative px-10 max-sm:px-5 pt-[9vh] pb-10">
        <div aria-hidden className="absolute inset-x-0 top-0 h-[720px] pointer-events-none" style={{ background: 'radial-gradient(60% 55% at 50% 8%, rgba(183,160,244,.16), transparent 70%)' }} />
        <div className="relative max-w-[1240px] mx-auto text-center">
          <h1 className="font-display font-semibold tracking-[-0.04em] leading-[0.98] text-[clamp(44px,8.4vw,96px)]">
            {words('Your imagination,')}<br />
            <span className="font-serif italic font-medium tracking-[-0.03em] text-accent">{words('organized.', 300)}</span>
          </h1>
          <p className="promo-in text-muted text-[clamp(15px,1.5vw,18px)] leading-relaxed max-w-[52ch] mx-auto mt-7" style={{ animationDelay: '520ms' }}>
            Lilacanvas is a studio for the part of the work that happens before the work — collecting references, pinning them to a desk, and finding the colour and type that hold an idea together.
          </p>
          <div className="promo-in flex items-center justify-center gap-3 mt-9 flex-wrap" style={{ animationDelay: '640ms' }}>
            <button className="btn btn-primary !h-11 !px-6 !text-[14px] !rounded-lg" onClick={enter}>Start a board <ArrowRight size={16} /></button>
            <button className="btn !h-11 !px-5 !text-[14px] !rounded-lg" onClick={() => nav('board/' + lead.id)}>See a finished one</button>
          </div>
        </div>

        {/* the product itself, live */}
        <div className="promo-in relative max-w-[1180px] mx-auto mt-[8vh]" style={{ animationDelay: '760ms' }}>
          <div className="rounded-[14px] border border-line bg-bg overflow-hidden" style={{ boxShadow: '0 60px 120px -40px rgba(8,6,14,.75), 0 0 0 1px rgba(232,223,252,.04)' }}>
            <div className="h-10 flex items-center gap-3 px-4 border-b border-line">
              <span className="flex gap-1.5"><i className="w-2.5 h-2.5 rounded-full bg-line" /><i className="w-2.5 h-2.5 rounded-full bg-line" /><i className="w-2.5 h-2.5 rounded-full bg-line" /></span>
              <Mark size={15} /><span className="font-display font-semibold text-[12px]">{lead.name}</span>
              <span className="text-[11px] text-muted max-sm:hidden">Saved</span>
              <span className="ml-auto h-6 px-2.5 rounded-md bg-accent text-onaccent text-[11px] font-semibold grid place-items-center">Export</span>
            </div>
            <div className="flex">
              <div className="w-[150px] shrink-0 border-r border-line p-3 max-md:hidden">
                {['Home', 'Recent', 'My Boards', 'Favorites'].map((t, i) => <div key={t} className={`h-6 px-2 rounded text-[10.5px] flex items-center ${i === 2 ? 'bg-[var(--accent-wash)] text-ink' : 'text-muted'}`}>{t}</div>)}
                <div className="label !text-[8.5px] mt-3 mb-1 px-2">Library</div>
                {['Images', 'Colors', 'Typography', 'Elements'].map((t) => <div key={t} className="h-6 px-2 text-[10.5px] flex items-center text-muted">{t}</div>)}
              </div>
              <div className="relative flex-1 min-w-0">
                <BoardThumb board={lead} fit="contain" pad={70} className="w-full aspect-[16/10]" />
                <div aria-hidden className="promo-pick absolute left-[27.5%] top-[36%] w-[12.5%] h-[33%] border-[1.5px] border-[#9A7FF0] pointer-events-none" style={{ animation: 'promo-pick 9s cubic-bezier(.6,0,.2,1) infinite' }}>
                  {['-left-1 -top-1', '-right-1 -top-1', '-left-1 -bottom-1', '-right-1 -bottom-1'].map((p) => <i key={p} className={`absolute ${p} w-2 h-2 bg-white border border-[#9A7FF0] rounded-[2px]`} />)}
                </div>
                <div aria-hidden className="promo-cursor absolute inset-0 pointer-events-none" style={{ animation: 'promo-cursor 9s cubic-bezier(.6,0,.2,1) infinite' }}>
                  <MousePointer2 size={18} fill="#211D2B" stroke="#fff" strokeWidth={1.5} />
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 bottom-3 flex items-center gap-0.5 px-1.5 h-9 rounded-[10px] bg-raised border border-line max-sm:hidden" style={{ boxShadow: 'var(--shadow)' }}>
                  {TOOLS.map(([Icon], i) => <span key={i} className={`grid place-items-center w-7 h-7 rounded-md ${i === 0 ? 'text-accent bg-[var(--accent-wash)]' : 'text-muted'}`}><Icon size={14} strokeWidth={1.75} /></span>)}
                </div>
              </div>
              <div className="w-[170px] shrink-0 border-l border-line bg-panel p-3 max-lg:hidden">
                <div className="label !text-[8.5px] mb-2">Image</div>
                <div className="grid grid-cols-2 gap-1">{[['X', '432'], ['Y', '330'], ['W', '322'], ['H', '483'], ['R', '0°'], ['O', '100%']].map(([k, v]) => <div key={k} className="h-6 rounded bg-bg px-1.5 flex items-center gap-1.5 mono text-[9.5px]"><span className="text-muted">{k}</span>{v}</div>)}</div>
                <div className="label !text-[8.5px] mt-4 mb-2">Colours on this board</div>
                <div className="flex gap-1">{pal?.colors.map((c) => <i key={c} className="w-4 h-4 rounded-full border border-line" style={{ background: c }} />)}</div>
              </div>
            </div>
          </div>
          <div aria-hidden className="promo-float absolute -left-7 bottom-[18%] w-[124px] p-3 pt-5 text-[11px] leading-snug text-[#2B2633] max-lg:hidden" style={{ ['--r' as string]: '-5deg', background: '#F3E3A1', boxShadow: '0 18px 30px -12px rgba(8,6,14,.6)' }}>Rounder “k”. Ask Inès about the ribbon script.</div>
          <div aria-hidden className="promo-float absolute -right-6 top-[22%] w-[92px] bg-[#FDFCFA] rounded-[3px] overflow-hidden max-lg:hidden" style={{ ['--r' as string]: '6deg', animationDelay: '-3s', boxShadow: '0 18px 30px -12px rgba(8,6,14,.6)' }}>
            <div className="h-[84px]" style={{ background: '#C93F5A' }} /><div className="px-2 py-1.5"><div className="text-[10px] font-semibold text-[#211D2B]">Jam</div><div className="mono text-[8.5px] text-[#7A7286]">#C93F5A</div></div>
          </div>
        </div>
      </section>

      {/* ---- boards in motion ---- */}
      <section className="py-[13vh] overflow-hidden">
        <Reveal className="max-w-[1180px] mx-auto px-10 max-sm:px-5 mb-10">
          <h2 className="text-[clamp(30px,4.6vw,56px)] font-semibold tracking-[-0.035em] leading-[1.02] max-w-[18ch]">Four briefs. Four desks. <span className="font-serif italic font-medium text-muted">One studio.</span></h2>
        </Reveal>
        <div className="promo-strip flex gap-6 w-max px-3">
          {[...boards, ...boards].map((b, i) => (
            <button key={b.id + i} onClick={() => nav('board/' + b.id)} className="group shrink-0 w-[min(560px,78vw)] text-left" aria-label={`Open ${b.name}`} tabIndex={i >= boards.length ? -1 : 0}>
              <div className="rounded-[8px] overflow-hidden border border-line thumb-hover"><BoardThumb board={b} className="w-full aspect-[16/10]" /></div>
              <div className="flex items-baseline justify-between mt-3 px-0.5"><span className="font-display font-semibold text-[15px] group-hover:text-accent transition-colors">{b.name}</span><span className="mono text-[10.5px] text-muted uppercase tracking-[0.08em]">{b.kind}</span></div>
            </button>
          ))}
        </div>
      </section>

      {/* ---- canvas ---- */}
      <section id="canvas" className="scroll-mt-16 border-y border-line bg-bg2">
        <div className="max-w-[1180px] mx-auto px-10 max-sm:px-5 py-[13vh] grid lg:grid-cols-[1fr_1.25fr] gap-x-16 gap-y-12 items-center">
          <Reveal>
            <h2 className="text-[clamp(30px,4vw,50px)] font-semibold tracking-[-0.035em] leading-[1.03]">A desk that never runs out of room.</h2>
            <p className="text-muted text-[16px] leading-relaxed mt-6 max-w-[44ch]">Drop a photograph and it lands like a print — with a paper border, a strip of tape, a shadow. Paint chips, sticky notes and type samples sit beside it, because references are objects, not rows in a grid.</p>
            <dl className="mt-9 grid grid-cols-2 gap-x-8 gap-y-5 max-w-[440px]">
              {[['Place', 'Drag from the library, the desktop or the clipboard.'], ['Arrange', 'Rotate, layer, group, align and distribute.'], ['Annotate', 'Text, frames and notes, edited right on the board.'], ['Hand off', 'Export a 2× PNG or a file anyone can reopen.']].map(([k, v]) => (
                <div key={k}><dt className="font-display font-semibold text-[14px]">{k}</dt><dd className="text-muted text-[13px] leading-snug mt-1">{v}</dd></div>
              ))}
            </dl>
          </Reveal>
          <Reveal delay={120}>
            <div className="rounded-[10px] overflow-hidden border border-line" style={{ boxShadow: 'var(--shadow)' }}><BoardThumb board={night} className="w-full aspect-[5/4]" /></div>
            <div className="flex flex-wrap gap-1.5 mt-5">
              {TOOLS.map(([Icon, k, name]) => (
                <span key={k} className="inline-flex items-center gap-2 h-8 pl-2 pr-2.5 rounded-md border border-line text-[12px] text-muted"><Icon size={13} strokeWidth={1.75} />{name}<kbd className="mono text-[10.5px] text-ink px-1 rounded bg-raised">{k}</kbd></span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---- colour ---- */}
      <section id="colour" className="scroll-mt-16 max-w-[1180px] mx-auto px-10 max-sm:px-5 py-[13vh]">
        <Reveal className="grid lg:grid-cols-[1.1fr_1fr] gap-x-16 gap-y-6 items-end">
          <h2 className="text-[clamp(30px,4vw,50px)] font-semibold tracking-[-0.035em] leading-[1.03]">Colour, taken seriously.</h2>
          <p className="text-muted text-[16px] leading-relaxed max-w-[46ch]">Pull a palette out of any photograph, push it through five harmonies, and read the contrast before a client does. Every value is one click from your clipboard.</p>
        </Reveal>
        {pal && <Reveal delay={100} className="mt-12">
          <div className="flex h-[min(46vh,380px)] rounded-[10px] overflow-hidden border border-line" role="listbox" aria-label="Sample palette">
            {pal.colors.map((c, i) => (
              <button key={c + i} role="option" aria-selected={i === ci} onMouseEnter={() => setCi(i)} onFocus={() => setCi(i)} onClick={() => setCi(i)}
                className="relative min-w-0 flex flex-col justify-end items-start p-5 max-sm:p-2.5 transition-[flex-grow] duration-700 ease-[cubic-bezier(.16,1,.3,1)]" style={{ background: c, color: inkOn(c), flexGrow: i === ci ? 2.6 : 1, flexBasis: 0 }}>
                <span className="mono text-[12px] truncate max-w-full">{c}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-10 gap-y-2 mono text-[12.5px]">
            <span className="flex items-center gap-2.5"><i className="w-3.5 h-3.5 rounded-full border border-line" style={{ background: color }} /><span className="text-muted">HEX</span>{color}</span>
            <span><span className="text-muted">RGB</span>&nbsp; {fmtRgb(color)}</span>
            <span><span className="text-muted">HSL</span>&nbsp; {fmtHsl(color)}</span>
            <button className="btn btn-ghost !h-7 text-accent ml-auto max-sm:ml-0 font-sans" onClick={() => nav('colors')}><Copy size={13} /> Open Color Lab</button>
          </div>
        </Reveal>}
      </section>

      {/* ---- library ---- */}
      <section id="library" className="scroll-mt-16 border-y border-line bg-bg2">
        <div className="max-w-[1180px] mx-auto px-10 max-sm:px-5 py-[13vh] grid lg:grid-cols-[1.25fr_1fr] gap-x-16 gap-y-12 items-center">
          <Reveal className="grid grid-cols-3 auto-rows-[110px] max-sm:auto-rows-[78px] gap-3 max-lg:order-2">
            {SHOTS.map(([n, span], i) => <Img key={n} src={`img/${n}.jpg`} alt="" className={`rounded-[5px] ${span} ${i === 0 ? '' : ''}`} />)}
          </Reveal>
          <Reveal delay={120}>
            <h2 className="text-[clamp(30px,4vw,50px)] font-semibold tracking-[-0.035em] leading-[1.03]">Everything you have ever saved, <span className="font-serif italic font-medium text-accent">findable.</span></h2>
            <p className="text-muted text-[16px] leading-relaxed mt-6 max-w-[44ch]">Photography, textures, type pairings, palettes, shapes and the pieces you build yourself — tagged, searchable, and a drag away from the board you are working on.</p>
            <button className="btn !h-10 !px-4 !text-[13.5px] mt-8" onClick={() => nav('library/images')}>Browse the library <ArrowRight size={15} /></button>
          </Reveal>
        </div>
      </section>

      {/* ---- close ---- */}
      <section className="relative px-10 max-sm:px-5 py-[18vh] text-center overflow-hidden">
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-[520px] pointer-events-none" style={{ background: 'radial-gradient(55% 70% at 50% 100%, rgba(183,160,244,.18), transparent 70%)' }} />
        <Reveal className="relative">
          <div className="inline-block"><Mark size={44} /></div>
          <h2 className="font-display font-semibold tracking-[-0.04em] leading-[1] text-[clamp(38px,6.6vw,84px)] mt-8">Start with a <span className="font-serif italic font-medium text-accent">clear desk.</span></h2>
          <p className="text-muted text-[16px] mt-6 max-w-[46ch] mx-auto leading-relaxed">No account, no upload queue. Lilacanvas runs in this browser and keeps your boards on this device.</p>
          <button className="btn btn-primary !h-12 !px-7 !text-[15px] !rounded-lg mt-10" onClick={enter}>Open the studio <ArrowRight size={17} /></button>
        </Reveal>
      </section>

      <footer className="border-t border-line px-10 max-sm:px-5 h-16 flex items-center justify-between text-[12px] text-muted">
        <Logo />
        <span className="flex items-center gap-5"><button className="hover:text-ink transition-colors" onClick={() => nav('terms')}>Terms</button><button className="hover:text-ink transition-colors" onClick={() => nav('privacy')}>Privacy</button></span>
        <span className="mono text-[11px]">© {new Date().getFullYear()} Lilacanvas</span>
      </footer>
    </div>
  )
}
