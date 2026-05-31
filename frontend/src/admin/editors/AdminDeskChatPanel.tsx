import { useEffect, useState } from 'react'
import { deskChatApi } from '@/services/api'
import { MessengerChat, mergeMessage } from '@/components/chat/MessengerChat'
import type { ChatSendPayload } from '@/components/chat/MessengerComposer'
import { avatarColor, initials } from '@/components/chat/chatTheme'
import {
  emitDeskCommunitySend,
  emitDeskCommunityTyping,
  emitDeskDirectSend,
  emitDeskDirectTyping,
  onCommunityMessage,
  onDirectMessage,
  onDirectTyping,
  type DeskChatMessage,
} from '@/realtime/appSocket'

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
  const [typingNames, setTypingNames] = useState<string[]>([])

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
        const studentId = msg.fromRole === 'student' ? msg.fromUserId : msg.toUserId
        if (!studentId) return
        setThreads((prev) => {
          const rest = prev.filter((t) => t.studentId !== studentId)
          return [
            {
              studentId,
              studentName: msg.fromRole === 'student' ? msg.fromUserName : 'Student',
              lastMessage: msg.message || '📎 Media',
              lastAt: msg.createdAt,
              count: 1,
            },
            ...rest,
          ]
        })
        if (studentId === activeStudentId) {
          setDirectMessages((prev) => mergeMessage(prev, msg))
        }
      }),
    [activeStudentId],
  )

  useEffect(
    () =>
      onDirectTyping((p) => {
        if (p.studentId === activeStudentId && p.typing) {
          setTypingNames([p.userName])
        } else if (!p.typing) {
          setTypingNames([])
        }
      }),
    [activeStudentId],
  )

  useEffect(() => {
    if (!activeStudentId) {
      setDirectMessages([])
      return
    }
    void deskChatApi.adminDirectThread(activeStudentId).then((res) => setDirectMessages(res.data))
    void deskChatApi.adminDirectMarkRead(activeStudentId)
  }, [activeStudentId])

  const sendCommunity = async (payload: ChatSendPayload) => {
    try {
      const msg = await emitDeskCommunitySend(payload)
      setCommunity((prev) => mergeMessage(prev, msg))
    } catch {
      const res = await deskChatApi.adminCommunitySend(payload)
      setCommunity((prev) => mergeMessage(prev, res.data))
    }
  }

  const sendDirect = async (payload: ChatSendPayload) => {
    if (!activeStudentId) return
    try {
      const msg = await emitDeskDirectSend(payload, activeStudentId)
      setDirectMessages((prev) => mergeMessage(prev, msg))
    } catch {
      const res = await deskChatApi.adminDirectReply(activeStudentId, payload)
      setDirectMessages((prev) => mergeMessage(prev, res.data))
    }
  }

  const upload = async (file: File) => {
    const res = await deskChatApi.adminUpload(file)
    return res.data
  }

  return (
    <div className="admin-desk-chat">
      <div className="admin-editor__header mb-4">
        <div>
          <h3 className="font-display text-base font-bold text-theme-primary">VIP messages</h3>
          <p className="text-sm text-theme-muted">Meta-style chat — photos, voice, video & live typing.</p>
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
          <ul className="admin-desk-chat__threads messenger-thread-list">
            {threads.length === 0 ? (
              <li className="text-sm text-theme-muted p-3">No student messages yet.</li>
            ) : (
              threads.map((th) => (
                <li key={th.studentId}>
                  <button
                    type="button"
                    className={`messenger-thread ${activeStudentId === th.studentId ? 'messenger-thread--active' : ''}`}
                    onClick={() => setActiveStudentId(th.studentId)}
                  >
                    <span className="messenger-thread__avatar" style={{ backgroundColor: avatarColor(th.studentName) }}>
                      {initials(th.studentName)}
                    </span>
                    <span className="messenger-thread__body">
                      <strong>{th.studentName}</strong>
                      <span>{th.lastMessage.slice(0, 36)}</span>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
          <MessengerChat
            title={threads.find((t) => t.studentId === activeStudentId)?.studentName ?? 'Student'}
            subtitle="Private thread"
            emptyLabel={activeStudentId ? 'No messages yet.' : 'Select a student'}
            placeholder={activeStudentId ? 'Reply to student…' : 'Select a student'}
            messages={directMessages}
            mineRole="admin"
            typingNames={typingNames}
            disabled={!activeStudentId}
            onSend={sendDirect}
            onUpload={upload}
            onTyping={(typing) => activeStudentId && emitDeskDirectTyping(typing, activeStudentId)}
          />
        </div>
      ) : (
        <MessengerChat
          title="VIP community"
          subtitle="Group chat with all paid members"
          emptyLabel="No community messages yet."
          placeholder="Post to VIP community…"
          messages={community}
          mineRole="admin"
          groupChat
          onSend={sendCommunity}
          onUpload={upload}
          onTyping={emitDeskCommunityTyping}
        />
      )}
    </div>
  )
}
