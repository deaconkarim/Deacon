import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Gift, DollarSign, Mail, AlertCircle, Target } from 'lucide-react';
import supabase from '@/lib/supabaseClient';

export default function ChurchDonatePage() {
  const router = useRouter();
  const { slug } = router.query;
  const [church, setChurch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [amount, setAmount] = useState('');
  const [fund, setFund] = useState('');
  const [campaign, setCampaign] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [funds, setFunds] = useState([]);
  const [campaigns, setCampaigns] = useState([]);

  // Fetch church info by slug
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    supabase
      .from('organizations')
      .select('*')
      .eq('slug', slug)
      .single()
      .then(async ({ data, error }) => {
        if (error || !data) {
          setError('Church not found.');
          setChurch(null);
          setLoading(false);
          return;
        }
        setChurch(data);
        // Fetch funds (donation categories)
        const { data: fundData } = await supabase
          .from('donation_categories')
          .select('*')
          .eq('organization_id', data.id)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });
        setFunds(fundData || []);
        // Fetch active campaigns
        const { data: campaignData } = await supabase
          .from('donation_campaigns')
          .select('*')
          .eq('organization_id', data.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        setCampaigns(campaignData || []);
        setFund((fundData && fundData[0]?.id) || '');
        setCampaign((campaignData && campaignData[0]?.id) || '');
        setLoading(false);
      });
  }, [slug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setFormError('Please enter a valid donation amount.');
      return;
    }
    if (!email || !email.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: church.id,
          amount: Math.round(Number(amount) * 100),
          donor_email: email,
          fund_designation: fund,
          campaign_id: campaign || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setFormError(data.error || 'Failed to start donation.');
      }
    } catch (err) {
      setFormError('Something went wrong. Please try again.');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-emerald-50">
        <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
        <span className="ml-3 text-blue-700">Loading church info...</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-blue-50">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <span className="ml-3 text-red-700">{error}</span>
      </div>
    );
  }
  if (!church) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-emerald-50 py-12 px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <div className="flex flex-col items-center gap-2">
            {church.logo_url && (
              <img src={church.logo_url} alt={church.name} className="h-16 w-16 rounded-full object-cover border" />
            )}
            <CardTitle className="text-2xl font-bold text-blue-900 text-center">Give to {church.name}</CardTitle>
            <p className="text-muted-foreground text-center">Secure online giving powered by Stripe</p>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="amount" className="flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-blue-500" /> Amount
              </Label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="0.01"
                placeholder="Enter amount (USD)"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
              />
            </div>
            {funds.length > 0 && (
              <div>
                <Label htmlFor="fund" className="flex items-center gap-1">
                  <Gift className="w-4 h-4 text-blue-500" /> Fund
                </Label>
                <Select value={fund} onValueChange={setFund}>
                  <SelectTrigger id="fund">
                    <SelectValue placeholder="Select fund" />
                  </SelectTrigger>
                  <SelectContent>
                    {funds.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {campaigns.length > 0 && (
              <div>
                <Label htmlFor="campaign" className="flex items-center gap-1">
                  <Target className="w-4 h-4 text-blue-500" /> Campaign
                </Label>
                <Select value={campaign} onValueChange={setCampaign}>
                  <SelectTrigger id="campaign">
                    <SelectValue placeholder="Select campaign (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="email" className="flex items-center gap-1">
                <Mail className="w-4 h-4 text-blue-500" /> Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            {formError && (
              <div className="text-red-600 text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> {formError}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : null}
              Give Now
            </Button>
          </form>
          <div className="mt-6 text-xs text-center text-muted-foreground">
            Payments processed securely by Stripe. You’ll receive a receipt by email.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}