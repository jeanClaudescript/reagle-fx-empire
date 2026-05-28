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
- `POST /api/media/upload` (admin, multipart `file` → Cloudinary URL)

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
- `CLOUDINARY_CLOUD_NAME=<your-cloud-name>`
- `CLOUDINARY_API_KEY=<your-api-key>`
- `CLOUDINARY_API_SECRET=<your-api-secret>`
- `CLOUDINARY_FOLDER=reagle-fx` (optional)

**Vercel (frontend)** — [reagle-fx-empire.vercel.app](https://reagle-fx-empire.vercel.app/):
- `VITE_API_URL=https://reagle-fx-empire.onrender.com`
- `VITE_ADMIN_API_KEY=<same-as-backend-admin-key>`

## Payments & referrals (Mobile Money)

Public flow: **`/pay`** (also linked from Community). Creates a **PENDING** payment with a unique **reference code** (`RFX-…`), shows USSD / merchant number, and polls until **PAID**.

**Render payment env (optional):**
- `PAYMENT_MERCHANT_PHONE=250789880060`
- `PAYMENT_DEFAULT_AMOUNT=5000`
- `PAYMENT_CURRENCY=RWF`
- `PAYMENT_USSD_TEMPLATE=182*1*1*{phone}*{amount}#`
- `REFERRAL_REWARD_AMOUNT=1000`
- `MOMO_WEBHOOK_SECRET=<secret-for-webhook-header>`

**API:**
- `POST /api/payments/create` — start payment
- `GET /api/payments/status/:referenceCode`
- `POST /api/payments/:id/submit-transaction` — user submits MoMo transaction ID
- `POST /api/payments/webhook/momo` — provider callback (match phone + amount + reference)
- Admin: `GET /api/payments/admin/list`, `POST …/approve`, `POST …/reject`

**Admin:** CMS → **Students & Pay** — dashboard (paid vs unpaid), create student accounts (phone and/or email), grant/revoke access, payments, MoMo settings.

Referrals: new users can pass `?ref=REF-XXXX` or enter a code at checkout. On the referred user’s **first PAID** payment, the referrer’s wallet is credited (`REFERRAL_REWARD_AMOUNT`).
