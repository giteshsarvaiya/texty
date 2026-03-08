import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import * as Y from 'yjs'
import { PublicEditor } from './PublicEditor'

interface Props {
  params: Promise<{ docId: string }>
}

function extractTitleFromYdoc(ydocBase64: string): string {
  try {
    const d = new Y.Doc()
    const bytes = new Uint8Array(atob(ydocBase64).split('').map(c => c.charCodeAt(0)))
    Y.applyUpdate(d, bytes)
    const fragment = d.getXmlFragment('default')

    function textFromElement(el: Y.XmlElement): string {
      let text = ''
      el.forEach((child) => {
        if (child instanceof Y.XmlText) {
          text += child.toString()
        } else if (child instanceof Y.XmlElement) {
          text += textFromElement(child)
        }
      })
      return text
    }

    for (const child of fragment.toArray()) {
      if (child instanceof Y.XmlElement) {
        const text = textFromElement(child).trim()
        if (text) return text
      }
    }
    return ''
  } catch {
    return ''
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { docId } = await params
  const ydoc = await getDocYdoc(docId)
  const docTitle = ydoc ? extractTitleFromYdoc(ydoc) : ''
  const title = docTitle || docId
  return {
    title: `${title} — texty`,
    openGraph: { title: `${title} — texty` },
  }
}

async function getDocYdoc(docId: string): Promise<string | null> {
  const workerUrl = process.env.CRDT_WORKER_URL
  if (!workerUrl) return null
  try {
    const res = await fetch(`${workerUrl}/rooms/${encodeURIComponent(docId)}/content`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    const { ydoc } = await res.json() as { ydoc: string }
    return ydoc
  } catch {
    return null
  }
}

export default async function PublicDocPage({ params }: Props) {
  const { docId } = await params
  const ydoc      = await getDocYdoc(docId)

  if (ydoc === null) notFound()

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
      {/* Nav */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 py-4 border-b"
        style={{ borderColor: 'var(--border)', background: 'rgba(250,250,248,0.9)', backdropFilter: 'blur(12px)' }}
      >
        <Link href="/" className="font-serif italic text-2xl" style={{ color: 'var(--fg)' }}>texty</Link>
        <Link
          href="/app"
          className="text-xs px-3 py-1.5 rounded-md border transition-colors hover:bg-stone-50"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
        >
          Start writing →
        </Link>
      </nav>

      {/* Document */}
      <article className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-8 pt-28 md:pt-32 pb-20 md:pb-24">
        <p className="text-xs font-mono mb-8" style={{ color: 'var(--muted)' }}>{docId}</p>
        <PublicEditor ydocBase64={ydoc} />
      </article>

      {/* Footer */}
      <footer
        className="border-t px-4 md:px-8 py-6 text-xs text-center"
        style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
      >
        Published with{' '}
        <Link href="/" className="underline underline-offset-2" style={{ color: 'var(--fg)' }}>texty</Link>
      </footer>
    </div>
  )
}
