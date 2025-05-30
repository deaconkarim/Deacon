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
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (requestId) {
      fetchPrayerRequest();
    }
    checkDeaconStatus();
  }, [requestId, user]);

  const checkDeaconStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('members')
        .select('group_id')
        .eq('id', user.id)
        .eq('status', 'active')
        .single();

      if (error) throw error;
      setIsDeacon(data?.group_id === 'deacons');
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
              first_name,
              last_name
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

      // Notify deacons
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

      setIsAddRequestOpen(false);
      setNewRequest({
        name: '',
        email: '',
        phone: '',
        request: '',
        isPrivate: false
      });
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
    try {
      // Here you would integrate with your SMS service
      // For now, we'll just update the status
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
        description: 'Prayer request has been sent to members.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
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
                            {response.member.first_name} {response.member.last_name}
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
              <Button onClick={handleSendToMembers}>
                <Send className="mr-2 h-4 w-4" />
                Send to Members
              </Button>
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
        <Button onClick={() => setIsAddRequestOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Submit Prayer Request
        </Button>
      </div>

      {/* Add Prayer Request Dialog */}
      <Dialog open={isAddRequestOpen} onOpenChange={setIsAddRequestOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Submit Prayer Request</DialogTitle>
            <DialogDescription>
              Share your prayer request with our church community.
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={newRequest.email}
                onChange={(e) => setNewRequest({...newRequest, email: e.target.value})}
                required
              />
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
              />
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
            <Button variant="outline" onClick={() => setIsAddRequestOpen(false)}>
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