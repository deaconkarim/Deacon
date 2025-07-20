import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { automationService } from '@/lib/automationService';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabaseClient';
import { Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Helper function to get current user's organization ID
const getCurrentUserOrganizationId = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (error) throw error;
    return data?.organization_id;
  } catch (error) {
    console.error('Error getting user organization:', error);
    return null;
  }
};

export default function AutomationSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState({});
  const [rules, setRules] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [organizationId, setOrganizationId] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    trigger_type: '',
    trigger_conditions: '',
    action_type: '',
    action_data: '',
    is_active: true
  });
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchOrganizationId = async () => {
      try {
        const orgId = await getCurrentUserOrganizationId();
        console.log('AutomationSettings: organization_id =', orgId);
        setOrganizationId(orgId);
        if (orgId) {
          await loadAutomationData(orgId);
          await loadUsers(orgId);
        }
      } catch (error) {
        console.error('Error fetching organization ID:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizationId();
  }, []);

  const loadAutomationData = async (orgId) => {
    try {
      console.log('Loading automation data for organization:', orgId);
      setLoading(true);
      const [settingsData, rulesData, executionsData] = await Promise.all([
        automationService.getAutomationSettings(orgId),
        automationService.getAutomationRules(orgId),
        automationService.getAutomationExecutions(orgId, 10)
      ]);

      console.log('Automation data loaded:', { settingsData, rulesData, executionsData });
      setSettings(settingsData);
      setRules(rulesData);
      setExecutions(executionsData);
    } catch (error) {
      console.error('Error loading automation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async (orgId) => {
    try {
      console.log('Loading users for organization:', orgId);
      
      // Get organization users with member data
      const [orgUsersResult, membersResult] = await Promise.all([
        supabase
          .from('organization_users')
          .select('user_id, role, approval_status')
          .eq('organization_id', orgId)
          .eq('status', 'active')
          .eq('approval_status', 'approved')
          .order('created_at', { ascending: false }),
        supabase
          .from('members')
          .select('id, firstname, lastname, email, user_id')
          .eq('organization_id', orgId)
          .order('firstname', { ascending: true })
      ]);

      if (orgUsersResult.error) throw orgUsersResult.error;
      if (membersResult.error) throw membersResult.error;

      // Create a map of user_id to member data
      const membersMap = new Map();
      membersResult.data?.forEach(member => {
        if (member.user_id) {
          membersMap.set(member.user_id, member);
        }
      });

      // Transform to user list for assignment
      const userList = [];
      orgUsersResult.data?.forEach(orgUser => {
        const member = membersMap.get(orgUser.user_id);
        if (member) {
          userList.push({
            id: member.user_id,
            name: `${member.firstname} ${member.lastname}`,
            email: member.email,
            role: orgUser.role
          });
        }
      });

      console.log('Users loaded:', userList);
      setUsers(userList);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleSettingToggle = async (settingKey, currentValue) => {
    if (!organizationId) return;
    
    try {
      setSaving(true);
      const newValue = !currentValue;
      await automationService.updateAutomationSetting(
        organizationId,
        settingKey,
        newValue
      );
      setSettings(prev => ({ ...prev, [settingKey]: newValue }));
    } catch (error) {
      console.error('Error updating setting:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRuleToggle = async (ruleId, currentActive) => {
    try {
      setSaving(true);
      await automationService.updateAutomationRule(ruleId, {
        is_active: !currentActive
      });
      setRules(prev => prev.map(rule => 
        rule.id === ruleId ? { ...rule, is_active: !currentActive } : rule
      ));
    } catch (error) {
      console.error('Error updating rule:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleEditRule = (rule) => {
    // Parse trigger_conditions and action_data for user-friendly fields
    let tc = {};
    let ad = {};
    try {
      tc = typeof rule.trigger_conditions === 'string' ? JSON.parse(rule.trigger_conditions) : rule.trigger_conditions || {};
    } catch {}
    try {
      ad = typeof rule.action_data === 'string' ? JSON.parse(rule.action_data) : rule.action_data || {};
    } catch {}
    setEditingRule(rule);
    setEditForm({
      name: rule.name,
      description: rule.description,
      trigger_type: rule.trigger_type,
      trigger_conditions: typeof rule.trigger_conditions === 'string' ? rule.trigger_conditions : JSON.stringify(rule.trigger_conditions, null, 2),
      action_type: rule.action_type,
      action_data: typeof rule.action_data === 'string' ? rule.action_data : JSON.stringify(rule.action_data, null, 2),
      is_active: rule.is_active,
      tc_event_type: tc.event_type || 'any',
      tc_member_type: tc.member_type || 'any',
      tc_attendance_status: tc.attendance_status || 'any',
      tc_is_first_visit: tc.is_first_visit === undefined ? 'any' : String(tc.is_first_visit),
      tc_status: tc.status || 'any',
      ad_title: ad.title || '',
      ad_description: ad.description || '',
      ad_priority: ad.priority || '',
      ad_assigned_to: ad.assigned_to || '',
      ad_due_date_offset_days: ad.due_date_offset_days || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveRule = async () => {
    if (!editingRule) return;
    try {
      setSaving(true);
      console.log('🔧 Saving automation rule:', editingRule.id);
      console.log('📝 Edit form data:', editForm);
      
      // Always assemble from form fields for consistency
      const assembledTC = {};
      if (editForm.tc_event_type && editForm.tc_event_type !== 'any') assembledTC.event_type = editForm.tc_event_type;
      if (editForm.tc_member_type && editForm.tc_member_type !== 'any') assembledTC.member_type = editForm.tc_member_type;
      if (editForm.tc_attendance_status && editForm.tc_attendance_status !== 'any') assembledTC.attendance_status = editForm.tc_attendance_status;
      if (editForm.tc_is_first_visit !== '' && editForm.tc_is_first_visit !== 'any') assembledTC.is_first_visit = editForm.tc_is_first_visit === 'true';
      if (editForm.tc_status && editForm.tc_status !== 'any') assembledTC.status = editForm.tc_status;
      
      const assembledAD = {};
      if (editForm.ad_title) assembledAD.title = editForm.ad_title;
      if (editForm.ad_description) assembledAD.description = editForm.ad_description;
      if (editForm.ad_priority) assembledAD.priority = editForm.ad_priority;
      if (editForm.ad_assigned_to) assembledAD.assigned_to = editForm.ad_assigned_to;
      if (editForm.ad_due_date_offset_days) assembledAD.due_date_offset_days = Number(editForm.ad_due_date_offset_days);
      
      console.log('🔧 Assembled trigger conditions:', assembledTC);
      console.log('🔧 Assembled action data:', assembledAD);
      
      const updatedRule = {
        name: editForm.name,
        description: editForm.description,
        trigger_type: editForm.trigger_type,
        trigger_conditions: assembledTC,
        action_type: editForm.action_type,
        action_data: assembledAD,
        is_active: editForm.is_active
      };
      
      console.log('🔧 Final updated rule:', updatedRule);
      
      const result = await automationService.updateAutomationRule(editingRule.id, updatedRule);
      console.log('✅ Rule updated successfully:', result);
      
      setRules(prev => prev.map(rule => rule.id === editingRule.id ? { ...rule, ...updatedRule } : rule));
      setIsEditDialogOpen(false);
      setEditingRule(null);
      
      // Show success message
      toast({
        title: "Success",
        description: "Automation rule updated successfully."
      });
    } catch (error) {
      console.error('❌ Error updating rule:', error);
      toast({
        title: "Error",
        description: "Failed to update automation rule. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!confirm('Are you sure you want to delete this automation rule?')) return;

    try {
      setSaving(true);
      await automationService.deleteAutomationRule(ruleId);
      setRules(prev => prev.filter(rule => rule.id !== ruleId));
    } catch (error) {
      console.error('Error deleting rule:', error);
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
      failed: { color: 'bg-red-100 text-red-800', label: 'Failed' },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      running: { color: 'bg-blue-100 text-blue-800', label: 'Running' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Automation Settings</CardTitle>
            <CardDescription>Manage automated workflows and triggers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!organizationId && !isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Automation Settings</CardTitle>
            <CardDescription>Manage automated workflows and triggers</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-center py-4">
              Unable to load automation settings. Please ensure you are associated with an organization.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Automation Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Automation Settings</CardTitle>
          <CardDescription>Enable or disable automated workflows</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Visitor Follow-up</h4>
              <p className="text-sm text-gray-600">
                Automatically create follow-up tasks when new visitors attend Sunday service
              </p>
            </div>
            <Switch
              checked={settings.visitor_followup_enabled || false}
              onCheckedChange={(checked) => handleSettingToggle('visitor_followup_enabled', settings.visitor_followup_enabled)}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Automation Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Automation Rules</CardTitle>
          <CardDescription>Configure triggers and actions for automated workflows</CardDescription>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No automation rules configured</p>
          ) : (
            <div className="space-y-4">
              {rules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{rule.name}</h4>
                      <Badge variant={rule.is_active ? "default" : "secondary"}>
                        {rule.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>Trigger: {rule.trigger_type}</span>
                      <span>Action: {rule.action_type}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditRule(rule)}
                      disabled={saving}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRule(rule.id)}
                      disabled={saving}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={() => handleRuleToggle(rule.id, rule.is_active)}
                      disabled={saving}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Executions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Executions</CardTitle>
          <CardDescription>Track recent automation executions</CardDescription>
        </CardHeader>
        <CardContent>
          {executions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent executions</p>
          ) : (
            <div className="space-y-3">
              {executions.map((execution) => (
                <div key={execution.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">
                        {execution.automation_rules?.name || 'Unknown Rule'}
                      </h4>
                      {getStatusBadge(execution.status)}
                    </div>
                    <p className="text-xs text-gray-600">
                      {new Date(execution.executed_at).toLocaleString()}
                    </p>
                    {execution.error_message && (
                      <p className="text-xs text-red-600 mt-1">
                        Error: {execution.error_message}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Rule Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Automation Rule</DialogTitle>
            <DialogDescription>
              Modify the automation rule settings and conditions
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Rule Name</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter rule name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter rule description"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="trigger_type">Trigger Type</Label>
                <Select
                  value={editForm.trigger_type}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, trigger_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select trigger type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member_created">Member Created</SelectItem>
                    <SelectItem value="event_attendance">Event Attendance</SelectItem>
                    <SelectItem value="donation_made">Donation Made</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="action_type">Action Type</Label>
                <Select
                  value={editForm.action_type}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, action_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select action type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="create_task">Create Task</SelectItem>
                    <SelectItem value="send_email">Send Email</SelectItem>
                    <SelectItem value="send_sms">Send SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* User-friendly Trigger Conditions */}
            <div className="space-y-2 border-t pt-4 mt-4">
              <Label>Trigger Conditions</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Event Type</Label>
                  <Select
                    value={editForm.tc_event_type || 'any'}
                    onValueChange={v => setEditForm(prev => ({ ...prev, tc_event_type: v === 'any' ? '' : v }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="Worship Service">Worship Service</SelectItem>
                      <SelectItem value="Sunday Worship Service">Sunday Worship Service</SelectItem>
                      <SelectItem value="Bible Study or Class">Bible Study or Class</SelectItem>
                      <SelectItem value="Wednesday Bible Study">Wednesday Bible Study</SelectItem>
                      <SelectItem value="Prayer Meeting">Prayer Meeting</SelectItem>
                      <SelectItem value="Ministry Meeting">Ministry Meeting</SelectItem>
                      <SelectItem value="Outreach Event">Outreach Event</SelectItem>
                      <SelectItem value="Fellowship Gathering">Fellowship Gathering</SelectItem>
                      <SelectItem value="Special Event">Special Event</SelectItem>
                      <SelectItem value="Training or Workshop">Training or Workshop</SelectItem>
                      <SelectItem value="Fundraiser">Fundraiser</SelectItem>
                      <SelectItem value="Trip or Retreat">Trip or Retreat</SelectItem>
                      <SelectItem value="Youth Group">Youth Group</SelectItem>
                      <SelectItem value="Children's Ministry">Children's Ministry</SelectItem>
                      <SelectItem value="Men's Ministry">Men's Ministry</SelectItem>
                      <SelectItem value="Women's Ministry">Women's Ministry</SelectItem>
                      <SelectItem value="Choir Practice">Choir Practice</SelectItem>
                      <SelectItem value="Board Meeting">Board Meeting</SelectItem>
                      <SelectItem value="Deacon Meeting">Deacon Meeting</SelectItem>
                      <SelectItem value="Potluck">Potluck</SelectItem>
                      <SelectItem value="Community Service">Community Service</SelectItem>
                      <SelectItem value="Mission Trip">Mission Trip</SelectItem>
                      <SelectItem value="Conference">Conference</SelectItem>
                      <SelectItem value="Seminar">Seminar</SelectItem>
                      <SelectItem value="Concert">Concert</SelectItem>
                      <SelectItem value="Wedding">Wedding</SelectItem>
                      <SelectItem value="Funeral">Funeral</SelectItem>
                      <SelectItem value="Baptism">Baptism</SelectItem>
                      <SelectItem value="Communion">Communion</SelectItem>
                      <SelectItem value="Dedication">Dedication</SelectItem>
                      <SelectItem value="Graduation">Graduation</SelectItem>
                      <SelectItem value="Anniversary">Anniversary</SelectItem>
                      <SelectItem value="Holiday Service">Holiday Service</SelectItem>
                      <SelectItem value="Easter Service">Easter Service</SelectItem>
                      <SelectItem value="Christmas Service">Christmas Service</SelectItem>
                      <SelectItem value="Thanksgiving Service">Thanksgiving Service</SelectItem>
                      <SelectItem value="New Year's Service">New Year's Service</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Member Type</Label>
                  <Select
                    value={editForm.tc_member_type || 'any'}
                    onValueChange={v => setEditForm(prev => ({ ...prev, tc_member_type: v === 'any' ? '' : v }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="visitor">Visitor</SelectItem>
                      <SelectItem value="adult">Adult</SelectItem>
                      <SelectItem value="child">Child</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Attendance Status</Label>
                  <Select
                    value={editForm.tc_attendance_status || 'any'}
                    onValueChange={v => setEditForm(prev => ({ ...prev, tc_attendance_status: v === 'any' ? '' : v }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="attended">Attended</SelectItem>
                      <SelectItem value="checked-in">Checked In</SelectItem>
                      <SelectItem value="not_attending">Not Attending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Is First Visit</Label>
                  <Select
                    value={editForm.tc_is_first_visit === undefined ? 'any' : String(editForm.tc_is_first_visit)}
                    onValueChange={v => setEditForm(prev => ({ ...prev, tc_is_first_visit: v === 'any' ? undefined : v === 'true' }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={editForm.tc_status || 'any'}
                    onValueChange={v => setEditForm(prev => ({ ...prev, tc_status: v === 'any' ? '' : v }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="visitor">Visitor</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* User-friendly Action Data */}
            <div className="space-y-2 border-t pt-4 mt-4">
              <Label>Action Data</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Task Title</Label>
                  <Input
                    value={editForm.ad_title || ''}
                    onChange={e => setEditForm(prev => ({ ...prev, ad_title: e.target.value }))}
                    placeholder="e.g. Follow up with {member_name}"
                  />
                  <div className="mt-1 text-xs text-gray-500">
                    <span>Available: </span>
                    <code className="bg-gray-100 px-1 rounded">{'{member_name}'}</code>
                    <code className="bg-gray-100 px-1 rounded">{'{event_date_formatted}'}</code>
                    <code className="bg-gray-100 px-1 rounded">{'{phone}'}</code>
                  </div>
                </div>
                <div>
                  <Label>Task Description</Label>
                  <Textarea
                    value={editForm.ad_description || ''}
                    onChange={e => setEditForm(prev => ({ ...prev, ad_description: e.target.value }))}
                    placeholder="e.g. New visitor {member_name} attended..."
                    rows={4}
                    className="font-mono text-sm"
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    <p className="font-medium mb-1">Available variables:</p>
                    <div className="grid grid-cols-2 gap-1">
                      <code className="bg-gray-100 px-1 rounded">{'{member_name}'}</code>
                      <code className="bg-gray-100 px-1 rounded">{'{event_date}'}</code>
                      <code className="bg-gray-100 px-1 rounded">{'{event_date_formatted}'}</code>
                      <code className="bg-gray-100 px-1 rounded">{'{phone}'}</code>
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select
                    value={editForm.ad_priority || ''}
                    onValueChange={v => setEditForm(prev => ({ ...prev, ad_priority: v }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Medium" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Assigned To</Label>
                  <Select
                    value={editForm.ad_assigned_to || ''}
                    onValueChange={v => setEditForm(prev => ({ ...prev, ad_assigned_to: v }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                    <SelectContent>
                      {users.length > 0 ? (
                        users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.role})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-users" disabled>
                          No users available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Due Date Offset (days)</Label>
                  <Input
                    type="number"
                    value={editForm.ad_due_date_offset_days || ''}
                    onChange={e => setEditForm(prev => ({ ...prev, ad_due_date_offset_days: e.target.value }))}
                    placeholder="e.g. 3"
                  />
                </div>
              </div>
            </div>

            {/* Advanced: Raw JSON fallback for unknown fields */}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-gray-500">Advanced: Edit raw JSON</summary>
              <div className="space-y-2 mt-2">
                <Label htmlFor="trigger_conditions">Trigger Conditions (JSON)</Label>
                <Textarea
                  id="trigger_conditions"
                  value={editForm.trigger_conditions}
                  onChange={(e) => setEditForm(prev => ({ ...prev, trigger_conditions: e.target.value }))}
                  rows={4}
                  className="font-mono text-xs"
                />
                <Label htmlFor="action_data">Action Data (JSON)</Label>
                <Textarea
                  id="action_data"
                  value={editForm.action_data}
                  onChange={(e) => setEditForm(prev => ({ ...prev, action_data: e.target.value }))}
                  rows={4}
                  className="font-mono text-xs"
                />
              </div>
            </details>

            <div className="flex items-center space-x-2 mt-4">
              <Switch
                id="is_active"
                checked={editForm.is_active}
                onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRule} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 