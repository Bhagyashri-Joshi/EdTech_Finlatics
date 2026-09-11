import pool from './db.js';

const MS_DAY = 86400000;

export const ACTIVITY_TYPES = [
'LOGIN',
'ASSIGNMENT_SUBMITTED',
'ASSIGNMENT_COMPLETED',
'QUIZ_ATTEMPTED',
'QUIZ_COMPLETED',
'QUIZ_SCORE'
];

/* =====================================================
DATE UTILITIES
===================================================== */

export function daysSince(
date,
now = new Date()
) {

if (!date) {
return 999;
}

return Math.max(
0,
Math.floor(
(
now.getTime() -
new Date(date).getTime()
) / MS_DAY
)
);

}

export function recencyScore(
lastActivity,
now = new Date()
) {

const days =
daysSince(lastActivity, now);

return [
100,
90,
80,
70,
50,
40,
25
][days] ?? 0;

}

export function statusFor(score) {

if (score >= 80) {
return 'HIGHLY_ENGAGED';
}

if (score >= 60) {
return 'ENGAGED';
}

if (score >= 40) {
return 'NEEDS_ATTENTION';
}

return 'AT_RISK';

}

/* =====================================================
ENGAGEMENT CALCULATION
===================================================== */

export function calculateEngagementComponents({

loginDays = 0,
assignedAssignments = 0,
completedAssignments = 0,
quizAverage = 0,
lastActivity,
now = new Date()

}) {

const loginScore =
Math.min(
100,
Math.max(
0,
(loginDays / 20) * 100
)
);

const assignmentScore =
assignedAssignments > 0

 
  ? Math.min(
      100,
      Math.max(
        0,
        (
          completedAssignments /
          assignedAssignments
        ) * 100
      )
    )

  : 0;
 

const quizScore =
Number.isFinite(Number(quizAverage))

 
  ? Math.max(
      0,
      Math.min(
        100,
        Number(quizAverage)
      )
    )

  : 0;
 

const recency =
recencyScore(
lastActivity,
now
);

const engagementScore =
loginScore * 0.25 +
assignmentScore * 0.30 +
quizScore * 0.25 +
recency * 0.20;

return {

 
loginScore:
  +loginScore.toFixed(1),

assignmentScore:
  +assignmentScore.toFixed(1),

quizScore:
  +quizScore.toFixed(1),

recencyScore:
  recency,

engagementScore:
  +engagementScore.toFixed(1),

assignmentCompletion:
  +assignmentScore.toFixed(1)
 

};

}

/* =====================================================
STUDENT METRICS

Optimized:
One PostgreSQL aggregate query instead of six queries.
===================================================== */

export async function getStudentMetricsAt(
studentId,
now = new Date()
) {

const nowIso =
now.toISOString();

const since30 =
new Date(
now.getTime() -
30 * MS_DAY
).toISOString();

const result =
await pool.query(
`
WITH assignment_count AS (

 
    SELECT
      COUNT(*)::int AS assigned

    FROM assignments

    WHERE due_at <= $2

  )

  SELECT

    COUNT(
      DISTINCT CASE

        WHEN ae.event_type = 'LOGIN'
         AND ae.occurred_at >= $3

        THEN DATE(ae.occurred_at)

      END
    )::int AS "loginDays",


    COUNT(
      DISTINCT CASE

        WHEN ae.event_type =
             'ASSIGNMENT_COMPLETED'

        THEN ae.metadata->>'assignmentId'

      END
    )::int AS "completedAssignments",


    COALESCE(
      AVG(
        CASE

          WHEN ae.event_type =
               'QUIZ_SCORE'

          THEN
            NULLIF(
              ae.metadata->>'score',
              ''
            )::numeric

        END
      ),
      0
    ) AS "quizAverage",


    COUNT(
      CASE

        WHEN ae.event_type =
             'QUIZ_SCORE'

        THEN 1

      END
    )::int AS "quizzesCompleted",


    COUNT(
      CASE

        WHEN ae.event_type =
             'QUIZ_ATTEMPTED'

        THEN 1

      END
    )::int AS "quizAttempts",


    MAX(ae.occurred_at)
      AS "lastActivity",


    (
      SELECT assigned
      FROM assignment_count
    ) AS "assignedAssignments"


  FROM activity_events ae

  WHERE ae.student_id = $1

    AND ae.occurred_at <= $2
  `,
  [
    studentId,
    nowIso,
    since30
  ]
);
 

const row =
result.rows[0];

const loginDays =
Number(
row?.loginDays || 0
);

const assignedAssignments =
Number(
row?.assignedAssignments || 0
);

const completedAssignments =
Number(
row?.completedAssignments || 0
);

const quizAverage =
Number(
row?.quizAverage || 0
);

const quizzesCompleted =
Number(
row?.quizzesCompleted || 0
);

const quizAttempts =
Number(
row?.quizAttempts || 0
);

const lastActivity =
row?.lastActivity || null;

const metrics =
calculateEngagementComponents({

 
  loginDays,

  assignedAssignments,

  completedAssignments,

  quizAverage,

  lastActivity,

  now

});
 

const atRisk =

 
metrics.engagementScore < 40 ||

daysSince(
  lastActivity,
  now
) >= 7 ||

metrics.assignmentCompletion < 50;
 

return {

 
...metrics,

status:
  atRisk
    ? 'AT_RISK'
    : statusFor(
        metrics.engagementScore
      ),

atRisk,

lastActive:
  lastActivity,

loginDays,

assignedAssignments,

completedAssignments,

quizAverage:
  +quizAverage.toFixed(1),

quizAttempts,

quizzesCompleted
 

};

}

