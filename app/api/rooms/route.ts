import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { roomId, createdBy } = await request.json() as { roomId: string; createdBy: string }

  const workerUrl = process.env.CRDT_WORKER_URL
  if (!workerUrl) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })

  const res = await fetch(`${workerUrl}/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, createdBy }),
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
