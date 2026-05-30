import { getAdminAuthToken } from '@/admin/adminSession'
import { getStudentAuthToken } from '@/student/studentSession'

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || 'http://localhost:4000'

type RequestInitLite = {
  method?: string
  body?: unknown
  admin?: boolean
  student?: boolean
}

export class StudentSessionError extends Error {
  code: string
  constructor(message: string, code = 'SESSION_REVOKED') {
    super(message)
    this.name = 'StudentSessionError'
    this.code = code
  }
}

export function parseApiError(text: string, status: number) {
  try {
    const body = JSON.parse(text) as { error?: string }
    if (body.error) return body.error
  } catch {
    /* plain text */
  }
  if (text.trim()) return text
  return `Request failed with ${status}`
}

async function apiFetch<T>(path: string, init: RequestInitLite = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (init.admin) {
    const token = getAdminAuthToken()
    if (!token) {
      throw new Error('Not signed in as admin — open /admin-login and sign in.')
    }
    headers.Authorization = `Bearer ${token}`
  }
  if (init.student) {
    const token = getStudentAuthToken()
    if (!token) {
      throw new StudentSessionError('Sign in to the VIP desk first', 'NO_SESSION')
    }
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: init.method ?? 'GET',
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })
  if (!res.ok) {
    const text = await res.text()
    if (init.student && res.status === 401) {
      try {
        const body = JSON.parse(text) as { code?: string; error?: string }
        if (body.code === 'SESSION_REVOKED') {
          throw new StudentSessionError(
            body.error ?? 'Signed in on another device — sign in again',
            'SESSION_REVOKED',
          )
        }
      } catch (e) {
        if (e instanceof StudentSessionError) throw e
      }
    }
    throw new Error(parseApiError(text, res.status))
  }
  return (await res.json()) as T
}

export type HealthStatus = {
  ok: boolean
  service: string
  db: 'connected' | 'connection_failed' | 'not_configured'
  dbError?: string
  media: 'cloudinary' | 'not_configured'
  auth: string
  timestamp: string
}

export const healthApi = {
  check: () => apiFetch<HealthStatus>('/api/health'),
}

export function hasAdminSession() {
  return Boolean(getAdminAuthToken())
}

export type AdminAccountRecord = {
  id: string
  email: string
  name?: string
  isPrimary: boolean
  createdAt: string
}

export const authApi = {
  setupStatus: () => apiFetch<{ data: { hasAdmin: boolean } }>('/api/auth/admin/setup'),
  bootstrap: (body: { email: string; password: string; name?: string }) =>
    apiFetch<{
      ok: true
      data: { token: string; expiresAt: string; user: AdminAccountRecord }
    }>('/api/auth/admin/bootstrap', { method: 'POST', body }),
  login: (email: string, password: string) =>
    apiFetch<{
      ok: true
      data: { token: string; expiresAt: string; user: AdminAccountRecord }
    }>('/api/auth/admin/login', { method: 'POST', body: { email, password } }),
  logout: () => apiFetch<{ ok: true }>('/api/auth/admin/logout', { method: 'POST', admin: true }),
  me: () =>
    apiFetch<{ data: { id: string; email: string; name?: string; isPrimary: boolean; role: string } }>(
      '/api/auth/admin/me',
      { admin: true },
    ),
  listAdmins: () => apiFetch<{ data: AdminAccountRecord[] }>('/api/auth/admin/users', { admin: true }),
  createAdmin: (body: { email: string; password: string; name?: string }) =>
    apiFetch<{ ok: true; data: AdminAccountRecord }>('/api/auth/admin/users', {
      method: 'POST',
      admin: true,
      body,
    }),
  removeAdmin: (id: string) =>
    apiFetch<{ ok: true }>(`/api/auth/admin/users/${id}`, { method: 'DELETE', admin: true }),
}

export type ApiMessage = {
  id: string
  name: string
  email?: string
  phone?: string
  channel?: string
  message: string
  source: 'public-site'
  status: 'new' | 'read'
  createdAt: string
}

export { API_BASE }

