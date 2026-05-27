# CoachPeter250 (REAGLE FX)

Monorepo with frontend and backend in one project folder.

## Structure

- `frontend/` — React + Vite public site and admin CMS UI
- `backend/` — Express API (health endpoint first; DB integration next)

## Development

From project root:

```bash
npm install
npm install --prefix frontend
npm install --prefix backend
npm run dev
```

Run only one side:

```bash
npm run dev:frontend
npm run dev:backend
```

## Build

```bash
npm run build
```

## Deployment

- Frontend: Vercel (uses root `vercel.json`, builds `frontend/`)
- Backend: deploy `backend/` separately (Render/Railway/Fly/etc.)
