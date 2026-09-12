# EngageAI — Student Engagement Analytics Platform

A full-stack EdTech platform for monitoring student engagement, analyzing learning trends, identifying at-risk students, and generating AI-powered insights.

EngageAI provides teachers and administrators with a centralized dashboard to understand student activity and performance through engagement analytics, visualizations, student profiles, and AI-generated recommendations.

---

## Live Deployment

### Frontend

https://engageai-frontend-gules.vercel.app

### Backend API

https://edtech-finlatics.onrender.com

### API Health Check

https://edtech-finlatics.onrender.com/api/health

---

# Features

## Authentication

- Secure JWT-based authentication
- Teacher/Admin login
- Protected frontend routes
- Authenticated API requests
- Login rate limiting
- Secure password handling
- Session persistence

### Demo Credentials

```text
Email: teacher@engageai.demo
Password: Demo@123
````

---

# Dashboard

The Dashboard provides an overview of student engagement and learning activity.

Features include:

* Total student overview
* Student engagement metrics
* At-risk student identification
* Highly engaged student identification
* Performance summaries
* Live learner monitoring
* Visual engagement data

The dashboard helps teachers quickly identify students who may require additional attention.

---

# Students

The Students section allows teachers and administrators to view student information and engagement data.

Features include:

* Student list
* Student engagement status
* At-risk classification
* Highly engaged classification
* Individual student details
* Engagement scores
* Activity information
* Performance information
* Historical engagement data

Each student includes a 90-point engagement history for detailed student-level analysis.

> Note: The 90-point engagement history is different from global analytics windows.

---

# Analytics

The Analytics page provides visual insights into student engagement and learning performance.

Supported analytics periods:

* 7 Days
* 30 Days

Features include:

* Engagement trends over time
* Performance by topic
* Student engagement metrics
* Retention metrics
* Interactive analytics period selection
* Data visualizations

The default analytics period is:

```text
30 Days
```

The 90-day global analytics option has been removed.

However, 90-point student engagement history remains available for individual student details.

---

# AI Insights

EngageAI includes AI-powered student analysis using Google Gemini.

AI Insights can help identify:

* At-risk students
* Highly engaged students
* Student learning patterns
* Engagement concerns
* Possible improvement areas
* Actionable recommendations

The system also supports graceful fallback behavior if the Gemini API is unavailable or not configured.

---

# Settings

The Settings page provides functional account and application configuration.

## Profile Settings

Users can manage:

* Name
* Email
* Role information
* Profile changes

---

## Account Security

Users can securely update their password using:

* Current password
* New password
* Confirm new password

---

## AI Settings

The Settings page displays:

* Gemini AI availability
* AI Insights status
* API configuration status
* Clear feedback when Gemini is not configured

---

## Application Preferences

Users can configure their preferred analytics period:

* 7 Days
* 30 Days

Preferences can be saved for future use.

---

## Account Information

The Settings page displays:

* Logged-in user information
* Account role
* Account creation information
* Account details

---

# Technology Stack

## Frontend

* React
* Vite
* JavaScript
* React Router
* Recharts
* CSS

---

## Backend

* Node.js
* Express.js
* JWT Authentication
* Google Gemini AI API

---

## Database

* PostgreSQL
* Supabase PostgreSQL

The application is designed to maintain PostgreSQL and Supabase compatibility.

---

## Deployment

### Frontend

* Vercel

### Backend

* Render

### Database

* Supabase PostgreSQL

---

# Project Structure

```text
EdTech_Finlatics/
│
├── backend/
│   │
│   ├── src/
│   │   ├── ai.js
│   │   ├── app.js
│   │   ├── auth.js
│   │   ├── db.js
│   │   ├── engagement.js
│   │   ├── phase1-test.js
│   │   ├── phase2-test.js
│   │   ├── phase4-test.js
│   │   ├── phase5-test.js
│   │   ├── seed.js
│   │   └── server.js
│   │
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   │
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Students.jsx
│   │   │   ├── Analytics.jsx
│   │   │   ├── AIInsights.jsx
│   │   │   └── Settings.jsx
│   │   │
│   │   └── ...
│   │
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── supabase/
│   └── schema.sql
│
├── render.yaml
├── vercel.json
├── package.json
├── DEPLOYMENT.md
└── README.md
```

---

# System Architecture

```text
                    ┌─────────────────────┐
                    │                     │
                    │   React + Vite      │
                    │   Frontend          │
                    │                     │
                    └──────────┬──────────┘
                               │
                               │ HTTPS / REST API
                               │
                    ┌──────────▼──────────┐
                    │                     │
                    │  Node.js + Express  │
                    │      Backend        │
                    │                     │
                    └───────┬───────┬─────┘
                            │       │
                            │       │
                 ┌──────────▼──┐ ┌──▼──────────────┐
                 │             │ │                 │
                 │ PostgreSQL  │ │   Gemini AI     │
                 │  Supabase   │ │                 │
                 │             │ │                 │
                 └─────────────┘ └─────────────────┘
