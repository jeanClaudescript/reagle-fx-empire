import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { studentApi } from '@/services/api'

const STORAGE_KEY = 'rfx_student_contact'

export type StudentMembershipStatus = 'none' | 'paid' | 'unpaid' | 'not_found'

type Contact = { phone?: string; email?: string; name?: string }

type AccessState = {
  loading: boolean
  isPaid: boolean
  isLoggedIn: boolean
  membershipStatus: StudentMembershipStatus
  found: boolean
  contact: Contact | null
  referralCode?: string
  checkAccess: (input: Contact) => Promise<StudentMembershipStatus>
  refreshAccess: () => Promise<void>
  logout: () => void
}

const StudentAccessContext = createContext<AccessState | null>(null)

export function StudentAccessProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [contact, setContact] = useState<Contact | null>(null)
  const [isPaid, setIsPaid] = useState(false)
  const [found, setFound] = useState(false)
  const [membershipStatus, setMembershipStatus] = useState<StudentMembershipStatus>('none')
  const [referralCode, setReferralCode] = useState<string>()

  const applyResult = useCallback(
    (data: {
      found: boolean
      membershipStatus: 'paid' | 'unpaid'
      name?: string
      referralCode?: string
    }): StudentMembershipStatus => {
      setFound(data.found)
      if (!data.found) {
        setIsPaid(false)
        setMembershipStatus('not_found')
        return 'not_found'
      }
      const paid = data.membershipStatus === 'paid'
      setIsPaid(paid)
      setMembershipStatus(paid ? 'paid' : 'unpaid')
      if (data.referralCode) setReferralCode(data.referralCode)
      return paid ? 'paid' : 'unpaid'
    },
    [],
  )

  const checkAccess = useCallback(
    async (input: Contact) => {
      setLoading(true)
      try {
        const res = await studentApi.checkAccess(input)
        const next = { ...input, name: res.data.name ?? input.name }
        setContact(next)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        return applyResult(res.data)
      } catch {
        setFound(false)
        setIsPaid(false)
        setMembershipStatus('none')
        return 'none'
      } finally {
        setLoading(false)
      }
    },
    [applyResult],
  )

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setContact(null)
    setIsPaid(false)
    setFound(false)
    setMembershipStatus('none')
    setReferralCode(undefined)
  }, [])

  const refreshAccess = useCallback(async () => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try {
      const saved = JSON.parse(raw) as Contact
      if (saved.phone || saved.email) {
        await checkAccess(saved)
      }
    } catch {
      /* ignore */
    }
  }, [checkAccess])

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      setLoading(false)
      return
    }
    try {
      const saved = JSON.parse(raw) as Contact
      if (saved.phone || saved.email) {
        void checkAccess(saved)
        return
      }
    } catch {
      /* ignore */
    }
    setLoading(false)
  }, [checkAccess])

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible' && contact) {
        void refreshAccess()
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [contact, refreshAccess])

  const isLoggedIn = membershipStatus !== 'none' && contact !== null

  const value = useMemo(
    () => ({
      loading,
      isPaid,
      isLoggedIn,
      membershipStatus,
      found,
      contact,
      referralCode,
      checkAccess,
      refreshAccess,
      logout,
    }),
    [
      loading,
      isPaid,
      isLoggedIn,
      membershipStatus,
      found,
      contact,
      referralCode,
      checkAccess,
      refreshAccess,
      logout,
    ],
  )

  return <StudentAccessContext.Provider value={value}>{children}</StudentAccessContext.Provider>
}

export function useStudentAccess() {
  const ctx = useContext(StudentAccessContext)
  if (!ctx) throw new Error('useStudentAccess must be used within StudentAccessProvider')
  return ctx
}
