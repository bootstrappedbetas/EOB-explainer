import path from 'path'
import fs from 'fs/promises'
import { query, getOrCreateUser } from '../db/index.js'
import { processPdf } from '../services/eobProcessingService.js'
import { generateSummary } from '../services/aiSummaryService.js'
import { getUploadsDir } from '../utils/fileStorage.js'

export async function listEobs(req, res) {
  try {
    const userSub = req.userId
    if (!userSub) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const rows = await query(
      `SELECT e.id,
              e.member,
              e.plan,
              e.service_date AS date,
              e.provider,
              e.amount_owed,
              e.status,
              e.created_at
         FROM eobs e
         JOIN users u ON e.user_id = u.id
        WHERE u.auth0_sub = $1
        ORDER BY e.created_at DESC`,
      [userSub]
    )
    res.json(rows.rows)
  } catch (err) {
    console.error('listEobs error', err)
    res.status(500).json({ error: 'Failed to fetch EOBs' })
  }
}

export async function getEob(req, res) {
  try {
    const userSub = req.userId
    const { id } = req.params
    const result = await query(
      `SELECT e.*
         FROM eobs e
         JOIN users u ON e.user_id = u.id
        WHERE e.id = $1 AND u.auth0_sub = $2`,
      [id, userSub]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'EOB not found' })
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error('getEob error', err)
    res.status(500).json({ error: 'Failed to fetch EOB' })
  }
}

export async function uploadEob(req, res) {
  const file = req.file
  if (!file) {
    return res.status(400).json({ error: 'PDF file is required' })
  }

  try {
    const userSub = req.userId
    const userEmail = req.userEmail
    if (!userSub) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const userId = await getOrCreateUser(userSub, userEmail)
    const filePath = file.path

    const processingResult = await processPdf({ filePath })
    const { normalized, requiresOcr, status, rawText } = processingResult

    const member = normalized?.member || null
    const plan = normalized?.plan || null
    const serviceDate = normalized?.serviceDate || null
    const provider = normalized?.provider || null
    const amountOwed = normalized?.amountOwed ?? null

    const insert = await query(
      `INSERT INTO eobs (
          user_id,
          member,
          plan,
          service_date,
          provider,
          amount_owed,
          file_path,
          status,
          extracted_text
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, member, plan, service_date AS date, provider, amount_owed, status, created_at`,
      [
        userId,
        member,
        plan,
        serviceDate ? new Date(serviceDate) : null,
        provider,
        amountOwed,
        path.basename(filePath),
        requiresOcr ? 'pending_ocr' : status || 'processed',
        rawText ? rawText.slice(0, 15000) : null,
      ]
    )

    res.status(201).json({
      ...insert.rows[0],
      requiresOcr,
      note: requiresOcr
        ? 'Document requires OCR. It will be processed soon.'
        : 'Document processed successfully.',
    })
  } catch (err) {
    console.error('uploadEob error', err)
    res.status(500).json({ error: 'Failed to upload EOB', details: err.message })
  }
}

export async function summarizeEob(req, res) {
  try {
    const userSub = req.userId
    const { id } = req.params
    if (!userSub) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const result = await query(
      `SELECT e.* FROM eobs e
       JOIN users u ON e.user_id = u.id
       WHERE e.id = $1 AND u.auth0_sub = $2`,
      [id, userSub]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'EOB not found' })
    }
    const eob = result.rows[0]

    let rawText = eob.extracted_text || eob.ai_summary
    if (!rawText && eob.file_path) {
      const fullPath = path.join(getUploadsDir(), eob.file_path)
      const processResult = await processPdf({ filePath: fullPath })
      rawText = processResult.rawText
      if (rawText) {
        await query(
          'UPDATE eobs SET extracted_text = $1 WHERE id = $2',
          [rawText.slice(0, 15000), id]
        )
      }
    }

    const aiResult = await generateSummary(rawText)
    const stored = JSON.stringify(aiResult)

    await query('UPDATE eobs SET ai_summary = $1 WHERE id = $2', [stored, id])

    res.json(aiResult)
  } catch (err) {
    console.error('summarizeEob error', err)
    res.status(500).json({ error: 'Failed to generate summary', details: err.message })
  }
}

export async function deleteEobFile(filename) {
  if (!filename) return
  const fullPath = path.join(getUploadsDir(), filename)
  try {
    await fs.unlink(fullPath)
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn('Failed to remove file', fullPath, err)
    }
  }
}