```

---

# Local Installation

## Prerequisites

Make sure the following are installed:

* Node.js
* npm
* Git
* PostgreSQL or Supabase account

Recommended:

```text
Node.js 20+
npm 10+
```

---

# Clone the Repository

```bash
git clone https://github.com/Bhagyashri-Joshi/EdTech_Finlatics.git
```

Move into the project:

```bash
cd EdTech_Finlatics
```

---

# Install Dependencies

## Root Dependencies

```bash
npm install
```

## Backend

```bash
cd backend
npm install
```

## Frontend

Open another terminal:

```bash
cd frontend
npm install
```

---

# Environment Variables

## Backend Environment Variables

Create:

```text
backend/.env
```

Example:

```env
NODE_ENV=development

PORT=4000

DATABASE_URL=your_supabase_postgresql_connection_string

DATABASE_SSL=true

JWT_SECRET=your_secure_jwt_secret

FRONTEND_URL=http://localhost:5173

DB_POOL_MAX=10

DB_IDLE_TIMEOUT_MS=30000

DB_CONNECTION_TIMEOUT_MS=10000

REQUEST_TIMEOUT_MS=125000

HEADERS_TIMEOUT_MS=130000

LOGIN_RATE_WINDOW_MS=900000

LOGIN_RATE_MAX=10

GEMINI_API_KEY=your_gemini_api_key

