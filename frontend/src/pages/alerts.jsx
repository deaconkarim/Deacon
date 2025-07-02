import React, { useState, useEffect } from 'react';
import { format, addDays, isToday, isTomorrow } from 'date-fns';
import { 
  Bell, 
  Calendar, 
  Users, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  MessageSquare,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';

export function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateAlertOpen, setIsCreateAlertOpen] = useState(false);
  const [isEditAlertOpen, setIsEditAlertOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [newAlert, setNewAlert] = useState({
    name: '',
    type: 'birthday',
    message_template: '',
    send_via: ['sms'],
    send_time: '09:00',
    days_before: 1,
    is_active: true,
    recipients: 'all'
  });
  const { toast } = useToast();

  useEffect(() => {
    loadAlerts();
    loadUpcomingEvents();
  }, []);

  const loadAlerts = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: orgData } = await supabase
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (!orgData?.organization_id) throw new Error('User not associated with any organization');

      // For now, we'll use a simple structure. In a real app, you'd have an alerts table
      const defaultAlerts = [
        {
          id: 1,
          name: 'Birthday Reminders',
          type: 'birthday',
          message_template: 'Happy Birthday {first_name}! We hope you have a wonderful day celebrating with family and friends. Blessings from your church family!',
          send_via: ['sms'],
          send_time: '09:00',
          days_before: 0,
          is_active: true,
          recipients: 'all',
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          name: 'Anniversary Reminders',
          type: 'anniversary',
          message_template: 'Happy Anniversary {first_name} & {spouse_name}! May God continue to bless your marriage. We\'re celebrating with you!',
          send_via: ['sms'],
          send_time: '09:00',
          days_before: 0,
          is_active: true,
          recipients: 'married',
          created_at: new Date().toISOString()
        },
        {
          id: 3,
          name: 'Birthday Week Ahead',
          type: 'birthday',
          message_template: 'We noticed {first_name} has a birthday coming up this week! Let\'s make sure to celebrate them.',
          send_via: ['email'],
          send_time: '08:00',
          days_before: 7,
          is_active: true,
          recipients: 'leaders',
          created_at: new Date().toISOString()
        }
      ];

      setAlerts(defaultAlerts);
    } catch (error) {
      console.error('Error loading alerts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load alerts',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadUpcomingEvents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: orgData } = await supabase
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (!orgData?.organization_id) return;

      // Get members with birthdays and anniversaries in the next 30 days
      const { data: members } = await supabase
        .from('members')
        .select('id, firstname, lastname, birth_date, anniversary_date, phone, email, spouse_name, communication_preferences')
        .eq('organization_id', orgData.organization_id)
        .eq('status', 'active');

      if (!members) return;

      const today = new Date();
      const thirtyDaysFromNow = addDays(today, 30);
      
      const upcoming = [];

      members.forEach(member => {
        // Check birthdays
        if (member.birth_date) {
          const birthDate = new Date(member.birth_date);
          const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
          const nextYearBirthday = new Date(today.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());
          
          let nextBirthday = thisYearBirthday;
          if (thisYearBirthday < today) {
            nextBirthday = nextYearBirthday;
          }

          if (nextBirthday <= thirtyDaysFromNow) {
            upcoming.push({
              id: `birthday-${member.id}`,
              type: 'birthday',
              member: member,
              date: nextBirthday,
              isToday: isToday(nextBirthday),
              isTomorrow: isTomorrow(nextBirthday)
            });
          }
        }

        // Check anniversaries
        if (member.anniversary_date) {
          const anniversaryDate = new Date(member.anniversary_date);
          const thisYearAnniversary = new Date(today.getFullYear(), anniversaryDate.getMonth(), anniversaryDate.getDate());
          const nextYearAnniversary = new Date(today.getFullYear() + 1, anniversaryDate.getMonth(), anniversaryDate.getDate());
          
          let nextAnniversary = thisYearAnniversary;
          if (thisYearAnniversary < today) {
            nextAnniversary = nextYearAnniversary;
          }

          if (nextAnniversary <= thirtyDaysFromNow) {
            upcoming.push({
              id: `anniversary-${member.id}`,
              type: 'anniversary',
              member: member,
              date: nextAnniversary,
              isToday: isToday(nextAnniversary),
              isTomorrow: isTomorrow(nextAnniversary)
            });
          }
        }
      });

      // Sort by date
      upcoming.sort((a, b) => a.date - b.date);
      setUpcomingEvents(upcoming);
    } catch (error) {
      console.error('Error loading upcoming events:', error);
    }
  };

  const handleCreateAlert = async () => {
    try {
      // In a real app, you'd save to the database
      const newAlertWithId = {
        ...newAlert,
        id: Date.now(),
        created_at: new Date().toISOString()
      };
      
      setAlerts([...alerts, newAlertWithId]);
      setIsCreateAlertOpen(false);
      setNewAlert({
        name: '',
        type: 'birthday',
        message_template: '',
        send_via: ['sms'],
        send_time: '09:00',
        days_before: 1,
        is_active: true,
        recipients: 'all'
      });
      
      toast({
        title: 'Success',
        description: 'Alert created successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create alert',
        variant: 'destructive'
      });
    }
  };

  const handleEditAlert = async () => {
    try {
      const updatedAlerts = alerts.map(alert => 
        alert.id === editingAlert.id ? editingAlert : alert
      );
      setAlerts(updatedAlerts);
      setIsEditAlertOpen(false);
      setEditingAlert(null);
      
      toast({
        title: 'Success',
        description: 'Alert updated successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update alert',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteAlert = async (alertId) => {
    try {
      setAlerts(alerts.filter(alert => alert.id !== alertId));
      toast({
        title: 'Success',
        description: 'Alert deleted successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete alert',
        variant: 'destructive'
      });
    }
  };

  const toggleAlertStatus = async (alertId) => {
    try {
      const updatedAlerts = alerts.map(alert => 
        alert.id === alertId ? { ...alert, is_active: !alert.is_active } : alert
      );
      setAlerts(updatedAlerts);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update alert status',
        variant: 'destructive'
      });
    }
  };

  const getEventTypeIcon = (type) => {
    return type === 'birthday' ? <Calendar className="h-4 w-4" /> : <Users className="h-4 w-4" />;
  };

  const getEventTypeColor = (type) => {
    return type === 'birthday' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
  };

  const getUrgencyColor = (isToday, isTomorrow) => {
    if (isToday) return 'bg-red-100 text-red-800';
    if (isTomorrow) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  };

  if (isLoading) {
    return (
      <div className="w-full px-4 md:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading alerts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 md:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Alerts & Reminders</h1>
          <p className="text-gray-600 text-lg">Manage automated birthday and anniversary alerts</p>
        </div>
        <Button onClick={() => setIsCreateAlertOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Alert
        </Button>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
          <TabsTrigger value="alerts">Alert Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          <div className="grid gap-4">
            {upcomingEvents.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Upcoming Events</h3>
                  <p className="text-muted-foreground">
                    No birthdays or anniversaries in the next 30 days.
                  </p>
                </CardContent>
              </Card>
            ) : (
              upcomingEvents.map((event) => (
                <Card key={event.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-full ${getEventTypeColor(event.type)}`}>
                          {getEventTypeIcon(event.type)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {event.member.firstname} {event.member.lastname}
                            {event.type === 'anniversary' && event.member.spouse_name && (
                              <span className="text-muted-foreground"> & {event.member.spouse_name}</span>
                            )}
                          </h3>
                          <p className="text-muted-foreground">
                            {event.type === 'birthday' ? 'Birthday' : 'Anniversary'} • {format(event.date, 'MMMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getUrgencyColor(event.isToday, event.isTomorrow)}>
                          {event.isToday ? 'Today' : event.isTomorrow ? 'Tomorrow' : format(event.date, 'MMM d')}
                        </Badge>
                        <div className="flex space-x-1">
                          {event.member.phone && (
                            <Button size="sm" variant="outline">
                              <MessageSquare className="h-3 w-3" />
                            </Button>
                          )}
                          {event.member.email && (
                            <Button size="sm" variant="outline">
                              <Mail className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="grid gap-4">
            {alerts.map((alert) => (
              <Card key={alert.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{alert.name}</CardTitle>
                      <CardDescription>
                        {alert.type === 'birthday' ? 'Birthday' : 'Anniversary'} alerts • 
                        {alert.days_before > 0 ? ` ${alert.days_before} day${alert.days_before > 1 ? 's' : ''} before` : ' On the day'} • 
                        {alert.send_time}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAlertStatus(alert.id)}
                      >
                        {alert.is_active ? (
                          <ToggleRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingAlert(alert);
                          setIsEditAlertOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAlert(alert.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Message Template:</div>
                    <div className="p-3 bg-muted rounded-md text-sm">
                      {alert.message_template}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="h-3 w-3" />
                        <span>{alert.send_via.includes('sms') ? 'SMS' : 'No SMS'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Mail className="h-3 w-3" />
                        <span>{alert.send_via.includes('email') ? 'Email' : 'No Email'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{alert.recipients === 'all' ? 'All Members' : alert.recipients}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Alert Dialog */}
      <Dialog open={isCreateAlertOpen} onOpenChange={setIsCreateAlertOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Alert</DialogTitle>
            <DialogDescription>
              Set up automated alerts for birthdays and anniversaries.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="alert_name">Alert Name *</Label>
              <Input
                id="alert_name"
                value={newAlert.name}
                onChange={(e) => setNewAlert({...newAlert, name: e.target.value})}
                placeholder="Birthday Reminders"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="alert_type">Event Type *</Label>
                <select
                  id="alert_type"
                  value={newAlert.type}
                  onChange={(e) => setNewAlert({...newAlert, type: e.target.value})}
                  className="w-full p-2 border border-input rounded-md bg-background"
                >
                  <option value="birthday">Birthday</option>
                  <option value="anniversary">Anniversary</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alert_recipients">Recipients</Label>
                <select
                  id="alert_recipients"
                  value={newAlert.recipients}
                  onChange={(e) => setNewAlert({...newAlert, recipients: e.target.value})}
                  className="w-full p-2 border border-input rounded-md bg-background"
                >
                  <option value="all">All Members</option>
                  <option value="leaders">Ministry Leaders</option>
                  <option value="married">Married Members</option>
                  <option value="active">Active Members</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="alert_time">Send Time *</Label>
                <Input
                  id="alert_time"
                  type="time"
                  value={newAlert.send_time}
                  onChange={(e) => setNewAlert({...newAlert, send_time: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alert_days">Days Before Event</Label>
                <Input
                  id="alert_days"
                  type="number"
                  min="0"
                  max="30"
                  value={newAlert.days_before}
                  onChange={(e) => setNewAlert({...newAlert, days_before: parseInt(e.target.value)})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Send Via</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="send_sms"
                    checked={newAlert.send_via.includes('sms')}
                    onChange={(e) => {
                      const sendVia = e.target.checked 
                        ? [...newAlert.send_via, 'sms']
                        : newAlert.send_via.filter(v => v !== 'sms');
                      setNewAlert({...newAlert, send_via});
                    }}
                    className="rounded"
                  />
                  <Label htmlFor="send_sms" className="text-sm">SMS</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="send_email"
                    checked={newAlert.send_via.includes('email')}
                    onChange={(e) => {
                      const sendVia = e.target.checked 
                        ? [...newAlert.send_via, 'email']
                        : newAlert.send_via.filter(v => v !== 'email');
                      setNewAlert({...newAlert, send_via});
                    }}
                    className="rounded"
                  />
                  <Label htmlFor="send_email" className="text-sm">Email</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alert_message">Message Template *</Label>
              <Textarea
                id="alert_message"
                value={newAlert.message_template}
                onChange={(e) => setNewAlert({...newAlert, message_template: e.target.value})}
                placeholder="Happy Birthday {first_name}! We hope you have a wonderful day!"
                rows={4}
                required
              />
              <p className="text-xs text-muted-foreground">
                Use {'{first_name}'}, {'{last_name}'}, {'{spouse_name}'} for dynamic content
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateAlertOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAlert}>
              <Plus className="mr-2 h-4 w-4" />
              Create Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Alert Dialog */}
      <Dialog open={isEditAlertOpen} onOpenChange={setIsEditAlertOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Alert</DialogTitle>
            <DialogDescription>
              Modify the alert settings and message template.
            </DialogDescription>
          </DialogHeader>
          
          {editingAlert && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit_alert_name">Alert Name *</Label>
                <Input
                  id="edit_alert_name"
                  value={editingAlert.name}
                  onChange={(e) => setEditingAlert({...editingAlert, name: e.target.value})}
                  placeholder="Birthday Reminders"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_alert_type">Event Type *</Label>
                  <select
                    id="edit_alert_type"
                    value={editingAlert.type}
                    onChange={(e) => setEditingAlert({...editingAlert, type: e.target.value})}
                    className="w-full p-2 border border-input rounded-md bg-background"
                  >
                    <option value="birthday">Birthday</option>
                    <option value="anniversary">Anniversary</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_alert_recipients">Recipients</Label>
                  <select
                    id="edit_alert_recipients"
                    value={editingAlert.recipients}
                    onChange={(e) => setEditingAlert({...editingAlert, recipients: e.target.value})}
                    className="w-full p-2 border border-input rounded-md bg-background"
                  >
                    <option value="all">All Members</option>
                    <option value="leaders">Ministry Leaders</option>
                    <option value="married">Married Members</option>
                    <option value="active">Active Members</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_alert_time">Send Time *</Label>
                  <Input
                    id="edit_alert_time"
                    type="time"
                    value={editingAlert.send_time}
                    onChange={(e) => setEditingAlert({...editingAlert, send_time: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_alert_days">Days Before Event</Label>
                  <Input
                    id="edit_alert_days"
                    type="number"
                    min="0"
                    max="30"
                    value={editingAlert.days_before}
                    onChange={(e) => setEditingAlert({...editingAlert, days_before: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Send Via</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="edit_send_sms"
                      checked={editingAlert.send_via.includes('sms')}
                      onChange={(e) => {
                        const sendVia = e.target.checked 
                          ? [...editingAlert.send_via, 'sms']
                          : editingAlert.send_via.filter(v => v !== 'sms');
                        setEditingAlert({...editingAlert, send_via});
                      }}
                      className="rounded"
                    />
                    <Label htmlFor="edit_send_sms" className="text-sm">SMS</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="edit_send_email"
                      checked={editingAlert.send_via.includes('email')}
                      onChange={(e) => {
                        const sendVia = e.target.checked 
                          ? [...editingAlert.send_via, 'email']
                          : editingAlert.send_via.filter(v => v !== 'email');
                        setEditingAlert({...editingAlert, send_via});
                      }}
                      className="rounded"
                    />
                    <Label htmlFor="edit_send_email" className="text-sm">Email</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_alert_message">Message Template *</Label>
                <Textarea
                  id="edit_alert_message"
                  value={editingAlert.message_template}
                  onChange={(e) => setEditingAlert({...editingAlert, message_template: e.target.value})}
                  placeholder="Happy Birthday {first_name}! We hope you have a wonderful day!"
                  rows={4}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Use {'{first_name}'}, {'{last_name}'}, {'{spouse_name}'} for dynamic content
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditAlertOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditAlert}>
              <Edit className="mr-2 h-4 w-4" />
              Update Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 