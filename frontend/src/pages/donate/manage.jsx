import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, Mail, Calendar, DollarSign, AlertTriangle } from 'lucide-react';

export default function ManageDonations() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [error, setError] = useState(null);

  const findSubscriptions = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/find-subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Failed to find subscriptions');
      }

      const data = await response.json();
      setSubscriptions(data.subscriptions || []);
      
      if (data.subscriptions?.length === 0) {
        setError('No recurring donations found for this email address');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async (subscriptionId) => {
    if (!confirm('Are you sure you want to cancel this recurring donation? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      // Refresh the subscriptions list
      await findSubscriptions();
    } catch (err) {
      setError(err.message);
    }
  };

  const formatAmount = (amount) => `$${(amount / 100).toFixed(2)}`;
  const formatDate = (timestamp) => new Date(timestamp * 1000).toLocaleDateString();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-bold text-blue-700">
            <Calendar className="w-6 h-6 text-blue-500" />
            Manage Your Recurring Donations
          </CardTitle>
          <p className="text-muted-foreground">
            Enter your email address to find and manage your recurring donations
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && findSubscriptions()}
              />
              <Button 
                onClick={findSubscriptions} 
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Find
              </Button>
            </div>
          </div>

          {error && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {subscriptions.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Your Recurring Donations</h3>
              {subscriptions.map((subscription) => (
                <Card key={subscription.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{subscription.customer_email}</span>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        subscription.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {subscription.status === 'active' ? 'Active' : 'Canceled'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <span>Amount: {formatAmount(subscription.items.data[0].price.unit_amount)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>Frequency: {subscription.items.data[0].price.recurring.interval}ly</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600">Next payment: {formatDate(subscription.current_period_end)}</span>
                      </div>
                    </div>

                    {subscription.status === 'active' && (
                      <div className="mt-4 pt-3 border-t">
                        <Button 
                          onClick={() => cancelSubscription(subscription.id)} 
                          variant="destructive" 
                          size="sm"
                        >
                          Cancel Recurring Donation
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 