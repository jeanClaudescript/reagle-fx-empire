# CoachPeter250 (REAGLE FX)

## Structure

- `frontend/` — React + Vite public site and admin CMS UI
- `backend/` — Express API

## Development

### 1) MongoDB

Use one of these:

- Local MongoDB: `mongodb://127.0.0.1:27017/coachpeter250`
- MongoDB Atlas connection string

Create backend env file:

```bash
cd backend
copy .env.example .env
```

Set `MONGODB_URI` in `backend/.env`.
If you set `ADMIN_API_KEY` in backend, set matching `VITE_ADMIN_API_KEY` in `frontend/.env`.
If your frontend uses Vercel previews, keep `ALLOW_VERCEL_PREVIEW_ORIGINS=true`.

### 2) Run apps

Open two terminals:

```bash
cd frontend
npm install
npm run dev
```

```bash
cd backend
npm install
npm run dev
```

Backend API: `http://localhost:4000`

### Backend endpoints

- `GET /api/health`
- `GET /api/cms/published` (public content)
- `GET /api/cms/draft` (admin)
- `PUT /api/cms/draft` (admin, body: `{ "data": { ... } }`)
- `POST /api/cms/publish` (admin)
- `POST /api/cms/draft/reset` (admin)

If `ADMIN_API_KEY` is set, send header:

`x-admin-api-key: <your-key>`

### If MongoDB is not set yet

- Backend still starts on Render and health endpoint works.
- `/api/cms/*` and `/api/messages/*` return `503 Database not configured yet` until `MONGODB_URI` is set.
- Frontend continues in local fallback mode for CMS data until backend DB is available.

## Build

```bash
cd frontend && npm run build
cd backend && npm run build
```

## Deployment

- **Frontend (Vercel):** set project **Root Directory** to `frontend`
- **Backend:** deploy the `backend/` folder (Render/Railway/Fly/etc.)

### Production env checklist

**Render (backend)** — [reagle-fx-empire.onrender.com](https://reagle-fx-empire.onrender.com/api/health):
- `PORT=4000` (or Render-provided port)
- `MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.kbthmhy.mongodb.net/coachpeter250?retryWrites=true&w=majority&appName=Cluster0`
- `FRONTEND_ORIGIN=http://localhost:5173,https://reagle-fx-empire.vercel.app`
- `ALLOW_VERCEL_PREVIEW_ORIGINS=true`
- `ADMIN_API_KEY=<strong-secret>`

**Vercel (frontend)** — [reagle-fx-empire.vercel.app](https://reagle-fx-empire.vercel.app/):
- `VITE_API_URL=https://reagle-fx-empire.onrender.com`
- `VITE_ADMIN_API_KEY=<same-as-backend-admin-key>`
