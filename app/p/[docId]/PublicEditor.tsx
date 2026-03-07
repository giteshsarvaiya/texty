'use client'

import { useState } from 'react'
import * as Y from 'yjs'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'

export function PublicEditor({ ydocBase64 }: { ydocBase64: string }) {
  const [doc] = useState(() => {
    const d     = new Y.Doc()
    const bytes = new Uint8Array(atob(ydocBase64).split('').map(c => c.charCodeAt(0)))
    Y.applyUpdate(d, bytes)
    return d
  })

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

  return <EditorContent editor={editor} />
}