export const cmsApi = {
  getPublished: () => apiFetch<{ data: unknown }>('/api/cms/published'),
  getDraft: () => apiFetch<{ data: unknown }>('/api/cms/draft', { admin: true }),
  putDraft: (data: unknown) => apiFetch<{ data: unknown }>('/api/cms/draft', { method: 'PUT', body: { data }, admin: true }),
  publish: () => apiFetch<{ data: unknown }>('/api/cms/publish', { method: 'POST', admin: true }),
  resetDraft: () => apiFetch<{ data: unknown }>('/api/cms/draft/reset', { method: 'POST', admin: true }),
}

export const mediaApi = {
  upload: async (file: File) => {
    const form = new FormData()
    form.append('file', file)
    const headers: Record<string, string> = {}
    const token = getAdminAuthToken()
    if (!token) throw new Error('Not signed in as admin')
    headers.Authorization = `Bearer ${token}`

    const res = await fetch(`${API_BASE}/api/media/upload`, {
      method: 'POST',
      headers,
      body: form,
    })
    if (!res.ok) {
      let message = `Upload failed (${res.status})`
      try {
        const body = (await res.json()) as { error?: string }
        if (body.error) message = body.error
      } catch {
        /* ignore */
      }
      throw new Error(message)
    }
    return (await res.json()) as { ok: true; url: string; publicId: string }
  },
}

export type PaymentRecord = {
  id: string
  userId: string
  phone: string
  displayPhone: string
  programType?: 'forex' | 'crypto' | 'bundle'
  amount: number
  currency: string
  status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED'
  referenceCode: string
  transactionId?: string
  provider?: string
  confirmedBy?: string
  confirmedAt?: string
  createdAt: string
}

export type PaymentSettings = {
  merchantPhone: string
  defaultAmount: number
  currency: string
  ussdTemplate: string
  referralRewardAmount: number
  paymentNote: string
  paymentsEnabled: boolean
  allowCustomAmount: boolean
  membershipDays: number
  siteFreeAccessEnabled: boolean
  siteFreeAccessUntil: string | null
  autoTrialDays: number
  accessTip: string
  payPageTip: string
  programsEnabled: boolean
  programForexAmount: number
  programCryptoAmount: number
  programBundleAmount: number
  physicalClassesEnabled: boolean
  physicalClassSchedule: string
  physicalClassLocation: string
  physicalClassNote: string
  updatedAt?: string
}

export type PaymentConfig = PaymentSettings & {
  displayMerchantPhone?: string
}

export type PaymentInstructions = {
  merchantPhone: string
  merchantPhoneE164: string
  amount: number
  currency: string
  referenceCode: string
  provider: 'MTN' | 'AIRTEL'
  ussdDial: string
  mtnUssdDial: string
  airtelUssdDial: string
  telMerchant: string
  telUssd: string
  telMtnUssd: string
  telAirtelUssd: string
  note: string
}

export type ReferralRewardRecord = {
  id: string
  referrerId: string
  referredUserId: string
  referrerName?: string
  referredName?: string
  paymentId: string
  rewardAmount: number
  currency: string
  status: 'PENDING' | 'CREDITED' | 'CANCELLED'
  createdAt: string
  creditedAt?: string
}

export type StudentPendingPayment = {
  id: string
  referenceCode: string
  amount: number
  currency: string
  transactionId?: string
  createdAt: string
}

export type StudentAccessMode = 'paid' | 'promo' | 'unpaid' | 'expired'

export type StudentMembershipInfo = {
  accessMode?: StudentAccessMode
  paidUntil?: string | null
  daysRemaining?: number | null
  isExpiringSoon?: boolean
  membershipExpired?: boolean
  siteFreeAccessActive?: boolean
  siteFreeAccessUntil?: string | null
}

export type StudentRecord = {
  id: string
  name?: string
  phone?: string
  displayPhone?: string
  email?: string
  referralCode: string
  referredByCode?: string
  referredByUserId?: string
  referrerName?: string
  membershipStatus: 'paid' | 'unpaid'
  programType?: 'forex' | 'crypto' | 'bundle'
  paidAt?: string
  paidUntil?: string
  daysRemaining?: number | null
  isExpiringSoon?: boolean
  notes: string
  walletBalance: number
  totalPaid: number
  paymentCount: number
  lastPaymentAt?: string
  pendingPayment?: StudentPendingPayment
  createdAt: string
  updatedAt: string
}

