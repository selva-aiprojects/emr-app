-- ============================================================
-- CREATE EMR SCHEMA IF NOT EXISTS
-- Run this FIRST if emr schema doesn't exist
-- ============================================================

-- Create emr schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS emr;

-- Grant permissions
GRANT ALL ON SCHEMA emr TO postgres;
GRANT ALL ON SCHEMA emr TO authenticated; -- If using RLS
