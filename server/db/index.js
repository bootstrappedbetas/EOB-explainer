import pg from 'pg'
import 'dotenv/config'

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
})

pool.on('error', (err) => {
  console.error('Unexpected database error:', err)
})

export async function query(text, params) {
  const start = Date.now()
  try {
    const result = await pool.query(text, params)
    const duration = Date.now() - start
    if (process.env.NODE_ENV === 'development' && duration > 100) {
      console.log('Slow query', { text: text.substring(0, 50), duration })
    }
    return result
  } catch (err) {
    console.error('Database query error:', err)
    throw err
  }
}

export async function getOrCreateUser(auth0Sub, email = null) {
  const existing = await query(
    'SELECT id FROM users WHERE auth0_sub = $1',
    [auth0Sub]
  )
  if (existing.rows.length > 0) {
    return existing.rows[0].id
  }
  const insert = await query(
    'INSERT INTO users (auth0_sub, email) VALUES ($1, $2) RETURNING id',
    [auth0Sub, email]
  )
  return insert.rows[0].id
}

export { pool }