export type StudentStats = {
  totalStudents: number
  paidStudents: number
  unpaidStudents: number
  pendingPayments: number
  totalRevenue: number
  currency: string
  referralRewardAmount: number
  recentPaid: StudentRecord[]
  recentUnpaid: StudentRecord[]
}

export type LiveSession = {
  id: string
  title: string
  description?: string
  status: 'scheduled' | 'live' | 'ended'
  streamUrl?: string
  meetingUrl?: string
  pair: string
  coachNote: string
  signalSide: 'buy' | 'sell' | 'neutral'
  signalEntry?: number
  signalStop?: number
  signalTarget?: number
  scheduledAt?: string
  startedAt?: string
  endedAt?: string
  createdAt: string
  updatedAt: string
}

export const studentApi = {
  checkAccess: (body: { phone?: string; email?: string }) =>
    apiFetch<{
      data: {
        found: boolean
        accessMode?: StudentAccessMode
        membershipStatus: 'paid' | 'unpaid'
        membershipExpired?: boolean
        siteFreeAccessActive?: boolean
        siteFreeAccessUntil?: string | null
        name?: string
        referralCode?: string
        paidUntil?: string | null
        daysRemaining?: number | null
        isExpiringSoon?: boolean
      }
    }>('/api/students/access/check', { method: 'POST', body }),
  login: (body: { phone?: string; email?: string; deviceId: string; deviceLabel?: string }) =>
    apiFetch<{
      ok: true
      data: {
        token: string
        expiresAt: string
        user: {
          id: string
          name?: string
          phone?: string
          email?: string
          accessMode?: StudentAccessMode
          membershipStatus: 'paid' | 'unpaid'
          membershipExpired?: boolean
          siteFreeAccessActive?: boolean
          referralCode?: string
          paidUntil?: string | null
          daysRemaining?: number | null
          isExpiringSoon?: boolean
        }
      }
    }>('/api/students/auth/login', { method: 'POST', body }),
  logout: () =>
    apiFetch<{ ok: true }>('/api/students/auth/logout', { method: 'POST', student: true }),
  me: () =>
    apiFetch<{
      data: {
        id: string
        name?: string
        phone?: string
        email?: string
        accessMode?: StudentAccessMode
        membershipStatus: 'paid' | 'unpaid'
        membershipExpired?: boolean
        siteFreeAccessActive?: boolean
        referralCode?: string
        paidUntil?: string | null
        daysRemaining?: number | null
        isExpiringSoon?: boolean
      }
    }>('/api/students/auth/me', { student: true }),
  getStats: () => apiFetch<{ data: StudentStats }>('/api/students/admin/stats', { admin: true }),
  list: (params: { status?: 'paid' | 'unpaid' | 'all'; q?: string }) => {
    const search = new URLSearchParams()
    if (params.status) search.set('status', params.status)
    if (params.q) search.set('q', params.q)
    const qs = search.toString()
    return apiFetch<{ data: StudentRecord[] }>(`/api/students/admin/list${qs ? `?${qs}` : ''}`, {
      admin: true,
    })
  },
  create: (body: {
    name?: string
    phone?: string
    email?: string
    referrerCode?: string
    notes?: string
    membershipStatus?: 'paid' | 'unpaid'
  }) =>
    apiFetch<{ ok: true; data: StudentRecord }>('/api/students/admin/create', {
      method: 'POST',
      admin: true,
      body,
    }),
  update: (
    id: string,
    body: {
      name?: string
      phone?: string
      email?: string
      notes?: string
      membershipStatus?: 'paid' | 'unpaid'
      walletBalance?: number
    },
  ) =>
    apiFetch<{ ok: true; data: StudentRecord }>(`/api/students/admin/${id}`, {
      method: 'PATCH',
      admin: true,
      body,
    }),
  grantAccess: (id: string, body?: { days?: number }) =>
    apiFetch<{ ok: true; data: StudentRecord }>(`/api/students/admin/${id}/grant-access`, {
      method: 'POST',
      admin: true,
      body,
    }),
  revokeAccess: (id: string) =>
    apiFetch<{ ok: true; data: StudentRecord }>(`/api/students/admin/${id}/revoke-access`, {
      method: 'POST',
      admin: true,
    }),
}

