-- Test Location Functions
-- Run this in your Supabase SQL Editor to check if functions exist

-- Check if functions exist
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name IN ('check_location_conflict', 'get_available_locations')
AND routine_schema = 'public';

-- Test the check_location_conflict function with dummy data
SELECT * FROM check_location_conflict(
  'test-location-id',
  NOW(),
  NOW() + INTERVAL '1 hour',
  NULL,
  NULL
);

-- Test the get_available_locations function with dummy data
SELECT * FROM get_available_locations(
  NOW(),
  NOW() + INTERVAL '1 hour',
  '00000000-0000-0000-0000-000000000000'::UUID
); 