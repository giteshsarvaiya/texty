import { getDocYdoc, renderDoc } from '@/lib/docContent'

// Markdown version of a published doc, for AI agents and other non-browser clients.
// Reached via /p/:docId.md or /p/:docId with `Accept: text/markdown` (see next.config.ts).
export async function GET(_request: Request, { params }: { params: Promise<{ docId: string }> }) {
  const { docId } = await params
  const ydoc = await getDocYdoc(docId)
  if (ydoc === null) {
    return new Response('Not found\n', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  }

  const { title, markdown } = renderDoc(ydoc)
  const url = `https://texty.giteshsarvaiya.com/p/${encodeURIComponent(docId)}`
  const frontmatter = `---\ntitle: ${JSON.stringify(title || docId)}\nurl: ${url}\n---\n\n`

  return new Response(frontmatter + markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Link': `<${url}>; rel="canonical"`,
      'Vary': 'Accept',
    },
  })
}
