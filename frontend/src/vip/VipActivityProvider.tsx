import { createContext, useContext, type ReactNode } from 'react'
import { useVipActivityFeed } from '@/vip/useVipActivityFeed'

type VipActivityContextValue = ReturnType<typeof useVipActivityFeed>

const VipActivityContext = createContext<VipActivityContextValue | null>(null)

export function VipActivityProvider({ children }: { children: ReactNode }) {
  const value = useVipActivityFeed()
  return <VipActivityContext.Provider value={value}>{children}</VipActivityContext.Provider>
}

export function useVipActivity() {
  const ctx = useContext(VipActivityContext)
  if (!ctx) throw new Error('useVipActivity must be used within VipActivityProvider')
  return ctx
}
