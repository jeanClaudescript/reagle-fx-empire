import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  captureReferralFromSearch,
  getStoredReferralCode,
  normalizeReferralCode,
  setStoredReferralCode,
  clearStoredReferralCode,
} from '@/referral/referralStorage'

export function useReferralCode() {
  const [code, setCodeState] = useState(() => getStoredReferralCode())
  const [manualEntry, setManualEntry] = useState(false)

  useEffect(() => {
    captureReferralFromSearch()
    const stored = getStoredReferralCode()
    if (stored) setCodeState(stored)
  }, [])

  const setCode = useCallback((next: string) => {
    const normalized = normalizeReferralCode(next)
    setCodeState(normalized)
    if (normalized) setStoredReferralCode(normalized)
    else clearStoredReferralCode()
  }, [])

  const isAutoApplied = useMemo(
    () => Boolean(code) && !manualEntry && Boolean(getStoredReferralCode()),
    [code, manualEntry],
  )

  return {
    code,
    setCode,
    isAutoApplied,
    manualEntry,
    openManualEntry: () => setManualEntry(true),
    closeManualEntry: () => setManualEntry(false),
  }
}
