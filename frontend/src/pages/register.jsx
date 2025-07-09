import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Church, UserPlus, Mail, Lock, User, Building, MapPin, Phone } from 'lucide-react';

export function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    // Organization fields
    organizationName: '',
    organizationPhone: '',
    organizationAddress: {
      street: '',
      city: '',
      state: '',
      zip: ''
    },
    // SMS opt-in
    smsOptIn: false
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Force light mode for the register page
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      organizationAddress: {
        ...prev.organizationAddress,
        [field]: value
      }
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.organizationName.trim()) {
      toast({
        title: "Organization name required",
        description: "Please enter your church name.",
        variant: "destructive",
      });
      return;
    }

    // Note: SMS opt-in is optional, so we don't require it to be checked
    // The checkbox defaults to false and must be explicitly checked by the user

    setLoading(true);

    try {
      // Create the user account first
      const { data: userData, error: userError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            sms_opt_in: formData.smsOptIn,
          }
        }
      });

      if (userError) throw userError;

      if (userData.user) {
        // Create the organization
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: formData.organizationName,
            phone: formData.organizationPhone || null,
            address: formData.organizationAddress
          })
          .select()
          .single();

        if (orgError) {
          console.error('Error creating organization:', orgError);
          throw new Error('Failed to create organization');
        }

        // Create a member record in the database
        const { error: memberError } = await supabase
          .from('members')
          .insert({
            firstname: formData.firstName,
            lastname: formData.lastName,
            email: formData.email,
            user_id: userData.user.id,
            status: 'active',
            organization_id: orgData.id
          });

        if (memberError) {
          console.error('Error creating member record:', memberError);
          // Don't throw here as the user account and organization were created successfully
        }

        // Create organization membership with admin role
        const { error: orgMemberError } = await supabase
          .from('organization_users')
          .insert({
            organization_id: orgData.id,
            user_id: userData.user.id,
            role: 'admin',
            status: 'active',
            approval_status: 'approved'
          });

        if (orgMemberError) {
          console.error('Error creating organization membership:', orgMemberError);
          // Don't throw here as the user account and organization were created successfully
        }
      }

      toast({
        title: "Registration successful!",
        description: "Your church and account have been created successfully. Please check your email for a confirmation link before signing in to access your Deacon command center.",
      });

      navigate('/login');
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getOrganizationAddress = (address) => {
    if (!address) return '';
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.zip) parts.push(address.zip);
    return parts.join(', ');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-1">
          <div className="flex justify-center mb-4">
            <Church className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Create Your Church</CardTitle>
          <CardDescription>
            Set up your church's Deacon command center and create your admin account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <div className="flex items-center">
                    <User className="mr-2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <div className="flex items-center">
                    <User className="mr-2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center">
                  <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="flex items-center">
                    <Lock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="flex items-center">
                    <Lock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Organization Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Church Information</h3>
              <div className="space-y-2">
                <Label htmlFor="organizationName">Church Name *</Label>
                <div className="flex items-center">
                  <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="organizationName"
                    name="organizationName"
                    type="text"
                    placeholder="Your Church Name"
                    value={formData.organizationName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              

              
              <div className="space-y-2">
                <Label htmlFor="organizationPhone">Phone Number</Label>
                <div className="flex items-center">
                  <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="organizationPhone"
                    name="organizationPhone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.organizationPhone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <Label className="text-sm font-medium">Address (Optional)</Label>
                <div className="space-y-2">
                  <Input
                    placeholder="Street Address"
                    value={formData.organizationAddress.street}
                    onChange={(e) => handleAddressChange('street', e.target.value)}
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="City"
                      value={formData.organizationAddress.city}
                      onChange={(e) => handleAddressChange('city', e.target.value)}
                    />
                    <Input
                      placeholder="State"
                      value={formData.organizationAddress.state}
                      onChange={(e) => handleAddressChange('state', e.target.value)}
                    />
                    <Input
                      placeholder="ZIP"
                      value={formData.organizationAddress.zip}
                      onChange={(e) => handleAddressChange('zip', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SMS Opt-in Disclaimer */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Communication Preferences</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="smsOptIn"
                    checked={formData.smsOptIn}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, smsOptIn: checked }))
                    }
                  />
                  <div className="space-y-2">
                    <Label htmlFor="smsOptIn" className="text-sm font-medium">
                      I agree to receive SMS messages from {formData.organizationName || 'our church'}
                    </Label>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>
                        By checking this box, you consent to receive SMS messages including appointment reminders, 
                        event notifications, ministry updates, and occasional offers from {formData.organizationName || 'our church'}.
                      </p>
                      <p>
                        <strong>Message and data rates may apply.</strong> Message frequency varies based on church activities and events.
                      </p>
                      <p>
                        <strong>Text HELP for help</strong> or call {formData.organizationPhone || '(925) 304-3799'} for assistance.
                      </p>
                      <p>
                        <strong>Text STOP to unsubscribe</strong> from SMS messages at any time.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {loading ? 'Creating Your Church...' : 'Create Church & Account'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Button
                variant="link"
                className="p-0 h-auto font-normal"
                onClick={() => navigate('/login')}
              >
                Sign in
              </Button>
            </p>
          </div>

          {/* Legal Links */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-xs text-muted-foreground text-center space-y-1">
              <p>
                By creating an account, you agree to our{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto font-normal text-xs underline"
                  onClick={() => window.open('/privacy-policy', '_blank')}
                >
                  Privacy Policy
                </Button>
                {' '}and{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto font-normal text-xs underline"
                  onClick={() => window.open('/terms-of-service', '_blank')}
                >
                  Terms of Service
                </Button>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 