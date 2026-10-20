const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'appuser',
  password: process.env.DB_PASSWORD || 'apppass',
  database: process.env.DB_NAME || 'tasksdb',
  waitForConnections: true,
  connectionLimit: 10
});

const wrap = (fn) => async (req, res) => {
  try { await fn(req, res); }
  catch (e) { res.status(500).json({ error: e.message }); }
};

// Health check (also verifies DB connectivity)
app.get('/api/health', wrap(async (req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok' });
}));

// READ
app.get('/api/tasks', wrap(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM tasks ORDER BY id DESC');
  res.json(rows);
}));

// CREATE
app.post('/api/tasks', wrap(async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  const [r] = await pool.query('INSERT INTO tasks (title) VALUES (?)', [title]);
  res.status(201).json({ id: r.insertId, title, status: 'pending' });
}));

// UPDATE
app.put('/api/tasks/:id', wrap(async (req, res) => {
  const { title, status } = req.body;
  await pool.query('UPDATE tasks SET title=?, status=? WHERE id=?', [title, status, req.params.id]);
  res.json({ id: Number(req.params.id), title, status });
}));

// DELETE
app.delete('/api/tasks/:id', wrap(async (req, res) => {
  await pool.query('DELETE FROM tasks WHERE id=?', [req.params.id]);
  res.json({ deleted: Number(req.params.id) });
}));

// Create the table if it does not exist, then start the server
async function start() {
  await pool.query(`CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
  app.listen(5000, '127.0.0.1', () => console.log('Backend running on port 5000'));
}
start().catch(e => { console.error(e); process.exit(1); });
