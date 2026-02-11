import { Router } from 'express'
import { query, getOrCreateUser } from '../db/index.js'
import { optionalAuth } from '../middleware/auth.js'

const router = Router()

// All EOB routes require auth
router.use(optionalAuth)

// GET /api/eobs - list EOBs for the current user
router.get('/', async (req, res) => {
  try {
    const userId = req.userId
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const result = await query(
      `SELECT id, member, plan, service_date as date, provider, amount_owed, status, created_at
       FROM eobs
       WHERE user_id = (SELECT id FROM users WHERE auth0_sub = $1)
       ORDER BY created_at DESC`,
      [userId]
    )

    res.json(result.rows)
  } catch (err) {
    console.error('Error fetching EOBs:', err)
    res.status(500).json({ error: 'Failed to fetch EOBs' })
  }
})

// GET /api/eobs/:id - get single EOB
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.userId

    const result = await query(
      `SELECT e.* FROM eobs e
       JOIN users u ON e.user_id = u.id
       WHERE e.id = $1 AND u.auth0_sub = $2`,
      [id, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'EOB not found' })
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error('Error fetching EOB:', err)
    res.status(500).json({ error: 'Failed to fetch EOB' })
  }
})

// POST /api/eobs - create EOB (upload handled separately in Phase 2)
router.post('/', async (req, res) => {
  try {
    const userId = req.userId
    const { member, plan, date, provider, amount_owed } = req.body

    const dbUserId = await getOrCreateUser(userId, req.userEmail)
    const result = await query(
      `INSERT INTO eobs (user_id, member, plan, service_date, provider, amount_owed)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, member, plan, service_date as date, provider, amount_owed, status, created_at`,
      [dbUserId, member || null, plan || null, date || null, provider || null, amount_owed ?? 0]
    )

    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('Error creating EOB:', err)
    res.status(500).json({ error: 'Failed to create EOB' })
  }
})

export default router
