'use client'

import { useState, useEffect, FormEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Plus, LogIn, Copy, Check, Clock, KeyRound } from 'lucide-react'
import Link from 'next/link'
import { trackEvent } from '@/lib/analytics'

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

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48)
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 6)
}

interface RecentDoc { docId: string; joinCode: string; savedAt: number }

function getRecentDocs(): RecentDoc[] {
  try { return JSON.parse(localStorage.getItem('texty-recent') || '[]') } catch { return [] }
}

function AppPageInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [tab,       setTab]       = useState<'create' | 'join'>('create')
  const [name,      setName]      = useState('')
  const [docName,   setDocName]   = useState('')
  const [joinCode,  setJoinCode]  = useState('')
  const [joinDoc,   setJoinDoc]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [suggested, setSuggested] = useState('')
  const [shareInfo, setShareInfo] = useState<{ inviteLink: string; docUrl: string; joinCode: string; docId: string } | null>(null)
  const [copied,    setCopied]    = useState(false)
  const [recentDocs, setRecentDocs] = useState<RecentDoc[]>([])

  // Pre-fill join form from URL params (e.g. from invite links)
  useEffect(() => {
    const doc  = searchParams.get('doc')
    const code = searchParams.get('code')
    if (doc && code) {
      setTab('join')
      setJoinDoc(doc)
      setJoinCode(code.toUpperCase())
    }
    setRecentDocs(getRecentDocs())
  }, [searchParams])

  async function createRoom(roomId: string) {
    setError('')
    setSuggested('')
    setLoading(true)
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, createdBy: name.trim() }),
      })

      if (res.status === 409) {
        setSuggested(`${slugify(docName)}-${randomSuffix()}`)
        setError('That name is already taken.')
        setLoading(false)
        return
      }
      if (!res.ok) { setError('Failed to create document.'); setLoading(false); return }

      const { joinCode: code } = await res.json() as { roomId: string; joinCode: string }
      const inviteLink = `${window.location.origin}/app?doc=${encodeURIComponent(roomId)}&code=${code}`
      const docUrl     = `${window.location.origin}/doc/${encodeURIComponent(roomId)}?name=${encodeURIComponent(name.trim())}&code=${code}`
      const existing   = getRecentDocs()
      localStorage.setItem('texty-recent', JSON.stringify(
        [{ docId: roomId, joinCode: code, savedAt: Date.now() }, ...existing.filter(d => d.docId !== roomId)].slice(0, 10)
      ))
      trackEvent('doc_created')
      setShareInfo({ inviteLink, docUrl, joinCode: code, docId: roomId })
    } catch {
      setError('Network error.')
    }
    setLoading(false)
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !docName.trim()) return
    await createRoom(slugify(docName))
  }

  async function handleCreateWithSuggested() {
    if (!suggested) return
    setDocName(suggested)
    await createRoom(suggested)
  }

  function handleJoin(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !joinDoc.trim() || !joinCode.trim()) return
    trackEvent('doc_edited')
    router.push(`/doc/${encodeURIComponent(slugify(joinDoc))}?name=${encodeURIComponent(name.trim())}&code=${joinCode.trim().toUpperCase()}`)
  }

  function copyInviteLink() {
    if (!shareInfo) return
    navigator.clipboard.writeText(shareInfo.inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const inputCls = "w-full px-3 py-2.5 text-sm rounded-lg border bg-transparent outline-none transition-all focus:ring-2 focus:ring-stone-300"
  const inputStyle = { borderColor: 'var(--border)', color: 'var(--fg)', background: 'var(--bg)' }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-4 md:px-8 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <Link href="/" className="font-serif italic text-xl tracking-tight" style={{ color: 'var(--fg)' }}>texty</Link>
      </nav>

      {/* Form */}
      <div className="flex-1 flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="text-2xl font-semibold mb-1" style={{ color: 'var(--fg)' }}>
              {tab === 'create' ? 'New document' : 'Edit a document'}
            </h1>
            <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>
              {tab === 'create'
                ? 'Create a doc and invite anyone to write with you.'
                : 'Have a join code? Enter the document name and your code to open and edit it.'}
            </p>

            {/* Tab switcher */}
            <div className="flex rounded-lg border p-1 mb-8 gap-1" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              {(['create', 'join'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError(''); setShareInfo(null) }}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-all"
                  style={tab === t
                    ? { background: 'var(--fg)', color: 'var(--bg)' }
                    : { color: 'var(--muted)' }
                  }
                >
                  {t === 'create' ? <><Plus size={13} /> Create</> : <><KeyRound size={13} /> Edit</>}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {shareInfo ? (
                <motion.div
                  key="share"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-3"
                >
                  {/* Join code — save warning */}
                  <div className="p-4 rounded-lg border text-center" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                    <p className="text-xs font-medium mb-2" style={{ color: 'var(--muted)' }}>Your join code</p>
                    <p className="font-mono text-3xl font-bold tracking-widest mb-3" style={{ color: 'var(--fg)' }}>{shareInfo.joinCode}</p>
                    <div className="rounded-md px-3 py-2" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                      <p className="text-xs font-medium" style={{ color: 'var(--fg)' }}>Save this code — it&apos;s your edit key.</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Anyone with the document name + this code can open and edit it, from any device. There is no other way to recover it.</p>
                    </div>
                  </div>

                  {/* Invite link */}
                  <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                    <p className="text-xs font-medium mb-2" style={{ color: 'var(--muted)' }}>Share this link to invite collaborators</p>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={shareInfo.inviteLink}
                        className="flex-1 text-xs px-2 py-1.5 rounded border truncate font-mono min-w-0"
                        style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--muted)' }}
                      />
                      <button
                        onClick={copyInviteLink}
                        className="shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border transition-colors hover:bg-stone-100"
                        style={{ borderColor: 'var(--border)', color: 'var(--fg)' }}
                      >
                        {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push(shareInfo.docUrl)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-85"
                    style={{ background: 'var(--fg)', color: 'var(--bg)' }}
                  >
                    Open my document <ArrowRight size={14} />
                  </button>
                </motion.div>
              ) : tab === 'create' ? (
                <motion.form
                  key="create"
                  onSubmit={handleCreate}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>Your name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Alice"
                      className={inputCls}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>Document name</label>
                    <input
                      type="text"
                      value={docName}
                      onChange={e => { setDocName(e.target.value); setError(''); setSuggested('') }}
                      placeholder="my-document"
                      className={inputCls}
                      style={inputStyle}
                    />
                    {docName && (
                      <p className="text-xs mt-1 font-mono" style={{ color: 'var(--muted)' }}>
                        id: {slugify(docName)}
                      </p>
                    )}
                  </div>
                  {error && (
                    <div className="space-y-2">
                      <p className="text-xs" style={{ color: '#dc2626' }}>{error}</p>
                      {suggested && (
                        <button
                          type="button"
                          onClick={handleCreateWithSuggested}
                          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium border transition-colors hover:bg-stone-50"
                          style={{ borderColor: 'var(--border)', color: 'var(--fg)' }}
                        >
                          Use <span className="font-mono">{suggested}</span> instead
                        </button>
                      )}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={!name.trim() || !docName.trim() || loading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'var(--fg)', color: 'var(--bg)' }}
                  >
                    {loading ? 'Creating…' : <><Plus size={14} /> Create document</>}
                  </button>
                </motion.form>
              ) : (
                <motion.form
                  key="join"
                  onSubmit={handleJoin}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>Your name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Alice"
                      className={inputCls}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>Document name</label>
                    <input
                      type="text"
                      value={joinDoc}
                      onChange={e => setJoinDoc(e.target.value)}
                      placeholder="my-document"
                      className={inputCls}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>Join code</label>
                    <input
                      type="text"
                      value={joinCode}
                      onChange={e => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="ABC12345"
                      className={`${inputCls} font-mono tracking-widest`}
                      style={inputStyle}
                    />
                  </div>
                  {error && <p className="text-xs" style={{ color: '#dc2626' }}>{error}</p>}
                  <button
                    type="submit"
                    disabled={!name.trim() || !joinDoc.trim() || !joinCode.trim()}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'var(--fg)', color: 'var(--bg)' }}
                  >
                    <KeyRound size={14} /> Open and edit
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Recent docs */}
          {recentDocs.length > 0 && !shareInfo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-xs font-medium mb-3 flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
                <Clock size={12} /> Recent documents
              </p>
              <div className="space-y-2">
                {recentDocs.map(doc => (
                  <Link
                    key={doc.docId}
                    href={`/doc/${encodeURIComponent(doc.docId)}?name=${encodeURIComponent(name.trim() || 'Me')}&code=${doc.joinCode}`}
                    className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg border text-sm transition-colors hover:bg-stone-50"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <span className="font-medium truncate" style={{ color: 'var(--fg)' }}>{doc.docId}</span>
                    <span className="text-xs font-mono shrink-0 ml-2" style={{ color: 'var(--muted)' }}>{doc.joinCode}</span>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AppPage() {
  return (
    <Suspense>
      <AppPageInner />
    </Suspense>
  )
}
