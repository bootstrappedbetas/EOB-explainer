require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

async function test() {
  const result = await pool.query('select now()')
  console.log(result.rows)
  await pool.end()
}

test().catch(console.error)
