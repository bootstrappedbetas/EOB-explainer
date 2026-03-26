/** Normalize US ZIP to 5 digits, or null if invalid */
export function normalizeZip(input) {
  if (input == null || typeof input !== 'string') return null
  const digits = input.replace(/\D/g, '')
  if (digits.length >= 5) return digits.slice(0, 5)
  return null
}
