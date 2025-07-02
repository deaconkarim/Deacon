-- Drop all alert-related tables and functions
-- Run this in your Supabase SQL editor to completely remove the alerts system

-- Drop tables in the correct order (due to foreign key constraints)
DROP TABLE IF EXISTS alert_logs CASCADE;
DROP TABLE IF EXISTS alert_recipients CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;

-- Drop any alert-related functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Verify tables are dropped
SELECT 'Alerts tables dropped successfully' as status; 