import path from 'path'
import fs from 'fs/promises'
import { query, getOrCreateUser } from '../db/index.js'
import { processPdf } from '../services/eobProcessingService.js'
import { isSupabaseStorageEnabled, uploadPdf, downloadPdf, deletePdf } from '../utils/supabaseStorage.js'
import { extractEobFields } from '../services/eobExtractionService.js'
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
              e.claim_number,
              e.member,
              e.plan,
              e.group_number,
              e.member_id,
              e.service_date AS date,
              e.provider,
              e.amount_charged,
              e.insurance_paid,
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
    const useSupabase = isSupabaseStorageEnabled()
    const buffer = file.buffer
    const filePath = file.path // only set when using disk storage

    const processingResult = useSupabase
      ? await processPdf({ buffer })
      : await processPdf({ filePath })
    const { normalized, requiresOcr, status, rawText } = processingResult

    let claimNumber = null
    let member = normalized?.member || null
    let plan = normalized?.plan || null
    let groupNumber = null
    let memberId = null
    let serviceDate = normalized?.serviceDate || null
    let provider = normalized?.provider || null
    let amountCharged = null
    let insurancePaid = null
    let amountOwed = normalized?.amountOwed ?? null
    let procedureCode = null

    if (rawText && !requiresOcr) {
      const extracted = await extractEobFields(rawText)
      const hasUsefulData = [
        extracted.claim_number,
        extracted.patient_name,
        extracted.plan,
        extracted.group_number,
        extracted.member_id,
        extracted.provider,
        extracted.amount_owed,
      ].some((v) => v != null)
      if (hasUsefulData) {
        claimNumber = extracted.claim_number ?? claimNumber
        member = extracted.patient_name ?? member
        plan = extracted.plan ?? plan
        groupNumber = extracted.group_number ?? groupNumber
        memberId = extracted.member_id ?? memberId
        provider = extracted.provider ?? provider
        amountCharged = extracted.amount_billed ?? amountCharged
        insurancePaid = extracted.plan_paid ?? insurancePaid
        amountOwed = extracted.amount_owed ?? amountOwed
        serviceDate = extracted.service_date ?? serviceDate
        procedureCode = extracted.procedure_code ?? procedureCode
      }
    }

    let storedFilePath
    if (useSupabase && buffer) {
      const timestamp = Date.now()
      const safeName = file.originalname.replace(/[^a-z0-9.\-_]/gi, '_')
      const storagePath = `${userId}/${timestamp}-${safeName}`
      storedFilePath = await uploadPdf(buffer, storagePath)
      if (!storedFilePath) {
        return res.status(500).json({ error: 'Failed to upload PDF to storage' })
      }
    } else {
      storedFilePath = path.basename(filePath)
    }

    const insert = await query(
      `INSERT INTO eobs (
          user_id,
          claim_number,
          member,
          plan,
          group_number,
          member_id,
          service_date,
          provider,
          amount_charged,
          insurance_paid,
          amount_owed,
          file_path,
          status,
          extracted_text,
          procedure_code
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id, claim_number, member, plan, group_number, member_id, service_date AS date, provider, amount_charged, insurance_paid, amount_owed, status, created_at`,
      [
        userId,
        claimNumber,
        member,
        plan,
        groupNumber,
        memberId,
        serviceDate ? new Date(serviceDate) : null,
        provider,
        amountCharged,
        insurancePaid,
        amountOwed,
        storedFilePath,
        requiresOcr ? 'pending_ocr' : status || 'processed',
        rawText ? rawText.slice(0, 15000) : null,
        procedureCode,
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
      let processResult
      if (eob.file_path.includes('/')) {
        const pdfBuffer = await downloadPdf(eob.file_path)
        processResult = pdfBuffer ? await processPdf({ buffer: pdfBuffer }) : { rawText: null }
      } else {
        const fullPath = path.join(getUploadsDir(), eob.file_path)
        processResult = await processPdf({ filePath: fullPath })
      }
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

export async function getBenchmarks(req, res) {
  try {
    const userSub = req.userId
    if (!userSub) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { procedure_code: procedureCode } = req.query
    if (!procedureCode || typeof procedureCode !== 'string') {
      return res.status(400).json({ error: 'procedure_code query parameter is required' })
    }

    // Users' average: AVG(amount_owed) across our eobs for this procedure (all users for better sample)
    const usersResult = await query(
      `SELECT AVG(e.amount_owed)::numeric AS avg_owed, COUNT(*)::int AS sample_size
         FROM eobs e
        WHERE e.procedure_code = $1
          AND e.amount_owed IS NOT NULL`,
      [procedureCode.trim()]
    )
    const usersRow = usersResult.rows[0]
    let usersAverageOwed = null
    let sampleSize = 0
    if (usersRow && usersRow.avg_owed != null) {
      usersAverageOwed = Number(usersRow.avg_owed)
      sampleSize = usersRow.sample_size || 0
    }

    // Market average: placeholder for future public API (CMS, Turquoise, etc.)
    // Will fetch from external pricing DB, cache in benchmarks table, return here
    const marketAverageOwed = null

    res.json({
      procedure_code: procedureCode.trim(),
      usersAverageOwed,
      usersSampleSize: sampleSize,
      marketAverageOwed,
      marketSource: null, // e.g. "CMS" or "Turquoise Health" when wired
    })
  } catch (err) {
    console.error('getBenchmarks error', err)
    res.status(500).json({ error: 'Failed to fetch benchmarks' })
  }
}

export async function deleteEobFile(filePath) {
  if (!filePath) return
  if (filePath.includes('/')) {
    await deletePdf(filePath)
  } else {
    const fullPath = path.join(getUploadsDir(), filePath)
    try {
      await fs.unlink(fullPath)
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.warn('Failed to remove file', fullPath, err)
      }
    }
  }
}
