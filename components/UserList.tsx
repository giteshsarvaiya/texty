'use client'

import { useOthers, useSelf, colorFromUserId } from '@/lib/hooks'

export function UserList() {
  const self   = useSelf()
  const others = useOthers()

  const all = [
    { userId: self.userId, name: self.name, isSelf: true },
    ...others.map(u => ({ userId: u.userId, name: (u.data.name as string) || u.userId, isSelf: false })),
  ]

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--muted)' }}>
        In this doc
      </p>
      <div className="space-y-2">
        {all.map(u => (
          <div key={u.userId} className="flex items-center gap-2.5">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
              style={{ backgroundColor: colorFromUserId(u.userId) }}
            >
              {u.name[0]?.toUpperCase()}
            </div>
            <span className="text-sm truncate" style={{ color: 'var(--fg)' }}>
              {u.name}
              {u.isSelf && <span className="ml-1 text-xs" style={{ color: 'var(--muted)' }}>(you)</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
