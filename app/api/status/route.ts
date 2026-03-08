import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const roomId  = searchParams.get('roomId')
  const code    = searchParams.get('code')

  if (!roomId || !code) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const workerUrl = process.env.CRDT_WORKER_URL
  if (!workerUrl) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })

  const res = await fetch(`${workerUrl}/rooms/${encodeURIComponent(roomId)}/verify?code=${encodeURIComponent(code)}`)
  if (!res.ok) return NextResponse.json({ published: false })

  const data = await res.json() as { valid: boolean; published: boolean }
  return NextResponse.json({ published: data.published ?? false })
}
