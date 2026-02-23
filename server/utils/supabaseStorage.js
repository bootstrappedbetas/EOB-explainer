import { createClient } from '@supabase/supabase-js'

const BUCKET = 'eobs'

let client = null

function getClient() {
  if (!client) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return null
    client = createClient(url, key)
  }
  return client
}

export function isSupabaseStorageEnabled() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

/**
 * Upload a PDF buffer to Supabase Storage.
 * @param {Buffer} buffer - PDF file buffer
 * @param {string} storagePath - Path in bucket (e.g. "userId/1739123456-doc.pdf")
 * @returns {Promise<string|null>} - Storage path on success, null on failure
 */
export async function uploadPdf(buffer, storagePath) {
  const supabase = getClient()
  if (!supabase) return null

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (error) {
    console.error('Supabase storage upload error:', error)
    return null
  }
  return storagePath
}

/**
 * Download a PDF from Supabase Storage.
 * @param {string} storagePath - Path in bucket (e.g. "userId/1739123456-doc.pdf")
 * @returns {Promise<Buffer|null>} - PDF buffer on success, null on failure
 */
export async function downloadPdf(storagePath) {
  const supabase = getClient()
  if (!supabase) return null

  const { data, error } = await supabase.storage.from(BUCKET).download(storagePath)
  if (error) {
    console.error('Supabase storage download error:', error)
    return null
  }
  if (!data) return null

  const arrayBuffer = await data.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Get a signed URL for direct download (useful for web/mobile to fetch the PDF).
 * @param {string} storagePath - Path in bucket
 * @param {number} expiresIn - Seconds until URL expires (default 1 hour)
 * @returns {Promise<string|null>} - Signed URL or null
 */
export async function getSignedUrl(storagePath, expiresIn = 3600) {
  const supabase = getClient()
  if (!supabase) return null

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, expiresIn)

  if (error) {
    console.error('Supabase signed URL error:', error)
    return null
  }
  return data?.signedUrl ?? null
}

/**
 * Delete a PDF from Supabase Storage.
 * @param {string} storagePath - Path in bucket
 * @returns {Promise<boolean>} - true on success
 */
export async function deletePdf(storagePath) {
  const supabase = getClient()
  if (!supabase) return false

  const { error } = await supabase.storage.from(BUCKET).remove([storagePath])
  if (error) {
    console.error('Supabase storage delete error:', error)
    return false
  }
  return true
}
