-- Get all table schemas for the ChurchApp database
SELECT 
  t.table_name,
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default,
  CASE 
    WHEN c.data_type = 'character varying' THEN c.character_maximum_length::text
    WHEN c.data_type = 'numeric' THEN c.numeric_precision::text || ',' || c.numeric_scale::text
    ELSE NULL
  END as constraints
FROM information_schema.tables t
JOIN information_schema.columns c ON c.table_name = t.table_name
WHERE t.table_schema = 'public' 
  AND t.table_type = 'BASE TABLE'
  AND t.table_name IN ('organizations', 'members', 'events', 'donations', 'groups', 'tasks', 'donation_batches', 'sms_conversations', 'automation_rules')
ORDER BY t.table_name, c.ordinal_position;