export const liveApi = {
  getActive: () => apiFetch<{ data: LiveSession | null }>('/api/live/active', { student: true }),
  adminList: () => apiFetch<{ data: LiveSession[] }>('/api/live/admin/list', { admin: true }),
  adminCreate: (body: {
    title: string
    description?: string
    streamUrl?: string
    meetingUrl?: string
    pair?: string
    scheduledAt?: string
  }) =>
    apiFetch<{ ok: true; data: LiveSession }>('/api/live/admin/create', {
      method: 'POST',
      admin: true,
      body,
    }),
  adminUpdate: (
    id: string,
    body: Partial<{
      title: string
      description: string
      streamUrl: string
      meetingUrl: string
      pair: string
      coachNote: string
      signalSide: 'buy' | 'sell' | 'neutral'
      signalEntry: number
      signalStop: number
      signalTarget: number
    }>,
  ) =>
    apiFetch<{ ok: true; data: LiveSession }>(`/api/live/admin/${id}`, {
      method: 'PATCH',
      admin: true,
      body,
    }),
  adminSetStatus: (id: string, status: 'scheduled' | 'live' | 'ended') =>
    apiFetch<{ ok: true; data: LiveSession }>(`/api/live/admin/${id}/status`, {
      method: 'POST',
      admin: true,
      body: { status },
    }),
}

export type ClassroomRoom = {
  id: string
  teacherId: string
  title: string
  description: string
  status: 'draft' | 'live' | 'ended'
  symbol: string
  timeframe: string
  enableLiveTeaching: boolean
  jitsiRoomName: string
  teachingSessionTitle: string
  teachingScheduledAt?: string
  jitsiMode: 'webcam' | 'screenshare'
  startedAt?: string
  endedAt?: string
  createdAt: string
  updatedAt: string
}

export type ClassroomAttendance = {
  id: string
  userId: string
  userName: string
  role: string
  joinedAt: string
  leftAt?: string
  durationSeconds: number
}

export type ClassroomRecording = {
  id: string
  roomId: string
  title: string
  filePath: string
  eventCount: number
  startedAt?: string
  endedAt?: string
  createdAt: string
}

export type ClassroomReplayEvent = {
  eventType: string
  payload: Record<string, unknown>
  userId?: string
  createdAt: string
}

export type ClassroomReplayData = {
  roomId: string
  title: string
  startedAt?: string
  endedAt?: string
  events: ClassroomReplayEvent[]
}

