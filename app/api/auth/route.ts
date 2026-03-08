import { NextRequest, NextResponse } from 'next/server'

async function signJWT(payload: Record<string, unknown>, secret: string): Promise<string> {
  const encode = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  const header = encode({ alg: 'HS256', typ: 'JWT' })
  const body   = encode({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 })
  const data   = `${header}.${body}`

  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  return `${data}.${sigB64}`
}

export async function POST(request: NextRequest) {
  const { room, userId, joinCode } = await request.json() as { room: string; userId: string; joinCode: string }

  if (!room || !userId || !joinCode) {
    return NextResponse.json({ error: 'room, userId and joinCode are required' }, { status: 400 })
  }

  const secret    = process.env.CRDT_SECRET_KEY
  const workerUrl = process.env.CRDT_WORKER_URL

  if (!secret || !workerUrl) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const verify = await fetch(`${workerUrl}/rooms/${encodeURIComponent(room)}/verify?code=${encodeURIComponent(joinCode)}`)
  if (!verify.ok) {
    const { error } = await verify.json() as { error: string }
    return NextResponse.json({ error: error || 'Invalid join code' }, { status: 403 })
  }

  const token = await signJWT({ userId, permissions: { [room]: ['read', 'write'] } }, secret)
  return NextResponse.json({ token })
}
