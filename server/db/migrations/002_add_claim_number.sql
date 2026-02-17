-- Add claim_number for EOB table extraction
ALTER TABLE eobs ADD COLUMN IF NOT EXISTS claim_number TEXT;
