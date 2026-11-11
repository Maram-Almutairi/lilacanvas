import { useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Logo, nav } from '../ui'

const UPDATED = 'November 11, 2026'
type Section = { h: string; p: (string | string[])[] }

const TERMS: Section[] = [
  { h: 'Agreement', p: ['These terms govern your use of MOODSPACE, a creative workspace for building moodboards, colour palettes and visual references. By using MOODSPACE you agree to them. If you do not agree, please do not use it.'] },
  { h: 'What MOODSPACE is', p: ['MOODSPACE runs entirely in your web browser. There are no accounts. Boards, uploads and palettes are stored on your own device, in your browser’s local storage, and are not sent to us.', 'Because nothing is kept on a server, we cannot recover work for you. Clearing your browser data, using private browsing, or switching browser or device will remove or hide your boards. Export boards you care about as a .moodspace file or PNG.'] },
  { h: 'Your content', p: ['You keep every right you have in the images, text and other material you place on a board. We claim no ownership of it and receive no copy of it.', 'You are responsible for what you add and for having the right to use it. Collecting reference images for private inspiration is different from publishing them: before you share or publish an exported board, make sure you hold the necessary rights or licences for everything on it.'] },
  { h: 'Acceptable use', p: ['Please do not use MOODSPACE to:', ['break the law or infringe someone else’s copyright, trademark, privacy or publicity rights;', 'create or distribute material that is unlawful, abusive or sexually exploits anyone;', 'attempt to interfere with, reverse the security of, or disrupt the service for others;', 'pass off MOODSPACE, its name or its logo as your own product.']] },
  { h: 'Sample content', p: ['The sample boards include photographs published on Unsplash under the Unsplash Licence. They are provided to demonstrate the product. The people, brands and projects named in sample boards are fictional.'] },
  { h: 'Our intellectual property', p: ['The MOODSPACE name, logo, interface design and software belong to their respective owners and are protected by applicable law. These terms do not grant you rights in them beyond using the product as offered.'] },
  { h: 'No warranty', p: ['MOODSPACE is provided “as is” and “as available”, without warranties of any kind, whether express or implied, including fitness for a particular purpose and non-infringement. We do not promise that it will be uninterrupted, error-free, or that stored boards will never be lost.'] },
  { h: 'Limitation of liability', p: ['To the fullest extent permitted by law, the operators of MOODSPACE are not liable for indirect, incidental or consequential loss, or for loss of data, profits or goodwill, arising from your use of the product. Nothing in these terms excludes liability that cannot lawfully be excluded.'] },
  { h: 'Changes', p: ['We may update MOODSPACE and these terms. When the terms change, the date at the top of this page changes with them. Continuing to use MOODSPACE after a change means you accept the updated terms.'] },
  { h: 'Contact', p: ['Questions about these terms can be raised through the project’s public repository, where MOODSPACE is published.'] },
]

const PRIVACY: Section[] = [
  { h: 'The short version', p: ['MOODSPACE does not collect, sell or share your personal data. It has no accounts, no analytics, no advertising and no tracking cookies. What you make stays in your browser, on your device.'] },
  { h: 'What is stored, and where', p: ['The following is saved locally on your device using your browser’s storage (IndexedDB):', ['your boards and everything placed on them;', 'images you upload, which are resized in your browser and never transmitted;', 'your colour palettes, favourites and library items;', 'your theme preference.'], 'None of this leaves your device unless you export a file and choose to send it to someone.'] },
  { h: 'What we do not collect', p: [['No name, email address or password — there is no sign-up.', 'No usage analytics, fingerprinting or advertising identifiers.', 'No cookies set by MOODSPACE.', 'No requests to third-party services: fonts and sample images are served with the app itself.']] },
  { h: 'Hosting', p: ['MOODSPACE is delivered as static files by a web host. Like any website, the host’s servers may record standard technical information — such as your IP address, browser type and the time of the request — in order to deliver the files and keep the service secure. That processing is carried out by the host under its own privacy policy; MOODSPACE itself does not receive or use it.'] },
  { h: 'Sharing and exports', p: ['A board leaves your device only when you export it. An exported .moodspace file contains the board’s contents, including any images you uploaded to it, so share it only with people you intend to see them.', 'When you open a board file from someone else, MOODSPACE checks its contents and only loads images embedded in the file or shipped with the app. It will not fetch images from remote addresses.'] },
  { h: 'Your control', p: ['You can delete any board, upload or palette inside the app at any time. To remove everything, use “Reset sample workspace” in the account menu, or clear this site’s data in your browser settings. Because we hold no copy, there is nothing further for us to delete.'] },
  { h: 'Children', p: ['MOODSPACE is a general creative tool and is not directed at children under 13. Since it collects no personal data, it knowingly collects none from children.'] },
  { h: 'Changes to this policy', p: ['If MOODSPACE ever begins to collect or transmit data — for example by adding accounts or cloud sync — this policy will be updated before that change takes effect, and the date above will change.'] },
  { h: 'Contact', p: ['Privacy questions can be raised through the project’s public repository, where MOODSPACE is published.'] },
]

