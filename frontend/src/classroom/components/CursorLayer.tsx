import { useClassroomStore } from '../store/useClassroomStore'

export function CursorLayer() {
  const cursors = useClassroomStore((s) => s.cursors)
  const selfId = useClassroomStore((s) => s.selfId)

  return (
    <div className="classroom-cursors" aria-hidden>
      {Object.values(cursors)
        .filter((c) => c.userId !== selfId)
        .map((c) => (
          <div
            key={c.userId}
            className="classroom-cursor"
            style={{
              left: `${c.x}%`,
              top: `${c.y}%`,
            }}
          >
            <span className="classroom-cursor__dot" />
            <span className="classroom-cursor__label">{c.name}</span>
          </div>
        ))}
    </div>
  )
}
