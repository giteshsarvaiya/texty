'use client'

import { useState, useEffect } from 'react'
import { trackEvent } from '@/lib/analytics'
import { decodeYdoc } from '@/lib/docContent'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'

export function PublicEditor({ ydocBase64, html }: { ydocBase64: string; html: string }) {
  const [doc] = useState(() => decodeYdoc(ydocBase64))

  useEffect(() => { trackEvent('doc_viewed') }, [])

  const editor = useEditor({
    extensions: [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      StarterKit.configure({ history: false } as any),
      Collaboration.configure({ document: doc }),
    ],
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: 'editor-prose focus:outline-none' },
    },
  })

  // Server-rendered HTML until Tiptap mounts, so the content is in the initial HTML
  if (!editor) {
    return <div className="editor-prose" dangerouslySetInnerHTML={{ __html: html }} />
  }

  return <EditorContent editor={editor} />
}
