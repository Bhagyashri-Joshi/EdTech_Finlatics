import pool from './db.js';

import {
getStudentMetrics,
getEngagementHistory,
getGlobalAnalytics
} from './engagement.js';

const GEMINI_ENDPOINT =
'https://generativelanguage.googleapis.com/v1beta/models';

const DEFAULT_MODEL =
'gemini-3.6-flash';

/* =====================================================
JSON UTILITIES
===================================================== */

function cleanJsonText(text = '') {

const cleaned =
String(text)
.trim()
.replace(
/^`(?:json)?\s*/i,
        ''
      )
      .replace(
        /\s*`$/i,
''
);

try {

  
return JSON.parse(
  cleaned
);
  

}

catch {}

const start =
cleaned.indexOf('{');

const end =
cleaned.lastIndexOf('}');

if (
start >= 0 &&
end > start
) {

  
return JSON.parse(
  cleaned.slice(
    start,
    end + 1
  )
);
  

}

throw new Error(
'Gemini returned an unreadable response'
);

}

/* =====================================================
NORMALIZATION
===================================================== */

function normalizeList(
value,
max = 4
) {

if (!Array.isArray(value)) {
return [];
}

return value
.map(
(item) =>
String(item).trim()
)
.filter(Boolean)
.slice(0, max);

}

function normalizeStudentInsight(value) {

return {

  
summary:
  String(
    value?.summary || ''
  ).trim(),

keyObservations:
  normalizeList(
    value?.keyObservations
  ),

riskFactors:
  normalizeList(
    value?.riskFactors,
    3
  ),

recommendations:
  normalizeList(
    value?.recommendations,
    3
  )
  

};

}

function normalizeDashboardInsight(value) {

return {

  
summary:
  String(
    value?.summary || ''
  ).trim(),

importantTrend:
  String(
    value?.importantTrend || ''
  ).trim(),

recommendedAction:
  String(
    value?.recommendedAction || ''
  ).trim(),

keyObservations:
  normalizeList(
    value?.keyObservations,
    3
  )
  

};

}

/* =====================================================
GEMINI API
===================================================== */

export async function callGemini(
prompt,
{
fetchImpl = fetch
} = {}
) {

const apiKey =
process.env.GEMINI_API_KEY;

if (!apiKey) {

  
const error =
  new Error(
    'Gemini API is not configured'
  );


error.statusCode =
  503;


throw error;
  

}

const model =
process.env.GEMINI_MODEL ||
DEFAULT_MODEL;

let response;

try {

  
response =
  await fetchImpl(

    `${GEMINI_ENDPOINT}/${encodeURIComponent(model)}:generateContent`,

    {

      method:
        'POST',

      headers: {

        'Content-Type':
          'application/json',

        'x-goog-api-key':
          apiKey

      },

      body:
        JSON.stringify({

          contents: [

            {

              role:
                'user',

              parts: [

                {

                  text:
                    prompt

                }

              ]

            }

          ],

          generationConfig: {

            temperature:
              0.2,

            maxOutputTokens:
              2048

          }

        }),

      signal:
        AbortSignal.timeout(
          30000
        )

    }

  );
  

}

catch (cause) {

  
const error =
  new Error(
    'Could not reach Gemini'
  );


error.statusCode =
  502;


error.retryable =
  true;


error.cause =
  cause;


throw error;
  

}

if (!response.ok) {

  
let providerMessage =
  '';


try {

  const cloned =
    response.clone
      ? response.clone()
      : response;


  const body =
    await cloned.json();


  providerMessage =
    body?.error?.message ||
    '';

}

catch {}


const quota =
  response.status === 429;


const error =
  new Error(

    quota

      ? `Gemini quota exceeded. ${
          providerMessage ||
          'Please retry later or check your Gemini limits.'
        }`

      : 'Gemini request failed'

  );


error.statusCode =
  quota
    ? 429
    : 502;


error.retryable =
  quota ||
  response.status >= 500;


throw error;
  

}

const payload =
await response.json();

const text =
payload
?.candidates?.[0]
?.content?.parts
?.map(
(part) =>
part.text || ''
)
.join('')
.trim();

if (!text) {

  
const error =
  new Error(
    'Gemini returned no usable insight'
  );


error.statusCode =
  502;


throw error;
  

}

return cleanJsonText(
text
);

}

/* =====================================================
FALLBACK INSIGHTS
===================================================== */

