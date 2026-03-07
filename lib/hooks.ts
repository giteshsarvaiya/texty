'use client'

import { Room, OtherUser, RoomStorage, ConnectionStatus } from 'livetexts'
import { useRoomContext } from './RoomContext'

export function useRoom(): Room                              { return useRoomContext().room }
export function useOthers(): OtherUser[]                    { return useRoomContext().others }
export function useStorage(): RoomStorage | null            { return useRoomContext().storage }
export function useStatus(): ConnectionStatus               { return useRoomContext().status }
export function useSelf(): { userId: string; name: string } { return useRoomContext().self }

const COLORS = ['#E57373', '#81C784', '#64B5F6', '#FFB74D', '#BA68C8', '#4DB6AC', '#F06292', '#AED581']

export function colorFromUserId(userId: string): string {
  let hash = 0
  for (const c of userId) hash = (hash * 31 + c.charCodeAt(0)) & 0xFFFFFF
  return COLORS[Math.abs(hash) % COLORS.length]
}
