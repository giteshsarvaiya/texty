'use client'

import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCaret from '@tiptap/extension-collaboration-caret'
import { Placeholder } from '@tiptap/extension-placeholder'
import { useRoom, useSelf, colorFromUserId } from '@/lib/hooks'

export function Editor() {
  const room = useRoom()
  const self = useSelf()

  const editor = useEditor({
    extensions: [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      StarterKit.configure({
        history: false,
        bold: false,
        italic: false,
        strike: false,
        code: false,
        codeBlock: false,
        blockquote: false,
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        horizontalRule: false,
      } as any),
      Placeholder.configure({ placeholder: 'Start writing…' }),
      Collaboration.configure({ document: room.doc }),
      CollaborationCaret.configure({
        provider: { awareness: room.awareness },
        user: { name: self.name, color: colorFromUserId(self.userId) },
      }),
    ],
    editorProps: {
      attributes: { class: 'editor-prose focus:outline-none', spellcheck: 'true' },
    },
    immediatelyRender: false,
  })

  // Keep awareness user info in sync
  useEffect(() => {
    if (!room.awareness) return
    room.awareness.setLocalStateField('user', {
      name: self.name,
      color: colorFromUserId(self.userId),
    })
  }, [room.awareness, self.name, self.userId])

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} className="w-full h-full" />
      </div>
    </div>
  )
}
