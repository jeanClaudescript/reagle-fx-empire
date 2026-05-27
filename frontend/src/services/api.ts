const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || 'http://localhost:4000'
const ADMIN_API_KEY = (import.meta.env.VITE_ADMIN_API_KEY as string | undefined)?.trim() || ''

type RequestInitLite = {
  method?: string
  body?: unknown
  admin?: boolean
}

async function apiFetch<T>(path: string, init: RequestInitLite = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (init.admin && ADMIN_API_KEY) {
    headers['x-admin-api-key'] = ADMIN_API_KEY
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: init.method ?? 'GET',
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Request failed with ${res.status}`)
  }
  return (await res.json()) as T
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

export const messageApi = {
  send: (payload: { name: string; email?: string; phone?: string; channel?: string; message: string }) =>
    apiFetch<{ ok: true; data: { id: string; createdAt: string } }>('/api/messages', { method: 'POST', body: payload }),
  list: () => apiFetch<{ data: ApiMessage[] }>('/api/messages', { admin: true }),
  markRead: (id: string) => apiFetch<{ ok: true }>(`/api/messages/${id}/read`, { method: 'POST', admin: true }),
}
