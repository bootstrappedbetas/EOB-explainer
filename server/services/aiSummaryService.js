import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder',
})

const SYSTEM_PROMPT = `You are a healthcare billing expert. Your job is to explain Explanation of Benefits (EOB) documents in plain, easy-to-understand language.

For each EOB you receive:
1. Write a 2-4 sentence summary of what the claim is about (the service, who provided it, and what the patient owes).
2. Identify any billing codes mentioned (CPT, HCPCS, ICD-10, etc.) and explain what each code means in simple terms—what service or diagnosis it represents.
3. Create a concise, high-level description of the main service provided (e.g. "MRI of left knee without contrast", "Primary care office visit, established patient").
4. Assign a normalized service category key that groups similar services (e.g. "imaging_mri", "primary_care_visit", "lab_test"). Use lowercase snake_case strings.
5. Provide a list of CPT codes that represent this type of service (including any codes in the document and closely related alternatives).
6. Use a friendly, reassuring tone. Avoid jargon where possible; when you must use a term, briefly explain it.

Respond in valid JSON with this structure:
{
  "summary": "Plain-language summary of the claim...",
  "codeExplanations": [
    { "code": "99213", "type": "CPT", "description": "Office visit, established patient, moderate complexity" }
  ],
  "serviceSummary": "Short high-level description of the main service",
  "serviceCategory": "normalized_service_category_key",
  "relatedCptCodes": ["99213", "99214"]
}`

export async function generateSummary(rawText) {
  if (!rawText || rawText.trim().length < 20) {
    return {
      summary: 'Unable to generate a summary. The document may be a scanned image or contain too little text.',
      codeExplanations: [],
      serviceSummary: null,
      serviceCategory: null,
      relatedCptCodes: [],
    }
  }

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-placeholder') {
    return {
      summary: 'AI summary is not configured. Add OPENAI_API_KEY to your .env to generate summaries.',
      codeExplanations: [],
      serviceSummary: null,
      serviceCategory: null,
      relatedCptCodes: [],
    }
  }

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Explain this EOB document:\n\n${rawText.slice(0, 12000)}`,
        },
      ],
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('Empty response from AI')
    }

    const parsed = JSON.parse(content)
    return {
      summary: parsed.summary || 'Summary unavailable.',
      codeExplanations: Array.isArray(parsed.codeExplanations) ? parsed.codeExplanations : [],
      serviceSummary: parsed.serviceSummary || null,
      serviceCategory: parsed.serviceCategory || null,
      relatedCptCodes: Array.isArray(parsed.relatedCptCodes) ? parsed.relatedCptCodes : [],
    }
  } catch (err) {
    console.error('AI summary error:', err)
    throw err
  }
}