GEMINI_MODEL=your_gemini_model
```

---

## Frontend Environment Variables

Create:

```text
frontend/.env
```

Add your backend API URL.

For local development:

```env
VITE_API_URL=http://localhost:4000
```

For production:

```env
VITE_API_URL=https://edtech-finlatics.onrender.com
```

---

# Database Setup

The database schema is located at:

```text
supabase/schema.sql
```

## Setup Steps

1. Create a Supabase project.
2. Open the Supabase SQL Editor.
3. Copy the contents of:

```text
supabase/schema.sql
```

4. Run the SQL.
5. Copy the PostgreSQL connection string.
6. Add it to:

```env
DATABASE_URL=
```

---

# Seed Demo Data

Move into the backend directory:

```bash
cd backend
```

Run:

```bash
npm run seed
```

This creates demo data for testing and development.

---

# Run the Backend

From the backend directory:

```bash
npm run dev
```

The backend will run using:

```text
http://localhost:4000
```

Health check:

```text
http://localhost:4000/api/health
```

---

# Run the Frontend

From the frontend directory:

```bash
npm run dev
```

Vite will provide a local development URL, typically:

```text
http://localhost:5173
```

---

# Build the Frontend

From the frontend directory:

```bash
npm run build
```

This creates the production build:

```text
frontend/dist
```

To preview the production build:

```bash
npm run preview
```

---

# Testing

The project includes phase-based validation tests.

## Phase 1

From the backend directory:

```bash
npm run test:phase1
```

---

## Phase 2

```bash
npm run test:phase2
```

---

## Phase 4

```bash
npm run test:phase4
```

Phase 4 validates:

* Engagement history
* Global analytics
* Authentication
* Student details API
* Analytics API

Expected analytics windows:

```json
[7, 30]
```

Student details should continue returning:

```text
90 engagement history points
```

---

## Phase 5

```bash
npm run test:phase5
```

Phase 5 validates:

* Student AI insights
* Student insight generation
* Dashboard AI insights
* AI API endpoints
* Authentication
* At-risk student AI endpoint
* Engaged student AI endpoint
* Dashboard AI endpoint
* Gemini fallback behavior

---

# API Health Check

The backend provides a health endpoint:

```text
GET /api/health
```

Example response:

```json
{
  "success": true,
  "status": "ok",
  "database": "connected"
}
```

This endpoint is used to verify:

* Backend availability
* API status
* Database connectivity

---

# Authentication

The login API accepts user credentials and returns a JWT token.

Example request:

```text
POST /api/auth/login
```

Example body:

```json
{
  "email": "teacher@engageai.demo",
  "password": "Demo@123"
}
```

Example PowerShell request:

```powershell
Invoke-RestMethod `
-Uri "http://localhost:4000/api/auth/login" `
-Method POST `
-ContentType "application/json" `
-Body '{"email":"teacher@engageai.demo","password":"Demo@123"}'
```

Successful authentication returns:

```json
{
  "success": true,
  "token": "JWT_TOKEN"
}
```

---

# Engagement Classification

The system analyzes student activity and engagement data to identify student categories.

Examples include:

## At-Risk Students

Students may be identified as at-risk based on engagement and learning activity.

Possible indicators:

* Low engagement
* Reduced activity
* Poor recent performance
* Inconsistent participation

---

## Highly Engaged Students

Students with strong and consistent engagement may be classified as highly engaged.

Possible indicators:

* High activity
* Consistent engagement
* Strong participation
* Positive learning patterns

---

# Analytics Windows

EngageAI currently supports global analytics for:

| Analytics Period | Supported |
| ---------------- | --------- |
| 7 Days           | Yes       |
| 30 Days          | Yes       |
| 90 Days          | No        |

Important distinction:

The removal of 90-day global analytics does not affect student engagement history.

Individual student details continue to provide:

```text
90 engagement history points
```

---

# AI Integration

EngageAI integrates Google Gemini for AI-powered insights.

The backend uses:

```env
GEMINI_API_KEY
```

and optionally:

```env
GEMINI_MODEL
```

AI features include:

* Student analysis
* At-risk insights
* Highly engaged student insights
* Dashboard-level insights
* Recommendations

---

## Gemini Fallback

If Gemini is unavailable, the system handles failures gracefully.

This ensures:

* Core application functionality remains available
* AI failures do not crash the application
* Insight endpoints can provide fallback behavior
* Missing API configuration is communicated clearly

---

# Security

The application includes several security-focused measures.

## JWT Authentication

Protected routes require valid authentication tokens.

---

## Rate Limiting

Login requests are rate limited.

Example configuration:

```env
LOGIN_RATE_WINDOW_MS=900000
LOGIN_RATE_MAX=10
```

---

## Request Limits

JSON request payload size is limited.

Example:

```text
100kb
```

---

## Database Security

Production database connections support SSL.

```env
DATABASE_SSL=true
```

---

## Environment Variables

Sensitive values are not stored directly in source code.

Examples:

```text
JWT_SECRET
DATABASE_URL
GEMINI_API_KEY
```

These should be configured through environment variables.

---

# Production Deployment

The project uses separate frontend and backend deployments.

---

## Frontend Deployment — Vercel

The frontend is deployed using Vercel.

Configuration:

```text
Framework: Vite
Root Directory: frontend
```

The production frontend URL should be configured in the backend environment variables.

Example:

```env
FRONTEND_URL=https://engageai-frontend-gules.vercel.app
```

Do not include:

```text
/login
```

The value should contain only the frontend origin.

---

## Backend Deployment — Render

The backend is deployed as a Render Web Service.

Recommended production environment:

```env
NODE_ENV=production
```

Example required variables:

```env
DATABASE_URL=...
DATABASE_SSL=true
JWT_SECRET=...
FRONTEND_URL=https://engageai-frontend-gules.vercel.app
GEMINI_API_KEY=...
```

---

# Production Environment Variables

## Render Backend

```env
NODE_ENV=production

DATABASE_URL=your_database_url

DATABASE_SSL=true

JWT_SECRET=your_secure_secret

FRONTEND_URL=https://engageai-frontend-gules.vercel.app

DB_POOL_MAX=10

DB_IDLE_TIMEOUT_MS=30000

DB_CONNECTION_TIMEOUT_MS=10000

REQUEST_TIMEOUT_MS=125000

HEADERS_TIMEOUT_MS=130000

LOGIN_RATE_WINDOW_MS=900000

LOGIN_RATE_MAX=10

GEMINI_API_KEY=your_api_key

