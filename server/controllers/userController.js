import { query, getOrCreateUser } from '../db/index.js'
import { normalizeZip } from '../utils/zip.js'

export async function getMe(req, res) {
  try {
    const userSub = req.userId
    if (!userSub) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const result = await query('SELECT zip_code FROM users WHERE auth0_sub = $1', [userSub])
    const zip = result.rows[0]?.zip_code ?? null
    res.json({ zipCode: zip })
  } catch (err) {
    console.error('getMe error', err)
    res.status(500).json({ error: 'Failed to load profile' })
  }
}

export async function updateZip(req, res) {
  try {
    const userSub = req.userId
    const userEmail = req.userEmail
    if (!userSub) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const raw = req.body?.zip
    const zip = normalizeZip(typeof raw === 'string' ? raw : String(raw ?? ''))
    if (!zip) {
      return res.status(400).json({ error: 'Valid 5-digit ZIP required' })
    }

    const userId = await getOrCreateUser(userSub, userEmail)
    await query(
      'UPDATE users SET zip_code = $1, updated_at = NOW() WHERE id = $2',
      [zip, userId]
    )

    res.json({ zipCode: zip })
  } catch (err) {
    console.error('updateZip error', err)
    res.status(500).json({ error: 'Failed to save ZIP' })
  }
}
