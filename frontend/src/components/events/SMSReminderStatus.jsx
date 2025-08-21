import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { MessageSquare, Clock, Users, CheckCircle2, XCircle, AlertTriangle, Send } from 'lucide-react';
import { smsService } from '@/lib/smsService';

const SMSReminderStatus = ({ eventId, eventTitle, onClose }) => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (eventId) {
      loadReminders();
    }
  }, [eventId]);

  const loadReminders = async () => {
    try {
      setLoading(true);
      const data = await smsService.getEventReminders(eventId);
      setReminders(data);
    } catch (error) {
      console.error('Error loading reminders:', error);
      toast({
        title: "Error",
        description: "Failed to load SMS reminders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelReminder = async (reminderId) => {
    try {
      await smsService.cancelEventReminder(reminderId);
      toast({
        title: "Success",
        description: "SMS reminder cancelled"
      });
      loadReminders(); // Reload to update status
    } catch (error) {
      console.error('Error cancelling reminder:', error);
      toast({
        title: "Error",
        description: "Failed to cancel reminder",
        variant: "destructive"
      });
    }
  };

  const sendTestReminder = async (reminder) => {
    try {
      const results = await smsService.sendEventReminderManually(
        eventId, 
        [reminder.group_id], 
        `TEST: ${reminder.message_content}`
      );
      
      const successCount = results.filter(r => r.status === 'sent').length;
      toast({
        title: "Test Reminder Sent",
        description: `Sent to ${successCount} members with TEST prefix`
      });
    } catch (error) {
      console.error('Error sending test reminder:', error);
      toast({
        title: "Error",
        description: "Failed to send test reminder",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status, scheduledTime) => {
    const isOverdue = new Date(scheduledTime) <= new Date() && status === 'scheduled';
    
    switch (status) {
      case 'sent':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'scheduled':
        return isOverdue ? 
          <AlertTriangle className="h-4 w-4 text-orange-600" /> :
          <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status, scheduledTime) => {
    const isOverdue = new Date(scheduledTime) <= new Date() && status === 'scheduled';
    
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'scheduled':
        return isOverdue ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status, scheduledTime) => {
    const isOverdue = new Date(scheduledTime) <= new Date() && status === 'scheduled';
    
    if (isOverdue) return 'Overdue';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Loading SMS reminders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">SMS Reminders</h3>
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      {reminders.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">No SMS reminders scheduled</p>
            <p className="text-sm text-gray-500">
              Enable SMS reminders when creating or editing this event to schedule automatic reminders.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reminders.map((reminder) => (
            <Card key={reminder.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(reminder.status, reminder.scheduled_time)}
                      <Badge className={getStatusColor(reminder.status, reminder.scheduled_time)}>
                        {getStatusText(reminder.status, reminder.scheduled_time)}
                      </Badge>
                      <span className="text-sm font-medium">
                        {reminder.groups?.name || 'Unknown Group'}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>
                          Scheduled: {format(new Date(reminder.scheduled_time), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                      
                      {reminder.sent_at && (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                          <span>
                            Sent: {format(new Date(reminder.sent_at), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {reminder.message_content && (
                      <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                        <strong>Message:</strong> {reminder.message_content}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    {reminder.status === 'scheduled' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => sendTestReminder(reminder)}
                          className="h-8 text-xs"
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Test
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelReminder(reminder.id)}
                          className="h-8 text-xs text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>Note:</strong> SMS reminders are automatically processed every 5 minutes. 
          You can use the "Test" button to send a test reminder immediately.
        </p>
      </div>
    </div>
  );
};

export default SMSReminderStatus;