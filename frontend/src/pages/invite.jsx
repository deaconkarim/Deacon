import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  User,
  Mail,
  Shield,
  Calendar
} from 'lucide-react';

export function Invite() {
  const { invitationId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invitation, setInvitation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadInvitation();
  }, [invitationId]);

  const loadInvitation = async () => {
    try {
      const { data, error } = await supabase
        .from('organization_invitations')
        .select(`
          *,
          organizations!inner (
            name,
            description
          )
        `)
        .eq('id', invitationId)
        .single();

      if (error) throw error;

      // Check if invitation is expired
      if (new Date(data.expires_at) < new Date()) {
        setError('This invitation has expired.');
        setInvitation(data);
        return;
      }

      // Check if invitation is already accepted
      if (data.status === 'accepted') {
        setError('This invitation has already been accepted.');
        setInvitation(data);
        return;
      }

      setInvitation(data);
    } catch (error) {
      console.error('Error loading invitation:', error);
      setError('Invalid or expired invitation link.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive"
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password: formData.password,
        options: {
          data: {
            first_name: invitation.first_name,
            last_name: invitation.last_name
          },
          emailConfirm: false
        }
      });

      if (authError) throw authError;

      // Check if member record already exists
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('members')
        .select('id')
        .eq('email', invitation.email)
        .single();

      let memberId = authData.user.id;

      if (existingMember) {
        // First, update the invitation to remove the member_id reference
        const { error: updateInvitationError } = await supabase
          .from('organization_invitations')
          .update({
            member_id: null
          })
          .eq('id', invitationId);

        if (updateInvitationError) throw updateInvitationError;

        // Now update the member record with the auth user ID and organization
        const { error: updateMemberError } = await supabase
          .from('members')
          .update({
            id: authData.user.id, // Link to the auth user
            firstname: invitation.first_name,
            lastname: invitation.last_name,
            status: 'active',
            organization_id: invitation.organization_id
          })
          .eq('email', invitation.email);

        if (updateMemberError) throw updateMemberError;
      } else {
        // Create new member record
        const { error: memberError } = await supabase
          .from('members')
          .insert({
            id: authData.user.id, // Use the same ID as the auth user
            firstname: invitation.first_name,
            lastname: invitation.last_name,
            email: invitation.email,
            status: 'active',
            organization_id: invitation.organization_id
          });

        if (memberError) throw memberError;
      }

      // Create organization membership
      const { error: membershipError } = await supabase
        .from('organization_users')
        .insert({
          organization_id: invitation.organization_id,
          user_id: authData.user.id,
          role: invitation.role,
          status: 'active',
          approval_status: 'approved'
        });

      if (membershipError) throw membershipError;

      // Update invitation status
      const { error: updateError } = await supabase
        .from('organization_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitationId);

      if (updateError) throw updateError;

      // Automatically sign in the user
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: invitation.email,
        password: formData.password
      });

      if (signInError) throw signInError;

      toast({
        title: "Welcome to " + invitation.organizations.name + "!",
        description: "Your account has been created and you're now logged in.",
      });

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        title: "Error creating account",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeclineInvitation = async () => {
    setIsProcessing(true);

    try {
      const { error } = await supabase
        .from('organization_invitations')
        .update({
          status: 'declined'
        })
        .eq('id', invitationId);

      if (error) throw error;

      toast({
        title: "Invitation declined",
        description: "You have declined this invitation.",
      });

      navigate('/login');
    } catch (error) {
      console.error('Error declining invitation:', error);
      toast({
        title: "Error declining invitation",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto bg-destructive/20 p-3 rounded-full w-fit mb-4">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-xl text-destructive">Invitation Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/login')} 
              className="w-full"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/20 p-3 rounded-full w-fit mb-4">
              <User className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">You're Invited!</CardTitle>
            <CardDescription className="text-lg">
              Join {invitation.organizations.name}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Invitation Details */}
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Email:</span>
                <span className="text-sm font-medium">{invitation.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Name:</span>
                <span className="text-sm font-medium">{invitation.first_name} {invitation.last_name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Role:</span>
                <span className="text-sm font-medium capitalize">{invitation.role}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Expires:</span>
                <span className="text-sm font-medium">
                  {new Date(invitation.expires_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Password Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="password">Create Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter your password"
                  disabled={isProcessing}
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirm your password"
                  disabled={isProcessing}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleAcceptInvitation}
                disabled={isProcessing || !formData.password || !formData.confirmPassword}
                className="flex-1"
              >
                {isProcessing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accept Invitation
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleDeclineInvitation}
                disabled={isProcessing}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Decline
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              By accepting this invitation, you agree to join {invitation.organizations.name} 
              and will receive access to their organization management system.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
} 