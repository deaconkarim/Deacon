-- Check if automation rules exist for the organization
SELECT 
  ar.name,
  ar.trigger_type,
  ar.trigger_conditions,
  ar.action_type,
  ar.is_active,
  o.name as organization_name
FROM automation_rules ar
JOIN organizations o ON ar.organization_id = o.id
ORDER BY ar.created_at DESC;

-- Check if automation settings exist
SELECT 
  as2.setting_key,
  as2.setting_value,
  o.name as organization_name
FROM automation_settings as2
JOIN organizations o ON as2.organization_id = o.id
ORDER BY as2.created_at DESC;

-- Create automation rules for the first organization if they don't exist
INSERT INTO automation_rules (organization_id, name, description, trigger_type, trigger_conditions, action_type, action_data) 
SELECT 
  o.id,
  'Visitor Follow-up Task',
  'Create a follow-up task when a new visitor attends Sunday service',
  'event_attendance',
  '{
    "event_type": "Sunday Worship Service",
    "member_type": "visitor",
    "attendance_status": "attended",
    "is_first_visit": true
  }',
  'create_task',
  '{
    "task_type": "follow_up",
    "title": "Follow up with {member_name}",
    "description": "New visitor {member_name} attended Sunday service on {event_date}. Schedule a follow-up call or visit.",
    "priority": "medium",
    "assigned_to": "pastor",
    "due_date_offset_days": 3
  }'
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM automation_rules 
  WHERE organization_id = o.id 
  AND name = 'Visitor Follow-up Task'
);

-- Create automation rule for any visitor attendance
INSERT INTO automation_rules (organization_id, name, description, trigger_type, trigger_conditions, action_type, action_data) 
SELECT 
  o.id,
  'Visitor Attendance Follow-up',
  'Create a follow-up task when any visitor attends an event',
  'event_attendance',
  '{
    "member_type": "visitor",
    "attendance_status": "attended",
    "is_first_visit": true
  }',
  'create_task',
  '{
    "task_type": "follow_up",
    "title": "Follow up with {member_name}",
    "description": "New visitor {member_name} attended an event on {event_date}. Schedule a follow-up call or visit.",
    "priority": "medium",
    "assigned_to": "pastor",
    "due_date_offset_days": 3
  }'
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM automation_rules 
  WHERE organization_id = o.id 
  AND name = 'Visitor Attendance Follow-up'
);

-- Create automation rule for new visitor creation
INSERT INTO automation_rules (organization_id, name, description, trigger_type, trigger_conditions, action_type, action_data) 
SELECT 
  o.id,
  'New Visitor Welcome Task',
  'Create a welcome task when a new visitor is created',
  'member_created',
  '{
    "status": "visitor",
    "member_type": "visitor"
  }',
  'create_task',
  '{
    "task_type": "welcome",
    "title": "Welcome new visitor {member_name}",
    "description": "New visitor {member_name} was added to the system. Send a welcome message and invite them to upcoming events.",
    "priority": "medium",
    "assigned_to": "pastor",
    "due_date_offset_days": 1
  }'
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM automation_rules 
  WHERE organization_id = o.id 
  AND name = 'New Visitor Welcome Task'
);

-- Create automation settings
INSERT INTO automation_settings (organization_id, setting_key, setting_value, description) 
SELECT 
  o.id,
  'visitor_followup_enabled',
  'true',
  'Automatically create follow-up tasks when new visitors attend Sunday service'
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM automation_settings 
  WHERE organization_id = o.id 
  AND setting_key = 'visitor_followup_enabled'
);

-- Show final state
SELECT 'Final automation rules:' as status;
SELECT 
  ar.name,
  ar.trigger_type,
  ar.is_active,
  o.name as organization_name
FROM automation_rules ar
JOIN organizations o ON ar.organization_id = o.id
ORDER BY ar.created_at DESC; 