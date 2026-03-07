'use client'

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react'
import { Room, OtherUser, RoomStorage, ConnectionStatus } from 'livetexts'

interface RoomContextValue {
  room: Room
  others: OtherUser[]
  storage: RoomStorage | null
  status: ConnectionStatus
  self: { userId: string; name: string }
}

const RoomContext = createContext<RoomContextValue | null>(null)

interface RoomProviderProps {
  children: ReactNode
  serverUrl: string
  roomId: string
  userId: string
  userName: string
  joinCode: string
}

export function RoomProvider({ children, serverUrl, roomId, userId, userName, joinCode }: RoomProviderProps) {
  const roomRef = useRef<Room | null>(null)
  const [others,  setOthers]  = useState<OtherUser[]>([])
  const [storage, setStorage] = useState<RoomStorage | null>(null)
  const [status,  setStatus]  = useState<ConnectionStatus>('disconnected')

  useEffect(() => {
    const room = new Room(serverUrl, roomId, { userId, joinCode, authEndpoint: '/api/auth' })
    roomRef.current = room

    const u1 = room.subscribe('others',  (all) => setOthers(all.filter(u => u.userId !== userId)))
    const u2 = room.subscribe('storage', setStorage)
    const u3 = room.subscribe('status',  setStatus)

    room.connect().then(() => room.updatePresence({ name: userName, cursor: null }))

    return () => { u1(); u2(); u3(); room.disconnect() }
  }, [serverUrl, roomId, userId, userName, joinCode])

  const room = roomRef.current
  if (!room) return null

  return (
    <RoomContext.Provider value={{ room, others, storage, status, self: { userId, name: userName } }}>
      {children}
    </RoomContext.Provider>
  )
}

export function useRoomContext(): RoomContextValue {
  const ctx = useContext(RoomContext)
  if (!ctx) throw new Error('useRoomContext must be used inside RoomProvider')
  return ctx
}
