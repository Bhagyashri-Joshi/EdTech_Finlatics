import 'dotenv/config';

import { app } from './app.js';

import pool from './db.js';

import {
generateStudentInsight,
getStudentInsightData,
getDashboardInsightData
} from './ai.js';

const expect = (value, message) => {

if (!value) {
throw new Error(message);
}

};

const oldKey =
process.env.GEMINI_API_KEY;

process.env.GEMINI_API_KEY =
'phase5-test-key';

/* =====================================================
GET STUDENTS - POSTGRESQL
===================================================== */

console.log(
'Testing student AI insights...'
);

const studentResult =
await pool.query(
`     SELECT id
    FROM students
    ORDER BY id
    `
);

const rows =
studentResult.rows;

expect(
rows.length > 1,
'Seed data missing. Run npm run seed first.'
);

/* =====================================================
CLASSIFY STUDENTS
===================================================== */

const classified = [];

for (const row of rows) {

const data =
await getStudentInsightData(
row.id
);

classified.push({

 
id:
  row.id,

data
 

});

}

const atRisk =
classified.find(
(item) =>
item.data.status ===
'AT_RISK'
);

const engaged =
classified.find(
(item) =>

 
  item.data.status ===
    'ENGAGED' ||

  item.data.status ===
    'HIGHLY_ENGAGED'
 

);

expect(
atRisk,
'No at-risk student available for Phase 5 test'
);

expect(
engaged,
'No engaged student available for Phase 5 test'
);

/* =====================================================
MOCK GEMINI RESPONSES
===================================================== */

const studentJson = {

summary:
'Grounded student summary.',

keyObservations: [
'Observation one',
'Observation two'
],

riskFactors: [
'Risk grounded in supplied metrics'
],

recommendations: [
'Teacher action one',
'Teacher action two'
]

};

const dashboardJson = {

summary:
'Grounded class summary.',

importantTrend:
'Class trend from supplied metrics.',

recommendedAction:
'Prioritize follow-up with at-risk learners.',

keyObservations: [
'Observation'
]

};

const mockResponse =
(data) => ({

 
ok: true,

json: async () => ({

  candidates: [

    {

      content: {

        parts: [

          {

            text:
              JSON.stringify(data)

          }

        ]

      }

    }

  ]

})
 

});

/* =====================================================
TEST STUDENT INSIGHTS
===================================================== */

console.log(
'Testing student insight generation...'
);

for (
const target of [
atRisk,
engaged
]
) {

const result =
await generateStudentInsight(

 
  target.id,

  {

    fetchImpl:
      async () =>
        mockResponse(
          studentJson
        )

  }

);
 

expect(
result.data.studentName,
'Student metrics were not gathered'
);

expect(
result.data.engagementScore ===
target.data.engagementScore,

 
'Authoritative engagement score changed'
 

);

expect(
result.data.recentActivity.length > 0,

 
'Recent activity missing from AI input'
 

);

expect(
result.data.topicPerformance.length > 0,

 
'Topic performance missing from AI input'
 

);

expect(
result.data.engagementTrend.length === 30,

 
'Engagement trend missing from AI input'
 

);

expect(
result.insight.recommendations.length === 2,

 
'Student recommendations parse failed'
 

);

}

/* =====================================================
DASHBOARD INSIGHT DATA
===================================================== */

console.log(
'Testing dashboard AI insights...'
);

const dash =
await getDashboardInsightData();

expect(
dash.totalStudents ===
rows.length,

'Dashboard AI metrics student count mismatch'
);

expect(
typeof dash.atRiskStudents ===
'number',

'Dashboard at-risk count missing'
);

expect(
dash.engagementTrend.series.length ===
30,

'Dashboard trend missing'
);

/* =====================================================
START TEST SERVER
===================================================== */

