import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder',
})

const EXTRACTION_PROMPT = `You are an expert at extracting structured data from Explanation of Benefits (EOB) documents.

Extract the following fields from the EOB text. The document typically contains a table with columns like:
Claim #, Patient Name, Provider, Amount Billed/Charged, Your Plan Paid/Insurance Paid, What You Owe/Patient Responsibility.

Return valid JSON with exactly this structure (use null for any missing field):
{
  "claim_number": "string or null - the claim/control number",
  "patient_name": "string or null - member/patient name",
  "provider": "string or null - provider or facility name",
  "amount_billed": number or null - total amount charged/billed (dollars, e.g. 500.00),
  "plan_paid": number or null - amount insurance/plan paid (dollars, e.g. 450.00),
  "amount_owed": number or null - patient responsibility / what you owe (dollars, e.g. 50.00),
  "service_date": "YYYY-MM-DD or null - date of service",
  "procedure_code": "string or null - CPT/HCPCS code if present (e.g. 99213)"
}

Rules:
- Amounts must be numbers in dollars (not cents). 50.00 not 5000.
- Patient responsibility (amount_owed) is usually the smallest amount.
- Use null for any field you cannot find.
- Do not invent data. Only extract what is clearly present in the document.`

const MAX_AMOUNT = 999999999.99

function sanitizeAmount(val) {
  if (val == null) return null
  const n = Number(val)
  if (isNaN(n)) return null
  if (Math.abs(n) > MAX_AMOUNT) return null
  return Math.round(n * 100) / 100
}

/**
 * Extract structured EOB fields from raw PDF text using AI.
 * @param {string} rawText - Extracted text from the PDF
 * @returns {Promise<{ claim_number, patient_name, provider, amount_billed, plan_paid, amount_owed, service_date, procedure_code }>}
 */
export async function extractEobFields(rawText) {
  const empty = {
    claim_number: null,
    patient_name: null,
    provider: null,
    amount_billed: null,
    plan_paid: null,
    amount_owed: null,
    service_date: null,
    procedure_code: null,
  }

  if (!rawText || rawText.trim().length < 50) {
    return empty
  }

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-placeholder') {
    return empty
  }

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: EXTRACTION_PROMPT },
        {
          role: 'user',
          content: `Extract the structured fields from this EOB document:\n\n${rawText.slice(0, 12000)}`,
        },
      ],
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content
    if (!content) return empty

    const parsed = JSON.parse(content)

    return {
      claim_number: typeof parsed.claim_number === 'string' ? parsed.claim_number.trim() || null : null,
      patient_name: typeof parsed.patient_name === 'string' ? parsed.patient_name.trim() || null : null,
      provider: typeof parsed.provider === 'string' ? parsed.provider.trim() || null : null,
      amount_billed: sanitizeAmount(parsed.amount_billed),
      plan_paid: sanitizeAmount(parsed.plan_paid),
      amount_owed: sanitizeAmount(parsed.amount_owed),
      service_date: typeof parsed.service_date === 'string' && parsed.service_date.match(/^\d{4}-\d{2}-\d{2}$/)
        ? parsed.service_date
        : null,
      procedure_code: typeof parsed.procedure_code === 'string' ? parsed.procedure_code.trim() || null : null,
    }
  } catch (err) {
    console.error('EOB extraction error:', err)
    return empty
  }
}
