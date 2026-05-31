import { useCms } from '@/cms/CmsProvider'
import { useAdminConfirm } from '@/admin/confirm'
import type { CMSSectionId } from '@/cms/types'
import { AdminCard } from '@/components/admin/AdminCard'
import { useAdminToast } from '@/admin/toast'
import { useEffect, useState } from 'react'
import { loadDraftCMS, loadPublishedCMS, saveDraftCMS, savePublishedCMS } from '@/cms/storage'
import { DEFAULT_CMS_DATA } from '@/cms/defaultCms'
import { normalizeCmsData } from '@/cms/storage'
import { messageApi, type ApiMessage } from '@/services/api'
import { onInboxMessage } from '@/realtime/appSocket'
import { AdminsEditor } from '@/admin/editors/AdminsEditor'

const SECTION_LABELS: Record<CMSSectionId, string> = {
  results: 'Proven Results',
  videos: 'Teaching Videos',
  community: 'Community',
  certificates: 'Certificates (carousel in About)',
  lessons: 'What They Master (Lessons)',
  dailyUpdates: 'Daily updates (story strip in hero)',
  books: 'VIP books (paid library)',
}

export function SettingsEditor() {
  const { draft, updateDraft, published } = useCms()
  const { push } = useAdminToast()
  const { confirm } = useAdminConfirm()
  const sections = draft.settings.sections ?? DEFAULT_CMS_DATA.settings.sections
  const [messages, setMessages] = useState<ApiMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)

  useEffect(() => {
    const run = async () => {
      setLoadingMessages(true)
      try {
        const res = await messageApi.list()
        setMessages(res.data)
      } catch {
        setMessages([])
      } finally {
        setLoadingMessages(false)
      }
    }
    void run()
  }, [])

  useEffect(
    () =>
      onInboxMessage((msg) => {
        setMessages((prev) => {
          const next: ApiMessage = {
            id: msg.id,
            name: msg.name,
            email: msg.email,
            phone: msg.phone,
            channel: msg.channel,
            message: msg.message,
            source: 'public-site',
            status: msg.status,
            createdAt: msg.createdAt,
          }
          if (prev.some((m) => m.id === next.id)) return prev
          push(`New message from ${next.name}`, 'info')
          return [next, ...prev]
        })
      }),
    [push],
  )

  const toggle = (id: CMSSectionId, enabled: boolean) => {
    updateDraft((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        sections: {
          ...prev.settings.sections,
          [id]: enabled,
        },
      },
    }))
    push(`${SECTION_LABELS[id]} ${enabled ? 'visible' : 'hidden'} (draft)`, 'info')
  }

  return (
    <div className="admin-form-stack">
      <AdminsEditor />

      <AdminCard>
        <div className="admin-card-body">
          <p className="admin-editor-card-intro">
            Control section visibility. Empty content still auto-hides (e.g. no certificates).
          </p>

          <ul className="mt-6 flex flex-col gap-3">
            {(Object.keys(SECTION_LABELS) as CMSSectionId[]).map((id) => (
              <li
                key={id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-theme bg-theme-surface/60 px-4 py-3"
              >
                <span className="text-sm font-semibold text-theme-primary">{SECTION_LABELS[id]}</span>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-theme-muted">
                  <input
                    type="checkbox"
                    checked={sections[id] !== false}
                    onChange={(e) => toggle(id, e.target.checked)}
                  />
                  Show on site
                </label>
              </li>
            ))}
          </ul>
        </div>
      </AdminCard>

      <AdminCard>
        <div className="admin-card-body">
          <h3 className="font-display text-md font-bold text-theme-primary">Storage (frontend)</h3>
          <p className="mt-2 text-sm text-theme-muted">
            Content is saved in this browser via localStorage until the Node + MongoDB backend is connected.
          </p>
          <p className="mt-3 rounded-xl border border-theme bg-theme-elevated/50 px-3 py-2 font-mono text-xs text-theme-muted">
            MONGODB_URI=
          </p>
          <p className="mt-2 text-xs text-theme-muted">
            Published snapshot: {published.upcomingBanners.length} banners ·{' '}
            {published.certificates.length} certificates
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              className="admin-btn admin-btn--danger"
              onClick={async () => {
                const ok = await confirm({
                  title: 'Reset all CMS data?',
                  message:
                    'All published and draft content in this browser will be erased. This cannot be undone.',
                  confirmLabel: 'Reset everything',
                  variant: 'danger',
                })
                if (!ok) return
                const fresh = normalizeCmsData(DEFAULT_CMS_DATA)
                savePublishedCMS(fresh)
                saveDraftCMS(fresh)
                window.location.reload()
              }}
            >
              Reset all CMS data
            </button>
            <button
              type="button"
              className="admin-btn admin-btn--secondary"
              onClick={() => {
                const d = loadDraftCMS()
                const p = loadPublishedCMS()
                push(
                  `Draft banners: ${d.upcomingBanners.length} · Published: ${p.upcomingBanners.length}`,
                  'info',
                )
              }}
            >
              Check storage
            </button>
          </div>
        </div>
      </AdminCard>

      <AdminCard>
        <div className="admin-card-body">
          <h3 className="font-display text-md font-bold text-theme-primary">VIP desk chat</h3>
          <p className="mt-2 text-sm text-theme-muted">
            Manage community chat and private student messages in the <strong>VIP messages</strong> tab under
            Operations — realtime, no duplicate panel here.
          </p>
        </div>
      </AdminCard>

      <AdminCard>
        <div className="admin-card-body">
          <h3 className="font-display text-md font-bold text-theme-primary">User messages</h3>
          <p className="mt-2 text-sm text-theme-muted">
            Messages submitted from the public community section.
          </p>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              className="admin-btn admin-btn--secondary admin-btn--sm"
              onClick={async () => {
                setLoadingMessages(true)
                try {
                  const res = await messageApi.list()
                  setMessages(res.data)
                  push(`Loaded ${res.data.length} message(s).`, 'info')
                } catch {
                  push('Could not load messages. Check backend/API key.', 'error')
                } finally {
                  setLoadingMessages(false)
                }
              }}
            >
              Refresh messages
            </button>
          </div>

          {loadingMessages ? (
            <p className="mt-4 text-sm text-theme-muted">Loading messages...</p>
          ) : messages.length === 0 ? (
            <p className="mt-4 text-sm text-theme-muted">No messages yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="rounded-2xl border border-theme bg-theme-surface/60 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-theme-primary">{msg.name}</p>
                    <span className="rounded-full border border-theme px-2 py-0.5 text-[10px] text-theme-muted">
                      {msg.status}
                    </span>
                    <span className="text-xs text-theme-muted">
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-theme-primary">{msg.message}</p>
                  <p className="mt-2 text-xs text-theme-muted">
                    {msg.phone ? `Phone: ${msg.phone} · ` : ''}
                    {msg.email ? `Email: ${msg.email} · ` : ''}
                    {msg.channel ? `Channel: ${msg.channel}` : ''}
                  </p>
                  {msg.status !== 'read' ? (
                    <div className="mt-3">
                      <button
                        type="button"
                        className="admin-btn admin-btn--secondary admin-btn--sm"
                        onClick={async () => {
                          try {
                            await messageApi.markRead(msg.id)
                            setMessages((prev) =>
                              prev.map((item) => (item.id === msg.id ? { ...item, status: 'read' } : item)),
                            )
                          } catch {
                            push('Could not update message status.', 'error')
                          }
                        }}
                      >
                        Mark as read
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </AdminCard>
    </div>
  )
}
