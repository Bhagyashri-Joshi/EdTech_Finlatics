import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import pool from './db.js';
import { requireAuth, signToken } from './auth.js';
import { getStudentMetrics, getEngagementHistory, getGlobalAnalytics } from './engagement.js';
import { generateDashboardInsight, generateStudentInsight } from './ai.js';
import settingsRouter from './settings.js';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required');

export const app = express();
app.disable('x-powered-by');

const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((x) => x.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (isProduction) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) return callback(null, true);
    return callback(null, false);
  },
  credentials: false
}));

app.use('/api/settings', settingsRouter);
app.use(express.json({ limit: '100kb' }));

const loginAttempts = new Map();
const LOGIN_WINDOW_MS = Number(process.env.LOGIN_RATE_WINDOW_MS || 15 * 60 * 1000);
const LOGIN_MAX = Number(process.env.LOGIN_RATE_MAX || 10);

function loginRateLimit(req, res, next) {
  const key = `${req.ip}:${String(req.body?.email || '').toLowerCase()}`;
  const now = Date.now();
  const entry = loginAttempts.get(key) || { count: 0, resetAt: now + LOGIN_WINDOW_MS };
  if (entry.resetAt <= now) {
    entry.count = 0;
    entry.resetAt = now + LOGIN_WINDOW_MS;
  }
  entry.count += 1;
  loginAttempts.set(key, entry);
  if (entry.count > LOGIN_MAX) {
    res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
    return res.status(429).json({ success: false, message: 'Too many login attempts. Please try again later.' });
  }
  return next();
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of loginAttempts) if (entry.resetAt <= now) loginAttempts.delete(key);
}, Math.min(LOGIN_WINDOW_MS, 60000)).unref();

app.get('/api/health', async (_req, res, next) => {
  try {
    const result = await pool.query('SELECT NOW() AS now');
    res.json({ success: true, status: 'ok', database: 'connected', timestamp: result.rows[0].now });
  } catch (error) { next(error); }
});

app.post('/api/auth/login', loginRateLimit, async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required' });

    const result = await pool.query(
      'SELECT id, name, email, role, password_hash FROM users WHERE email = $1 LIMIT 1',
      [email]
    );
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    res.json({ success: true, token: signToken(safeUser), user: safeUser });
  } catch (error) { next(error); }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ success: true, user: req.user });
});

app.get('/api/dashboard', requireAuth, async (_req, res, next) => {
  try {
    const studentResult = await pool.query('SELECT id, first_name, last_name FROM students ORDER BY id');
    const students = await Promise.all(studentResult.rows.map(async (student) => ({ ...student, ...(await getStudentMetrics(student.id)) })));
    const total = students.length;
    const active = students.filter((student) => student.lastActive && Date.now() - new Date(student.lastActive).getTime() < 7 * 86400000).length;
    const atRisk = students.filter((student) => student.atRisk).length;
    const avgEngagement = total ? +(students.reduce((sum, student) => sum + student.engagementScore, 0) / total).toFixed(1) : 0;
    const avgQuizScore = total ? +(students.reduce((sum, student) => sum + student.quizAverage, 0) / total).toFixed(1) : 0;
    const activityResult = await pool.query(`
      SELECT e.id, e.event_type, e.occurred_at, s.first_name, s.last_name
      FROM activity_events e JOIN students s ON s.id = e.student_id
      ORDER BY e.occurred_at DESC LIMIT 10
    `);
    res.json({ success: true, totalStudents: total, activeStudents: active, atRiskStudents: atRisk, averageEngagement: avgEngagement, averageQuizScore: avgQuizScore, recentActivity: activityResult.rows });
  } catch (error) { next(error); }
});

app.get('/api/students', requireAuth, async (_req, res, next) => {
  try {
    const result = await pool.query('SELECT id, first_name, last_name, email, cohort FROM students ORDER BY first_name, last_name');
    const students = await Promise.all(result.rows.map(async (student) => {
      const metrics = await getStudentMetrics(student.id);
      return { id: student.id, name: `${student.first_name} ${student.last_name}`, engagementScore: metrics.engagementScore, status: metrics.status, lastActive: metrics.lastActive, assignmentCompletion: metrics.assignmentCompletion, quizScore: metrics.quizAverage };
    }));
    res.json({ success: true, students });
  } catch (error) { next(error); }
});

app.get('/api/students/:id', requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ success: false, message: 'Invalid student ID' });
    const studentResult = await pool.query('SELECT id, first_name, last_name, email, cohort FROM students WHERE id = $1', [id]);
    const student = studentResult.rows[0];
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    const metrics = await getStudentMetrics(id);
    const [activityResult, topicResult, engagementHistory] = await Promise.all([
      pool.query('SELECT id, event_type, metadata, occurred_at FROM activity_events WHERE student_id = $1 ORDER BY occurred_at DESC LIMIT 20', [id]),
      pool.query('SELECT t.id, t.name, stp.score, stp.updated_at FROM student_topic_performance stp JOIN topics t ON t.id = stp.topic_id WHERE stp.student_id = $1 ORDER BY t.name', [id]),
      getEngagementHistory(id, 90)
    ]);
    res.json({ success: true, student: { id: student.id, name: `${student.first_name} ${student.last_name}`, email: student.email, cohort: student.cohort }, engagement: { score: metrics.engagementScore, status: metrics.status, components: { loginScore: metrics.loginScore, assignmentScore: metrics.assignmentScore, quizScore: metrics.quizScore, recencyScore: metrics.recencyScore }, atRisk: metrics.atRisk, lastActive: metrics.lastActive }, loginMetrics: { activeLoginDaysLast30: metrics.loginDays, expectedLoginDays: 20 }, assignmentMetrics: { assigned: metrics.assignedAssignments, completed: metrics.completedAssignments, completion: metrics.assignmentCompletion }, quizMetrics: { attempts: metrics.quizAttempts, completed: metrics.quizzesCompleted, averageScore: metrics.quizAverage }, recentActivity: activityResult.rows.map((event) => ({ ...event, metadata: event.metadata || {} })), engagementHistory, topicPerformance: topicResult.rows });
  } catch (error) { next(error); }
});

app.get('/api/analytics', requireAuth, async (req, res, next) => {
  try {
    const days = Number(req.query.days) || 30;
    const analytics = await getGlobalAnalytics(days);
    res.json({ success: true, ...analytics });
  } catch (error) { next(error); }
});

app.post('/api/ai/dashboard-insight', requireAuth, async (_req, res, next) => {
  try {
    const result = await generateDashboardInsight();
    res.json({ success: true, metrics: result.data, insight: result.insight, fallback: result.fallback, fallbackMessage: result.fallbackMessage });
  } catch (error) { next(error); }
});

app.post('/api/ai/student-insight', requireAuth, async (req, res, next) => {
  try {
    const studentId = Number(req.body?.studentId);
    if (!Number.isInteger(studentId) || studentId <= 0) return res.status(400).json({ success: false, message: 'A valid studentId is required' });
    const result = await generateStudentInsight(studentId);
    res.json({ success: true, studentId, insight: result.insight, fallback: result.fallback, fallbackMessage: result.fallbackMessage });
  } catch (error) { next(error); }
});

app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

app.use((err, _req, res, _next) => {
  const status = Number(err.statusCode) || 500;
  if (status >= 500) console.error(err);
  const message = status >= 500 && isProduction ? 'Internal server error' : (err.message || 'Internal server error');
  res.status(status).json({ success: false, message });
});