export function Legal({ page }: { page: 'terms' | 'privacy' }) {
  const terms = page === 'terms'
  const sections = terms ? TERMS : PRIVACY
  const title = terms ? 'Terms & Conditions' : 'Privacy Policy'
  useEffect(() => { document.title = `${title} — MOODSPACE`; return () => { document.title = 'MOODSPACE' } }, [title])
  const slug = (h: string) => h.toLowerCase().replace(/[^a-z]+/g, '-')
  return (
    <div className="h-full overflow-y-auto bg-bg text-ink scroll-smooth" key={page}>
      <header className="sticky top-0 z-10 h-16 flex items-center justify-between px-10 max-sm:px-5 bg-[color-mix(in_srgb,var(--bg)_86%,transparent)] backdrop-blur-md border-b border-line/60">
        <button onClick={() => nav('promo')} aria-label="MOODSPACE"><Logo /></button>
        <div className="flex items-center gap-1.5">
          <button className="btn btn-ghost" aria-current={terms ? 'page' : undefined} style={terms ? { color: 'var(--accent)' } : undefined} onClick={() => nav('terms')}>Terms</button>
          <button className="btn btn-ghost" aria-current={!terms ? 'page' : undefined} style={!terms ? { color: 'var(--accent)' } : undefined} onClick={() => nav('privacy')}>Privacy</button>
          <button className="btn ml-2" onClick={() => nav('home')}><ArrowLeft size={14} /> Back to the studio</button>
        </div>
      </header>

      <div className="max-w-[1080px] mx-auto px-10 max-sm:px-5 pt-16 pb-28 grid lg:grid-cols-[220px_1fr] gap-x-16">
        <nav aria-label="On this page" className="max-lg:hidden">
          <ol className="sticky top-28 grid gap-0.5 text-[12.5px]">
            {sections.map((s) => <li key={s.h}><a href={'#' + slug(s.h)} onClick={(e) => { e.preventDefault(); document.getElementById(slug(s.h))?.scrollIntoView() }} className="block py-1.5 text-muted hover:text-ink transition-colors">{s.h}</a></li>)}
          </ol>
        </nav>
        <article className="max-w-[66ch] rise">
          <h1 className="text-[clamp(34px,5vw,54px)] font-semibold tracking-[-0.035em] leading-[1.02]">{title}</h1>
          <p className="mono text-[11px] uppercase tracking-[0.08em] text-muted mt-5">Last updated {UPDATED}</p>
          {sections.map((s) => (
            <section key={s.h} id={slug(s.h)} className="scroll-mt-24 mt-12">
              <h2 className="text-[19px] font-semibold tracking-[-0.015em]">{s.h}</h2>
              {s.p.map((p, i) => Array.isArray(p)
                ? <ul key={i} className="mt-3 grid gap-2 pl-5 list-disc marker:text-accent2 text-[15px] leading-[1.65] text-muted">{p.map((li) => <li key={li}>{li}</li>)}</ul>
                : <p key={i} className="mt-3 text-[15px] leading-[1.7] text-muted">{p}</p>)}
            </section>
          ))}
          <div className="mt-16 pt-6 border-t border-line flex flex-wrap gap-x-6 gap-y-2 text-[13px]">
            <button className="text-accent hover:underline underline-offset-4" onClick={() => nav(terms ? 'privacy' : 'terms')}>Read the {terms ? 'Privacy Policy' : 'Terms & Conditions'}</button>
            <button className="text-muted hover:text-ink" onClick={() => nav('promo')}>About MOODSPACE</button>
          </div>
        </article>
      </div>
    </div>
  )
}
