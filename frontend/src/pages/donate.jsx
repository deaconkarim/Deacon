import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Gift, DollarSign, Mail, CheckCircle, AlertCircle } from 'lucide-react';

const FUNDS = [
  { value: 'general', label: 'General Fund' },
  { value: 'tithe', label: 'Tithes' },
  { value: 'building_fund', label: 'Building Fund' },
  { value: 'missions', label: 'Missions' },
  { value: 'youth_ministry', label: 'Youth Ministry' },
];

export default function DonatePage() {
  const [amount, setAmount] = useState('');
  const [fund, setFund] = useState(FUNDS[0].value);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: window.ORG_ID || '', // Set this globally or fetch dynamically
          amount: Math.round(parseFloat(amount) * 100),
          donor_email: email,
          fund_designation: fund,
        }),
      });
      const result = await res.json();
      if (result.url) {
        window.location.href = result.url;
      } else {
        setError(result.error || 'Failed to start payment.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-bold text-blue-700">
            <Gift className="w-6 h-6 text-emerald-500" />
            Give Online
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
            {error && (
              <div className="flex items-center text-red-600 text-sm mt-2">
                <AlertCircle className="w-4 h-4 mr-1" /> {error}
              </div>
            )}
            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Give Now
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}