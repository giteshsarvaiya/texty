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

export async function POST(request: NextRequest) {
  const { username, password } = await request.json() as { username: string; password: string }

  const adminUser = process.env.ADMIN_USERNAME
  const adminPass = process.env.ADMIN_PASSWORD
  if (!adminUser || !adminPass || username !== adminUser || password !== adminPass) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const secret = process.env.CRDT_SECRET_KEY || 'admin'
  const token = await makeToken(secret)

  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_TOKEN, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24h
    path: '/',
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(SESSION_TOKEN)
  return res
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRDT_SECRET_KEY || 'admin'
  const expected = await makeToken(secret)
  const token = request.cookies.get(SESSION_TOKEN)?.value
  const valid = token === expected
  return NextResponse.json({ valid })
}