GEMINI_MODEL=your_model
```

---

# Deployment Checklist

Before deploying, verify the following.

## Backend

* [x] Backend starts successfully
* [x] Database connection works
* [x] Health endpoint responds
* [x] JWT authentication works
* [x] CORS allows the frontend
* [x] Environment variables are configured
* [x] Phase tests pass

---

## Frontend

* [x] Frontend builds successfully
* [x] Production API URL is configured
* [x] Login works
* [x] Protected routes work
* [x] Dashboard loads
* [x] Students page loads
* [x] Analytics page loads
* [x] AI Insights page loads
* [x] Settings page works

---

# Troubleshooting

## Backend Cannot Connect

Check:

```env
DATABASE_URL
```

Make sure:

* The connection string is valid
* The database is accessible
* SSL settings are correct
* Supabase credentials are valid

---

## Login Failed

Check:

* Backend is running
* Correct API URL is configured
* Database is connected
* Demo user exists
* JWT_SECRET is configured

Test the backend health endpoint:

```text
/api/health
```

---

## Frontend Cannot Reach Backend

Check:

```env
VITE_API_URL
```

For production:

```env
VITE_API_URL=https://edtech-finlatics.onrender.com
```

Also verify:

```env
FRONTEND_URL=https://engageai-frontend-gules.vercel.app
```

in Render.

---

## AI Insights Unavailable

Check:

```env
GEMINI_API_KEY
```

Verify that:

* The API key is configured
* The key is valid
* The selected Gemini model is available
* The backend has been redeployed after updating environment variables

The application should handle Gemini failures gracefully.

---

## Render Backend Takes Time to Respond

Render free instances may spin down during inactivity.

The first request after inactivity may take longer while the service starts again.

This is normal for a free instance.

---

# Development Commands

## Backend

```bash
cd backend
npm install
npm run dev
```

---

## Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Database Seed

```bash
cd backend
npm run seed
```

---

## Run All Available Phase Tests

```bash
cd backend

npm run test:phase1
npm run test:phase2
npm run test:phase4
npm run test:phase5
```

---

## Build Frontend

```bash
cd frontend
npm run build
```

---

# Future Improvements

Possible future enhancements include:

* Student management dashboard improvements
* Advanced analytics filters
* Export analytics reports
* PDF report generation
* CSV export
* Email notifications
* Student comparison tools
* Advanced AI recommendations
* Class and course management
* Multi-role authentication
* Real-time notifications
* Improved mobile responsiveness
* Activity monitoring improvements
* Teacher collaboration features

---

# Project Goals

EngageAI was developed to demonstrate a production-oriented full-stack EdTech application with:

* Modern frontend development
* REST API architecture
* JWT authentication
* PostgreSQL integration
* Supabase compatibility
* Data analytics
* AI integration
* Production deployment
* Environment-based configuration
* Automated phase validation

---

# Production Status

## Current Implementation

| Feature                  | Status      |
| ------------------------ | ----------- |
| Authentication           | Implemented |
| Dashboard                | Implemented |
| Student Management       | Implemented |
| Student Details          | Implemented |
| Engagement Analysis      | Implemented |
| 90-Point Student History | Implemented |
| 7-Day Analytics          | Implemented |
| 30-Day Analytics         | Implemented |
| AI Insights              | Implemented |
| Gemini Fallback          | Implemented |
| Settings                 | Implemented |
| PostgreSQL               | Implemented |
| Supabase                 | Compatible  |
| Vercel Deployment        | Deployed    |
| Render Deployment        | Deployed    |

---

# Acknowledgements

Technologies and platforms used in this project:

* React
* Vite
* Node.js
* Express.js
* PostgreSQL
* Supabase
* Google Gemini
* Recharts
* Vercel
* Render

---

# Screens and Modules

```text
Login
  │
  ▼
Dashboard
  │
  ├── Students
  │     └── Student Details
  │
  ├── Analytics
  │     ├── 7 Days
  │     └── 30 Days
  │
  ├── AI Insights
  │     ├── At-Risk Analysis
  │     ├── Engaged Student Analysis
  │     └── Dashboard Insights
  │
  └── Settings
        ├── Profile
        ├── Security
        ├── AI Settings
        ├── Preferences
        └── Account Information
```

---

# Author

**Bhagyashri Joshi**

Project Repository:

[https://github.com/Bhagyashri-Joshi/EdTech_Finlatics](https://github.com/Bhagyashri-Joshi/EdTech_Finlatics)

---

# License

This project was developed for educational and academic purposes.

---
