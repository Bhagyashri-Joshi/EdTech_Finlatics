import 'dotenv/config';

import { app } from './app.js';
import { seedDatabase } from './seed.js';
import pool from './db.js';

import {
  calculateEngagementComponents,
  statusFor,
  recencyScore,
  getStudentMetrics
} from './engagement.js';


function expect(
  condition,
  message
) {

  if (!condition) {

    throw new Error(message);

  }

}


console.log(
  'Starting Phase 2 database seed...'
);


await seedDatabase();


console.log(
  'Checking database connection...'
);


const connection =
  await pool.query(
    'SELECT 1 AS ok'
  );


expect(
  connection.rows[0].ok === 1,
  'Database connection failed'
);


const requiredTables = [

  'users',

  'students',

  'assignments',

  'assignment_submissions',

  'quizzes',

  'quiz_attempts',

  'activity_events',

  'topics',

  'student_topic_performance'

];


console.log(
  'Checking required tables...'
);


const tableResult =
  await pool.query(`
    SELECT table_name

    FROM information_schema.tables

    WHERE table_schema = 'public'
  `);


const existingTables =
  tableResult.rows.map(
    (row) => row.table_name
  );


for (
  const table
  of requiredTables
) {

  expect(
    existingTables.includes(table),
    `Missing required table: ${table}`
  );

}


console.log(
  'Checking student data...'
);


const studentCountResult =
  await pool.query(
    'SELECT COUNT(*)::int AS count FROM students'
  );


const studentCount =
  studentCountResult.rows[0].count;


expect(
  studentCount >= 50 &&
  studentCount <= 100,

  `Expected 50-100 students, found ${studentCount}`
);


const requiredActivityTypes = [

  'LOGIN',

  'ASSIGNMENT_SUBMITTED',

  'ASSIGNMENT_COMPLETED',

  'QUIZ_ATTEMPTED',

  'QUIZ_COMPLETED',

  'QUIZ_SCORE'

];


const activityResult =
  await pool.query(`
    SELECT DISTINCT event_type

    FROM activity_events

    ORDER BY event_type
  `);


const activityTypes =
  activityResult.rows.map(
    (row) => row.event_type
  );


for (
  const type
  of requiredActivityTypes
) {

  expect(
    activityTypes.includes(type),
    `Missing required activity type: ${type}`
  );

}


console.log(
  'Checking engagement formula...'
);


const components =
  calculateEngagementComponents({

    loginDays: 20,

    assignedAssignments: 10,

    completedAssignments: 10,

    quizAverage: 100,

    lastActivity:
      new Date().toISOString()

  });


expect(
  components.engagementScore === 100,
  `Wrong engagement formula: ${components.engagementScore}`
);


expect(
  components.loginScore === 100,
  'Login score normalization failed'
);


expect(
  components.assignmentScore === 100,
  'Assignment score normalization failed'
);


expect(
  components.quizScore === 100,
  'Quiz score normalization failed'
);


expect(
  components.recencyScore === 100,
  'Recency score normalization failed'
);


console.log(
  'Checking engagement status mapping...'
);


expect(
  statusFor(80) ===
  'HIGHLY_ENGAGED',

  '80 should map to HIGHLY_ENGAGED'
);


expect(
  statusFor(79) ===
  'ENGAGED',

  '79 should map to ENGAGED'
);


expect(
  statusFor(60) ===
  'ENGAGED',

  '60 should map to ENGAGED'
);


expect(
  statusFor(59) ===
  'NEEDS_ATTENTION',

  '59 should map to NEEDS_ATTENTION'
);


expect(
  statusFor(40) ===
  'NEEDS_ATTENTION',

  '40 should map to NEEDS_ATTENTION'
);


expect(
  statusFor(39) ===
  'AT_RISK',

  '39 should map to AT_RISK'
);


expect(
  statusFor(0) ===
  'AT_RISK',

  '0 should map to AT_RISK'
);


console.log(
  'Checking recency scores...'
);


const dayScores = {

  0: 100,

  1: 90,

  2: 80,

  3: 70,

  4: 50,

  5: 40,

  6: 25,

  7: 0

};


for (
  const [days, score]
  of Object.entries(dayScores)
) {

  const testDate =
    new Date(
      Date.now() -
      Number(days) *
      86400000
    ).toISOString();


  expect(
    recencyScore(testDate) === score,

    `Recency mapping failed for ${days} days`
  );

}


console.log(
  'Checking student engagement metrics...'
);


const studentsResult =
  await pool.query(`
    SELECT id

    FROM students

    ORDER BY id
  `);


const students =
  studentsResult.rows;


const distribution = {

  HIGHLY_ENGAGED: 0,

  ENGAGED: 0,

  NEEDS_ATTENTION: 0,

  AT_RISK: 0

};


for (
  const student
  of students
) {

  const metrics =
    await getStudentMetrics(
      student.id
    );


  const status =
    metrics.status;


  expect(
    status in distribution,
    `Unexpected status ${status}`
  );


  distribution[status] += 1;

}


for (
  const status
  of Object.keys(distribution)
) {

  expect(
    distribution[status] > 0,

    `No students found for ${status}`
  );

}


console.log(
  'Testing API authentication...'
);


const server =
  app.listen(0);


await new Promise(
  (resolve) =>
    server.once(
      'listening',
      resolve
    )
);


const { port } =
  server.address();


const base =
  `http://127.0.0.1:${port}`;


try {

  const unauthorizedRes =
    await fetch(
      `${base}/api/dashboard`
    );


  expect(
    unauthorizedRes.status === 401,
    'Dashboard should require authentication'
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
          JSON.stringify({

            email:
              'teacher@engageai.demo',

            password:
              'Demo@123'

          })

      }
    );


  const login =
    await loginRes.json();


  expect(
    loginRes.ok &&
    login.token,

    `Login failed: ${JSON.stringify(login)}`
  );


  const dashboardRes =
    await fetch(
      `${base}/api/dashboard`,
      {

        headers: {

          authorization:
            `Bearer ${login.token}`

        }

      }
    );


  const dashboard =
    await dashboardRes.json();


  expect(
    dashboardRes.ok,

    `Dashboard failed: ${JSON.stringify(dashboard)}`
  );


  expect(
    typeof dashboard.totalStudents ===
    'number',

    'Dashboard should return student total'
  );


  expect(
    dashboard.totalStudents >= 50,

    'Dashboard student total is too low'
  );


  console.log(
    JSON.stringify(
      {

        success: true,

        phase: 2,

        studentCount,

        distribution,

        dashboard:
          'ok'

      },
      null,
      2
    )
  );


} finally {

  await new Promise(
    (resolve) =>
      server.close(resolve)
  );

  await pool.end();

}