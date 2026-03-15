require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

// Use DATABASE_URL for Render (priority), fall back to individual env vars for local dev
let poolConfig;
if (process.env.DATABASE_URL) {
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: true, // Render requires SSL
  };
} else {
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'todo_app',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  };
}

const pool = new Pool(poolConfig);

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
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      completed BOOLEAN NOT NULL DEFAULT FALSE
    );
  `);

  await pool.query('ALTER TABLE tasks DROP COLUMN IF EXISTS created_at;');
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
  console.error('PORT is required in .env');
  process.exit(1);
}

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });
