import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Plus, 
  MessageSquare,
  Phone,
  Send,
  RefreshCw,
  Mail,
  User
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/authContext';
import { smsService } from '@/lib/smsService';
import { getCurrentUserMember } from '@/lib/data';

export function Prayer() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [prayerRequest, setPrayerRequest] = useState(null);
  const [isAddRequestOpen, setIsAddRequestOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({
    name: '',
    email: '',
    phone: '',
    request: '',
    isPrivate: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDeacon, setIsDeacon] = useState(false);
  const [isSendingSMS, setIsSendingSMS] = useState(false);
  const [currentUserMember, setCurrentUserMember] = useState(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (requestId) {
      fetchPrayerRequest();
    }
    checkDeaconStatus();
    loadCurrentUserMember();
  }, [requestId, user]);

  const loadCurrentUserMember = async () => {
    if (!user) return;
    
    try {
      const memberData = await getCurrentUserMember();
      setCurrentUserMember(memberData);
      
      // If we have member data, populate the form fields
      if (memberData) {
        setNewRequest(prev => ({
          ...prev,
          name: `${memberData.firstname} ${memberData.lastname}`,
          email: memberData.email || '',
          phone: memberData.phone || ''
        }));
      }
    } catch (error) {
      console.error('Error loading current user member:', error);
      // Don't show error toast as this is not critical for the prayer request functionality
    }
  };

  const checkDeaconStatus = async () => {
    if (!user) return;
    
    try {
      // Check if user is a member of the Deacons group
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          member_id,
          groups!inner (
            name
          )
        `)
        .eq('member_id', user.id)
        .eq('groups.name', 'Deacons')
        .maybeSingle();

      if (error) throw error;
      setIsDeacon(!!data);
    } catch (error) {
      console.error('Error checking deacon status:', error);
    }
  };

  const fetchPrayerRequest = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('prayer_requests')
        .select(`
          *,
          prayer_responses (
            id,
            response,
            created_at,
            member:members (
              firstName,
              lastName
            )
          )
        `)
        .eq('id', requestId)
        .single();

      if (error) throw error;
      setPrayerRequest(data);
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Failed to fetch prayer request', 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRequest = async () => {
    if (!newRequest.name || !newRequest.email || !newRequest.phone || !newRequest.request) {
      toast({ 
        title: 'Missing Information', 
        description: 'Please fill in all required fields.', 
        variant: 'destructive' 
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('prayer_requests')
        .insert([{ 
          ...newRequest,
          status: 'pending',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Notify deacons via email
      const { error: notifyError } = await supabase.functions.invoke('notify-deacons', {
        body: { requestId: data.id }
      });

      if (notifyError) {
        console.error('Error notifying deacons:', notifyError);
        toast({
          title: 'Warning',
          description: 'Prayer request saved but failed to notify deacons.',
          variant: 'destructive'
        });
      }

      handleCloseAddRequest();
      toast({ 
        title: 'Prayer Request Submitted', 
        description: 'Your prayer request has been submitted and the deacons have been notified.' 
      });
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  };

  const handleSendToMembers = async () => {
    if (!prayerRequest) return;

    setIsSendingSMS(true);
    try {
      // Send prayer request via SMS using the new SMS service
      const conversation = await smsService.sendPrayerRequestSMS(prayerRequest);

      // Update prayer request status
      const { error } = await supabase
        .from('prayer_requests')
        .update({
          status: 'sent_to_members',
          sms_sent_to_members: true,
          sms_sent_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Prayer request has been sent to prayer team members via SMS. Conversation ID: ${conversation.id}`
      });

      // Refresh the prayer request data
      await fetchPrayerRequest();
    } catch (error) {
      console.error('Error sending SMS:', error);
      toast({
        title: 'Error',
        description: `Failed to send SMS: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setIsSendingSMS(false);
    }
  };

  const handleOpenAddRequest = () => {
    // Reset form and populate with current user data
    const resetForm = {
      name: currentUserMember ? `${currentUserMember.firstname} ${currentUserMember.lastname}` : '',
      email: currentUserMember?.email || '',
      phone: currentUserMember?.phone || '',
      request: '',
      isPrivate: false
    };
    setNewRequest(resetForm);
    setIsAddRequestOpen(true);
  };

  const handleCloseAddRequest = () => {
    setIsAddRequestOpen(false);
    // Reset form to initial state
    setNewRequest({
      name: '',
      email: '',
      phone: '',
      request: '',
      isPrivate: false
    });
  };

  if (requestId && !prayerRequest) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Loading...</h2>
          <p className="text-muted-foreground">Please wait while we fetch the prayer request.</p>
        </div>
      </div>
    );
  }

  if (requestId) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Prayer Request</h1>
          <p className="text-muted-foreground">
            View and manage this prayer request.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
            <CardDescription>
              Submitted on {format(new Date(prayerRequest.created_at), 'MMMM d, yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">From</h3>
                <p>{prayerRequest.name}</p>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <Mail className="mr-1 h-4 w-4" />
                  {prayerRequest.email}
                </div>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <Phone className="mr-1 h-4 w-4" />
                  {prayerRequest.phone}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-1">Request</h3>
                <p className="whitespace-pre-wrap">{prayerRequest.request}</p>
              </div>

              {prayerRequest.prayer_responses && prayerRequest.prayer_responses.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Responses</h3>
                  <div className="space-y-3">
                    {prayerRequest.prayer_responses.map((response) => (
                      <div key={response.id} className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {response.member.firstName} {response.member.lastName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(response.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <p className="text-sm">{response.response}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="border-t p-4 flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => navigate('/prayer')}
            >
              Back to Requests
            </Button>
            {isDeacon && !prayerRequest.sms_sent_to_members && (
              <Button 
                onClick={handleSendToMembers}
                disabled={isSendingSMS}
              >
                {isSendingSMS ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send to Prayer Team
                  </>
                )}
              </Button>
            )}
            {prayerRequest.sms_sent_to_members && (
              <div className="flex items-center text-sm text-green-600">
                <MessageSquare className="mr-1 h-4 w-4" />
                Sent to prayer team via SMS
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Prayer Requests</h1>
        <p className="text-muted-foreground">
          Submit and manage prayer requests for our church community.
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleOpenAddRequest}>
          <Plus className="mr-2 h-4 w-4" />
          Submit Prayer Request
        </Button>
      </div>

      {/* Add Prayer Request Dialog */}
      <Dialog open={isAddRequestOpen} onOpenChange={(open) => {
        if (!open) {
          handleCloseAddRequest();
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Submit Prayer Request</DialogTitle>
            <DialogDescription>
              {currentUserMember ? (
                <span>Your contact information has been pre-filled from your member profile. You can edit these fields if needed.</span>
              ) : (
                <span>Share your prayer request with our church community.</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name *</Label>
              <Input
                id="name"
                value={newRequest.name}
                onChange={(e) => setNewRequest({...newRequest, name: e.target.value})}
                required
                className={currentUserMember ? "border-green-200 bg-green-50" : ""}
              />
              {currentUserMember && (
                <p className="text-xs text-green-600 flex items-center">
                  <User className="h-3 w-3 mr-1" />
                  Pre-filled from your member profile
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={newRequest.email}
                onChange={(e) => setNewRequest({...newRequest, email: e.target.value})}
                required
                className={currentUserMember && currentUserMember.email ? "border-green-200 bg-green-50" : ""}
              />
              {currentUserMember && currentUserMember.email && (
                <p className="text-xs text-green-600 flex items-center">
                  <Mail className="h-3 w-3 mr-1" />
                  Pre-filled from your member profile
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={newRequest.phone}
                onChange={(e) => setNewRequest({...newRequest, phone: e.target.value})}
                placeholder="(555) 123-4567"
                required
                className={currentUserMember && currentUserMember.phone ? "border-green-200 bg-green-50" : ""}
              />
              {currentUserMember && currentUserMember.phone && (
                <p className="text-xs text-green-600 flex items-center">
                  <Phone className="h-3 w-3 mr-1" />
                  Pre-filled from your member profile
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="request">Prayer Request *</Label>
              <Textarea
                id="request"
                value={newRequest.request}
                onChange={(e) => setNewRequest({...newRequest, request: e.target.value})}
                placeholder="Share your prayer request..."
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPrivate"
                checked={newRequest.isPrivate}
                onChange={(e) => setNewRequest({...newRequest, isPrivate: e.target.checked})}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isPrivate">Keep this request private</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseAddRequest}>
              Cancel
            </Button>
            <Button onClick={handleAddRequest}>
              <Send className="mr-2 h-4 w-4" />
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 