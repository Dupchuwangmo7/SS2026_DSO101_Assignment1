// Only load .env in development - NOT in Docker/production
// In production, environment variables are provided by Render directly
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envPath)) {
  console.log('[INIT] Loading .env from filesystem (development mode)');
  require('dotenv').config();
} else {
  console.log('[INIT] .env not found - using environment variables directly (production mode)');
}

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

// ALWAYS print current state
console.log('[DB] NODE_ENV:', process.env.NODE_ENV || 'undefined');
console.log('[DB] DATABASE_URL present:', !!process.env.DATABASE_URL);

// Determine which database configuration to use
let poolConfig;

if (process.env.DATABASE_URL) {
  console.log('[DB] ✅ Using DATABASE_URL from environment (production configuration)');
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
} else {
  // SAFETY: In Docker, we MUST have DATABASE_URL
  if (process.env.RENDER === 'true' || process.argv.some(arg => arg.includes('/app/'))) {
    console.error('[DB] ❌ FATAL: DATABASE_URL not set in Docker environment!');
    console.error('[DB] Render requires DATABASE_URL environment variable');
    console.error('[DB] Make sure your PostgreSQL database is attached to this service');
    process.exit(1);
  }
  
  console.log('[DB] ⚠️  DATABASE_URL not found - attempting local database configuration');
  // Local development ONLY
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'todo_app',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  };
  console.log('[DB] Local config:', { host: poolConfig.host, port: poolConfig.port, database: poolConfig.database });
}

const pool = new Pool(poolConfig);

// Handle pool connection errors
pool.on('error', (err) => {
  console.error('[DB POOL ERROR]', err);
});

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'To-Do backend is running',
    endpoints: ['/tasks'],
  });
});

async function initializeDatabase() {
  try {
    console.log('[DB] Testing database connection...');
    // Test the connection first
    const result = await pool.query('SELECT NOW();');
    console.log('[DB] ✅ Database connection successful:', result.rows[0]);
  } catch (error) {
    console.error('[DB] ❌ Failed to connect to database:');
    console.error('[DB] Error:', error.message);
    console.error('[DB] Code:', error.code);
    console.error('[DB] Address:', error.address);
    console.error('[DB] Port:', error.port);
    throw error;
  }

  try {
    console.log('[DB] Creating tables...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        completed BOOLEAN NOT NULL DEFAULT FALSE
      );
    `);
    console.log('[DB] ✅ Tables ready');

    await pool.query('ALTER TABLE tasks DROP COLUMN IF EXISTS created_at;');
  } catch (error) {
    console.error('[DB] ❌ Failed to initialize tables:', error.message);
    throw error;
  }
}

app.get('/tasks', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, title, completed FROM tasks ORDER BY id DESC;');

    res.json(rows);
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/tasks', async (req, res) => {
  const title = req.body?.title?.trim();

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    const { rows } = await pool.query(
      'INSERT INTO tasks (title, completed) VALUES ($1, $2) RETURNING id, title, completed;',
      [title, false]
    );

    return res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Failed to create task:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/tasks/:id', async (req, res) => {
  const taskId = Number(req.params.id);

  if (Number.isNaN(taskId)) {
    return res.status(400).json({ error: 'Invalid task id' });
  }

  const hasTitle = typeof req.body?.title === 'string';
  const hasCompleted = typeof req.body?.completed === 'boolean';

  if (!hasTitle && !hasCompleted) {
    return res
      .status(400)
      .json({ error: 'Provide title and/or completed to update' });
  }

  const title = hasTitle ? req.body.title.trim() : null;

  if (hasTitle && !title) {
    return res.status(400).json({ error: 'Title cannot be empty' });
  }

  try {
    const { rows } = await pool.query(
      `
      UPDATE tasks
      SET
        title = CASE WHEN $1::boolean THEN $2 ELSE title END,
        completed = CASE WHEN $3::boolean THEN $4 ELSE completed END
      WHERE id = $5
      RETURNING id, title, completed;
      `,
      [hasTitle, title, hasCompleted, req.body.completed ?? null, taskId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    return res.json(rows[0]);
  } catch (error) {
    console.error('Failed to update task:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/tasks/:id', async (req, res) => {
  const taskId = Number(req.params.id);

  if (Number.isNaN(taskId)) {
    return res.status(400).json({ error: 'Invalid task id' });
  }

  try {
    const result = await pool.query('DELETE FROM tasks WHERE id = $1;', [taskId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Failed to delete task:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = Number(process.env.PORT);

if (!PORT) {
  console.error('❌ PORT is required in environment variables');
  process.exit(1);
}

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
  });
