import { Megaphone } from 'lucide-react'
import { usePaymentConfig } from '@/hooks/usePaymentConfig'

export function VipAccessTip() {
  const { config } = usePaymentConfig()
  const tip = config?.accessTip?.trim()
  if (!tip) return null

  return (
    <div className="vip-access-tip">
      <Megaphone className="h-4 w-4 shrink-0 text-theme-accent" aria-hidden />
      <p className="text-xs text-theme-primary">{tip}</p>
    </div>
  )
}
