# Live Trading Classroom — Deployment Guide

Free/open-source stack: **Socket.IO**, **WebRTC**, **Coturn**, **TradingView Lightweight Charts**, **Zustand**.

Teachers use the admin panel (`/admin` → **Trading classroom**). Paid VIP students join from `/desk` → **Trading classroom**.

## Architecture

| Layer | Technology |
|-------|------------|
| REST API | Express `/api/classroom/*` |
| Realtime | Socket.IO on same Node HTTP server |
| Chart sync | Event-based (symbol, timeframe, range, drawings, cursor) |
| Voice | WebRTC mesh (teacher → students, optional student speak) |
| TURN | Coturn (self-hosted) |
| Storage | MongoDB + local `recordings/` JSON files |
| Auth | Admin session token (teacher) / student VIP session token |

## Environment variables

Add to `backend/.env`:

```env
# Comma-separated TURN URLs (production)
TURN_URLS=turn:your-server.com:3478,turns:your-server.com:5349
TURN_USERNAME=classroom
TURN_CREDENTIAL=your-strong-secret
```

Frontend uses `VITE_API_URL` (same host as REST; Socket.IO connects to that origin).

## Database collections (MongoDB)

Mapped from the spec:

- `live_rooms` — classroom sessions
- `live_room_participants` — attendance (join/leave/duration)
- `live_room_events` — chart + drawing events for replay
- `live_chat_messages` — room chat
- `live_recordings` — metadata + path to JSON replay file

## Coturn setup (Ubuntu)

```bash
sudo apt update && sudo apt install -y coturn
sudo sed -i 's/#TURNSERVER_ENABLED=1/TURNSERVER_ENABLED=1/' /etc/default/coturn
```

Edit `/etc/turnserver.conf`:

```
listening-port=3478
tls-listening-port=5349
fingerprint
lt-cred-mech
user=classroom:your-strong-secret
realm=reaglefx.local
total-quota=100
stale-nonce=600
no-loopback-peers
no-multicast-peers
```

Open firewall ports `3478/tcp+udp` and `5349/tcp` (if using TLS).

```bash
sudo systemctl enable coturn
sudo systemctl restart coturn
```

Set matching `TURN_*` env vars on the backend.

## Running locally

```bash
# Terminal 1 — backend (HTTP + Socket.IO)
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

1. Sign in as admin → **Trading classroom** → Create room → **Start**
2. Click **Enter as teacher** (opens `/classroom/{id}/teacher`)
3. Sign in as paid student → `/desk` → **Trading classroom** → **Join classroom**

## Production notes

- Deploy backend on a **long-running Node host** (Railway, Render, VPS). Serverless (Vercel functions) does not support persistent Socket.IO.
- Put Node behind nginx with WebSocket upgrade:

```nginx
location /socket.io/ {
  proxy_pass http://127.0.0.1:4000;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
}
```

- Ensure `FRONTEND_ORIGIN` includes your production site URL.
- Recordings are written to `backend/recordings/` — mount persistent volume or sync to object storage.

## Security

- Socket handshake validates admin or paid student tokens.
- Students cannot emit chart/drawing control events (server-side role check).
- Only one live classroom at a time (prevents split sessions).
- Student access requires active paid membership + valid VIP session.

## Performance (500+ students)

- No screen/video streaming — only chart events, cursor (50ms throttle), drawings, chat, audio.
- Use a single teacher chart; students receive lightweight JSON events.
- Scale horizontally requires Redis adapter for Socket.IO (future enhancement).

## API summary

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/classroom/active` | Student |
| GET | `/api/classroom/rooms/:id` | Student |
| GET | `/api/classroom/admin/list` | Admin |
| POST | `/api/classroom/admin/create` | Admin |
| POST | `/api/classroom/admin/:id/start` | Admin |
| POST | `/api/classroom/admin/:id/end` | Admin |
| GET | `/api/classroom/admin/:id/attendance` | Admin |
| GET | `/api/classroom/admin/:id/recordings` | Admin |

## Socket events

- `classroom:join` / `classroom:leave`
- `chart:symbol`, `chart:timeframe`, `chart:range`, `chart:crosshair`
- `cursor:move` (throttled)
- `drawing:add`, `drawing:update`, `drawing:delete`
- `chat:send`, `chat:pin`
- `audio:grant`, `webrtc:signal`

Session end persists all chart events to a JSON replay file for reconstruction.

## Optional Jitsi live teaching layer

Jitsi is a **parallel** audio/video layer — it does not replace the WebSocket chart sync or the existing WebRTC voice module.

### Integration (External API)

The frontend loads Jitsi via the official **External API** (`external_api.js`), not a raw iframe URL:

| Module | Role |
|--------|------|
| `frontend/src/jitsi/loadJitsiExternalApi.ts` | Dynamic script load from `https://{domain}/external_api.js` |
| `frontend/src/jitsi/buildJitsiConfig.ts` | Room name sanitization + API options (prejoin off, toolbar, screen-share defaults) |
| `frontend/src/jitsi/useJitsiTeachingConference.ts` | Mount/dispose API; mode switch via `executeCommand('toggleShareScreen')` without remount |
| `frontend/src/jitsi/JitsiTeachingEmbed.tsx` | In-app embed UI (status bar, teacher mode toggle, fullscreen) |
| `frontend/src/jitsi/LiveTeachingSplitLayout.tsx` | Desktop 50/50 split; mobile tabs Chart \| Class \| Chat |

**Isolation rules:**

- Chart Socket.IO events are unchanged — the conference hook only remounts when room name or participant identity changes, **not** on webcam/screen-share toggle.
- `useClassroomAudio` (WebRTC mesh) is skipped when `enableLiveTeaching && jitsiRoomName`; Jitsi handles mic/camera instead.

### Admin setup

1. Admin → **Trading classroom** → create or expand a room → **Teaching settings**
2. Enable **Live Teaching Room (Jitsi)**
3. Set room name (sanitized slug used as Jitsi room)
4. Optional: session title, scheduled time, default mode (webcam / screen share)
5. **Start** the classroom session
6. **Enter as teacher** opens `/classroom/{id}/teacher` (teacher controls chart + Jitsi mode)

### Student experience

When `enableLiveTeaching` is on and the room is live:

- **Desktop:** 50/50 split — chart left, Jitsi conference right; chat/participants in sidebar
- **Mobile (&lt;1280px):** tabs — Chart \| Class \| Chat (chat moves out of hidden sidebar)
- WebSocket chart feed continues without reload during Jitsi join or mode changes
- WebRTC mic/listen controls are hidden (Jitsi handles A/V)

When disabled, the classroom behaves exactly as before.

### Socket events (Jitsi)

- `jitsi:mode` — teacher broadcasts webcam vs screen-share mode to students (UI sync only; chart socket unaffected)

### Environment

```env
# Optional — defaults to meet.jit.si
VITE_JITSI_DOMAIN=meet.jit.si
```

For self-hosted Jitsi, point `VITE_JITSI_DOMAIN` to your server (must serve `external_api.js` at the domain root).

See also: [JITSI_AUDIT.md](./JITSI_AUDIT.md) for production readiness checklist.
