import Fastify from 'fastify';
import * as dotenv from 'dotenv';
import fastifySqlite from 'fastify-sqlite';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'node:path';

dotenv.config();

const fastify = Fastify({ logger: true });
const port = process.env.PORT || 3000;
const host = ("RENDER" in process.env) ? `0.0.0.0` : `localhost`;

async function init() {
  const { clerkPlugin, getAuth } = await import('@clerk/fastify');

  await fastify.register(clerkPlugin);

  await fastify.register(fastifySqlite, {
    promiseApi: true,
    dbFile: './nomsters.db',
    verbose: true
  });

  await fastify.register(fastifyStatic, {
    root: path.resolve(path.dirname(''), '../client/dist'),
    prefix: '/'
  });

  await fastify.register(cors, {
    origin(origin, cb) {
      const host = origin ? new URL(origin).hostname : '';

      if (host === 'localhost' || host === 'nomsters.onrender.com' || !host) {
        cb(null, true);
        return;
      }

      cb(new Error('Not allowed'));
    },
    credentials: true
  });

  await fastify.sqlite.exec(`
    CREATE TABLE IF NOT EXISTS nomsters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      description TEXT,
      points INTEGER,
      latitude REAL,
      longitude REAL,
      restaurant TEXT,
      is_giga INTEGER,
      image_url TEXT
    );

    CREATE TABLE IF NOT EXISTS nomsters_eaten (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nomster_id INTEGER,
      user_id INTEGER,
      timestamp INTEGER
    );
  `);

  await fastify.sqlite.exec(`
    DELETE FROM nomsters;
    DELETE FROM nomsters_eaten;
  `);

  await Promise.all([
    [ 'Burgenstein', 'IT IS ALIVE! It is an abomination, but a delicious one!', 5, 36.72, -4.42, 'Uncle Johnny\'s burger joint', 0, 'burgenstein.png' ],
    [ 'Count Dietcola', 'Quench your thirst with him before he quenches his with your blood!', 3, 36.72, -4.4148, 'Shake shack', 0, 'dietcola.png' ],
    [ 'Dogzilla', 'He is destroying the city! Get the ketchup before it is too late!!!', 3, 36.73, -4.43, 'Emma\'s food truck', 0, 'dogzilla.png' ]
  ].map((values) => fastify.sqlite.run('INSERT INTO nomsters (name, description, points, latitude, longitude, restaurant, is_giga, image_url) VALUES (?,?,?,?,?,?,?,?)', values)));

  fastify.get('/nomsters', async (request, reply) => {
    const { userId } = getAuth(request);

    if (!userId) {
      return reply.code(401).send();
    }

    const nomsters = await fastify.sqlite.all(`
      SELECT n.*, count(ne.id) as times_eaten FROM nomsters n LEFT JOIN nomsters_eaten ne ON n.id = ne.nomster_id AND ne.user_id = '${userId}' GROUP BY n.id
    `);
    return nomsters;
  });

  fastify.post('/nomsters/:id/eat', async (request) => {
    const { userId } = getAuth(request);

    if (!userId) {
      return reply.code(401).send();
    }

    const { id } = request.params;
    await fastify.sqlite.run('INSERT INTO nomsters_eaten (nomster_id, user_id, timestamp) VALUES (?, ?, ?)', [id, userId, Date.now()]);
  });

  fastify.get('/me', async (request) => {
    const { userId } = getAuth(request);

    if (!userId) {
      return reply.code(401).send();
    }

    const result = await fastify.sqlite.all(`SELECT (n.points + count(ne.id) - 1) AS points FROM nomsters_eaten ne LEFT JOIN nomsters n ON n.id = ne.nomster_id WHERE ne.user_id = '${userId}' GROUP BY n.id`);

    return { points: result.reduce((sum, { points }) => sum + points, 0) };
  });
}

const start = async () => {
  try {
    await init();
    fastify.listen({ port, host });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
