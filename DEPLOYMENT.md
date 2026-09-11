# EngageAI production deployment

## What is intentionally not included
No real `.env` file or secret values are included in this package. You must configure production values in your deployment provider.

The application cannot connect to PostgreSQL until `DATABASE_URL` is supplied.

## 1. PostgreSQL / Supabase
1. Create a PostgreSQL database.
2. Run `supabase/schema.sql` in the database SQL editor.
3. Copy the database connection string.
4. Set it as `DATABASE_URL` in the backend environment.

## 2. Backend (Render)
Root directory: `backend`

Build command:
```bash
npm ci
```

Start command:
```bash
npm start
```

Required environment variables:
```text
NODE_ENV=production
DATABASE_URL=<your PostgreSQL connection string>
JWT_SECRET=<long random secret>
FRONTEND_URL=<exact frontend URL>
```

Optional:
```text
DATABASE_SSL=true
GEMINI_API_KEY=<Gemini key>
GEMINI_MODEL=gemini-3.6-flash
```

## 3. Frontend (Vercel)
Root directory: `frontend`

Build command:
```bash
npm run build
```

Output directory:
```text
dist
```

Environment:
```text
VITE_API_URL=https://YOUR-BACKEND/api
VITE_API_TIMEOUT_MS=125000
```

## 4. CORS
Set backend `FRONTEND_URL` to the exact deployed frontend origin. Multiple origins can be comma-separated.

## 5. Production smoke test
- `GET /api/health`
- Login
- Refresh and verify session restoration
- Dashboard
- Student list and details
- Analytics 7/30
- AI dashboard insight if `GEMINI_API_KEY` is configured
- AI student insight if `GEMINI_API_KEY` is configured

## Environment limitation
The package deliberately does not contain real production credentials. Database, JWT and AI integration cannot be verified against your production accounts until you provide those environment variables.
