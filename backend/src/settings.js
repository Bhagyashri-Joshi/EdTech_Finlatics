import express from 'express';
import bcrypt from 'bcrypt';
import pool from './db.js';
import { requireAuth } from './auth.js';

const router = express.Router();

const ALLOWED_ANALYTICS_DAYS = [7, 30];

function safeUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    createdAt: row.created_at
  };
}

/* =====================================================
GET COMPLETE SETTINGS
===================================================== */

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const userResult = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        role,
        created_at
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [req.user.sub]
    );

    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const preferenceResult = await pool.query(
      `
      SELECT
        default_analytics_days
      FROM user_preferences
      WHERE user_id = $1
      LIMIT 1
      `,
      [user.id]
    );

    const preferences = preferenceResult.rows[0] || {
      default_analytics_days: 30
    };

    const geminiConfigured =
      Boolean(process.env.GEMINI_API_KEY) &&
      process.env.GEMINI_API_KEY !== 'your_gemini_api_key';

    res.json({
      success: true,

      profile: safeUser(user),

      preferences: {
        defaultAnalyticsDays:
          Number(preferences.default_analytics_days) || 30
      },

      ai: {
        geminiConfigured,
        aiInsightsAvailable: geminiConfigured,
        status: geminiConfigured
          ? 'Configured'
          : 'Not configured'
      },

      account: {
        createdAt: user.created_at,
        role: user.role,
        userId: user.id
      }
    });
  } catch (error) {
    next(error);
  }
});

/* =====================================================
UPDATE PROFILE
===================================================== */

router.put('/profile', requireAuth, async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '')
      .trim()
      .toLowerCase();

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    const existingResult = await pool.query(
      `
      SELECT id
      FROM users
      WHERE email = $1
        AND id <> $2
      LIMIT 1
      `,
      [email, req.user.sub]
    );

    if (existingResult.rows[0]) {
      return res.status(409).json({
        success: false,
        message: 'This email address is already in use'
      });
    }

    const updateResult = await pool.query(
      `
      UPDATE users
      SET
        name = $1,
        email = $2
      WHERE id = $3
      RETURNING
        id,
        name,
        email,
        role,
        created_at
      `,
      [
        name,
        email,
        req.user.sub
      ]
    );

    const user = updateResult.rows[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: safeUser(user)
    });
  } catch (error) {
    next(error);
  }
});

/* =====================================================
CHANGE PASSWORD
===================================================== */

router.put('/password', requireAuth, async (req, res, next) => {
  try {
    const currentPassword =
      String(req.body?.currentPassword || '');

    const newPassword =
      String(req.body?.newPassword || '');

    const confirmPassword =
      String(req.body?.confirmPassword || '');

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message: 'All password fields are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          'New password must be at least 8 characters long'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match'
      });
    }

    if (newPassword === currentPassword) {
      return res.status(400).json({
        success: false,
        message:
          'New password must be different from the current password'
      });
    }

    const userResult = await pool.query(
      `
      SELECT
        id,
        password_hash
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [req.user.sub]
    );

    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const validPassword =
      await bcrypt.compare(
        currentPassword,
        user.password_hash
      );

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    const passwordHash =
      await bcrypt.hash(
        newPassword,
        12
      );

    await pool.query(
      `
      UPDATE users
      SET password_hash = $1
      WHERE id = $2
      `,
      [
        passwordHash,
        user.id
      ]
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
});

/* =====================================================
UPDATE PREFERENCES
===================================================== */

router.put('/preferences', requireAuth, async (req, res, next) => {
  try {
    const defaultAnalyticsDays =
      Number(req.body?.defaultAnalyticsDays);

    if (
      !ALLOWED_ANALYTICS_DAYS.includes(
        defaultAnalyticsDays
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Default analytics period must be 7 or 30 days'
      });
    }

    const result = await pool.query(
      `
      INSERT INTO user_preferences (
        user_id,
        default_analytics_days,
        updated_at
      )
      VALUES (
        $1,
        $2,
        now()
      )

      ON CONFLICT (user_id)

      DO UPDATE SET
        default_analytics_days =
          EXCLUDED.default_analytics_days,
        updated_at =
          now()

      RETURNING
        default_analytics_days
      `,
      [
        req.user.sub,
        defaultAnalyticsDays
      ]
    );

    res.json({
      success: true,
      message: 'Preferences saved successfully',

      preferences: {
        defaultAnalyticsDays:
          Number(
            result.rows[0]
              .default_analytics_days
          )
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;