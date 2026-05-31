import { createContext, useContext, type ReactNode } from 'react'
import { useEngagementEngine } from '@/engagement/useEngagementEngine'
import { useStudentAccess } from '@/context/StudentAccessContext'

type EngagementContextValue = ReturnType<typeof useEngagementEngine>

const EngagementContext = createContext<EngagementContextValue | null>(null)

export function EngagementProvider({ children }: { children: ReactNode }) {
  const { hasVipSession, accessMode } = useStudentAccess()
  const enabled = hasVipSession && (accessMode === 'paid' || accessMode === 'promo')
  const value = useEngagementEngine(enabled)
  return <EngagementContext.Provider value={value}>{children}</EngagementContext.Provider>
}

export function useEngagement() {
  const ctx = useContext(EngagementContext)
  if (!ctx) throw new Error('useEngagement must be used within EngagementProvider')
  return ctx
}
