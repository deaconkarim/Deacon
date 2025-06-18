import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, User, Mail, Lock, Phone, Globe, MapPin } from 'lucide-react';

export function Register() {
  const [activeTab, setActiveTab] = useState('organization');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Organization form state
  const [organizationData, setOrganizationData] = useState({
    name: '',
    slug: '',
    description: '',
    email: '',
    phone: '',
    website: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: ''
    }
  });

  // User form state
  const [userData, setUserData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstname: '',
    lastname: ''
  });

  const handleOrganizationChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setOrganizationData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [field]: value
        }
      }));
    } else {
      setOrganizationData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleOrganizationNameChange = (e) => {
    const name = e.target.value;
    setOrganizationData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  const validateForm = () => {
    if (activeTab === 'organization') {
      if (!organizationData.name || !organizationData.slug) {
        toast({
          title: "Error",
          description: "Please fill in all required organization fields",
          variant: "destructive",
        });
        return false;
      }
    } else {
      if (!userData.email || !userData.password || !userData.firstname || !userData.lastname) {
        toast({
          title: "Error",
          description: "Please fill in all required user fields",
          variant: "destructive",
        });
        return false;
      }
      if (userData.password !== userData.confirmPassword) {
        toast({
          title: "Error",
          description: "Passwords do not match",
          variant: "destructive",
        });
        return false;
      }
      if (userData.password.length < 6) {
        toast({
          title: "Error",
          description: "Password must be at least 6 characters long",
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    if (activeTab === 'organization') {
      // Store organization data and move to user tab
      localStorage.setItem('pendingOrganization', JSON.stringify(organizationData));
      setActiveTab('user');
    } else {
      // Complete registration
      await completeRegistration();
    }
  };

  const completeRegistration = async () => {
    setLoading(true);
    
    try {
      const pendingOrg = JSON.parse(localStorage.getItem('pendingOrganization') || '{}');
      
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            firstname: userData.firstname,
            lastname: userData.lastname
          }
        }
      });

      if (authError) throw authError;

      // Create organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert([{
          name: pendingOrg.name,
          slug: pendingOrg.slug,
          description: pendingOrg.description,
          email: pendingOrg.email,
          phone: pendingOrg.phone,
          website: pendingOrg.website,
          address: pendingOrg.address
        }])
        .select()
        .single();

      if (orgError) throw orgError;

      // Link user to organization as owner
      const { error: linkError } = await supabase
        .from('organization_users')
        .insert([{
          organization_id: orgData.id,
          user_id: authData.user.id,
          role: 'owner',
          status: 'active'
        }]);

      if (linkError) throw linkError;

      // Create initial member record for the user
      const { error: memberError } = await supabase
        .from('members')
        .insert([{
          id: authData.user.id,
          firstname: userData.firstname,
          lastname: userData.lastname,
          email: userData.email,
          organization_id: orgData.id,
          status: 'active'
        }]);

      if (memberError) throw memberError;

      // Clear pending data
      localStorage.removeItem('pendingOrganization');

      toast({
        title: "Success",
        description: "Registration completed! Please check your email to verify your account.",
      });

      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete registration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Create Your Church Account</CardTitle>
          <CardDescription>
            Set up your church's management system in just a few steps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="organization" disabled={activeTab === 'user'}>
                <Building className="mr-2 h-4 w-4" />
                Church Info
              </TabsTrigger>
              <TabsTrigger value="user">
                <User className="mr-2 h-4 w-4" />
                Your Account
              </TabsTrigger>
            </TabsList>

            <TabsContent value="organization" className="mt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Church Name *</Label>
                  <div className="flex items-center">
                    <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="org-name"
                      name="name"
                      value={organizationData.name}
                      onChange={handleOrganizationNameChange}
                      placeholder="Grace Community Church"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-slug">URL Slug *</Label>
                  <Input
                    id="org-slug"
                    name="slug"
                    value={organizationData.slug}
                    onChange={handleOrganizationChange}
                    placeholder="grace-community-church"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    This will be used in your church's URL: yourdomain.com/{organizationData.slug}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-description">Description</Label>
                  <Input
                    id="org-description"
                    name="description"
                    value={organizationData.description}
                    onChange={handleOrganizationChange}
                    placeholder="A brief description of your church"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="org-email">Email</Label>
                    <div className="flex items-center">
                      <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="org-email"
                        name="email"
                        type="email"
                        value={organizationData.email}
                        onChange={handleOrganizationChange}
                        placeholder="info@church.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="org-phone">Phone</Label>
                    <div className="flex items-center">
                      <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="org-phone"
                        name="phone"
                        value={organizationData.phone}
                        onChange={handleOrganizationChange}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-website">Website</Label>
                  <div className="flex items-center">
                    <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="org-website"
                      name="website"
                      value={organizationData.website}
                      onChange={handleOrganizationChange}
                      placeholder="www.church.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Address</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      name="address.street"
                      value={organizationData.address.street}
                      onChange={handleOrganizationChange}
                      placeholder="Street Address"
                    />
                    <Input
                      name="address.city"
                      value={organizationData.address.city}
                      onChange={handleOrganizationChange}
                      placeholder="City"
                    />
                    <Input
                      name="address.state"
                      value={organizationData.address.state}
                      onChange={handleOrganizationChange}
                      placeholder="State"
                    />
                    <Input
                      name="address.zip"
                      value={organizationData.address.zip}
                      onChange={handleOrganizationChange}
                      placeholder="ZIP Code"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  Continue to Account Setup
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="user" className="mt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstname">First Name *</Label>
                    <Input
                      id="firstname"
                      name="firstname"
                      value={userData.firstname}
                      onChange={handleUserChange}
                      placeholder="John"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastname">Last Name *</Label>
                    <Input
                      id="lastname"
                      name="lastname"
                      value={userData.lastname}
                      onChange={handleUserChange}
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <div className="flex items-center">
                    <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={userData.email}
                      onChange={handleUserChange}
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="flex items-center">
                    <Lock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={userData.password}
                      onChange={handleUserChange}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <div className="flex items-center">
                    <Lock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={userData.confirmPassword}
                      onChange={handleUserChange}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab('organization')}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Button variant="link" className="p-0" onClick={() => navigate('/login')}>
                Sign in
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 