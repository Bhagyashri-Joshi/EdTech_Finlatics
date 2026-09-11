import 'dotenv/config';
import bcrypt from 'bcrypt';
import pool from './db.js';
import { fileURLToPath } from 'node:url';

const email = 'teacher@engageai.demo';
const password = 'Demo@123';

const hash = await bcrypt.hash(password, 10);

const now = Date.now();
const day = 86400000;

const iso = (date) =>
  new Date(date).toISOString();


/* =====================================================
   SEED DATABASE
===================================================== */

async function seedDatabase() {

  console.log('Connecting to PostgreSQL...');

  const client = await pool.connect();

  console.log('PostgreSQL connection acquired.');

  try {

    console.log('Starting database seed...');

    console.log('Starting transaction...');

    await client.query('BEGIN');

    console.log('Transaction started.');


    /* =================================================
       RESET DATA
    ================================================= */

    console.log('Deleting student_topic_performance...');

    await client.query(`
      DELETE FROM student_topic_performance
    `);


    console.log('Deleting activity_events...');

    await client.query(`
      DELETE FROM activity_events
    `);


    console.log('Deleting quiz_attempts...');

    await client.query(`
      DELETE FROM quiz_attempts
    `);


    console.log('Deleting assignment_submissions...');

    await client.query(`
      DELETE FROM assignment_submissions
    `);


    console.log('Deleting quizzes...');

    await client.query(`
      DELETE FROM quizzes
    `);


    console.log('Deleting assignments...');

    await client.query(`
      DELETE FROM assignments
    `);


    console.log('Deleting students...');

    await client.query(`
      DELETE FROM students
    `);


    console.log('Deleting topics...');

    await client.query(`
      DELETE FROM topics
    `);


    console.log('Reset complete.');


    /* =================================================
       RESET USER
    ================================================= */

    console.log('Creating/updating demo teacher...');

    await client.query(
      `
      INSERT INTO users (
        name,
        email,
        password_hash,
        role
      )

      VALUES (
        $1,
        $2,
        $3,
        $4
      )

      ON CONFLICT (email)

      DO UPDATE SET

        name = EXCLUDED.name,

        password_hash =
          EXCLUDED.password_hash,

        role = EXCLUDED.role
      `,
      [
        'Demo Teacher',
        email,
        hash,
        'admin'
      ]
    );

    console.log('Demo teacher ready.');


    /* =================================================
       TOPICS
    ================================================= */

    console.log('Creating topics...');

    const topics = [
      'Mathematics',
      'Physics',
      'Programming',
      'Data Science',
      'Communication'
    ];


    for (const name of topics) {

      await client.query(
        `
        INSERT INTO topics (
          name
        )

        VALUES ($1)

        ON CONFLICT (name)

        DO NOTHING
        `,
        [name]
      );

    }


    const topicResult =
      await client.query(`
        SELECT *
        FROM topics
        ORDER BY id
      `);

    const topicRows =
      topicResult.rows;

    console.log(
      `Topics ready: ${topicRows.length}`
    );


    /* =================================================
       ASSIGNMENTS
    ================================================= */

    console.log('Creating assignments...');

    for (
      let i = 0;
      i < 12;
      i++
    ) {

      const topic =
        topicRows[
          i % topicRows.length
        ];


      await client.query(
        `
        INSERT INTO assignments (
          title,
          due_at,
          topic_id
        )

        VALUES (
          $1,
          $2,
          $3
        )
        `,
        [
          `Assignment ${i + 1}`,

          iso(
            now -
            (i + 2) *
            7 *
            day
          ),

          topic.id
        ]
      );

    }

    console.log('Assignments ready: 12');


    /* =================================================
       QUIZZES
    ================================================= */

    console.log('Creating quizzes...');

    for (
      let i = 0;
      i < 10;
      i++
    ) {

      const topic =
        topicRows[
          i % topicRows.length
        ];


      await client.query(
        `
        INSERT INTO quizzes (
          title,
          topic_id,
          max_score,
          created_at
        )

        VALUES (
          $1,
          $2,
          $3,
          $4
        )
        `,
        [
          `Quiz ${i + 1}`,

          topic.id,

          100,

          iso(
            now -
            (i + 1) *
            8 *
            day
          )
        ]
      );

    }

    console.log('Quizzes ready: 10');


    /* =================================================
       FETCH ASSIGNMENTS
    ================================================= */

    console.log('Fetching assignments...');

    const assignmentResult =
      await client.query(`
        SELECT *
        FROM assignments
        ORDER BY id
      `);

    const assignments =
      assignmentResult.rows;


    /* =================================================
       FETCH QUIZZES
    ================================================= */

    console.log('Fetching quizzes...');

    const quizResult =
      await client.query(`
        SELECT *
        FROM quizzes
        ORDER BY id
      `);

    const quizzes =
      quizResult.rows;


    /* =================================================
       STUDENT DATA
    ================================================= */

    const first = [
      'Aarav',
      'Ananya',
      'Vihaan',
      'Diya',
      'Arjun',
      'Isha',
      'Kabir',
      'Meera',
      'Rohan',
      'Kavya',
      'Aditya',
      'Sara',
      'Ishaan',
      'Aanya',
      'Reyansh',
      'Myra',
      'Advait',
      'Kiara',
      'Aryan',
      'Riya'
    ];


    const last = [
      'Sharma',
      'Patel',
      'Singh',
      'Joshi',
      'Gupta',
      'Kulkarni',
      'Rao',
      'Mehta',
      'Verma',
      'Nair'
    ];


    const groups = [
      'HIGH',
      'ENGAGED',
      'ATTENTION',
      'RISK'
    ];


    const students = [];


    /* =================================================
       CREATE 80 STUDENTS
    ================================================= */

    console.log('Creating 80 students...');

    for (
      let i = 0;
      i < 80;
      i++
    ) {

      const group =
        groups[
          Math.floor(i / 20)
        ];


      const firstName =
        first[
          i % first.length
        ];


      const lastName =
        last[
          Math.floor(
            i / first.length
          ) %
          last.length
        ];


      const studentResult =
        await client.query(
          `
          INSERT INTO students (
            first_name,
            last_name,
            email,
            cohort
          )

          VALUES (
            $1,
            $2,
            $3,
            $4
          )

          RETURNING id
          `,
          [
            firstName,
            lastName,
            `student${i + 1}@demo.edu`,
            'Cohort 2026'
          ]
        );


      const studentId =
        studentResult.rows[0].id;


      students.push({
        id: studentId,
        group,
        seed: i + 1
      });

    }

    console.log(
      `Students ready: ${students.length}`
    );


    /* =================================================
       ACTIVITY EVENT HELPER
    ================================================= */

    async function event(
      studentId,
      type,
      when,
      metadata = {}
    ) {

      await client.query(
        `
        INSERT INTO activity_events (
          student_id,
          event_type,
          metadata,
          occurred_at
        )

        VALUES (
          $1,
          $2,
          $3,
          $4
        )
        `,
        [
          studentId,
          type,
          JSON.stringify(metadata),
          iso(when)
        ]
      );

    }


    /* =================================================
       SEED STUDENT ACTIVITY
    ================================================= */

    console.log(
      'Creating student activity data...'
    );


    for (
      let index = 0;
      index < students.length;
      index++
    ) {

      const student =
        students[index];

      const group =
        student.group;


      if (
        index === 0 ||
        (index + 1) % 10 === 0
      ) {

        console.log(
          `Processing student ${index + 1}/80...`
        );

      }


      /* ===============================================
         LOGIN ACTIVITY
      =============================================== */

      const loginDays =

        group === 'HIGH'

          ? 25

          : group === 'ENGAGED'

            ? 17

            : group === 'ATTENTION'

              ? 8

              : 2;


      const endDaysAgo =

        group === 'HIGH'

          ? 0

          : group === 'ENGAGED'

            ? 1

            : group === 'ATTENTION'

              ? 4

              : 9;


      const available = [];


      for (
        let d = endDaysAgo;

        d < 90 &&
        available.length < loginDays;

        d +=
          group === 'HIGH'

            ? 3

            : group === 'ENGAGED'

              ? 5

              : 8
      ) {

        available.push(d);

      }


      for (
        let j = 0;

        j < available.length;

        j++
      ) {

        const d =
          available[j];


        await event(
          student.id,
          'LOGIN',

          now -
          d *
          day -
          (
            (j % 8) + 1
          ) *
          3600000
        );

      }


      /* ===============================================
         ASSIGNMENTS
      =============================================== */

      for (
        let j = 0;

        j < assignments.length;

        j++
      ) {

        const assignment =
          assignments[j];


        const completed =

          group === 'HIGH' ||

          (
            group === 'ENGAGED' &&
            j < 10
          ) ||

          (
            group === 'ATTENTION' &&
            j < 6
          ) ||

          (
            group === 'RISK' &&
            j < 3
          );


        const submitted =

          completed ||

          (
            group === 'ATTENTION' &&
            j < 8
          );


        const score =

          completed

            ? group === 'HIGH'

              ? 85 +
                (
                  student.seed +
                  j
                ) %
                12

              : group === 'ENGAGED'

                ? 70 +
                  (
                    student.seed +
                    j
                  ) %
                  18

                : group === 'ATTENTION'

                  ? 55 +
                    (
                      student.seed +
                      j
                    ) %
                    20

                  : 40 +
                    (
                      student.seed +
                      j
                    ) %
                    18

            : null;


        await client.query(
          `
          INSERT INTO assignment_submissions (
            assignment_id,
            student_id,
            submitted_at,
            completed,
            score
          )

          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5
          )
          `,
          [
            assignment.id,

            student.id,

            submitted

              ? iso(
                  now -
                  (j + 3) *
                  6 *
                  day
                )

              : null,

            completed,

            score
          ]
        );


        if (submitted) {

          await event(
            student.id,
            'ASSIGNMENT_SUBMITTED',

            now -
            (j + 3) *
            6 *
            day,

            {
              assignmentId:
                assignment.id
            }
          );

        }


        if (completed) {

          await event(
            student.id,
            'ASSIGNMENT_COMPLETED',

            now -
            (j + 3) *
            6 *
            day +
            3600000,

            {
              assignmentId:
                assignment.id
            }
          );

        }

      }


      /* ===============================================
         QUIZZES
      =============================================== */

      for (
        let j = 0;

        j < quizzes.length;

        j++
      ) {

        const quiz =
          quizzes[j];


        const take =

          group === 'HIGH' ||

          (
            group === 'ENGAGED' &&
            j < 9
          ) ||

          (
            group === 'ATTENTION' &&
            j < 6
          ) ||

          (
            group === 'RISK' &&
            j < 3
          );


        if (!take) {
          continue;
        }


        const score =

          group === 'HIGH'

            ? 82 +
              (
                student.seed +
                j
              ) %
              16

            : group === 'ENGAGED'

              ? 68 +
                (
                  student.seed +
                  j
                ) %
                20

              : group === 'ATTENTION'

                ? 48 +
                  (
                    student.seed +
                    j
                  ) %
                  22

                : 35 +
                  (
                    student.seed +
                    j
                  ) %
                  22;


        const when =
          now -
          (j + 2) *
          7 *
          day;


        await client.query(
          `
          INSERT INTO quiz_attempts (
            quiz_id,
            student_id,
            attempted_at,
            completed,
            score
          )

          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5
          )
          `,
          [
            quiz.id,
            student.id,
            iso(when),
            true,
            score
          ]
        );


        await event(
          student.id,
          'QUIZ_ATTEMPTED',
          when,
          {
            quizId: quiz.id
          }
        );


        await event(
          student.id,
          'QUIZ_COMPLETED',
          when + 1800000,
          {
            quizId: quiz.id
          }
        );


        await event(
          student.id,
          'QUIZ_SCORE',
          when + 1900000,
          {
            quizId: quiz.id,
            score
          }
        );

      }


      /* ===============================================
         TOPIC PERFORMANCE
      =============================================== */

      for (
        let j = 0;

        j < topicRows.length;

        j++
      ) {

        const topic =
          topicRows[j];


        const base =

          group === 'HIGH'

            ? 90

            : group === 'ENGAGED'

              ? 76

              : group === 'ATTENTION'

                ? 62

                : 48;


        const score =
          Math.min(
            100,

            base +

            (
              student.seed +
              j
            ) %
            11
          );


        await client.query(
          `
          INSERT INTO student_topic_performance (
            student_id,
            topic_id,
            score,
            updated_at
          )

          VALUES (
            $1,
            $2,
            $3,
            $4
          )
          `,
          [
            student.id,

            topic.id,

            score,

            iso(
              now -
              (j + 2) *
              day
            )
          ]
        );

      }

    }


    console.log(
      'Student activity data complete.'
    );


    /* =================================================
       COMMIT
    ================================================= */

    console.log(
      'Committing transaction...'
    );

    await client.query(
      'COMMIT'
    );


    console.log(
      JSON.stringify(
        {
          success: true,

          database:
            'connected',

          students:
            80,

          demoUser: {
            email,
            password
          }
        },
        null,
        2
      )
    );


  } catch (error) {

    console.error(
      'Seed failed:',
      error
    );

    try {

      await client.query(
        'ROLLBACK'
      );

      console.log(
        'Transaction rolled back.'
      );

    } catch (rollbackError) {

      console.error(
        'Rollback failed:',
        rollbackError.message
      );

    }

    throw error;


  } finally {

    client.release();

    console.log(
      'Database client released.'
    );

  }

}


/* =====================================================
   EXPORT SEED FUNCTION
===================================================== */

export {
  seedDatabase
};


/* =====================================================
   RUN ONLY WHEN EXECUTED DIRECTLY
===================================================== */

const isDirectRun =
  process.argv[1] &&
  fileURLToPath(
    import.meta.url
  ) === process.argv[1];


if (isDirectRun) {

  try {

    await seedDatabase();

    console.log(
      'Database seed completed successfully.'
    );

    await pool.end();

    process.exit(0);


  } catch (error) {

    console.error(
      'Database seed failed:',
      error.message
    );

    await pool.end();

    process.exit(1);

  }

}