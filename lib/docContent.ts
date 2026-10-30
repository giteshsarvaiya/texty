import * as Y from 'yjs'

// Server-side rendering of a published doc's Yjs state into HTML / Markdown,
// so crawlers, link unfurlers and AI agents can read it without running JS.

export interface DocContent {
  title: string
  description: string
  html: string
  markdown: string
}

type Marks = Record<string, Record<string, unknown> | undefined>
type Delta = { insert: unknown; attributes?: Marks }[]

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const safeHref = (href: unknown) =>
  typeof href === 'string' && /^(https?:|mailto:|\/|#)/i.test(href) ? href : null

export function decodeYdoc(ydocBase64: string): Y.Doc {
  const d = new Y.Doc()
  const bytes = new Uint8Array(atob(ydocBase64).split('').map(c => c.charCodeAt(0)))
  Y.applyUpdate(d, bytes)
  return d
}

function plainText(node: Y.XmlElement | Y.XmlText): string {
  if (node instanceof Y.XmlText) return node.toString().replace(/<[^>]+>/g, '')
  if (node.nodeName === 'hardBreak') return ' '
  return node.toArray().map(c => plainText(c as Y.XmlElement | Y.XmlText)).join('')
}

// ── Inline ────────────────────────────────────────────────────────────────────

function inlineHtml(el: Y.XmlElement): string {
  return el.toArray().map(child => {
    if (child instanceof Y.XmlElement) return child.nodeName === 'hardBreak' ? '<br>' : inlineHtml(child)
    if (!(child instanceof Y.XmlText)) return ''
    return (child.toDelta() as Delta).map(({ insert, attributes: a = {} }) => {
      if (typeof insert !== 'string') return ''
      let s = escapeHtml(insert)
      if (a.code) s = `<code>${s}</code>`
      if (a.bold) s = `<strong>${s}</strong>`
      if (a.italic) s = `<em>${s}</em>`
      if (a.underline) s = `<u>${s}</u>`
      if (a.strike) s = `<s>${s}</s>`
      const href = safeHref(a.link?.href)
      if (href) s = `<a href="${escapeHtml(href)}" rel="noopener noreferrer nofollow">${s}</a>`
      return s
    }).join('')
  }).join('')
}

function inlineMarkdown(el: Y.XmlElement): string {
  return el.toArray().map(child => {
    if (child instanceof Y.XmlElement) return child.nodeName === 'hardBreak' ? '  \n' : inlineMarkdown(child)
    if (!(child instanceof Y.XmlText)) return ''
    return (child.toDelta() as Delta).map(({ insert, attributes: a = {} }) => {
      if (typeof insert !== 'string') return ''
      let s = a.code ? `\`${insert}\`` : insert
      if (a.bold) s = `**${s}**`
      if (a.italic) s = `*${s}*`
      if (a.strike) s = `~~${s}~~`
      const href = safeHref(a.link?.href)
      if (href) s = `[${s}](${href})`
      return s
    }).join('')
  }).join('')
}

// ── Blocks ────────────────────────────────────────────────────────────────────

function blocks(el: Y.XmlElement | Y.XmlFragment): Y.XmlElement[] {
  return el.toArray().filter((c): c is Y.XmlElement => c instanceof Y.XmlElement)
}

function blockHtml(el: Y.XmlElement): string {
  const inner = () => blocks(el).map(blockHtml).join('')
  switch (el.nodeName) {
    case 'heading': {
      const level = Math.min(Math.max(Number(el.getAttribute('level')) || 1, 1), 6)
      return `<h${level}>${inlineHtml(el)}</h${level}>`
    }
    case 'blockquote':     return `<blockquote>${inner()}</blockquote>`
    case 'bulletList':     return `<ul>${inner()}</ul>`
    case 'orderedList':    return `<ol>${inner()}</ol>`
    case 'listItem':       return `<li>${inner()}</li>`
    case 'codeBlock':      return `<pre><code>${escapeHtml(plainText(el))}</code></pre>`
    case 'horizontalRule': return '<hr>'
    default:               return `<p>${inlineHtml(el)}</p>`
  }
}

function blockMarkdown(el: Y.XmlElement): string {
  const children = () => blocks(el).map(blockMarkdown)
  switch (el.nodeName) {
    case 'heading': {
      const level = Math.min(Math.max(Number(el.getAttribute('level')) || 1, 1), 6)
      return `${'#'.repeat(level)} ${inlineMarkdown(el)}`
    }
    case 'blockquote':
      return children().join('\n\n').split('\n').map(l => `> ${l}`.trimEnd()).join('\n')
    case 'bulletList':
    case 'orderedList':
      return blocks(el).map((item, i) => {
        const marker = el.nodeName === 'orderedList' ? `${i + 1}. ` : '- '
        const body = blocks(item).map(blockMarkdown).join('\n\n')
        return marker + body.split('\n').join('\n' + ' '.repeat(marker.length))
      }).join('\n')
    case 'codeBlock': {
      const lang = el.getAttribute('language') ?? ''
      return '```' + lang + '\n' + plainText(el) + '\n```'
    }
    case 'horizontalRule': return '---'
    default:               return inlineMarkdown(el)
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export function renderDoc(ydocBase64: string): DocContent {
  try {
    const fragment = decodeYdoc(ydocBase64).getXmlFragment('default')
    const top = blocks(fragment)
    const texts = top.map(b => plainText(b).trim()).filter(Boolean)

    const title = texts[0] ?? ''
    const rest = texts.slice(1).join(' ')
    const description = rest.length > 160 ? rest.slice(0, 157).trimEnd() + '…' : rest

    return {
      title,
      description,
      html: top.map(blockHtml).join(''),
      markdown: top.map(blockMarkdown).filter(s => s.trim()).join('\n\n') + '\n',
    }
  } catch {
    return { title: '', description: '', html: '', markdown: '' }
  }
}

export async function getDocYdoc(docId: string): Promise<string | null> {
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
