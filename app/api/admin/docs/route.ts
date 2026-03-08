import { NextRequest, NextResponse } from 'next/server'

const SESSION_TOKEN = 'txadm_session'

async function makeToken(secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret || 'fallback-secret'),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode('admin-session'))
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

async function isAuthed(request: NextRequest): Promise<boolean> {
  const secret = process.env.CRDT_SECRET_KEY || 'admin'
  const expected = await makeToken(secret)
  const token = request.cookies.get(SESSION_TOKEN)?.value
  return token === expected
}

export async function GET(request: NextRequest) {
  if (!(await isAuthed(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const workerUrl = process.env.CRDT_WORKER_URL
  if (!workerUrl) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })

  const secret = process.env.CRDT_SECRET_KEY || ''

  try {
    const res = await fetch(`${workerUrl}/admin/rooms`, {
      headers: { 'x-admin-secret': secret },
    })
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: `Worker error: ${text}` }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