export const classroomApi = {
  getActive: () => apiFetch<{ data: ClassroomRoom | null }>('/api/classroom/active', { student: true }),
  getRoom: (id: string) =>
    apiFetch<{ data: { room: ClassroomRoom; chartState: unknown; chat: unknown[] } }>(
      `/api/classroom/rooms/${id}`,
      { student: true },
    ),
  adminList: () => apiFetch<{ data: ClassroomRoom[] }>('/api/classroom/admin/list', { admin: true }),
  adminCreate: (body: {
    title: string
    description?: string
    symbol?: string
    timeframe?: string
    enableLiveTeaching?: boolean
    jitsiRoomName?: string
    teachingSessionTitle?: string
    teachingScheduledAt?: string
    jitsiMode?: 'webcam' | 'screenshare'
  }) =>
    apiFetch<{ ok: true; data: ClassroomRoom }>('/api/classroom/admin/create', {
      method: 'POST',
      admin: true,
      body,
    }),
  adminUpdate: (
    id: string,
    body: Partial<{
      title: string
      description: string
      symbol: string
      timeframe: string
      enableLiveTeaching: boolean
      jitsiRoomName: string
      teachingSessionTitle: string
      teachingScheduledAt: string
      jitsiMode: 'webcam' | 'screenshare'
    }>,
  ) =>
    apiFetch<{ ok: true; data: ClassroomRoom }>(`/api/classroom/admin/${id}`, {
      method: 'PATCH',
      admin: true,
      body,
    }),
  adminStart: (id: string) =>
    apiFetch<{ ok: true; data: ClassroomRoom }>(`/api/classroom/admin/${id}/start`, {
      method: 'POST',
      admin: true,
    }),
  adminEnd: (id: string) =>
    apiFetch<{ ok: true; data: ClassroomRoom }>(`/api/classroom/admin/${id}/end`, {
      method: 'POST',
      admin: true,
    }),
  adminGetRoom: (id: string) =>
    apiFetch<{
      data: {
        room: ClassroomRoom
        chartState: {
          symbol: string
          timeframe: string
          drawings: unknown[]
        }
        chat: unknown[]
      }
    }>(`/api/classroom/admin/${id}`, { admin: true }),
  adminAttendance: (id: string) =>
    apiFetch<{ data: ClassroomAttendance[] }>(`/api/classroom/admin/${id}/attendance`, { admin: true }),
  adminRecordings: (id: string) =>
    apiFetch<{ data: ClassroomRecording[] }>(`/api/classroom/admin/${id}/recordings`, { admin: true }),
  adminRecordingReplay: (recordingId: string) =>
    apiFetch<{ data: ClassroomReplayData }>(`/api/classroom/admin/recordings/${recordingId}/replay`, {
      admin: true,
    }),
}

export type DeskChatMessage = {
  id: string
  channel: 'vip-community' | 'direct'
  fromUserId: string
  fromUserName: string
  fromRole: 'admin' | 'student'
  toUserId?: string
  message: string
  createdAt: string
}

export const deskChatApi = {
  communityList: () => apiFetch<{ data: DeskChatMessage[] }>('/api/desk-chat/community', { student: true }),
  communitySend: (message: string) =>
    apiFetch<{ ok: true; data: DeskChatMessage }>('/api/desk-chat/community', {
      method: 'POST',
      student: true,
      body: { message },
    }),
  directList: () => apiFetch<{ data: DeskChatMessage[] }>('/api/desk-chat/direct', { student: true }),
  directSend: (message: string) =>
    apiFetch<{ ok: true; data: DeskChatMessage }>('/api/desk-chat/direct', {
      method: 'POST',
      student: true,
      body: { message },
    }),
  adminCommunityList: () =>
    apiFetch<{ data: DeskChatMessage[] }>('/api/desk-chat/admin/community', { admin: true }),
  adminCommunitySend: (message: string) =>
    apiFetch<{ ok: true; data: DeskChatMessage }>('/api/desk-chat/admin/community', {
      method: 'POST',
      admin: true,
      body: { message },
    }),
  adminDirectThreads: () =>
    apiFetch<{ data: Array<{ studentId: string; studentName: string; lastMessage: string; lastAt: string; count: number }> }>(
      '/api/desk-chat/admin/direct/threads',
      { admin: true },
    ),
  adminDirectThread: (studentId: string) =>
    apiFetch<{ data: DeskChatMessage[] }>(`/api/desk-chat/admin/direct/${studentId}`, { admin: true }),
  adminDirectReply: (studentId: string, message: string) =>
    apiFetch<{ ok: true; data: DeskChatMessage }>(`/api/desk-chat/admin/direct/${studentId}`, {
      method: 'POST',
      admin: true,
      body: { message },
    }),
}

