-- Fix event types that were incorrectly set to 'Fellowship Activity'
-- Migration: 20250109000001_fix_event_types.sql

-- Update Sunday Worship Service events
UPDATE events 
SET event_type = 'Sunday Service'
WHERE (
  id LIKE '%sunday-morning-worship-service%' 
  OR LOWER(title) LIKE '%sunday%worship%'
  OR LOWER(title) LIKE '%sunday%service%'
);

-- Update Bible Study events  
UPDATE events 
SET event_type = 'Bible Study'
WHERE (
  id LIKE '%bible-study%'
  OR LOWER(title) LIKE '%bible%study%'
  OR LOWER(title) LIKE '%tuesday%bible%'
  OR LOWER(title) LIKE '%wednesday%bible%'
);

-- Keep Potluck events as Fellowship Activity (they're already correct)
UPDATE events 
SET event_type = 'Fellowship Activity'
WHERE (
  id LIKE '%potluck%'
  OR LOWER(title) LIKE '%potluck%'
  OR id LIKE '%fifth-sunday-potluck%'
);

-- Keep Men's Ministry events as Fellowship Activity  
UPDATE events 
SET event_type = 'Fellowship Activity'
WHERE (
  id LIKE '%men-s-ministry%'
  OR LOWER(title) LIKE '%men%ministry%'
  OR LOWER(title) LIKE '%breakfast%'
); 