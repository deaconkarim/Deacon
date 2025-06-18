import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Mail, Lock, Building, ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils/formatters';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrganization, setSelectedOrganization] = useState('');
  const [showOrganizationSelect, setShowOrganizationSelect] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Fetch user's organizations
      const { data: orgData, error: orgError } = await supabase
        .from('organization_users')
        .select(`
          organization_id,
          role,
          status,
          organizations (
            id,
            name,
            slug,
            logo_url
          )
        `)
        .eq('user_id', data.user.id)
        .eq('status', 'active');

      if (orgError) throw orgError;

      const orgs = orgData.map(item => ({
        id: item.organization_id,
        name: item.organizations.name,
        slug: item.organizations.slug,
        logo_url: item.organizations.logo_url,
        role: item.role
      }));

      setOrganizations(orgs);

      if (orgs.length === 1) {
        // Auto-select if only one organization
        setSelectedOrganization(orgs[0].id);
        localStorage.setItem('currentOrganizationId', orgs[0].id);
        navigate('/dashboard');
      } else if (orgs.length > 1) {
        // Show organization selection
        setShowOrganizationSelect(true);
      } else {
        // No organizations - redirect to registration
        toast({
          title: "No Organizations Found",
          description: "You don't have access to any organizations. Please contact an administrator.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOrganizationSelect = (organizationId) => {
    setSelectedOrganization(organizationId);
    localStorage.setItem('currentOrganizationId', organizationId);
    navigate('/dashboard');
  };

  const handleSignUp = () => {
    navigate('/register');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your church management account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showOrganizationSelect ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center">
                  <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="flex items-center">
                  <Lock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <Button variant="link" className="p-0" onClick={handleSignUp}>
                    Sign up
                  </Button>
                </p>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium">Select Organization</h3>
                <p className="text-sm text-muted-foreground">
                  Choose which church you'd like to access
                </p>
              </div>

              <div className="space-y-3">
                {organizations.map((org) => (
                  <div
                    key={org.id}
                    className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleOrganizationSelect(org.id)}
                  >
                    <Avatar className="h-12 w-12 mr-4">
                      <AvatarImage src={org.logo_url} />
                      <AvatarFallback>
                        {getInitials(org.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-medium">{org.name}</h4>
                      <p className="text-sm text-muted-foreground capitalize">
                        {org.role} • {org.slug}
                      </p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowOrganizationSelect(false);
                  setOrganizations([]);
                }}
              >
                Back to Sign In
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 