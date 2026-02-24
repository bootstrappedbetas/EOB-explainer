-- Add group_number and member_id for better plan tracking
ALTER TABLE eobs ADD COLUMN IF NOT EXISTS group_number TEXT;
ALTER TABLE eobs ADD COLUMN IF NOT EXISTS member_id TEXT;
