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

## Build

```bash
cd frontend && npm run build
cd backend && npm run build
```

## Deployment

- **Frontend (Vercel):** set project **Root Directory** to `frontend`
- **Backend:** deploy the `backend/` folder (Render/Railway/Fly/etc.)
