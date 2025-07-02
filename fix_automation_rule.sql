-- Fix the automation rule to use the correct event_type
UPDATE automation_rules 
SET trigger_conditions = '{
  "event_type": "Sunday Worship Service",
  "member_type": "visitor",
  "attendance_status": "attended",
  "is_first_visit": true
}'
WHERE name = 'Visitor Follow-up Task'; 