import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getOrganizationBySlug, getCurrentUserMember } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Gift, DollarSign, Mail, CheckCircle, AlertCircle, CreditCard, Banknote } from 'lucide-react';

const FUNDS = [
  { value: 'general', label: 'General Fund' },
  { value: 'tithe', label: 'Tithes' },
  { value: 'building_fund', label: 'Building Fund' },
  { value: 'missions', label: 'Missions' },
  { value: 'youth_ministry', label: 'Youth Ministry' },
];

export default function DonatePage() {
  const { slug } = useParams();
  const [amount, setAmount] = useState('');
  const [fund, setFund] = useState('tithe');
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState('month');
  const [coverFees, setCoverFees] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [org, setOrg] = useState(null);
  const [orgLoading, setOrgLoading] = useState(true);
  const [member, setMember] = useState(null);
  const [memberLoading, setMemberLoading] = useState(true);

  useEffect(() => {
    async function fetchOrg() {
      setOrgLoading(true);
      const orgData = await getOrganizationBySlug(slug);
      setOrg(orgData);
      setOrgLoading(false);
    }
    fetchOrg();
  }, [slug]);

  useEffect(() => {
    async function fetchMember() {
      setMemberLoading(true);
      try {
        const m = await getCurrentUserMember();
        setMember(m);
      } catch (e) {
        setMember(null);
      }
      setMemberLoading(false);
    }
    fetchMember();
  }, []);

  // Calculate the fee amount based on payment method
  const calculateFee = (amount, method) => {
    const amountNum = parseFloat(amount) || 0;
    let fee;
    
    if (method === 'ach') {
      // ACH transfers have much lower fees: 0.8% + 25 cents
      fee = (amountNum * 0.008) + 0.25;
    } else {
      // Credit/debit cards: 2.9% + 30 cents
      fee = (amountNum * 0.029) + 0.30;
    }
    
    return Math.round(fee * 100) / 100; // Round to 2 decimal places
  };

  const feeAmount = calculateFee(amount, paymentMethod);
  const totalAmount = parseFloat(amount) + feeAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    // Log donation attempt details

      organization_id: org?.id,
      organization_name: org?.name,
      amount: amount,
      amount_cents: Math.round(parseFloat(amount) * 100),
      donor_email: email,
      fund_designation: fund,
      cover_fees: coverFees,
      fee_amount: feeAmount,
      total_amount: totalAmount,
    });
    
    try {

      const res = await fetch('https://getdeacon.com/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: org?.id || '',
          amount: parseFloat(amount),
          donor_email: email,
          fund_designation: fund,
          payment_method: paymentMethod,
          cover_fees: coverFees,
          is_recurring: isRecurring,
          recurring_interval: recurringInterval,
        }),
      });

      if (!res.ok) {
        let errorData;
        try {
          errorData = await res.json();
        } catch (parseError) {
          // If response is not JSON, get the text
          const errorText = await res.text();
          console.error('❌ Non-JSON error response:', errorText);
          errorData = { error: `HTTP ${res.status}: ${res.statusText}` };
        }
        console.error('❌ API Error Response:', errorData);
        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
      }
      
      let result;
      try {
        result = await res.json();
      } catch (parseError) {
        console.error('❌ Failed to parse JSON response:', parseError);
        throw new Error('Invalid response from server');
      }

      // Log debug information if available
      if (result.debug) {

        if (result.debug.is_same_account) {

        } else {

        }
      }
      
      if (result.url) {

        window.location.href = result.url;
      } else {
        console.error('❌ No checkout URL in response:', result);
        setError(result.error || 'Failed to start payment.');
      }
    } catch (err) {
      console.error('💥 Payment error:', err);
      console.error('🔍 Error details:', {
        message: err.message,
        stack: err.stack,
        organization_id: org?.id,
        organization_name: org?.name
      });
      
      // Log debug information from error response if available
      if (err.debug) {

      }
      
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);

    }
  };

  if (orgLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  if (!org) {
    return <div className="min-h-screen flex items-center justify-center text-red-600 font-bold">Church not found.</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-bold text-blue-700">
            <Gift className="w-6 h-6 text-emerald-500" />
            Give to {org.name}
          </CardTitle>
          <p className="text-muted-foreground mt-2">Support your church with a secure online donation.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="amount">Amount (USD)</Label>
              <div className="flex items-center mt-1">
                <DollarSign className="w-4 h-4 text-muted-foreground mr-1" />
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full"
                  disabled={loading}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="fund">Fund</Label>
              <Select value={fund} onValueChange={setFund} disabled={loading}>
                <SelectTrigger id="fund">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FUNDS.map(f => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={loading}>
                <SelectTrigger id="payment-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Credit/Debit Card
                    </div>
                  </SelectItem>
                  <SelectItem value="ach">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4" />
                      Bank Transfer (ACH) - Lower Fees
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {paymentMethod === 'ach' && (
                <p className="text-xs text-emerald-600 mt-1">
                  💰 Save money with ACH transfers - only 0.8% + $0.25 vs 2.9% + $0.30 for cards
                </p>
              )}
            </div>
            
            {/* Recurring Payment Options */}
            <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isRecurring"
                  checked={isRecurring}
                  onCheckedChange={setIsRecurring}
                  disabled={loading}
                />
                <Label htmlFor="isRecurring" className="text-sm font-medium">
                  Make this a recurring donation
                </Label>
              </div>
              
              {isRecurring && (
                <div className="space-y-2">
                  <Label htmlFor="recurring-interval">Frequency</Label>
                  <Select value={recurringInterval} onValueChange={setRecurringInterval} disabled={loading}>
                    <SelectTrigger id="recurring-interval">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Weekly</SelectItem>
                      <SelectItem value="month">Monthly</SelectItem>
                      <SelectItem value="quarter">Quarterly</SelectItem>
                      <SelectItem value="year">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-blue-600">
                    🔄 Your donation will be automatically charged every {recurringInterval === 'week' ? 'week' : 
                    recurringInterval === 'month' ? 'month' : 
                    recurringInterval === 'quarter' ? '3 months' : 'year'}
                  </p>
                </div>
              )}
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center mt-1">
                <Mail className="w-4 h-4 text-muted-foreground mr-1" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full"
                  disabled={loading}
                />
              </div>
            </div>
            
            {/* Fee Coverage Option */}
            {amount && parseFloat(amount) > 0 && (
              <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="coverFees"
                    checked={coverFees}
                    onCheckedChange={setCoverFees}
                    disabled={loading}
                  />
                  <Label htmlFor="coverFees" className="text-sm font-medium">
                    Cover processing fees so {org.name} receives the full amount
                  </Label>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Donation amount:</span>
                    <span>${parseFloat(amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Processing fee ({paymentMethod === 'ach' ? '0.8% + $0.25' : '2.9% + $0.30'}):</span>
                    <span>${feeAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-1">
                    <span>Total you'll pay:</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Church receives:</span>
                    <span>${parseFloat(amount).toFixed(2)}</span>
                  </div>
                  {paymentMethod === 'ach' && (
                    <div className="flex justify-between text-blue-600 text-xs">
                      <span>💰 You save:</span>
                      <span>${(calculateFee(amount, 'card') - feeAmount).toFixed(2)} vs card payment</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {error && (
              <div className="flex items-center text-red-600 text-sm mt-2">
                <AlertCircle className="w-4 h-4 mr-1" /> {error}
              </div>
            )}
            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {isRecurring 
                ? (coverFees ? `Start Recurring $${totalAmount.toFixed(2)}` : `Start Recurring $${parseFloat(amount).toFixed(2)}`)
                : (coverFees ? `Give $${totalAmount.toFixed(2)}` : 'Give Now')
              }
            </Button>
          </form>
        </CardContent>
        {/* Manage Recurring Payments Link for Members */}
        {(!memberLoading && member && member.stripe_customer_id) && (
          <div className="px-6 pb-6">
            <a
              href={`/donate/manage?customer=${member.stripe_customer_id}`}
              className="w-full inline-block"
            >
              <Button variant="secondary" className="w-full mt-2">
                Manage Recurring Payments
              </Button>
            </a>
            <p className="text-xs text-center text-muted-foreground mt-1">
              View or cancel your recurring donations
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}