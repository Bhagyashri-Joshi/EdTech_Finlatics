# EngageAI — Production-ready Phase 5 baseline

Full-stack EdTech student engagement dashboard with JWT authentication, PostgreSQL, analytics, student details and Gemini-powered insights.

## Important
This package intentionally contains no real `.env` files or credentials.

Copy the examples:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Then provide your own values. The backend requires `DATABASE_URL` and `JWT_SECRET`.

## Local setup
### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Production work included
- Environment validation for required secrets
- PostgreSQL pool configuration and timeouts
- Security response headers
- CORS allowlist
- Login rate limiting
- JWT expiration configuration
- Session validation through `/api/auth/me`
- Graceful server shutdown
- Standard API success/error envelope where updated
- Database query indexes
- Updated Render/Vercel deployment documentation

## Manual production checklist
1. Configure `DATABASE_URL`.
2. Run `supabase/schema.sql`.
3. Configure a strong `JWT_SECRET`.
4. Set exact `FRONTEND_URL`.
5. Set `VITE_API_URL`.
6. Deploy backend and verify `/api/health`.
7. Deploy frontend.
8. Test login, refresh, dashboard, students, analytics and AI.
9. If AI is required, configure `GEMINI_API_KEY`.

See `DEPLOYMENT.md` for details.
