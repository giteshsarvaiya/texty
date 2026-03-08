'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink, FileText, Globe, Lock, LogOut, RefreshCw } from 'lucide-react'

interface Room {
  roomId: string
  createdBy: string
  createdAt: string
  published: boolean
  publishedAt?: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [rooms, setRooms]       = useState<Room[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [refreshing, setRefreshing] = useState(false)

  async function checkAuth() {
    const res = await fetch('/api/admin/login')
    const { valid } = await res.json() as { valid: boolean }
    if (!valid) router.push('/admin')
  }

  async function fetchDocs(silent = false) {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    setError('')
    try {
      const res = await fetch('/api/admin/docs')
      if (res.status === 401) { router.push('/admin'); return }
      if (!res.ok) {
        const { error: e } = await res.json() as { error: string }
        setError(e || 'Failed to fetch docs.')
        return
      }
      const data = await res.json() as { rooms: Room[] }
      setRooms(data.rooms || [])
    } catch {
      setError('Network error.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    checkAuth().then(() => fetchDocs())
  }, [])

  async function handleLogout() {
    await fetch('/api/admin/login', { method: 'DELETE' })
    router.push('/admin')
  }

  const published = rooms.filter(r => r.published)
  const drafts    = rooms.filter(r => !r.published)

  function formatDate(iso?: string) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-4 md:px-8 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <Link href="/" className="font-serif italic text-xl tracking-tight" style={{ color: 'var(--fg)' }}>texty</Link>
          <span className="text-xs font-mono px-2 py-1 rounded" style={{ background: 'var(--surface)', color: 'var(--muted)' }}>admin</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchDocs(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border transition-colors hover:bg-stone-50 disabled:opacity-40"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border transition-colors hover:bg-stone-50"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
          >
            <LogOut size={12} />
            Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto w-full px-4 md:px-8 py-10 space-y-10">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total docs', value: rooms.length },
            { label: 'Published', value: published.length },
            { label: 'Drafts', value: drafts.length },
          ].map(s => (
            <div key={s.label} className="p-5 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <p className="text-2xl font-semibold" style={{ color: 'var(--fg)' }}>{loading ? '—' : s.value}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {error && (
          <div className="p-4 rounded-lg border text-sm" style={{ borderColor: '#fca5a5', background: '#fef2f2', color: '#dc2626' }}>
            {error}
            <p className="text-xs mt-1 opacity-70">Make sure the CRDT worker has a <code className="font-mono">GET /admin/rooms</code> endpoint that accepts the <code className="font-mono">x-admin-secret</code> header.</p>
          </div>
        )}

        {/* Published docs */}
        <section>
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--fg)' }}>
            <Globe size={14} /> Published docs
            <span className="font-mono font-normal text-xs" style={{ color: 'var(--muted)' }}>({published.length})</span>
          </h2>
          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => (
                <div key={i} className="h-14 rounded-lg animate-pulse" style={{ background: 'var(--surface)' }} />
              ))}
            </div>
          ) : published.length === 0 ? (
            <p className="text-sm py-6 text-center rounded-lg border" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>No published docs yet.</p>
          ) : (
            <div className="space-y-2">
              {published.map(doc => (
                <div
                  key={doc.roomId}
                  className="flex items-center justify-between px-4 py-3 rounded-lg border"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--fg)' }}>{doc.roomId}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                      by {doc.createdBy || 'unknown'} · published {formatDate(doc.publishedAt)}
                    </p>
                  </div>
                  <a
                    href={`/p/${encodeURIComponent(doc.roomId)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 ml-4 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border transition-colors hover:bg-stone-100"
                    style={{ borderColor: 'var(--border)', color: 'var(--fg)' }}
                  >
                    <ExternalLink size={11} /> View
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Draft docs */}
        <section>
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--fg)' }}>
            <Lock size={14} /> Drafts
            <span className="font-mono font-normal text-xs" style={{ color: 'var(--muted)' }}>({drafts.length})</span>
          </h2>
          {loading ? (
            <div className="space-y-2">
              {[1,2].map(i => (
                <div key={i} className="h-14 rounded-lg animate-pulse" style={{ background: 'var(--surface)' }} />
              ))}
            </div>
          ) : drafts.length === 0 ? (
            <p className="text-sm py-6 text-center rounded-lg border" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>No drafts.</p>
          ) : (
            <div className="space-y-2">
              {drafts.map(doc => (
                <div
                  key={doc.roomId}
                  className="flex items-center justify-between px-4 py-3 rounded-lg border"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--fg)' }}>{doc.roomId}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                      by {doc.createdBy || 'unknown'} · created {formatDate(doc.createdAt)}
                    </p>
                  </div>
                  <span className="shrink-0 ml-4 flex items-center gap-1.5 text-xs px-2 py-1 rounded-md" style={{ background: 'var(--bg)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
                    <FileText size={11} /> draft
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
