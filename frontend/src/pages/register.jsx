import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Church, UserPlus, Mail, Lock, User, Building, Search } from 'lucide-react';

export function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationId: ''
  });
  const [organizations, setOrganizations] = useState([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoadingOrganizations, setIsLoadingOrganizations] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch available organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('id, name, description, address')
          .order('name');

        if (error) throw error;
        setOrganizations(data || []);
        setFilteredOrganizations(data || []);
      } catch (error) {
        console.error('Error fetching organizations:', error);
        toast({
          title: "Error loading organizations",
          description: "Please try refreshing the page.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingOrganizations(false);
      }
    };

    fetchOrganizations();
  }, [toast]);

  // Filter organizations based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredOrganizations(organizations);
    } else {
      const filtered = organizations.filter(org => 
        org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (org.description && org.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredOrganizations(filtered);
    }
  }, [searchQuery, organizations]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOrganizationSelect = (organizationId) => {
    setFormData(prev => ({ ...prev, organizationId }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.organizationId) {
      toast({
        title: "Please select an organization",
        description: "You must choose a church to join.",
        variant: "destructive",
      });
      return;
    }

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

    setLoading(true);

    try {
      // Create the user account
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
          }
        }
      });

      if (error) throw error;

      // Create a member record in the database
      if (data.user) {
        const { error: memberError } = await supabase
          .from('members')
          .insert({
            id: data.user.id, // Use the auth user's ID
            firstname: formData.firstName,
            lastname: formData.lastName,
            email: formData.email,
            status: 'active',
            organization_id: formData.organizationId
          });

        if (memberError) {
          console.error('Error creating member record:', memberError);
          // Don't throw here as the user account was created successfully
        }

        // Create organization membership
        const { error: orgMemberError } = await supabase
          .from('organization_users')
          .insert({
            organization_id: formData.organizationId,
            user_id: data.user.id,
            role: 'member',
            status: 'active'
          });

        if (orgMemberError) {
          console.error('Error creating organization membership:', orgMemberError);
          // Don't throw here as the user account was created successfully
        }
      }

      toast({
        title: "Registration successful!",
        description: "Please check your email to confirm your account before signing in.",
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
          <CardTitle className="text-2xl">Join a Church</CardTitle>
          <CardDescription>
            Create an account and choose which church you'd like to join
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

            {/* Organization Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Choose Your Church</h3>
              
              {isLoadingOrganizations ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Loading churches...</p>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search churches..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {filteredOrganizations.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {searchQuery ? 'No churches found matching your search.' : 'No churches available.'}
                      </div>
                    ) : (
                      filteredOrganizations.map((org) => (
                        <div
                          key={org.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            formData.organizationId === org.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => handleOrganizationSelect(org.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <Building className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm">{org.name}</h4>
                              {org.description && (
                                <p className="text-sm text-muted-foreground mt-1">{org.description}</p>
                              )}
                              {org.address && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {getOrganizationAddress(org.address)}
                                </p>
                              )}
                            </div>
                            {formData.organizationId === org.id && (
                              <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !formData.organizationId}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {loading ? 'Creating Account...' : 'Create Account'}
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
        </CardContent>
      </Card>
    </div>
  );
} 