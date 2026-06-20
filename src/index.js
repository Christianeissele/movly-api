import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import sql, { initDB } from './db.js';

const app = new Hono();

app.use('*', cors());

app.get('/', (c) => c.json({ status: 'ok', app: 'movly-api' }));

app.get('/workouts', async (c) => {
  try {
    const rows = await sql`SELECT * FROM workouts ORDER BY started_at DESC LIMIT 100`;
    return c.json(rows);
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

app.post('/workouts', async (c) => {
  try {
    const body = await c.req.json();
    const [row] = await sql`
      INSERT INTO workouts
        (type, started_at, ended_at, duration, distance, calories, avg_hr, max_hr, route)
      VALUES (
        ${body.type},
        ${body.startTime},
        ${body.endTime ?? null},
        ${body.duration ?? 0},
        ${body.distance ?? 0},
        ${body.calories ?? 0},
        ${body.avgHeartRate ?? 0},
        ${body.maxHeartRate ?? 0},
        ${sql.json(body.route ?? [])}
      )
      RETURNING *
    `;
    return c.json(row, 201);
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

app.delete('/workouts/:id', async (c) => {
  try {
    await sql`DELETE FROM workouts WHERE id = ${c.req.param('id')}`;
    return c.json({ ok: true });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

serve({ fetch: app.fetch, port: process.env.PORT ?? 3000 }, async (info) => {
  console.log(`Movly API running on port ${info.port}`);
  try {
    await initDB();
    console.log('DB migrations complete');
  } catch (e) {
    console.error('DB init error:', e.message);
  }
});
