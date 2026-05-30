import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { StudentSessionError, studentApi, type StudentAccessMode } from '@/services/api'
import {
  clearStudentAuthToken,
  getStudentAuthToken,
  getStudentDeviceId,
  getStudentDeviceLabel,
  setStudentAuthToken,
} from '@/student/studentSession'
import { refreshAppSocketAuth } from '@/realtime/appSocket'

const STORAGE_KEY = 'rfx_student_contact'

export type StudentMembershipStatus = 'none' | 'paid' | 'unpaid' | 'expired' | 'promo' | 'not_found'

type Contact = { phone?: string; email?: string; name?: string }

type MembershipFields = {
  paidUntil: string | null
  daysRemaining: number | null
  isExpiringSoon: boolean
  membershipExpired: boolean
  accessMode: StudentAccessMode
  siteFreeAccessActive: boolean
}

type AccessState = {
  loading: boolean
  isPaid: boolean
  hasVipSession: boolean
  isLoggedIn: boolean
  membershipStatus: StudentMembershipStatus
  accessMode: StudentAccessMode
  siteFreeAccessActive: boolean
  found: boolean
  contact: Contact | null
  referralCode?: string
  sessionError: string | null
  paidUntil: string | null
  daysRemaining: number | null
  isExpiringSoon: boolean
  membershipExpired: boolean
  checkAccess: (input: Contact) => Promise<StudentMembershipStatus>
  refreshAccess: () => Promise<void>
  logout: () => Promise<void>
}

const StudentAccessContext = createContext<AccessState | null>(null)

const emptyMembership: MembershipFields = {
  paidUntil: null,
  daysRemaining: null,
  isExpiringSoon: false,
  membershipExpired: false,
  accessMode: 'unpaid',
  siteFreeAccessActive: false,
}

async function establishVipSession(input: Contact) {
  const res = await studentApi.login({
    phone: input.phone,
    email: input.email,
    deviceId: getStudentDeviceId(),
    deviceLabel: getStudentDeviceLabel(),
  })
  setStudentAuthToken(res.data.token)
  refreshAppSocketAuth()
  return res.data.user
}

function pickMembership(data: {
  accessMode?: StudentAccessMode
  membershipStatus?: 'paid' | 'unpaid'
  membershipExpired?: boolean
  paidUntil?: string | null
  daysRemaining?: number | null
  isExpiringSoon?: boolean
  siteFreeAccessActive?: boolean
}): MembershipFields {
  const accessMode =
    data.accessMode ??
    (data.membershipExpired ? 'expired' : data.membershipStatus === 'paid' ? 'paid' : 'unpaid')
  return {
    paidUntil: data.paidUntil ?? null,
    daysRemaining: data.daysRemaining ?? null,
    isExpiringSoon: Boolean(data.isExpiringSoon),
    membershipExpired: Boolean(data.membershipExpired) || accessMode === 'expired',
    accessMode,
    siteFreeAccessActive: Boolean(data.siteFreeAccessActive),
  }
}

function statusFromMode(mode: StudentAccessMode): StudentMembershipStatus {
  if (mode === 'paid') return 'paid'
  if (mode === 'promo') return 'promo'
  if (mode === 'expired') return 'expired'
  return 'unpaid'
}