/* =====================================================
CURRENT STUDENT METRICS
===================================================== */

export async function getStudentMetrics(
studentId
) {

return getStudentMetricsAt(
studentId,
new Date()
);

}

/* =====================================================
ENGAGEMENT HISTORY

30 points.
Each point now uses one aggregate query.
===================================================== */

export async function getEngagementHistory(
studentId,
days = 30
) {

const points = [];

const today =
new Date();

today.setHours(
23,
59,
59,
999
);

for (
let offset = days - 1;
offset >= 0;
offset--
) {

 
const date =
  new Date(
    today.getTime() -
    offset * MS_DAY
  );


const metrics =
  await getStudentMetricsAt(
    studentId,
    date
  );


points.push({

  date:
    date
      .toISOString()
      .slice(0, 10),

  engagementScore:
    metrics.engagementScore

});
 

}

return points;

}

/* =====================================================
GLOBAL ANALYTICS

Optimized PostgreSQL implementation.

Calculates all student metrics for each day using
SQL aggregation instead of querying every student
individually.
===================================================== */

export async function getGlobalAnalytics(
days = 30
) {

const allowed =
[7, 30];

const windowDays =
allowed.includes(Number(days))

 
  ? Number(days)

  : 30;
 

const today =
new Date();

today.setHours(
23,
59,
59,
999
);

const startDate =
new Date(
today.getTime() -
(windowDays - 1) *
MS_DAY
);

startDate.setHours(
0,
0,
0,
0
);

/*
===================================================
ENGAGEMENT OVER TIME

 
PostgreSQL generate_series creates all required
dates.

All student activity is aggregated in SQL.
===================================================
 

*/

const engagementResult =
await pool.query(
`
WITH dates AS (

 
    SELECT
      (
        gs::date +
        interval '23 hours 59 minutes 59 seconds'
      ) AS point_date

    FROM generate_series(
      $1::date,
      $2::date,
      interval '1 day'
    ) AS gs

  ),


  assignment_counts AS (

    SELECT
      d.point_date,

      COUNT(a.id)::numeric
        AS assigned

    FROM dates d

    LEFT JOIN assignments a

      ON a.due_at <= d.point_date

    GROUP BY
      d.point_date

  ),


  student_metrics AS (

    SELECT

      d.point_date,

      s.id AS student_id,


      COUNT(
        DISTINCT CASE

          WHEN ae.event_type = 'LOGIN'

           AND ae.occurred_at >=
               d.point_date -
               interval '30 days'

          THEN DATE(ae.occurred_at)

        END
      )::numeric AS login_days,


      COUNT(
        DISTINCT CASE

          WHEN ae.event_type =
               'ASSIGNMENT_COMPLETED'

          THEN ae.metadata->>'assignmentId'

        END
      )::numeric AS completed_assignments,


      COALESCE(
        AVG(
          CASE

            WHEN ae.event_type =
                 'QUIZ_SCORE'

            THEN
              NULLIF(
                ae.metadata->>'score',
                ''
              )::numeric

          END
        ),
        0
      ) AS quiz_average,


      MAX(
        ae.occurred_at
      ) AS last_activity,


      ac.assigned

    FROM dates d

    CROSS JOIN students s

    CROSS JOIN assignment_counts ac

    LEFT JOIN activity_events ae

      ON ae.student_id = s.id

     AND ae.occurred_at <=
         d.point_date

    WHERE ac.point_date =
          d.point_date

    GROUP BY

      d.point_date,

      s.id,

      ac.assigned

  ),


  calculated AS (

    SELECT

      point_date,


      LEAST(
        100,
        GREATEST(
          0,
          (
            login_days / 20
          ) * 100
        )
      ) AS login_score,


      CASE

        WHEN assigned > 0

        THEN LEAST(
          100,
          GREATEST(
            0,
            (
              completed_assignments /
              assigned
            ) * 100
          )
        )

        ELSE 0

      END AS assignment_score,


      LEAST(
        100,
        GREATEST(
          0,
          quiz_average
        )
      ) AS quiz_score,


      CASE

        WHEN last_activity IS NULL
          THEN 0

        WHEN FLOOR(
          EXTRACT(
            EPOCH FROM
            (
              point_date -
              last_activity
            )
          ) / 86400
        ) <= 0
          THEN 100

        WHEN FLOOR(
          EXTRACT(
            EPOCH FROM
            (
              point_date -
              last_activity
            )
          ) / 86400
        ) = 1
          THEN 90

        WHEN FLOOR(
          EXTRACT(
            EPOCH FROM
            (
              point_date -
              last_activity
            )
          ) / 86400
        ) = 2
          THEN 80

        WHEN FLOOR(
          EXTRACT(
            EPOCH FROM
            (
              point_date -
              last_activity
            )
          ) / 86400
        ) = 3
          THEN 70

        WHEN FLOOR(
          EXTRACT(
            EPOCH FROM
            (
              point_date -
              last_activity
            )
          ) / 86400
        ) = 4
          THEN 50

        WHEN FLOOR(
          EXTRACT(
            EPOCH FROM
            (
              point_date -
              last_activity
            )
          ) / 86400
        ) = 5
          THEN 40

        WHEN FLOOR(
          EXTRACT(
            EPOCH FROM
            (
              point_date -
              last_activity
            )
          ) / 86400
        ) = 6
          THEN 25

        ELSE 0

      END AS recency_score

    FROM student_metrics

  )


  SELECT

    point_date::date::text
      AS date,


    ROUND(
      AVG(

        login_score * 0.25 +

        assignment_score * 0.30 +

        quiz_score * 0.25 +

        recency_score * 0.20

      )::numeric,
      1
    ) AS engagement


  FROM calculated

  GROUP BY
    point_date

  ORDER BY
    point_date
  `,
  [
    startDate
      .toISOString()
      .slice(0, 10),

    today
      .toISOString()
      .slice(0, 10)
  ]
);
 

const engagementOverTime =
engagementResult.rows.map(
(row) => ({

 
    date:
      row.date,

    engagement:
      Number(row.engagement || 0)

  })
);
 

/*
===================================================
ENSURE EXACT NUMBER OF DAYS

 
generate_series should already guarantee this, but
this ensures API consistency.
===================================================
 

*/

const engagementMap =
new Map(
engagementOverTime.map(
(point) => [
point.date,
point.engagement
]
)
);

const normalizedEngagement =
[];

for (
let offset = windowDays - 1;
offset >= 0;
offset--
) {

 
const date =
  new Date(
    today.getTime() -
    offset * MS_DAY
  );


const key =
  date
    .toISOString()
    .slice(0, 10);


normalizedEngagement.push({

  date:
    key,

  engagement:
    engagementMap.get(key) ?? 0

});
 

}

/*
===================================================
TOPIC PERFORMANCE
===================================================
*/

const topicResult =
await pool.query(
`
SELECT

 
    t.name AS topic,

    ROUND(
      AVG(stp.score)::numeric,
      1
    ) AS score

  FROM student_topic_performance stp

  JOIN topics t
    ON t.id = stp.topic_id

  WHERE stp.updated_at >= $1

    AND stp.updated_at <= $2

  GROUP BY
    t.id,
    t.name

  ORDER BY
    t.name
  `,
  [
    startDate.toISOString(),
    today.toISOString()
  ]
);
 

const topicPerformance =
topicResult.rows.map(
(row) => ({

 
    ...row,

    score:
      Number(row.score)

  })
);
 

/*
===================================================
RETENTION
===================================================
*/

const retentionResult =
await pool.query(
`
WITH cohort AS (

 
    SELECT

      student_id,

      MIN(occurred_at)
        AS first_login

    FROM activity_events

    WHERE event_type = 'LOGIN'

      AND occurred_at >=
          $1

      AND occurred_at <=
          $2

    GROUP BY
      student_id

  ),


  returned AS (

    SELECT DISTINCT
      c.student_id

    FROM cohort c

    JOIN activity_events ae

      ON ae.student_id =
         c.student_id

     AND ae.event_type =
         'LOGIN'

     AND ae.occurred_at >
         c.first_login

     AND ae.occurred_at <=
         $3

  )


  SELECT

    (
      SELECT COUNT(*)
      FROM cohort
    )::int
      AS cohort_students,


    (
      SELECT COUNT(*)
      FROM returned
    )::int
      AS returned_students
  `,
  [

    new Date(
      today.getTime() -
      2 *
      windowDays *
      MS_DAY
    ).toISOString(),

    new Date(
      today.getTime() -
      (
        windowDays + 1
      ) *
      MS_DAY
    ).toISOString(),

    today.toISOString()

  ]
);


const retention =
retentionResult.rows[0] || {


  cohort_students: 0,

  returned_students: 0

};


const cohortStudents =
Number(
retention.cohort_students || 0
);

const returnedStudents =
Number(
retention.returned_students || 0
);

const retentionRate =
cohortStudents > 0

 
  ? +(
      (
        returnedStudents /
        cohortStudents
      ) * 100
    ).toFixed(1)

  : 0;
 

return {

 
days:
  windowDays,

engagementOverTime:
  normalizedEngagement,

topicPerformance,

retention: {

  cohortStudents,

  returnedStudents,

  rate:
    retentionRate

}
 

};

}
