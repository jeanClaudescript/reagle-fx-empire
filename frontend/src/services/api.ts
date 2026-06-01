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

function sanitizeApiErrorMessage(message: string, status: number): string {
  const trimmed = message.trim()
  if (!trimmed) {
    return status >= 500
      ? 'Something went wrong on our side. Please try again in a moment.'
      : 'Could not complete this action. Please check your details and try again.'
  }
  if (/E11000|duplicate key|Mongo(Server)?Error|mongodb/i.test(trimmed)) {
    return 'Something went wrong. Please try again.'
  }
  if (trimmed.length > 220) {
    return status >= 500
      ? 'Something went wrong on our side. Please try again in a moment.'
      : 'Could not complete this action. Please try again.'
  }
  return trimmed
}

export function parseApiError(text: string, status: number) {
  try {
    const body = JSON.parse(text) as { error?: string }
    if (body.error) return sanitizeApiErrorMessage(body.error, status)
  } catch {
    /* plain text */
  }
  if (text.trim()) return sanitizeApiErrorMessage(text, status)
  return sanitizeApiErrorMessage('', status)
}

async function apiFetch<T>(path: string, init: RequestInitLite = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (init.admin) {
    const token = getAdminAuthToken()
    if (!token) {
      throw new Error('Not signed in as admin — open /login?tab=admin and sign in.')
    }
    headers.Authorization = `Bearer ${token}`
  }
  if (init.student) {
    const token = getStudentAuthToken()
    if (!token) {
      throw new StudentSessionError('Sign in to your student account first', 'NO_SESSION')
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
  referralPointsPerSignup: number
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
  referrerCode?: string
  paymentId: string
  rewardAmount: number
  currency: string
  status: 'PENDING' | 'CREDITED' | 'CANCELLED'
  createdAt: string
  creditedAt?: string
}

export type ReferralRelationshipRecord = {
  id: string
  referredName: string
  referredPhone?: string
  referredEmail?: string
  referredByCode?: string
  membershipStatus: string
  referrerId?: string
  referrerName?: string
  referrerPhone?: string
  referrerCode?: string
  hasPaidPayment: boolean
  firstPaidAt?: string
  paymentReference?: string
  reward: {
    id: string
    amount: number
    currency: string
    status: string
    creditedAt?: string
    paymentId: string
  } | null
  suspicious: boolean
  createdAt: string
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
  referralPoints: number
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
  regularStudents: number
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
  loginFree: (body: { phone?: string; email?: string; password?: string; deviceId: string; deviceLabel?: string }) =>
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
    }>('/api/students/auth/login-free', { method: 'POST', body }),
  registerFree: (body: {
    name?: string
    phone?: string
    email?: string
    referrerCode?: string
    deviceId: string
    deviceLabel?: string
  }) =>
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
    }>('/api/students/auth/register-free', { method: 'POST', body }),
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
  list: (params: { status?: 'paid' | 'unpaid' | 'regular' | 'all'; q?: string }) => {
    const search = new URLSearchParams()
    if (params.status) search.set('status', params.status)
    if (params.q) search.set('q', params.q)
    const qs = search.toString()
    return apiFetch<{ data: StudentRecord[] }>(`/api/students/admin/list${qs ? `?${qs}` : ''}`, {
      admin: true,
    })
  },
  downloadExport: async (params: { status?: 'paid' | 'unpaid' | 'regular' | 'all'; q?: string }) => {
    const search = new URLSearchParams()
    if (params.status) search.set('status', params.status)
    if (params.q?.trim()) search.set('q', params.q.trim())
    const token = getAdminAuthToken()
    if (!token) throw new Error('Not signed in as admin')
    const res = await fetch(`${API_BASE}/api/students/admin/export?${search}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(parseApiError(text, res.status))
    }
    const blob = await res.blob()
    const label = params.status ?? 'all'
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `reagle-${label}-students.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  },
  get: (id: string) => apiFetch<{ data: StudentRecord }>(`/api/students/admin/${id}`, { admin: true }),
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
  delete: (id: string) =>
    apiFetch<{ ok: true }>(`/api/students/admin/${id}`, { method: 'DELETE', admin: true }),
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
  channel: 'vip-community' | 'regular-community' | 'direct'
  fromUserId: string
  fromUserName: string
  fromRole: 'admin' | 'student'
  toUserId?: string
  message: string
  messageType?: 'text' | 'image' | 'video' | 'voice' | 'file'
  attachments?: {
    url: string
    type: 'image' | 'video' | 'voice' | 'file'
    mimeType?: string
    fileName?: string
    durationSec?: number
  }[]
  replyTo?: { id: string; preview: string; fromUserName: string }
  readAt?: string
  createdAt: string
}

export type ChatSendBody = {
  message?: string
  messageType?: DeskChatMessage['messageType']
  attachments?: DeskChatMessage['attachments']
  replyTo?: DeskChatMessage['replyTo']
}

export const deskChatApi = {
  upload: async (file: File) => {
    const form = new FormData()
    form.append('file', file)
    const token = getStudentAuthToken()
    if (!token) throw new Error('Sign in to upload')
    const res = await fetch(`${API_BASE}/api/desk-chat/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
    if (!res.ok) throw new Error(parseApiError(await res.text(), res.status))
    return (await res.json()) as {
      ok: true
      data: { url: string; type: 'image' | 'video' | 'voice' | 'file'; mimeType?: string; fileName?: string }
    }
  },
  adminUpload: async (file: File) => {
    const form = new FormData()
    form.append('file', file)
    const token = getAdminAuthToken()
    if (!token) throw new Error('Not signed in as admin')
    const res = await fetch(`${API_BASE}/api/desk-chat/admin/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
    if (!res.ok) throw new Error(parseApiError(await res.text(), res.status))
    return (await res.json()) as {
      ok: true
      data: { url: string; type: 'image' | 'video' | 'voice' | 'file'; mimeType?: string; fileName?: string }
    }
  },
  regularUpload: async (file: File) => {
    const form = new FormData()
    form.append('file', file)
    const token = getStudentAuthToken()
    if (!token) throw new Error('Sign in to upload')
    const res = await fetch(`${API_BASE}/api/desk-chat/regular/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
    if (!res.ok) throw new Error(parseApiError(await res.text(), res.status))
    return (await res.json()) as {
      ok: true
      data: { url: string; type: 'image' | 'video' | 'voice' | 'file'; mimeType?: string; fileName?: string }
    }
  },
  regularCommunityList: () =>
    apiFetch<{ data: DeskChatMessage[] }>('/api/desk-chat/regular-community', { student: true }),
  regularCommunitySend: (payload: ChatSendBody) =>
    apiFetch<{ ok: true; data: DeskChatMessage }>('/api/desk-chat/regular-community', {
      method: 'POST',
      student: true,
      body: payload,
    }),
  communityList: () => apiFetch<{ data: DeskChatMessage[] }>('/api/desk-chat/community', { student: true }),
  communitySend: (payload: ChatSendBody) =>
    apiFetch<{ ok: true; data: DeskChatMessage }>('/api/desk-chat/community', {
      method: 'POST',
      student: true,
      body: payload,
    }),
  directList: () => apiFetch<{ data: DeskChatMessage[] }>('/api/desk-chat/direct', { student: true }),
  directSend: (payload: ChatSendBody) =>
    apiFetch<{ ok: true; data: DeskChatMessage }>('/api/desk-chat/direct', {
      method: 'POST',
      student: true,
      body: payload,
    }),
  directMarkRead: () =>
    apiFetch<{ ok: true; data: { readAt: string } }>('/api/desk-chat/direct/read', {
      method: 'POST',
      student: true,
    }),
  adminRegularCommunityList: () =>
    apiFetch<{ data: DeskChatMessage[] }>('/api/desk-chat/admin/regular-community', { admin: true }),
  adminRegularCommunitySend: (payload: ChatSendBody) =>
    apiFetch<{ ok: true; data: DeskChatMessage }>('/api/desk-chat/admin/regular-community', {
      method: 'POST',
      admin: true,
      body: payload,
    }),
  adminCommunityList: () =>
    apiFetch<{ data: DeskChatMessage[] }>('/api/desk-chat/admin/community', { admin: true }),
  adminCommunitySend: (payload: ChatSendBody) =>
    apiFetch<{ ok: true; data: DeskChatMessage }>('/api/desk-chat/admin/community', {
      method: 'POST',
      admin: true,
      body: payload,
    }),
  adminDirectThreads: () =>
    apiFetch<{ data: Array<{ studentId: string; studentName: string; lastMessage: string; lastAt: string; count: number }> }>(
      '/api/desk-chat/admin/direct/threads',
      { admin: true },
    ),
  adminDirectThread: (studentId: string) =>
    apiFetch<{ data: DeskChatMessage[] }>(`/api/desk-chat/admin/direct/${studentId}`, { admin: true }),
  adminDirectReply: (studentId: string, payload: ChatSendBody) =>
    apiFetch<{ ok: true; data: DeskChatMessage }>(`/api/desk-chat/admin/direct/${studentId}`, {
      method: 'POST',
      admin: true,
      body: payload,
    }),
  adminDirectMarkRead: (studentId: string) =>
    apiFetch<{ ok: true; data: { readAt: string } }>(`/api/desk-chat/admin/direct/${studentId}/read`, {
      method: 'POST',
      admin: true,
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
  adminReferralRelationships: () =>
    apiFetch<{ data: ReferralRelationshipRecord[] }>('/api/payments/admin/referral-relationships', {
      admin: true,
    }),
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

export type EngagementNotification = {
  id: string
  contentType: string
  contentId: string
  priority: 1 | 2 | 3 | 4
  title: string
  body: string
  actionUrl?: string
  panelId?: string
  groupKey?: string
  relevanceScore: number
  readAt?: string
  channels: string[]
  createdAt: string
}

export type ActivityFeedEntry = {
  id: string
  contentType: string
  groupKey: string
  title: string
  body: string
  itemCount: number
  contentIds: string[]
  panelId?: string
  relevanceScore: number
  readAt?: string
  createdAt: string
  updatedAt: string
}

export type EngagementHighlights = {
  generatedAt: string
  highlights: EngagementNotification[]
  feedPreview: ActivityFeedEntry[]
}

export type EngagementRecommendations = {
  continueLearning: { id: string; title: string; reason: string } | null
  recommendedLesson: { id: string; title: string; reason: string } | null
  upcomingLiveSession: {
    id: string
    title: string
    scheduledAt?: string
    pair: string
    isLive?: boolean
  } | null
  focusPair: string
  programType: string | null
  incompleteQuiz: null
  nextModule: { id: string; title: string; reason: string } | null
}

export type WhatsNewPayload = {
  hasNew: boolean
  update: {
    version: string
    title: string
    summary: string
    items: { contentType: string; contentId: string; title: string; summary?: string }[]
    publishedAt: string
  } | null
}

export const engagementApi = {
  listNotifications: () =>
    apiFetch<{ data: EngagementNotification[] }>('/api/engagement/notifications', { student: true }),
  listFeed: () => apiFetch<{ data: ActivityFeedEntry[] }>('/api/engagement/feed', { student: true }),
  unreadCounts: () =>
    apiFetch<{ data: { center: number; feed: number; total: number } }>('/api/engagement/unread-counts', {
      student: true,
    }),
  markRead: (id: string) =>
    apiFetch<{ ok: true; data: EngagementNotification }>(`/api/engagement/notifications/${id}/read`, {
      method: 'PATCH',
      student: true,
    }),
  markAllRead: () =>
    apiFetch<{ ok: true }>('/api/engagement/notifications/read-all', { method: 'POST', student: true }),
  dismiss: (id: string) =>
    apiFetch<{ ok: true; data: EngagementNotification }>(`/api/engagement/notifications/${id}/dismiss`, {
      method: 'POST',
      student: true,
    }),
  trackView: (body: { contentType: string; contentId: string; metadata?: Record<string, unknown> }) =>
    apiFetch<{ ok: true }>('/api/engagement/views', { method: 'POST', body, student: true }),
  highlights: () => apiFetch<{ data: EngagementHighlights }>('/api/engagement/highlights', { student: true }),
  recommendations: () =>
    apiFetch<{ data: EngagementRecommendations }>('/api/engagement/recommendations', { student: true }),
  whatsNew: () => apiFetch<{ data: WhatsNewPayload }>('/api/engagement/whats-new', { student: true }),
  markWhatsNewSeen: () =>
    apiFetch<{ ok: true }>('/api/engagement/whats-new/seen', { method: 'POST', student: true }),
  joinedLiveSession: (sessionId: string) =>
    apiFetch<{ ok: true }>(`/api/engagement/live-session/${sessionId}/joined`, {
      method: 'POST',
      student: true,
    }),
}

export type EducationBook = {
  id: string
  title: string
  description?: string
  fileUrl: string
  fileType: 'pdf' | 'txt' | 'epub'
  fileName?: string
  sortOrder: number
  enabled: boolean
  lessonCount: number
  createdAt: string
  updatedAt: string
}

export type LessonEmptyReason = 'disabled' | 'no_books' | 'no_lessons' | 'finished'

export type EducationLesson = {
  id: string
  bookId: string
  bookTitle?: string
  title: string
  subtitle?: string
  content: string
  aiContent?: string
  aiQuiz?: { question: string; options: string[]; answerIndex: number }[]
  orderIndex: number
  wordCount: number
  chapterTitle?: string
}

export type EducationSettings = {
  aiMode: boolean
  lessonSplitMode: 'chapter' | 'words'
  wordsPerLessonMin: number
  wordsPerLessonMax: number
  lessonsPerDay: number
  enabled: boolean
  geminiConfigured?: boolean
}

export type TodayLessonPayload = {
  date: string
  dayIndex: number
  lesson: EducationLesson | null
  book: EducationBook | null
  completed: boolean
  aiMode: boolean
  streakCount: number
  emptyReason?: LessonEmptyReason
}

export type LessonHistoryItem = {
  dayIndex: number
  assignedDate: string
  completed: boolean
  lesson: EducationLesson
  book: EducationBook
}

export type EducationProgress = {
  state: {
    userId: string
    startedAt: string
    streakCount: number
    lastCompletedDate?: string
    totalCompleted: number
    currentDayIndex: number
  }
  books: { bookId: string; title: string; totalLessons: number; completedLessons: number; percent: number }[]
  recentCompletions: { lessonId: string; lessonTitle: string; bookTitle: string; dateCompleted: string }[]
}

export const educationApi = {
  adminSettings: () =>
    apiFetch<{ data: EducationSettings }>('/api/education/admin/settings', { admin: true }),
  updateSettings: (body: Partial<EducationSettings>) =>
    apiFetch<{ data: EducationSettings }>('/api/education/admin/settings', {
      method: 'PUT',
      body,
      admin: true,
    }),
  toggleAi: (enabled: boolean) =>
    apiFetch<{ data: { aiMode: boolean; geminiConfigured: boolean } }>('/api/education/admin/toggle-ai', {
      method: 'POST',
      body: { enabled },
      admin: true,
    }),
  listBooks: () => apiFetch<{ data: EducationBook[] }>('/api/education/admin/books', { admin: true }),
  uploadBook: async (file: File, title: string, description?: string) => {
    const form = new FormData()
    form.append('file', file)
    form.append('title', title)
    if (description) form.append('description', description)
    const token = getAdminAuthToken()
    if (!token) throw new Error('Not signed in as admin')
    const res = await fetch(`${API_BASE}/api/education/admin/books/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
    if (!res.ok) throw new Error(parseApiError(await res.text(), res.status))
    return (await res.json()) as { ok: true; data: EducationBook }
  },
  updateBook: (id: string, body: { title?: string; description?: string; enabled?: boolean }) =>
    apiFetch<{ data: EducationBook }>(`/api/education/admin/books/${id}`, {
      method: 'PATCH',
      body,
      admin: true,
    }),
  deleteBook: (id: string) =>
    apiFetch<{ ok: true }>(`/api/education/admin/books/${id}`, { method: 'DELETE', admin: true }),
  reorderBooks: (orderedIds: string[]) =>
    apiFetch<{ data: EducationBook[] }>('/api/education/admin/books/reorder', {
      method: 'POST',
      body: { orderedIds },
      admin: true,
    }),
  regenerateLessons: (id: string) =>
    apiFetch<{ ok: true; data: { lessonCount: number } }>(
      `/api/education/admin/books/${id}/regenerate-lessons`,
      { method: 'POST', admin: true },
    ),
  adminUserProgress: () =>
    apiFetch<{
      data: {
        userId: string
        name?: string
        phone?: string
        email?: string
        streakCount: number
        totalCompleted: number
        startedAt: string
        lastCompletedDate?: string
      }[]
    }>('/api/education/admin/user-progress', { admin: true }),
  todayLesson: () => apiFetch<{ data: TodayLessonPayload }>('/api/education/today-lesson', { student: true }),
  lessonHistory: () =>
    apiFetch<{ data: LessonHistoryItem[] }>('/api/education/lesson-history', { student: true }),
  lessonForDay: (dayIndex: number) =>
    apiFetch<{
      data: TodayLessonPayload & { lesson: EducationLesson; book: EducationBook; completed: boolean }
    }>(`/api/education/lesson/${dayIndex}`, { student: true }),
  completeLesson: (lessonId: string) =>
    apiFetch<{ ok: true; data: { streakCount: number; totalCompleted: number } }>(
      '/api/education/complete-lesson',
      { method: 'POST', body: { lessonId }, student: true },
    ),
  progress: () => apiFetch<{ data: EducationProgress }>('/api/education/progress', { student: true }),
  settings: () =>
    apiFetch<{ data: { enabled: boolean; aiMode: boolean } }>('/api/education/settings', { student: true }),
}
