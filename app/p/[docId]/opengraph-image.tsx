import { ImageResponse } from 'next/og'
import { getDocYdoc, renderDoc } from '@/lib/docContent'

export const alt = 'A document published with texty'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

async function loadGoogleFont(family: string, italic = false): Promise<ArrayBuffer | null> {
  try {
    // No browser UA → Google Fonts serves TTF, which Satori can read
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}${italic ? ':ital@1' : ''}`,
    ).then(r => r.text())
    const src = css.match(/src: url\((.+?)\) format/)?.[1]
    return src ? await fetch(src).then(r => r.arrayBuffer()) : null
  } catch {
    return null
  }
}

export default async function OgImage({ params }: { params: Promise<{ docId: string }> }) {
  const { docId } = await params
  const ydoc = await getDocYdoc(docId)
  const { title, description } = ydoc ? renderDoc(ydoc) : { title: '', description: '' }
  const heading = title || docId
  const clipped = heading.length > 90 ? heading.slice(0, 87).trimEnd() + '…' : heading

  const [serif, serifItalic] = await Promise.all([
    loadGoogleFont('Instrument Serif'),
    loadGoogleFont('Instrument Serif', true),
  ])
  const fonts = [
    ...(serif ? [{ name: 'Instrument Serif', data: serif, style: 'normal' as const }] : []),
    ...(serifItalic ? [{ name: 'Instrument Serif', data: serifItalic, style: 'italic' as const }] : []),
  ]

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', padding: '72px 80px',
          background: '#FAFAF8', color: '#1C1917',
        }}
      >
        <div style={{ display: 'flex', fontFamily: 'Instrument Serif', fontStyle: 'italic', fontSize: 52 }}>
          texty
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', fontFamily: 'Instrument Serif', fontSize: clipped.length > 45 ? 72 : 96, lineHeight: 1.05 }}>
            {clipped}
          </div>
          {description && (
            <div style={{ display: 'flex', fontSize: 30, color: '#78716C', lineHeight: 1.4 }}>
              {description.length > 120 ? description.slice(0, 117).trimEnd() + '…' : description}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', fontSize: 24, color: '#A8A29E' }}>
          texty.giteshsarvaiya.com/p/{docId}
        </div>
      </div>
    ),
    { ...size, fonts },
  )
}