console.log(
'Testing AI API endpoints...'
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

const base =
`http://127.0.0.1:${server.address().port}`;

const originalFetch =
global.fetch;

/* =====================================================
API TESTS
===================================================== */

try {

/*
MOCK GEMINI API
*/

global.fetch =
async (
url,
options = {}
) => {

 
  if (
    String(url).includes(
      'generativelanguage.googleapis.com'
    )
  ) {

    const prompt =
      JSON.parse(
        options.body
      )
        .contents[0]
        .parts[0]
        .text;


    return mockResponse(

      prompt.includes(
        'DASHBOARD DATA'
      )

        ? dashboardJson

        : studentJson

    );

  }


  return originalFetch(
    url,
    options
  );

};
 

/*
LOGIN
*/

console.log(
'Testing authentication...'
);

const loginRes =
await originalFetch(

 
  `${base}/api/auth/login`,

  {

    method:
      'POST',

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
login.token,
'Login failed'
);

const headers = {

 
authorization:
  `Bearer ${login.token}`,

'content-type':
  'application/json'
 

};

/*
AT-RISK STUDENT API
*/

console.log(
'Testing at-risk student AI endpoint...'
);

const r1 =
await originalFetch(

 
  `${base}/api/ai/student-insight`,

  {

    method:
      'POST',

    headers,

    body:
      JSON.stringify({

        studentId:
          atRisk.id

      })

  }

);
 

expect(
r1.ok,
'At-risk student AI endpoint failed'
);

const j1 =
await r1.json();

expect(
j1.insight.summary,
'At-risk insight missing'
);

/*
ENGAGED STUDENT API
*/

console.log(
'Testing engaged student AI endpoint...'
);

const r2 =
await originalFetch(

 
  `${base}/api/ai/student-insight`,

  {

    method:
      'POST',

    headers,

    body:
      JSON.stringify({

        studentId:
          engaged.id

      })

  }

);
 

expect(
r2.ok,
'Engaged student AI endpoint failed'
);

/*
DASHBOARD AI API
*/

console.log(
'Testing dashboard AI endpoint...'
);

const rd =
await originalFetch(

 
  `${base}/api/ai/dashboard-insight`,

  {

    method:
      'POST',

    headers

  }

);
 

expect(
rd.ok,
'Dashboard AI endpoint failed'
);

const jd =
await rd.json();

expect(
jd.metrics.atRiskStudents ===
dash.atRiskStudents,

 
'Dashboard AI endpoint metric mismatch'
 

);

/*
GEMINI FAILURE FALLBACK
*/

console.log(
'Testing Gemini fallback...'
);

global.fetch =
async (
url,
options = {}
) => {

 
  if (
    String(url).includes(
      'generativelanguage.googleapis.com'
    )
  ) {

    return {

      ok: false,

      status: 429,

      json:
        async () => ({})

    };

  }


  return originalFetch(
    url,
    options
  );

};
 

const rf =
await originalFetch(

 
  `${base}/api/ai/student-insight`,

  {

    method:
      'POST',

    headers,

    body:
      JSON.stringify({

        studentId:
          atRisk.id

      })

  }

);
 

expect(
rf.ok,
'Retryable Gemini failure should return a fallback insight'
);

const jf =
await rf.json();

expect(
jf.fallback === true,

 
'Retryable Gemini failure should be marked as fallback'
 

);

expect(
jf.fallbackMessage.includes(
'Gemini quota exceeded'
),

 
'Quota fallback message mismatch'
 

);

console.log(

 
JSON.stringify(

  {

    success:
      true,

    phase:
      5,

    studentsTested: [

      {

        id:
          atRisk.id,

        status:
          atRisk.data.status

      },

      {

        id:
          engaged.id,

        status:
          engaged.data.status

      }

    ],

    dashboardAtRisk:
      dash.atRiskStudents,

    geminiFailure:
      'handled'

  },

  null,
  2

)
 

);

}

/* =====================================================
CLEANUP
===================================================== */

finally {

global.fetch =
originalFetch;

server.close();

if (
oldKey === undefined
) {

 
delete process.env.GEMINI_API_KEY;
 

}

else {

 
process.env.GEMINI_API_KEY =
  oldKey;
 

}

await pool.end();

}
