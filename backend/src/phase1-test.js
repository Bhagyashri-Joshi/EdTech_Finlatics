import 'dotenv/config';

import { app } from './app.js';
import pool from './db.js';


const server = app.listen(0);


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

  console.log(
    'Testing health endpoint...'
  );


  const healthRes =
    await fetch(
      `${base}/api/health`
    );


  const health =
    await healthRes.json();


  if (!healthRes.ok) {

    throw new Error(
      `Health test failed: ${JSON.stringify(health)}`
    );

  }


  console.log(
    'Testing login...'
  );


  const loginRes =
    await fetch(
      `${base}/api/auth/login`,
      {

        method: 'POST',

        headers: {
          'Content-Type':
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


  if (
    !loginRes.ok ||
    !login.token
  ) {

    throw new Error(
      `Login test failed: ${JSON.stringify(login)}`
    );

  }


  console.log(
    'Testing protected route...'
  );


  const meRes =
    await fetch(
      `${base}/api/auth/me`,
      {

        headers: {

          Authorization:
            `Bearer ${login.token}`

        }

      }
    );


  const me =
    await meRes.json();


  if (
    !meRes.ok ||
    !me.user
  ) {

    throw new Error(
      `Protected route failed: ${JSON.stringify(me)}`
    );

  }


  console.log(
    JSON.stringify(
      {

        success: true,

        health: 'ok',

        login: 'ok',

        protectedRoute: 'ok'

      },

      null,

      2
    )
  );


} catch (error) {

  console.error(
    'Phase 1 test failed:',
    error.message
  );

  process.exitCode = 1;

} finally {

  await new Promise(
    (resolve) =>
      server.close(resolve)
  );

  await pool.end();

}