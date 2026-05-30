import { useEffect, useState } from 'react'
import { ClassroomRoomView } from '@/classroom/ClassroomRoomView'

function parseClassroomPath(path: string) {
  const m = path.match(/^\/classroom\/([^/]+)(?:\/(teacher|student))?$/)
  if (!m) return null
  return { roomId: m[1], mode: (m[2] as 'teacher' | 'student') ?? 'student' }
}

export function ClassroomRoomPage() {
  const [path, setPath] = useState(() => window.location.pathname)

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const parsed = parseClassroomPath(path)
  if (!parsed) {
    return (
      <div className="classroom-page classroom-page--error">
        <p>Invalid classroom URL</p>
        <a href="/desk">Back to VIP desk</a>
      </div>
    )
  }

  const backHref = parsed.mode === 'teacher' ? '/admin' : '/desk'

  return (
    <ClassroomRoomView
      roomId={parsed.roomId}
      mode={parsed.mode}
      onBack={() => {
        window.history.pushState({}, '', backHref)
        window.dispatchEvent(new PopStateEvent('popstate'))
      }}
    />
  )
}