function fallbackDashboardInsight(
data
) {

const change =
data.engagementTrend.changePoints;

const direction =

  
change > 0

  ? 'increased'

  : change < 0

    ? 'decreased'

    : 'held steady';
  

return {

  
summary:
  `The class has ${data.totalStudents} students with ${data.atRiskStudents} at-risk learners and an average engagement score of ${data.averageEngagement}.`,

importantTrend:
  `Average engagement ${direction} by ${Math.abs(change)} points across the selected trend period.`,

recommendedAction:
  `Prioritize teacher check-ins with the ${data.atRiskStudents} at-risk students and review their recent activity.`,

keyObservations: [

  `${data.activeStudents} of ${data.totalStudents} students were active recently.`,

  `Average quiz score is ${data.averageQuizScore}.`

]
  

};

}

function fallbackStudentInsight(
data
) {

const risks =
[];

if (
data.status ===
'AT_RISK'
) {

  
risks.push(
  'The student is currently classified as at risk by the backend engagement rules.'
);
  

}

if (
data.assignmentCompletion < 50
) {

  
risks.push(
  `Assignment completion is ${data.assignmentCompletion}%.`
);
  

}

if (
data.loginFrequency.activeDaysLast30 < 10
) {

  
risks.push(
  `The student was active on ${data.loginFrequency.activeDaysLast30} of the expected ${data.loginFrequency.expectedActiveDays} days.`
);
  

}

return {

  
summary:
  `${data.studentName} has an engagement score of ${data.engagementScore} and is classified as ${data.status.replaceAll('_', ' ').toLowerCase()}.`,

keyObservations: [

  `Assignment completion is ${data.assignmentCompletion}%.`,

  `Quiz average is ${data.quizAverage}%.`,

  `The student was active on ${data.loginFrequency.activeDaysLast30} of the last 30 days.`

],

riskFactors:
  risks,

recommendations: [

  'Schedule a targeted teacher check-in based on the lowest current metric.',

  'Review recent activity and agree on one short-term learning goal.'

]
  

};

}

function canUseFallback(
error
) {

return (
error?.retryable ===
true
);

}

/* =====================================================
STUDENT INSIGHT DATA
POSTGRESQL VERSION
===================================================== */

export async function getStudentInsightData(
studentId
) {

/*
STUDENT
*/

const studentResult =
await pool.query(

  
  `
  SELECT
    id,
    first_name,
    last_name,
    email,
    cohort

  FROM students

  WHERE id = $1
  `,

  [
    studentId
  ]

);
  

const student =
studentResult.rows[0];

if (!student) {
return null;
}

/*
METRICS
*/

const metrics =
await getStudentMetrics(
studentId
);

/*
RECENT ACTIVITY
*/

const activityResult =
await pool.query(

  
  `
  SELECT
    event_type,
    metadata,
    occurred_at

  FROM activity_events

  WHERE student_id = $1

  ORDER BY
    occurred_at DESC

  LIMIT 12
  `,

  [
    studentId
  ]

);
  

const recentActivity =
activityResult.rows.map(
(event) => ({

  
    eventType:
      event.event_type,

    occurredAt:
      event.occurred_at,

    metadata:
      event.metadata || {}

  })
);
  

/*
TOPIC PERFORMANCE
*/

const topicResult =
await pool.query(

  
  `
  SELECT

    t.name,

    stp.score

  FROM student_topic_performance stp

  JOIN topics t
    ON t.id = stp.topic_id

  WHERE
    stp.student_id = $1

  ORDER BY
    t.name
  `,

  [
    studentId
  ]

);
  

const topicPerformance =
topicResult.rows.map(
(row) => ({

  
    name:
      row.name,

    score:
      Number(row.score)

  })
);
  

/*
30 DAY TREND
*/

const engagementTrend =
await getEngagementHistory(
studentId,
30
);

return {

  
studentName:
  `${student.first_name} ${student.last_name}`,

engagementScore:
  metrics.engagementScore,

status:
  metrics.status,

loginFrequency: {

  activeDaysLast30:
    metrics.loginDays,

  expectedActiveDays:
    20

},

lastActiveDate:
  metrics.lastActive,

assignmentCompletion:
  metrics.assignmentCompletion,

quizAverage:
  metrics.quizAverage,

recentActivity,

topicPerformance,

engagementTrend
  

};

}

/* =====================================================
DASHBOARD INSIGHT DATA
POSTGRESQL VERSION
===================================================== */

