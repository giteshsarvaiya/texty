import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { roomId, joinCode, published } = await request.json() as {
    roomId: string
    joinCode: string
    published: boolean
  }

  const workerUrl = process.env.CRDT_WORKER_URL
  if (!workerUrl) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })

  const res = await fetch(`${workerUrl}/rooms/${encodeURIComponent(roomId)}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ joinCode, published }),
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
