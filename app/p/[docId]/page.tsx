export const runtime = 'edge'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PublicEditor } from './PublicEditor'

interface Props {
  params: Promise<{ docId: string }>
}

async function getDocYdoc(docId: string): Promise<string | null> {
  const workerUrl = process.env.CRDT_WORKER_URL
  if (!workerUrl) return null
  try {
    const res = await fetch(`${workerUrl}/rooms/${encodeURIComponent(docId)}/content`, {
      next: { revalidate: 10 },
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
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
      {/* Nav */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 py-4 border-b"
        style={{ borderColor: 'var(--border)', background: 'rgba(250,250,248,0.9)', backdropFilter: 'blur(12px)' }}
      >
        <Link href="/" className="font-serif italic text-xl" style={{ color: 'var(--fg)' }}>texty</Link>
        <Link
          href="/app"
          className="text-xs px-3 py-1.5 rounded-md border transition-colors hover:bg-stone-50"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
        >
          Start writing →
        </Link>
      </nav>

      {/* Document */}
      <article className="max-w-2xl mx-auto px-4 sm:px-8 pt-28 md:pt-32 pb-20 md:pb-24">
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
