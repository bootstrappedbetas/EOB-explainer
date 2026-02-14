-- EOB Explainer Database Schema
-- Run this against your PostgreSQL database to create the tables

-- Users (linked to Auth0)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth0_sub TEXT UNIQUE NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Explanation of Benefits
CREATE TABLE IF NOT EXISTS eobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member TEXT,
  plan TEXT,
  service_date DATE,
  provider TEXT,
  amount_owed DECIMAL(12, 2) DEFAULT 0,
  amount_charged DECIMAL(12, 2),
  insurance_paid DECIMAL(12, 2),
  file_path TEXT,
  extracted_text TEXT,
  ai_summary TEXT,
  status TEXT DEFAULT 'pending',
  procedure_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fetching EOBs by user
CREATE INDEX IF NOT EXISTS idx_eobs_user_id ON eobs(user_id);
CREATE INDEX IF NOT EXISTS idx_eobs_created_at ON eobs(created_at DESC);

-- Benchmark data (for comparison chart - populated over time)
CREATE TABLE IF NOT EXISTS benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_code TEXT NOT NULL,
  region TEXT NOT NULL,
  avg_amount DECIMAL(12, 2) NOT NULL,
  sample_size INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(procedure_code, region)
);
