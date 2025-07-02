-- Create automation settings table for church-wide automation controls
CREATE TABLE IF NOT EXISTS automation_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, setting_key)
);

-- Create automation rules table for defining automation triggers and actions
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL, -- 'event_attendance', 'member_created', 'donation_made', etc.
  trigger_conditions JSONB NOT NULL, -- Conditions that must be met to trigger
  action_type TEXT NOT NULL, -- 'create_task', 'send_email', 'send_sms', etc.
  action_data JSONB NOT NULL, -- Data needed to execute the action
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create automation executions table to track when automations run
CREATE TABLE IF NOT EXISTS automation_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES automation_rules(id) ON DELETE CASCADE,
  trigger_record_id UUID, -- ID of the record that triggered the automation
  trigger_record_type TEXT, -- Type of record that triggered (e.g., 'event_attendance')
  status TEXT DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  result_data JSONB, -- Results of the automation execution
  error_message TEXT,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_automation_settings_org_key ON automation_settings(organization_id, setting_key);
CREATE INDEX IF NOT EXISTS idx_automation_rules_org_type ON automation_rules(organization_id, trigger_type);
CREATE INDEX IF NOT EXISTS idx_automation_rules_active ON automation_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_automation_executions_rule ON automation_executions(rule_id);
CREATE INDEX IF NOT EXISTS idx_automation_executions_status ON automation_executions(status);
CREATE INDEX IF NOT EXISTS idx_automation_executions_trigger ON automation_executions(trigger_record_type, trigger_record_id);

-- Add RLS policies for automation settings
ALTER TABLE automation_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view automation settings in their organization" ON automation_settings;
CREATE POLICY "Users can view automation settings in their organization" ON automation_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND ou.organization_id = automation_settings.organization_id
    )
  );

DROP POLICY IF EXISTS "Users can insert automation settings in their organization" ON automation_settings;
CREATE POLICY "Users can insert automation settings in their organization" ON automation_settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND ou.organization_id = automation_settings.organization_id
    )
  );

DROP POLICY IF EXISTS "Users can update automation settings in their organization" ON automation_settings;
CREATE POLICY "Users can update automation settings in their organization" ON automation_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND ou.organization_id = automation_settings.organization_id
    )
  );

-- Add RLS policies for automation rules
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view automation rules in their organization" ON automation_rules;
CREATE POLICY "Users can view automation rules in their organization" ON automation_rules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND ou.organization_id = automation_rules.organization_id
    )
  );

DROP POLICY IF EXISTS "Users can insert automation rules in their organization" ON automation_rules;
CREATE POLICY "Users can insert automation rules in their organization" ON automation_rules
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND ou.organization_id = automation_rules.organization_id
    )
  );

DROP POLICY IF EXISTS "Users can update automation rules in their organization" ON automation_rules;
CREATE POLICY "Users can update automation rules in their organization" ON automation_rules
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND ou.organization_id = automation_rules.organization_id
    )
  );

DROP POLICY IF EXISTS "Users can delete automation rules in their organization" ON automation_rules;
CREATE POLICY "Users can delete automation rules in their organization" ON automation_rules
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND ou.organization_id = automation_rules.organization_id
    )
  );

-- Add RLS policies for automation executions
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view automation executions in their organization" ON automation_executions;
CREATE POLICY "Users can view automation executions in their organization" ON automation_executions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND ou.organization_id = automation_executions.organization_id
    )
  );

DROP POLICY IF EXISTS "Users can insert automation executions in their organization" ON automation_executions;
CREATE POLICY "Users can insert automation executions in their organization" ON automation_executions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND ou.organization_id = automation_executions.organization_id
    )
  );

DROP POLICY IF EXISTS "Users can update automation executions in their organization" ON automation_executions;
CREATE POLICY "Users can update automation executions in their organization" ON automation_executions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND ou.organization_id = automation_executions.organization_id
    )
  );

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_automation_settings_updated_at ON automation_settings;
CREATE TRIGGER update_automation_settings_updated_at 
  BEFORE UPDATE ON automation_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_automation_rules_updated_at ON automation_rules;
CREATE TRIGGER update_automation_rules_updated_at 
  BEFORE UPDATE ON automation_rules 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed default automation settings for visitor follow-up
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

-- Seed default automation rule for visitor follow-up (event attendance) - specific to Sunday service
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

-- Seed default automation rule for any visitor attendance
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

-- Seed default automation rule for new visitor creation
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