'use client'

import { useAwarenessUsers } from '@/lib/hooks'

export function UserList() {
  const users = useAwarenessUsers()

  return (
    <div>
      <div className="space-y-2">
        {users.map(u => (
          <div key={u.clientId} className="flex items-center gap-2.5">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
              style={{ backgroundColor: u.color }}
            >
              {(u.name[0] || '?').toUpperCase()}
            </div>
            <span className="text-sm truncate" style={{ color: 'var(--fg)' }}>{u.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
