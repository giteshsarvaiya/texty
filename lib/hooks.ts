'use client'

import { useState, useEffect } from 'react'
import { Room, OtherUser, RoomStorage, ConnectionStatus } from 'livetexts'
import { useRoomContext } from './RoomContext'

export function useRoom(): Room                              { return useRoomContext().room }
export function useOthers(): OtherUser[]                    { return useRoomContext().others }
export function useStorage(): RoomStorage | null            { return useRoomContext().storage }
export function useStatus(): ConnectionStatus               { return useRoomContext().status }
export function useSelf(): { userId: string; name: string } { return useRoomContext().self }

export interface AwarenessUser { clientId: number; name: string; color: string }

export function useAwarenessUsers(): AwarenessUser[] {
  const room = useRoomContext().room
  const self = useRoomContext().self
  const [users, setUsers] = useState<AwarenessUser[]>([])

  useEffect(() => {
    if (!room.awareness) return

    function update() {
      const states = room.awareness.getStates() as Map<number, { user?: { name?: string; color?: string } }>
      const list: AwarenessUser[] = []
      states.forEach((state, clientId) => {
        const name = state.user?.name || self.name
        const color = state.user?.color || '#888'
        list.push({ clientId, name, color })
      })
      setUsers(list)
    }

    update()
    room.awareness.on('update', update)
    return () => room.awareness.off('update', update)
  }, [room.awareness, self.name])

  return users
}

const COLORS = ['#E57373', '#81C784', '#64B5F6', '#FFB74D', '#BA68C8', '#4DB6AC', '#F06292', '#AED581']

export function colorFromUserId(userId: string): string {
  let hash = 0
  for (const c of userId) hash = (hash * 31 + c.charCodeAt(0)) & 0xFFFFFF
  return COLORS[Math.abs(hash) % COLORS.length]
}
