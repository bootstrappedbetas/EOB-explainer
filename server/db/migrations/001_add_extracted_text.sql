-- Add extracted_text column for raw PDF text (ai_summary reserved for AI output)
ALTER TABLE eobs ADD COLUMN IF NOT EXISTS extracted_text TEXT;
