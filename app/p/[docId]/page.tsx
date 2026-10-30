import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { getDocYdoc, renderDoc } from '@/lib/docContent'
import { PublicEditor } from './PublicEditor'

interface Props {
  params: Promise<{ docId: string }>
}

// Shared between generateMetadata and the page so the worker is hit once per request
const loadDoc = cache(async (docId: string) => {
  const ydoc = await getDocYdoc(docId)
  return ydoc === null ? null : { ydoc, ...renderDoc(ydoc) }
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { docId } = await params
  const doc = await loadDoc(docId)
  const title = `${doc?.title || docId} — texty`
  const description = doc?.description || 'A document published with texty.'
  const url = `/p/${encodeURIComponent(docId)}`

  return {
    title,
    description,
    alternates: {
      canonical: url,
      types: { 'text/markdown': `${url}.md` },
    },
    openGraph: { type: 'article', url, siteName: 'texty', title, description },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function PublicDocPage({ params }: Props) {
  const { docId } = await params
  const doc = await loadDoc(docId)

  if (doc === null) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: doc.title || docId,
    description: doc.description,
    url: `https://texty.giteshsarvaiya.com/p/${encodeURIComponent(docId)}`,
    publisher: { '@type': 'Organization', name: 'texty' },
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      {/* Nav */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 py-4 border-b"
        style={{ borderColor: 'var(--border)', background: 'rgba(250,250,248,0.9)', backdropFilter: 'blur(12px)' }}
      >
        <Link href="/" className="font-serif italic text-3xl" style={{ color: 'var(--fg)' }}>texty</Link>
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
        <PublicEditor ydocBase64={doc.ydoc} html={doc.html} />
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
