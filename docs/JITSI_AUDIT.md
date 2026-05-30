# Jitsi Live Teaching — Production Audit

Audit date: May 2026. Scope: optional Jitsi layer for REAGLE FX Live Trading Classroom.

## Summary

| Requirement | Status | Notes |
|-------------|--------|-------|
| Jitsi External API (not iframe-only) | **Pass** | `loadJitsiExternalApi.ts` + `JitsiMeetExternalAPI` |
| In-app embed (students stay on platform) | **Pass** | VIP desk + `/classroom/:id/student`; admin teacher route in same app |
| WebSocket chart stable during Jitsi | **Pass** | Conference remount only on room/identity change; mode via API command |
| WebRTC voice isolated when Jitsi on | **Pass** | `useClassroomAudio` disabled; `hideWebRtcAudio` on participants panel |
| Admin create / start / stop | **Pass** | `ClassroomEditor` + REST `/api/classroom/admin/*` |
| Dynamic room names | **Pass** | `sanitizeJitsiRoomName()` |
| `enableLiveTeaching` feature flag | **Pass** | Backend + CMS fields on classroom room |
| Desktop 50/50 layout | **Pass** | `LiveTeachingSplitLayout` |
| Mobile Chart \| Class \| Chat tabs | **Pass** | Breakpoint `xl` (1280px); chat pane when Jitsi active |
| Teacher screen share toggle | **Pass** | `jitsi:mode` socket + `toggleShareScreen` without remount |
| i18n mobile tab labels | **Pass** | `jitsi.tabChart`, `tabClass`, `tabChat` in en/fr/rw/sw |

## Architecture

```
ClassroomRoomView
├── SharedChart + Socket.IO (unchanged)
├── useClassroomAudio (skipped when Jitsi active)
└── LiveTeachingSplitLayout
    ├── chart pane
    ├── JitsiTeachingEmbed
    │   └── useJitsiTeachingConference → External API
    └── mobile chat pane (ParticipantsPanel + ClassroomChat)
```

## Manual test checklist

Before production deploy with Jitsi enabled:

1. **Admin:** Create room → enable Live Teaching → set room name → Start → Enter as teacher.
2. **Student:** `/desk` → Join classroom — confirm split layout and Jitsi connects (camera/mic prompts).
3. **Chart:** Teacher changes symbol/timeframe — student chart updates while Jitsi session is active.
4. **Mode:** Teacher toggles Webcam ↔ Screen — chart socket must **not** disconnect (check header "Live" status).
5. **Mobile:** Resize below 1280px — Chart, Class, Chat tabs switch panes; chat sends/receives messages.
6. **Disable Jitsi:** Turn off Live Teaching — WebRTC mic/listen controls return; no Jitsi UI.

## Known limitations

- **Admin teacher entry** opens `/classroom/{id}/teacher` in a new browser tab from admin panel (acceptable for teacher workflow).
- **Public Jitsi** (`meet.jit.si`) is fine for demos; production academies should self-host or use JaaS for SLA and branding.
- **500+ students:** Jitsi A/V does not scale like chart JSON events; cap concurrent video participants or use webinar mode if needed.
- **Recordings:** Classroom JSON replay captures chart events only, not Jitsi A/V (by design).

## Environment

```env
VITE_JITSI_DOMAIN=meet.jit.si   # or self-hosted domain
VITE_API_URL=https://api.example.com
```

Backend TURN vars apply only when Jitsi is **off** and WebRTC voice is active.
