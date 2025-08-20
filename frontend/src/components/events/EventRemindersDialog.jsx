import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  Users, 
  MessageSquare, 
  Settings,
  TestTube,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  MapPin,
  User,
  Group,
  Target,
  Send,
  Save,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { eventReminderService } from '@/lib/eventReminderService';
import { format } from 'date-fns';

export function EventRemindersDialog({ event, isOpen, onClose, onUpdate }) {
  const [reminders, setReminders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [activeTab, setActiveTab] = useState('configs');
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({});
  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewMessage, setPreviewMessage] = useState('');

  const { toast } = useToast();

  // Form state for creating/editing reminders
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    reminder_type: 'sms',
    timing_hours: 24,
    message_template: '',
    target_type: 'all',
    target_groups: [],
    target_members: [],
    is_active: true
  });

  useEffect(() => {
    if (isOpen && event) {
      loadData();
    }
  }, [isOpen, event]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [
        remindersData,
        logsData,
        statsData,
        groupsData,
        membersData,
        templatesData
      ] = await Promise.all([
        eventReminderService.getEventReminders(event.id),
        eventReminderService.getEventReminderLogs(event.id),
        eventReminderService.getEventReminderStats(event.id),
        eventReminderService.getTargetGroups(),
        eventReminderService.getTargetMembers(),
        eventReminderService.getReminderTemplates()
      ]);

      setReminders(remindersData);
      setLogs(logsData);
      setStats(statsData);
      setGroups(groupsData);
      setMembers(membersData);
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error loading reminder data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reminder data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateReminder = async () => {
    try {
      setIsCreating(true);
      const newReminder = await eventReminderService.createEventReminder({
        ...formData,
        event_id: event.id
      });
      
      setReminders([...reminders, newReminder]);
      resetForm();
      toast({
        title: 'Success',
        description: 'Reminder configuration created successfully'
      });
    } catch (error) {
      console.error('Error creating reminder:', error);
      toast({
        title: 'Error',
        description: 'Failed to create reminder configuration',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateReminder = async () => {
    try {
      setIsEditing(true);
      const updatedReminder = await eventReminderService.updateEventReminder(
        editingReminder.id,
        formData
      );
      
      setReminders(reminders.map(r => r.id === updatedReminder.id ? updatedReminder : r));
      resetForm();
      toast({
        title: 'Success',
        description: 'Reminder configuration updated successfully'
      });
    } catch (error) {
      console.error('Error updating reminder:', error);
      toast({
        title: 'Error',
        description: 'Failed to update reminder configuration',
        variant: 'destructive'
      });
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteReminder = async (reminderId) => {
    if (!confirm('Are you sure you want to delete this reminder configuration?')) {
      return;
    }

    try {
      await eventReminderService.deleteEventReminder(reminderId);
      setReminders(reminders.filter(r => r.id !== reminderId));
      toast({
        title: 'Success',
        description: 'Reminder configuration deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting reminder:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete reminder configuration',
        variant: 'destructive'
      });
    }
  };

  const handleEditReminder = (reminder) => {
    setEditingReminder(reminder);
    setFormData({
      name: reminder.name,
      description: reminder.description,
      reminder_type: reminder.reminder_type,
      timing_hours: reminder.timing_hours,
      message_template: reminder.message_template,
      target_type: reminder.target_type,
      target_groups: reminder.target_groups || [],
      target_members: reminder.target_members || [],
      is_active: reminder.is_active
    });
    setIsEditing(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      reminder_type: 'sms',
      timing_hours: 24,
      message_template: '',
      target_type: 'all',
      target_groups: [],
      target_members: [],
      is_active: true
    });
    setEditingReminder(null);
    setIsEditing(false);
  };

  const handleSendTest = async () => {
    if (!testPhone || !editingReminder) return;

    try {
      setIsSendingTest(true);
      await eventReminderService.sendTestReminder(editingReminder.id, testPhone);
      setShowTestDialog(false);
      setTestPhone('');
      toast({
        title: 'Success',
        description: 'Test reminder sent successfully'
      });
    } catch (error) {
      console.error('Error sending test reminder:', error);
      toast({
        title: 'Error',
        description: 'Failed to send test reminder',
        variant: 'destructive'
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handlePreviewMessage = async () => {
    try {
      const preview = await eventReminderService.previewReminderMessage(
        formData.message_template,
        event.id
      );
      setPreviewMessage(preview);
      setShowPreview(true);
    } catch (error) {
      console.error('Error previewing message:', error);
      toast({
        title: 'Error',
        description: 'Failed to preview message',
        variant: 'destructive'
      });
    }
  };

  const getTargetTypeLabel = (type) => {
    switch (type) {
      case 'all': return 'All Members';
      case 'groups': return 'Specific Groups';
      case 'members': return 'Specific Members';
      case 'rsvp_attendees': return 'RSVP Attendees';
      case 'rsvp_declined': return 'RSVP Declined';
      default: return type;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Event Reminders
            </DialogTitle>
            <DialogDescription>
              Configure SMS reminders for "{event?.title}"
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="configs">Configurations</TabsTrigger>
              <TabsTrigger value="logs">Reminder Logs</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="configs" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Reminder Configurations</h3>
                <Button onClick={() => setIsEditing(false)} disabled={isEditing}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Reminder
                </Button>
              </div>

              {/* Create/Edit Form */}
              {(isEditing || !isEditing) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {isEditing ? 'Edit Reminder' : 'Create New Reminder'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          placeholder="e.g., 24-hour reminder"
                        />
                      </div>
                      <div>
                        <Label htmlFor="timing_hours">Timing (hours before event)</Label>
                        <Input
                          id="timing_hours"
                          type="number"
                          value={formData.timing_hours}
                          onChange={(e) => setFormData({...formData, timing_hours: parseInt(e.target.value)})}
                          min="1"
                          max="168"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="Optional description"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="target_type">Target Recipients</Label>
                        <Select
                          value={formData.target_type}
                          onValueChange={(value) => setFormData({...formData, target_type: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Members</SelectItem>
                            <SelectItem value="groups">Specific Groups</SelectItem>
                            <SelectItem value="members">Specific Members</SelectItem>
                            <SelectItem value="rsvp_attendees">RSVP Attendees</SelectItem>
                            <SelectItem value="rsvp_declined">RSVP Declined</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="reminder_type">Reminder Type</Label>
                        <Select
                          value={formData.reminder_type}
                          onValueChange={(value) => setFormData({...formData, reminder_type: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sms">SMS</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {formData.target_type === 'groups' && (
                      <div>
                        <Label>Select Groups</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {groups.map(group => (
                            <div key={group.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`group-${group.id}`}
                                checked={formData.target_groups.includes(group.id)}
                                onCheckedChange={(checked) => {
                                  const newGroups = checked
                                    ? [...formData.target_groups, group.id]
                                    : formData.target_groups.filter(id => id !== group.id);
                                  setFormData({...formData, target_groups: newGroups});
                                }}
                              />
                              <Label htmlFor={`group-${group.id}`}>{group.name}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {formData.target_type === 'members' && (
                      <div>
                        <Label>Select Members</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                          {members.map(member => (
                            <div key={member.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`member-${member.id}`}
                                checked={formData.target_members.includes(member.id)}
                                onCheckedChange={(checked) => {
                                  const newMembers = checked
                                    ? [...formData.target_members, member.id]
                                    : formData.target_members.filter(id => id !== member.id);
                                  setFormData({...formData, target_members: newMembers});
                                }}
                              />
                              <Label htmlFor={`member-${member.id}`}>
                                {member.firstname} {member.lastname}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="message_template">Message Template</Label>
                      <div className="flex gap-2 mb-2">
                        <Select
                          onValueChange={(templateId) => {
                            const template = templates.find(t => t.id === templateId);
                            if (template) {
                              setFormData({...formData, message_template: template.template_text});
                            }
                          }}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Choose template" />
                          </SelectTrigger>
                          <SelectContent>
                            {templates.map(template => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handlePreviewMessage}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                      </div>
                      <Textarea
                        id="message_template"
                        value={formData.message_template}
                        onChange={(e) => setFormData({...formData, message_template: e.target.value})}
                        placeholder="Enter your message template. Use {event_title}, {event_time}, {event_date}, {event_location}, {hours_until_event}, {member_name} as variables."
                        rows={4}
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Available variables: {'{event_title}'}, {'{event_time}'}, {'{event_date}'}, {'{event_location}'}, {'{hours_until_event}'}, {'{member_name}'}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                      />
                      <Label htmlFor="is_active">Active</Label>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={isEditing ? handleUpdateReminder : handleCreateReminder}
                        disabled={isCreating || !formData.name || !formData.message_template}
                      >
                        {isCreating ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        {isEditing ? 'Update' : 'Create'} Reminder
                      </Button>
                      {isEditing && (
                        <Button variant="outline" onClick={resetForm}>
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Reminder Configurations List */}
              <div className="space-y-4">
                {reminders.map(reminder => (
                  <Card key={reminder.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{reminder.name}</h4>
                            <Badge variant={reminder.is_active ? "default" : "secondary"}>
                              {reminder.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            <Badge variant="outline">
                              {reminder.timing_hours}h before
                            </Badge>
                          </div>
                          {reminder.description && (
                            <p className="text-sm text-gray-600 mb-2">{reminder.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Target className="w-4 h-4" />
                              {getTargetTypeLabel(reminder.target_type)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-4 h-4" />
                              {reminder.reminder_type.toUpperCase()}
                            </span>
                            {reminder.last_sent && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                Last sent: {format(new Date(reminder.last_sent), 'MMM d, yyyy HH:mm')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditReminder(reminder)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingReminder(reminder);
                              setShowTestDialog(true);
                            }}
                          >
                            <TestTube className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteReminder(reminder.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="logs" className="space-y-4">
              <h3 className="text-lg font-semibold">Reminder Logs</h3>
              <div className="space-y-2">
                {logs.map(log => (
                  <Card key={log.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusIcon(log.status)}
                            <Badge className={getStatusColor(log.status)}>
                              {log.status}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {format(new Date(log.sent_at), 'MMM d, yyyy HH:mm')}
                            </span>
                          </div>
                          <p className="text-sm mb-2">{log.message_sent}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            {log.member && (
                              <span className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                {log.member.firstname} {log.member.lastname}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-4 h-4" />
                              {log.phone_number}
                            </span>
                            {log.reminder_config && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {log.reminder_config.timing_hours}h reminder
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {logs.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No reminder logs found</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="stats" className="space-y-4">
              <h3 className="text-lg font-semibold">Reminder Statistics</h3>
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Send className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-500">Total Sent</p>
                        <p className="text-2xl font-bold">{stats.totalSent || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="text-sm text-gray-500">Delivered</p>
                        <p className="text-2xl font-bold">{stats.delivered || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-500" />
                      <div>
                        <p className="text-sm text-gray-500">Failed</p>
                        <p className="text-2xl font-bold">{stats.failed || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-purple-500" />
                      <div>
                        <p className="text-sm text-gray-500">Delivery Rate</p>
                        <p className="text-2xl font-bold">{stats.deliveryRate || 0}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {Object.keys(stats.timingBreakdown || {}).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Reminders by Timing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(stats.timingBreakdown).map(([hours, count]) => (
                        <div key={hours} className="flex justify-between items-center">
                          <span className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {hours} hours before
                          </span>
                          <Badge>{count} sent</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <h3 className="text-lg font-semibold">Event Reminder Settings</h3>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Configure default reminder settings for this event. These settings will be used when creating new reminder configurations.
                  </p>
                  {/* Add event-level reminder settings here */}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Test Reminder Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Reminder</DialogTitle>
            <DialogDescription>
              Send a test reminder to verify your configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="test-phone">Phone Number</Label>
              <Input
                id="test-phone"
                type="tel"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="+1234567890"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendTest}
              disabled={!testPhone || isSendingTest}
            >
              {isSendingTest ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message Preview</DialogTitle>
            <DialogDescription>
              Preview how your message will appear to recipients
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Preview:</p>
              <p className="whitespace-pre-wrap">{previewMessage}</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowPreview(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}