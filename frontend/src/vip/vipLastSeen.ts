const LAST_SEEN_KEY = 'rfx_vip_last_seen_v1'

function readMap(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(LAST_SEEN_KEY) || '{}') as Record<string, number>
  } catch {
    return {}
  }
}

function writeMap(map: Record<string, number>) {
  localStorage.setItem(LAST_SEEN_KEY, JSON.stringify(map))
}

export function getLastSeenAt(panelId: string) {
  return readMap()[panelId] ?? 0
}

export function markPanelSeen(panelId: string, at = Date.now()) {
  const map = readMap()
  map[panelId] = at
  writeMap(map)
}

export function isNewSince(panelId: string, atMs: number) {
  if (!atMs) return false
  return atMs > getLastSeenAt(panelId)
}

export function countUnreadPanels(panelIds: string[], unreadByPanel: Record<string, number>) {
  return panelIds.reduce((sum, id) => sum + (unreadByPanel[id] ?? 0), 0)
}
