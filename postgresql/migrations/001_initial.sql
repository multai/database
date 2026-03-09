-- Migration 001: Initial schema
-- Run: psql -d multai -f 001_initial.sql

\i ../schema.sql

-- Verify
SELECT 'Migration 001 complete. Tables created:' as status;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
