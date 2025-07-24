import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, Calendar, DollarSign, AlertTriangle } from 'lucide-react';

export default function ManageSubscription() {
  const [searchParams] = useSearchParams();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canceling, setCanceling] = useState(false);
  
  const customerId = searchParams.get('customer');
  const subscriptionId = searchParams.get('subscription');

  useEffect(() => {
    if (!customerId || !subscriptionId) {
      setError('Missing subscription information');
      setLoading(false);
      return;
    }

    fetchSubscription();
  }, [customerId, subscriptionId]);

  const fetchSubscription = async () => {
    try {
      const response = await fetch(`/api/stripe/get-subscription?customer=${customerId}&subscription=${subscriptionId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }
      const data = await response.json();
      setSubscription(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your recurring donation? This action cannot be undone.')) {
      return;
    }

    setCanceling(true);
    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      // Refresh subscription data
      await fetchSubscription();
    } catch (err) {
      setError(err.message);
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading subscription...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Subscription not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  const formatAmount = (amount) => `$${(amount / 100).toFixed(2)}`;
  const formatDate = (timestamp) => new Date(timestamp * 1000).toLocaleDateString();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-bold text-blue-700">
            <Calendar className="w-6 h-6 text-blue-500" />
            Manage Recurring Donation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Status:</span>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                subscription.status === 'active' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {subscription.status === 'active' ? 'Active' : 'Canceled'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="font-medium">Amount:</span>
              <span className="font-semibold">{formatAmount(subscription.items.data[0].price.unit_amount)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="font-medium">Frequency:</span>
              <span className="capitalize">{subscription.items.data[0].price.recurring.interval}ly</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="font-medium">Next payment:</span>
              <span>{formatDate(subscription.current_period_end)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="font-medium">Started:</span>
              <span>{formatDate(subscription.created)}</span>
            </div>
          </div>

          {subscription.status === 'active' && (
            <div className="pt-4 border-t">
              <Button 
                onClick={cancelSubscription} 
                variant="destructive" 
                className="w-full"
                disabled={canceling}
              >
                {canceling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Canceling...
                  </>
                ) : (
                  'Cancel Recurring Donation'
                )}
              </Button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                You can always start a new recurring donation anytime
              </p>
            </div>
          )}

          {subscription.status === 'canceled' && (
            <div className="pt-4 border-t">
              <Alert>
                <AlertDescription>
                  Your recurring donation has been canceled. You can start a new one anytime.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 