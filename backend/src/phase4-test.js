import 'dotenv/config';

import { app } from './app.js';
import pool from './db.js';

import {
getEngagementHistory,
getGlobalAnalytics
} from './engagement.js';

const expect = (value, message) => {

if (!value) {
throw new Error(message);
}

};

/* =====================================================
GET TEST STUDENT FROM POSTGRESQL
===================================================== */

const studentResult =
await pool.query(`     SELECT id
    FROM students
    ORDER BY id
    LIMIT 1
  `);

const student =
studentResult.rows[0];

expect(
student,
'Seed data missing. Run npm run seed first.'
);

/* =====================================================
TEST ENGAGEMENT HISTORY
===================================================== */

console.log(
'Testing engagement history...'
);

const history =
await getEngagementHistory(
student.id,
30
);

expect(
history.length === 30,
'Student engagement history should contain 30 points'
);

expect(
history.every(
point =>
typeof point.engagementScore === 'number' &&
point.engagementScore >= 0 &&
point.engagementScore <= 100
),
'Invalid engagement history score'
);

/* =====================================================
TEST GLOBAL ANALYTICS
===================================================== */

console.log(
'Testing global analytics...'
);

for (
const days of [7, 30]
) {

const analytics =
await getGlobalAnalytics(days);

expect(
analytics.days === days,
`Analytics days mismatch: ${days}`
);

expect(
analytics.engagementOverTime.length === days,
`Expected ${days} engagement points`
);

expect(
analytics.topicPerformance.length > 0,
'Topic performance missing'
);

expect(
analytics.retention.rate >= 0 &&
analytics.retention.rate <= 100,
'Retention outside 0-100'
);

}

/* =====================================================
START API SERVER
===================================================== */

const server =
app.listen(0);

await new Promise(
resolve =>
server.once(
'listening',
resolve
)
);

const base =
`http://127.0.0.1:${server.address().port}`;

try {

/* ===================================================
LOGIN
=================================================== */

console.log(
'Testing authentication...'
);

const loginRes =
await fetch(
`${base}/api/auth/login`,
{

    method: 'POST',

    headers: {
      'content-type':
        'application/json'
    },

    body:
      JSON.stringify(
        {
          email:
            'teacher@engageai.demo',

          password:
            'Demo@123'
        }
      )

  }
);


const login =
await loginRes.json();

expect(
loginRes.ok &&
login.token,
'Login failed'
);

const headers = {
authorization:
`Bearer ${login.token}`
};

/* ===================================================
STUDENT DETAILS API
=================================================== */

console.log(
'Testing student details API...'
);

const detailRes =
await fetch(
`${base}/api/students/${student.id}`,
{
headers
}
);

const detail =
await detailRes.json();

expect(
detailRes.ok,
'Student details API failed'
);

expect(
detail.engagementHistory.length === 90,
'Student details should expose 90-day history'
);

expect(
detail.topicPerformance.length > 0,
'Student topic performance missing'
);

expect(
detail.recentActivity.length > 0,
'Recent activity missing'
);

/* ===================================================
ANALYTICS API
=================================================== */

console.log(
'Testing analytics API...'
);

for (
const days of [7, 30]
) {

const response =
  await fetch(
    `${base}/api/analytics?days=${days}`,
    {
      headers
    }
  );


const analytics =
  await response.json();


expect(
  response.ok,
  `Analytics API ${days} failed`
);


expect(
  analytics.engagementOverTime.length === days,
  `Analytics API ${days} returned wrong number of points`
);


}

console.log(
JSON.stringify(
{
success: true,


    phase: 4,

    studentId:
      student.id,

    historyPoints:
      detail.engagementHistory.length,

    analyticsWindows:
      [7, 30]
  },

  null,

  2
)

);

} finally {

await new Promise(
resolve =>
server.close(resolve)
);

}