export async function getDashboardInsightData() {

/*
GET ALL STUDENTS
*/

const studentResult =
await pool.query(

  
  `
  SELECT id
  FROM students
  ORDER BY id
  `

);
  

const studentRows =
studentResult.rows;

/*
GET METRICS SEQUENTIALLY

  
This avoids exhausting the PostgreSQL
connection pool.
  

*/

const students =
[];

for (
const student of studentRows
) {

  
const metrics =
  await getStudentMetrics(
    student.id
  );


students.push(
  metrics
);
  

}

const totalStudents =
students.length;

/*
ACTIVE STUDENTS
*/

const activeStudents =
students.filter(

  
  (student) => {

    if (!student.lastActive) {
      return false;
    }


    const age =
      Date.now() -
      new Date(
        student.lastActive
      ).getTime();


    return (
      age <
      7 * 86400000
    );

  }

).length;
  

/*
AT-RISK
*/

const atRiskStudents =
students.filter(

  
  (student) =>
    student.atRisk

).length;
  

/*
AVERAGE ENGAGEMENT
*/

const averageEngagement =

  
totalStudents

  ? +(

      students.reduce(

        (total, student) =>
          total +
          student.engagementScore,

        0

      )

      /

      totalStudents

    ).toFixed(1)

  : 0;
  

/*
AVERAGE QUIZ SCORE
*/

const averageQuizScore =

  
totalStudents

  ? +(

      students.reduce(

        (total, student) =>
          total +
          student.quizAverage,

        0

      )

      /

      totalStudents

    ).toFixed(1)

  : 0;
  

/*
STATUS COUNTS
*/

const statusCounts =
students.reduce(

  
  (
    result,
    student
  ) => {

    result[
      student.status
    ] =

      (
        result[
          student.status
        ] ||
        0
      ) + 1;


    return result;

  },

  {}

);
  

/*
GLOBAL ANALYTICS
*/

const analytics =
await getGlobalAnalytics(
30
);

const trend =
analytics.engagementOverTime;

const first =
trend[0]
?.engagement ??
0;

const last =
trend.at(-1)
?.engagement ??
0;

return {

  
totalStudents,

activeStudents,

atRiskStudents,

averageEngagement,

averageQuizScore,

statusCounts,

engagementTrend: {

  firstDayAverage:
    first,

  latestAverage:
    last,

  changePoints:
    +(
      last - first
    ).toFixed(1),

  series:
    trend

},

topicPerformance:
  analytics.topicPerformance
  

};

}

/* =====================================================
GENERATE STUDENT INSIGHT
===================================================== */

export async function generateStudentInsight(
studentId,
options = {}
) {

const data =
await getStudentInsightData(
studentId
);

if (!data) {

  
const error =
  new Error(
    'Student not found'
  );


error.statusCode =
  404;


throw error;
  

}

const prompt =
`You are an educational analytics assistant.

Analyze ONLY the provided student performance data.

Never invent facts.

Never diagnose the student.

Do not claim information that is not in the provided data.

Recommendations must be practical for a teacher.

Keep the response concise.

Do not calculate or replace the engagement score; the backend engagement score is authoritative.

Return ONLY valid JSON with this exact shape:

{
"summary": "short summary",
"keyObservations": [
"observation"
],
"riskFactors": [
"risk factor"
],
"recommendations": [
"actionable recommendation"
]
}

Use 2-4 key observations, 0-3 risk factors, and 2-3 recommendations.

If the data does not show a risk factor, return an empty riskFactors array.

STUDENT DATA:

${JSON.stringify(data)}`;

try {

  
const raw =
  await callGemini(
    prompt,
    options
  );


return {

  data,

  insight:
    normalizeStudentInsight(
      raw
    ),

  fallback:
    false

};
  

}

catch (error) {

  
if (
  !canUseFallback(error)
) {

  throw error;

}


return {

  data,

  insight:
    fallbackStudentInsight(
      data
    ),

  fallback:
    true,

  fallbackMessage:
    error.message

};
  

}

}

/* =====================================================
GENERATE DASHBOARD INSIGHT
===================================================== */

export async function generateDashboardInsight(
options = {}
) {

const data =
await getDashboardInsightData();

const prompt =
`You are an educational analytics assistant.

Analyze ONLY the provided class engagement metrics.

Never invent facts.

Do not diagnose students.

Keep the response concise and practical for a teacher.

Do not calculate or replace engagement scores; backend metrics are authoritative.

Return ONLY valid JSON with this exact shape:

{
"summary": "overall engagement summary",
"importantTrend": "one important trend grounded in the data",
"recommendedAction": "one practical teacher action",
"keyObservations": [
"observation"
]
}

Use at most 3 key observations.

DASHBOARD DATA:

${JSON.stringify(data)}`;

try {

  
const raw =
  await callGemini(
    prompt,
    options
  );


return {

  data,

  insight:
    normalizeDashboardInsight(
      raw
    ),

  fallback:
    false

};
  

}

catch (error) {

  
if (
  !canUseFallback(error)
) {

  throw error;

}


return {

  data,

  insight:
    fallbackDashboardInsight(
      data
    ),

  fallback:
    true,

  fallbackMessage:
    error.message

};
  

}

}
