'use client'

import { use, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Globe, GlobeLock, Users, Loader2, Copy, Check } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'
import { RoomProvider } from '@/lib/RoomContext'
import { Editor } from '@/components/Editor'
import { UserList } from '@/components/UserList'
import { useStatus } from '@/lib/hooks'

function getUserId(): string {
  if (typeof window === 'undefined') return ''
  let id = sessionStorage.getItem('texty-userId')
  if (!id) {
    const bytes = crypto.getRandomValues(new Uint8Array(12))
    id = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
    sessionStorage.setItem('texty-userId', id)
  }
  return id
}

function StatusDot({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    connected:    { color: '#22c55e', label: 'Live' },
    connecting:   { color: '#f59e0b', label: 'Connecting' },
    disconnected: { color: '#ef4444', label: 'Offline' },
  }
  const s = map[status] ?? map.disconnected
  return (
    <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted)' }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
      {s.label}
    </span>
  )
}

function DocUI({ docId, joinCode }: { docId: string; joinCode: string }) {
  const status = useStatus()
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished]   = useState<boolean | null>(null)
  const [showUsers, setShowUsers]   = useState(false)
  const [copied,    setCopied]      = useState(false)

  async function togglePublish() {
    setPublishing(true)
    const next = !published
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: docId, joinCode, published: next }),
      })
      if (res.ok) { setPublished(next); if (next) trackEvent('doc_published') }
    } finally {
      setPublishing(false)
    }
  }

  const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/p/${docId}` : ''

  function copyPublicUrl() {
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--bg)' }}>
      {/* Top bar */}
      <header
        className="shrink-0 flex items-center justify-between px-4 md:px-6 py-3 border-b gap-2"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/" className="font-serif italic text-base shrink-0" style={{ color: 'var(--fg)' }}>texty</Link>
          <span className="text-stone-300">/</span>
          <span className="text-sm font-medium truncate max-w-[100px] sm:max-w-xs" style={{ color: 'var(--fg)' }}>{docId}</span>
        </div>

        <div className="flex items-center gap-2">
          <StatusDot status={status} />

          {/* Users toggle */}
          <button
            onClick={() => setShowUsers(v => !v)}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border transition-colors hover:bg-stone-50"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
          >
            <Users size={13} />
            <span className="hidden sm:inline">Collaborators</span>
          </button>

          {/* Copy public URL — only when published */}
          {published && (
            <button
              onClick={copyPublicUrl}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border transition-colors hover:bg-stone-50"
              style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
              title={publicUrl}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy link'}</span>
            </button>
          )}

          <button
            onClick={togglePublish}
            disabled={publishing}
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 md:px-4 md:py-2 rounded-md border transition-all hover:opacity-85 disabled:opacity-50"
            style={published
              ? { background: 'var(--fg)', color: 'var(--bg)', borderColor: 'var(--fg)' }
              : { background: 'var(--surface)', color: 'var(--fg)', borderColor: 'var(--border)' }
            }
          >
            {publishing
              ? <Loader2 size={13} className="animate-spin" />
              : published
                ? <><Globe size={13} /><span className="hidden sm:inline">Published</span></>
                : <><GlobeLock size={13} /><span className="hidden sm:inline">Publish</span></>
            }
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Users panel */}
        {showUsers && (
          <aside className="w-48 md:w-56 shrink-0 border-r p-4 md:p-5" style={{ borderColor: 'var(--border)' }}>
            <UserList />
          </aside>
        )}

        {/* Editor */}
        <main className="flex-1 min-w-0 overflow-hidden">
          <div className="max-w-2xl mx-auto px-4 sm:px-8 py-8 md:py-12 h-full">
            <Editor />
          </div>
        </main>
      </div>
    </div>
  )
}

export default function DocPage({ params }: { params: Promise<{ docId: string }> }) {
  const { docId }    = use(params)
  const searchParams = useSearchParams()
  const name         = searchParams.get('name') || 'Anonymous'
  const joinCode     = searchParams.get('code') || ''
  const userId       = getUserId()
  const serverUrl    = process.env.NEXT_PUBLIC_CRDT_SERVER_URL || 'ws://localhost:8787'

  // Save to recent docs so the user can find their way back
  useEffect(() => {
    if (!joinCode) return
    try {
      const existing = JSON.parse(localStorage.getItem('texty-recent') || '[]') as Array<{ docId: string; joinCode: string; savedAt: number }>
      const updated = [{ docId, joinCode, savedAt: Date.now() }, ...existing.filter(d => d.docId !== docId)].slice(0, 10)
      localStorage.setItem('texty-recent', JSON.stringify(updated))
    } catch { /* ignore */ }
  }, [docId, joinCode])

  if (!joinCode) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>Missing join code.</p>
          <Link href="/app" className="text-sm underline underline-offset-2" style={{ color: 'var(--fg)' }}>
            Go back
          </Link>
        </div>
      </div>
    )
  }

  return (
    <RoomProvider serverUrl={serverUrl} roomId={docId} userId={userId} userName={name} joinCode={joinCode}>
      <DocUI docId={docId} joinCode={joinCode} />
    </RoomProvider>
  )
}