export function StudentAccessProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [contact, setContact] = useState<Contact | null>(null)
  const [isPaid, setIsPaid] = useState(false)
  const [hasVipSession, setHasVipSession] = useState(false)
  const [found, setFound] = useState(false)
  const [membershipStatus, setMembershipStatus] = useState<StudentMembershipStatus>('none')
  const [referralCode, setReferralCode] = useState<string>()
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [membership, setMembership] = useState<MembershipFields>(emptyMembership)

  const clearLocal = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    clearStudentAuthToken()
    setContact(null)
    setIsPaid(false)
    setHasVipSession(false)
    setFound(false)
    setMembershipStatus('none')
    setReferralCode(undefined)
    setMembership(emptyMembership)
  }, [])

  const applyVipUser = useCallback(
    (
      next: Contact,
      user: {
        referralCode?: string
        accessMode?: StudentAccessMode
        siteFreeAccessActive?: boolean
      } & Partial<MembershipFields>,
    ) => {
      const meta = pickMembership(user)
      setContact(next)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      setFound(true)
      setIsPaid(true)
      setHasVipSession(true)
      setMembershipStatus(statusFromMode(meta.accessMode))
      if (user.referralCode) setReferralCode(user.referralCode)
      setMembership(meta)
      setSessionError(null)
    },
    [],
  )

  const applyResult = useCallback(
    (data: {
      found: boolean
      accessMode?: StudentAccessMode
      membershipStatus: 'paid' | 'unpaid'
      membershipExpired?: boolean
      name?: string
      referralCode?: string
      paidUntil?: string | null
      daysRemaining?: number | null
      isExpiringSoon?: boolean
      siteFreeAccessActive?: boolean
    }): StudentMembershipStatus => {
      setFound(data.found)
      const meta = pickMembership(data)
      setMembership(meta)

      if (!data.found) {
        setIsPaid(false)
        setHasVipSession(false)
        setMembershipStatus('not_found')
        return 'not_found'
      }

      if (meta.accessMode === 'expired') {
        setIsPaid(false)
        setHasVipSession(false)
        setMembershipStatus('expired')
        return 'expired'
      }

      const hasAccess = meta.accessMode === 'paid' || meta.accessMode === 'promo'
      setIsPaid(hasAccess)
      setMembershipStatus(statusFromMode(meta.accessMode))
      if (!hasAccess) setHasVipSession(false)
      if (data.referralCode) setReferralCode(data.referralCode)
      return statusFromMode(meta.accessMode)
    },
    [],
  )

  const checkAccess = useCallback(
    async (input: Contact) => {
      setLoading(true)
      setSessionError(null)
      try {
        const res = await studentApi.checkAccess(input)
        const next = { ...input, name: res.data.name ?? input.name }
        setContact(next)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))

        if (res.data.found && res.data.membershipStatus === 'paid') {
          try {
            const user = await establishVipSession(next)
            applyVipUser(
              { ...next, name: user.name ?? next.name },
              {
                referralCode: user.referralCode,
                accessMode: user.accessMode,
                siteFreeAccessActive: user.siteFreeAccessActive,
                paidUntil: user.paidUntil,
                daysRemaining: user.daysRemaining,
                isExpiringSoon: user.isExpiringSoon,
              },
            )
            return statusFromMode(user.accessMode ?? 'paid')
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Could not start VIP session'
            setSessionError(msg)
            if (msg.toLowerCase().includes('expired')) {
              setMembershipStatus('expired')
              setMembership({ ...pickMembership(res.data), membershipExpired: true })
              return 'expired' as const
            }
            return applyResult(res.data)
          }
        }

        clearStudentAuthToken()
        setHasVipSession(false)
        return applyResult(res.data)
      } catch {
        clearLocal()
        return 'none'
      } finally {
        setLoading(false)
      }
    },
    [applyVipUser, applyResult, clearLocal],
  )

  const restoreSession = useCallback(async () => {
    const token = getStudentAuthToken()
    if (!token) return false

    try {
      const res = await studentApi.me()
      if (res.data.membershipStatus !== 'paid') {
        setMembership({
          paidUntil: res.data.paidUntil ?? null,
          daysRemaining: res.data.daysRemaining ?? null,
          isExpiringSoon: false,
          membershipExpired: true,
          accessMode: res.data.accessMode ?? 'expired',
          siteFreeAccessActive: Boolean(res.data.siteFreeAccessActive),
        })
        setMembershipStatus('expired')
        setIsPaid(false)
        setHasVipSession(false)
        clearStudentAuthToken()
        return false
      }
      const next: Contact = {
        phone: res.data.phone,
        email: res.data.email,
        name: res.data.name,
      }
      applyVipUser(next, {
        referralCode: res.data.referralCode,
        accessMode: res.data.accessMode,
        siteFreeAccessActive: res.data.siteFreeAccessActive,
        paidUntil: res.data.paidUntil,
        daysRemaining: res.data.daysRemaining,
        isExpiringSoon: res.data.isExpiringSoon,
      })
      refreshAppSocketAuth()
      return true
    } catch (err) {
      if (err instanceof StudentSessionError && err.code === 'SESSION_REVOKED') {
        setSessionError(err.message)
      }
      clearLocal()
      return false
    }
  }, [applyVipUser, clearLocal])

  const logout = useCallback(async () => {
    try {
      if (getStudentAuthToken()) await studentApi.logout()
    } catch {
      /* ignore */
    }
    clearLocal()
    setSessionError(null)
  }, [clearLocal])

  const refreshAccess = useCallback(async () => {
    if (getStudentAuthToken()) {
      const ok = await restoreSession()
      if (ok) return
    }

    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try {
      const saved = JSON.parse(raw) as Contact
      if (saved.phone || saved.email) await checkAccess(saved)
    } catch {
      /* ignore */
    }
  }, [checkAccess, restoreSession])

  useEffect(() => {
    const boot = async () => {
      setLoading(true)
      const restored = await restoreSession()
      if (restored) {
        setLoading(false)
        return
      }

      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        try {
          const saved = JSON.parse(raw) as Contact
          if (saved.phone || saved.email) {
            await checkAccess(saved)
            return
          }
        } catch {
          /* ignore */
        }
      }
      setLoading(false)
    }
    void boot()
  }, [checkAccess, restoreSession])

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible' && getStudentAuthToken()) {
        void restoreSession()
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [restoreSession])

  useEffect(() => {
    if (hasVipSession) refreshAppSocketAuth()
  }, [hasVipSession])

  const isLoggedIn = membershipStatus !== 'none' && contact !== null

  const value = useMemo(
    () => ({
      loading,
      isPaid,
      hasVipSession,
      isLoggedIn,
      membershipStatus,
      accessMode: membership.accessMode,
      siteFreeAccessActive: membership.siteFreeAccessActive,
      found,
      contact,
      referralCode,
      sessionError,
      paidUntil: membership.paidUntil,
      daysRemaining: membership.daysRemaining,
      isExpiringSoon: membership.isExpiringSoon,
      membershipExpired: membership.membershipExpired || membershipStatus === 'expired',
      checkAccess,
      refreshAccess,
      logout,
    }),
    [
      loading,
      isPaid,
      hasVipSession,
      isLoggedIn,
      membershipStatus,
      membership,
      found,
      contact,
      referralCode,
      sessionError,
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
