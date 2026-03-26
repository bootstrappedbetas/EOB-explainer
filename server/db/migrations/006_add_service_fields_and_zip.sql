-- Add high-level service fields and zip information for benchmarking

-- EOB-level fields
ALTER TABLE eobs
  ADD COLUMN IF NOT EXISTS service_summary TEXT,
  ADD COLUMN IF NOT EXISTS service_category TEXT,
  ADD COLUMN IF NOT EXISTS service_cpt_group TEXT[],
  ADD COLUMN IF NOT EXISTS patient_zip TEXT;

-- User-level zip code (for default location)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS zip_code TEXT;