export const paymentApi = {
  getConfig: () => apiFetch<{ data: PaymentConfig }>('/api/payments/config'),
  adminGetSettings: () =>
    apiFetch<{ data: PaymentSettings }>('/api/payments/admin/settings', { admin: true }),
  adminUpdateSettings: (body: PaymentSettings) =>
    apiFetch<{ ok: true; data: PaymentSettings }>('/api/payments/admin/settings', {
      method: 'PUT',
      admin: true,
      body,
    }),
  adminEnableSiteFreeAccess: (days: number) =>
    apiFetch<{ ok: true; data: PaymentSettings }>('/api/payments/admin/site-free-access', {
      method: 'POST',
      admin: true,
      body: { days },
    }),
  adminDisableSiteFreeAccess: () =>
    apiFetch<{ ok: true; data: PaymentSettings }>('/api/payments/admin/site-free-access/disable', {
      method: 'POST',
      admin: true,
    }),
  create: (body: {
    phone?: string
    email?: string
    name?: string
    amount?: number
    program?: 'forex' | 'crypto' | 'bundle'
    referrerCode?: string
    provider?: 'MTN' | 'AIRTEL'
  }) =>
    apiFetch<{
      ok: true
      data: {
        payment: PaymentRecord
        referralCode: string
        instructions: PaymentInstructions
      }
    }>('/api/payments/create', { method: 'POST', body }),
  getStatus: (referenceCode: string) =>
    apiFetch<{ data: PaymentRecord }>(`/api/payments/status/${encodeURIComponent(referenceCode)}`),
  submitTransaction: (id: string, transactionId: string) =>
    apiFetch<{ ok: true; data: PaymentRecord }>(`/api/payments/${id}/submit-transaction`, {
      method: 'POST',
      body: { transactionId },
    }),
  adminList: (params: { status?: string; q?: string }) => {
    const search = new URLSearchParams()
    if (params.status) search.set('status', params.status)
    if (params.q) search.set('q', params.q)
    const qs = search.toString()
    return apiFetch<{ data: PaymentRecord[] }>(
      `/api/payments/admin/list${qs ? `?${qs}` : ''}`,
      { admin: true },
    )
  },
  adminApprove: (id: string, body?: { transactionId?: string }) =>
    apiFetch<{ ok: true; data: PaymentRecord }>(`/api/payments/admin/${id}/approve`, {
      method: 'POST',
      admin: true,
      body,
    }),
  adminReferrals: () =>
    apiFetch<{ data: ReferralRewardRecord[] }>('/api/payments/admin/referrals', { admin: true }),
  adminReject: (id: string) =>
    apiFetch<{ ok: true; data: PaymentRecord }>(`/api/payments/admin/${id}/reject`, {
      method: 'POST',
      admin: true,
    }),
  adminUpdatePayment: (id: string, body: { amount?: number; phone?: string }) =>
    apiFetch<{ ok: true; data: PaymentRecord }>(`/api/payments/admin/${id}`, {
      method: 'PATCH',
      admin: true,
      body,
    }),
}

export const messageApi = {
  send: (payload: { name: string; email?: string; phone?: string; channel?: string; message: string }) =>
    apiFetch<{ ok: true; data: { id: string; createdAt: string } }>('/api/messages', { method: 'POST', body: payload }),
  list: () => apiFetch<{ data: ApiMessage[] }>('/api/messages', { admin: true }),
  markRead: (id: string) => apiFetch<{ ok: true }>(`/api/messages/${id}/read`, { method: 'POST', admin: true }),
}

export type MarketQuote = {
  pair: string
  bid: number
  ask: number
  spread: number
  mid: number
  changePct?: number
  updatedAt: string
}

export type MarketCandle = {
  time: number
  open: number
  high: number
  low: number
  close: number
}

export type EconomicEvent = {
  id: string
  time: string
  currency: string
  title: string
  impact: 'low' | 'medium' | 'high'
  date: string
}

export type ForexNewsItem = {
  id: string
  headline: string
  source: string
  url: string
  datetime: number
}

export const marketApi = {
  quotes: () => apiFetch<{ data: MarketQuote[]; at: string }>('/api/market/quotes'),
  candles: (symbol = 'EURUSD', interval = '1', limit = 60) =>
    apiFetch<{ data: MarketCandle[]; symbol: string; at: string }>(
      `/api/market/candles?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&limit=${limit}`,
    ),
  calendar: () => apiFetch<{ data: EconomicEvent[]; at: string }>('/api/market/calendar'),
  news: () => apiFetch<{ data: ForexNewsItem[]; at: string }>('/api/market/news'),
  price: (symbol = 'EURUSD') =>
    apiFetch<{ data: { symbol: string; mid: number }; at: string }>(
      `/api/market/price?symbol=${encodeURIComponent(symbol)}`,
    ),
}
