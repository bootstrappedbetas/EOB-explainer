import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder',
})

const SYSTEM_PROMPT = `You are a healthcare billing expert. Your job is to explain Explanation of Benefits (EOB) documents in plain, easy-to-understand language.

For each EOB you receive:
1. Write a 2-4 sentence summary of what the claim is about (the service, who provided it, and what the patient owes).
2. Identify any billing codes mentioned (CPT, HCPCS, ICD-10, etc.) and explain what each code means in simple terms—what service or diagnosis it represents.
3. Use a friendly, reassuring tone. Avoid jargon where possible; when you must use a term, briefly explain it.

Respond in valid JSON with this structure:
{
  "summary": "Plain-language summary of the claim...",
  "codeExplanations": [
    { "code": "99213", "type": "CPT", "description": "Office visit, established patient, moderate complexity" }
  ]
}`

export async function generateSummary(rawText) {
  if (!rawText || rawText.trim().length < 20) {
    return {
      summary: 'Unable to generate a summary. The document may be a scanned image or contain too little text.',
      codeExplanations: [],
    }
  }

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-placeholder') {
    return {
      summary: 'AI summary is not configured. Add OPENAI_API_KEY to your .env to generate summaries.',
      codeExplanations: [],
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
    }
  } catch (err) {
    console.error('AI summary error:', err)
    throw err
  }
}
