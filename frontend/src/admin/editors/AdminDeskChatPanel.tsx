import { useEffect, useState } from 'react'
import { Send } from 'lucide-react'
import { deskChatApi } from '@/services/api'
import { emitDeskCommunitySend, emitDeskDirectSend, onCommunityMessage, onDirectMessage, type DeskChatMessage } from '@/realtime/appSocket'

function mergeMessage(list: DeskChatMessage[], msg: DeskChatMessage) {
  if (list.some((m) => m.id === msg.id)) return list
  return [...list, msg].slice(-200)
}

type DirectThread = {
  studentId: string
  studentName: string
  lastMessage: string
  lastAt: string
  count: number
}

export function AdminDeskChatPanel() {
  const [tab, setTab] = useState<'community' | 'direct'>('direct')
  const [community, setCommunity] = useState<DeskChatMessage[]>([])
  const [threads, setThreads] = useState<DirectThread[]>([])
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null)
  const [directMessages, setDirectMessages] = useState<DeskChatMessage[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    void deskChatApi.adminCommunityList().then((res) => setCommunity(res.data))
    void deskChatApi.adminDirectThreads().then((res) => {
      setThreads(res.data as DirectThread[])
      if (res.data.length > 0) setActiveStudentId((res.data[0] as DirectThread).studentId)
    })
  }, [])

  useEffect(() => onCommunityMessage((msg) => setCommunity((prev) => mergeMessage(prev, msg))), [])

  useEffect(
    () =>
      onDirectMessage((msg) => {
        if (!activeStudentId) return
        const studentId =
          msg.fromRole === 'student' ? msg.fromUserId : msg.toUserId
        if (studentId !== activeStudentId) return
        setDirectMessages((prev) => mergeMessage(prev, msg))
        setThreads((prev) => {
          const studentId = msg.fromRole === 'student' ? msg.fromUserId : msg.toUserId
          if (!studentId) return prev
          const rest = prev.filter((t) => t.studentId !== studentId)
          return [
            {
              studentId,
              studentName: msg.fromRole === 'student' ? msg.fromUserName : 'Student',
              lastMessage: msg.message,
              lastAt: msg.createdAt,
              count: 1,
            },
            ...rest,
          ]
        })
      }),
    [activeStudentId],
  )

  useEffect(() => {
    if (!activeStudentId) {
      setDirectMessages([])
      return
    }
    void deskChatApi.adminDirectThread(activeStudentId).then((res) => setDirectMessages(res.data))
  }, [activeStudentId])

  const sendCommunity = async () => {
    const msg = text.trim()
    if (!msg || sending) return
    setSending(true)
    try {
      await emitDeskCommunitySend(msg)
      setText('')
    } catch {
      const res = await deskChatApi.adminCommunitySend(msg)
      setCommunity((prev) => mergeMessage(prev, res.data))
      setText('')
    } finally {
      setSending(false)
    }
  }

  const sendDirect = async () => {
    const msg = text.trim()
    if (!msg || sending || !activeStudentId) return
    setSending(true)
    try {
      await emitDeskDirectSend(msg, activeStudentId)
      setText('')
    } catch {
      const res = await deskChatApi.adminDirectReply(activeStudentId, msg)
      setDirectMessages((prev) => mergeMessage(prev, res.data))
      setText('')
    } finally {
      setSending(false)
    }
  }

  const send = tab === 'community' ? sendCommunity : sendDirect

  return (
    <div className="admin-desk-chat">
      <div className="admin-editor__header mb-4">
        <div>
          <h3 className="font-display text-base font-bold text-theme-primary">VIP messages</h3>
          <p className="text-sm text-theme-muted">Community chat and private student threads — updates in real time.</p>
        </div>
      </div>
      <div className="admin-desk-chat__tabs">
        <button type="button" className={tab === 'direct' ? 'active' : ''} onClick={() => setTab('direct')}>
          Student messages
        </button>
        <button type="button" className={tab === 'community' ? 'active' : ''} onClick={() => setTab('community')}>
          VIP community
        </button>
      </div>

      {tab === 'direct' ? (
        <div className="admin-desk-chat__split">
          <ul className="admin-desk-chat__threads">
            {threads.length === 0 ? (
              <li className="text-sm text-theme-muted p-3">No student messages yet.</li>
            ) : (
              threads.map((t) => (
                <li key={t.studentId}>
                  <button
                    type="button"
                    className={activeStudentId === t.studentId ? 'active' : ''}
                    onClick={() => setActiveStudentId(t.studentId)}
                  >
                    <strong>{t.studentName}</strong>
                    <span>{t.lastMessage.slice(0, 40)}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
          <div className="desk-chat">
            <div className="desk-chat__messages">
              {directMessages.map((m) => (
                <div key={m.id} className={`desk-chat__row desk-chat__row--${m.fromRole}`}>
                  <div className="desk-chat__meta">
                    <strong>{m.fromUserName}</strong>
                    <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p>{m.message}</p>
                </div>
              ))}
            </div>
            <div className="desk-chat__input">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
                placeholder={activeStudentId ? 'Reply to student…' : 'Select a student'}
                disabled={!activeStudentId}
              />
              <button type="button" onClick={send} disabled={sending || !text.trim() || !activeStudentId}>
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="desk-chat">
          <div className="desk-chat__messages">
            {community.map((m) => (
              <div key={m.id} className={`desk-chat__row desk-chat__row--${m.fromRole}`}>
                <div className="desk-chat__meta">
                  <strong>{m.fromUserName}</strong>
                  <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p>{m.message}</p>
              </div>
            ))}
          </div>
          <div className="desk-chat__input">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
              placeholder="Post to VIP community…"
            />
            <button type="button" onClick={send} disabled={sending || !text.trim()}>
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
