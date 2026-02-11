import fs from 'fs/promises'
import pdfParse from 'pdf-parse'

/**
 * Detect if PDF already contains selectable text.
 * Simple heuristic: run pdf-parse and check extracted text length.
 */
async function detectScannedPdf(buffer) {
  try {
    const parsed = await pdfParse(buffer)
    const text = parsed.text?.trim() || ''
    return text.length < 50 // treat as scanned if virtually no text extracted
  } catch (err) {
    console.warn('Failed to parse PDF for detection, assuming scanned:', err.message)
    return true
  }
}

/**
 * Future placeholder: call external Python microservice for parsing/normalization.
 */
async function callPythonProcessingService(filePath) {
  if (!process.env.PDF_PROCESSOR_URL) {
    return null
  }
  // Example contract stub
  try {
    const response = await fetch(`${process.env.PDF_PROCESSOR_URL}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath }),
    })
    if (!response.ok) {
      throw new Error(`Processor responded with ${response.status}`)
    }
    return await response.json()
  } catch (err) {
    console.error('Failed to reach PDF processor microservice:', err)
    return null
  }
}

/**
 * Basic text extraction using pdf-parse for non-scanned PDFs.
 * In the future, replace with richer parsing.
 */
async function extractFieldsFromText(text) {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean)
  const joined = lines.join(' ')

  const memberMatch = joined.match(/Member[:\s]+([A-Z][A-Za-z\s]+)/i)
  const planMatch = joined.match(/Plan[:\s]+([A-Za-z0-9\s]+)/i)
  const providerMatch = joined.match(/Provider[:\s]+([A-Za-z0-9\s]+)/i)
  const amountMatch = joined.match(/(?:You Owe|Amount Due|Patient Responsibility)[:\s$]*([\d.,]+)/i)
  const dateMatch = joined.match(/Service Date[:\s]+([0-9/.-]+)/i)

  return {
    member: memberMatch?.[1]?.trim() || null,
    plan: planMatch?.[1]?.trim() || null,
    provider: providerMatch?.[1]?.trim() || null,
    amountOwed: amountMatch ? Number(amountMatch[1].replace(/,/g, '')) : null,
    serviceDate: dateMatch?.[1]?.trim() || null,
    rawText: text,
  }
}

export async function processPdf({ filePath }) {
  const buffer = await fs.readFile(filePath)
  const isScanned = await detectScannedPdf(buffer)

  if (isScanned) {
    return {
      status: 'pending_ocr',
      requiresOcr: true,
      normalized: null,
      rawText: null,
    }
  }

  // Try external processor first (if available)
  const externalResult = await callPythonProcessingService(filePath)
  if (externalResult?.normalized) {
    return {
      status: 'processed',
      requiresOcr: false,
      normalized: externalResult.normalized,
      rawText: externalResult.rawText || null,
    }
  }

  // Fallback: local pdf-parse
  try {
    const parsed = await pdfParse(buffer)
    const normalized = await extractFieldsFromText(parsed.text || '')
    return {
      status: 'processed',
      requiresOcr: false,
      normalized,
      rawText: parsed.text || '',
    }
  } catch (err) {
    console.error('Failed to parse PDF text:', err)
    return {
      status: 'error',
      requiresOcr: false,
      normalized: null,
      rawText: null,
      error: err.message,
    }
  }
}
