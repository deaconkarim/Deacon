import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  DollarSign,
  Heart,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  QrCode,
  Building,
  Users,
  Target,
  Gift
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

const DonatePage = () => {
  const [searchParams] = useSearchParams();
  const [donationForm, setDonationForm] = useState({
    amount: '',
    fund_designation: 'general',
    donor_name: '',
    donor_email: '',
    donor_phone: '',
    notes: '',
    is_anonymous: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  // Parse URL parameters
  useEffect(() => {
    const amount = searchParams.get('amount');
    const fund = searchParams.get('fund');
    const notes = searchParams.get('notes');
    const campaign = searchParams.get('campaign');

    if (amount) {
      setDonationForm(prev => ({
        ...prev,
        amount: parseFloat(amount) || '',
        fund_designation: fund || 'general',
        notes: notes || campaign ? `Campaign: ${campaign}` : ''
      }));
    }
  }, [searchParams]);

  const fundOptions = [
    { value: 'general', label: 'General Fund', icon: Heart, color: 'bg-blue-100 text-blue-800' },
    { value: 'tithes', label: 'Tithes', icon: Gift, color: 'bg-green-100 text-green-800' },
    { value: 'building', label: 'Building Fund', icon: Building, color: 'bg-purple-100 text-purple-800' },
    { value: 'missions', label: 'Missions', icon: Target, color: 'bg-orange-100 text-orange-800' },
    { value: 'youth', label: 'Youth Ministry', icon: Users, color: 'bg-pink-100 text-pink-800' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!donationForm.amount || parseFloat(donationForm.amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid donation amount",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // In a real implementation, this would send the donation to your backend
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsSuccess(true);
      toast({
        title: "Thank You!",
        description: "Your donation has been received. We'll send you a confirmation email.",
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: "Donation Failed",
        description: "There was an error processing your donation. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAmountChange = (value) => {
    // Remove any non-numeric characters except decimal point
    const cleanValue = value.replace(/[^0-9.]/g, '');
    setDonationForm(prev => ({ ...prev, amount: cleanValue }));
  };

  const getFundIcon = (fundValue) => {
    const fund = fundOptions.find(f => f.value === fundValue);
    return fund ? fund.icon : Heart;
  };

  const getFundColor = (fundValue) => {
    const fund = fundOptions.find(f => f.value === fundValue);
    return fund ? fund.color : 'bg-gray-100 text-gray-800';
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="text-center">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
              <p className="text-gray-600 mb-6">
                Your donation of ${parseFloat(donationForm.amount).toFixed(2)} has been received.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600">
                  We'll send you a confirmation email with your donation receipt.
                </p>
              </div>
              <Button 
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                Return to Home
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Church Donations</h1>
                <p className="text-sm text-gray-600">Support our ministry</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Donation Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                    <span>Make a Donation</span>
                  </CardTitle>
                  <CardDescription>
                    Your generosity helps us continue our mission and serve our community.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Amount */}
                    <div className="space-y-2">
                      <Label htmlFor="amount">Donation Amount</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          id="amount"
                          type="text"
                          placeholder="0.00"
                          value={donationForm.amount}
                          onChange={(e) => handleAmountChange(e.target.value)}
                          className="pl-10 text-lg"
                          required
                        />
                      </div>
                    </div>

                    {/* Fund Designation */}
                    <div className="space-y-2">
                      <Label htmlFor="fund">Fund Designation</Label>
                      <Select
                        value={donationForm.fund_designation}
                        onValueChange={(value) => setDonationForm(prev => ({ ...prev, fund_designation: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fundOptions.map((fund) => (
                            <SelectItem key={fund.value} value={fund.value}>
                              <div className="flex items-center space-x-2">
                                <fund.icon className="h-4 w-4" />
                                <span>{fund.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Donor Information */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="anonymous"
                          checked={donationForm.is_anonymous}
                          onChange={(e) => setDonationForm(prev => ({ ...prev, is_anonymous: e.target.checked }))}
                          className="rounded"
                        />
                        <Label htmlFor="anonymous" className="text-sm">Make this donation anonymous</Label>
                      </div>

                      {!donationForm.is_anonymous && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Your Name</Label>
                            <Input
                              id="name"
                              placeholder="John Doe"
                              value={donationForm.donor_name}
                              onChange={(e) => setDonationForm(prev => ({ ...prev, donor_name: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="john@example.com"
                              value={donationForm.donor_email}
                              onChange={(e) => setDonationForm(prev => ({ ...prev, donor_email: e.target.value }))}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                      <Label htmlFor="notes">Additional Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Any special instructions or comments..."
                        value={donationForm.notes}
                        onChange={(e) => setDonationForm(prev => ({ ...prev, notes: e.target.value }))}
                        rows={3}
                      />
                    </div>

                    {/* Submit Button */}
                    <Button 
                      type="submit" 
                      className="w-full" 
                      size="lg"
                      disabled={isSubmitting || !donationForm.amount || parseFloat(donationForm.amount) <= 0}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Heart className="h-4 w-4 mr-2" />
                          Complete Donation
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Information Sidebar */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <QrCode className="h-5 w-5 text-blue-600" />
                    <span>Quick Donation</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Selected Fund</Label>
                    <div className="flex items-center space-x-2">
                      <Badge className={getFundColor(donationForm.fund_designation)}>
                        <getFundIcon fundValue={donationForm.fund_designation} className="h-3 w-3 mr-1" />
                        {fundOptions.find(f => f.value === donationForm.fund_designation)?.label}
                      </Badge>
                    </div>
                  </div>
                  
                  {donationForm.amount && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Donation Amount</Label>
                      <div className="text-2xl font-bold text-green-600">
                        ${parseFloat(donationForm.amount).toFixed(2)}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>About Our Funds</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {fundOptions.map((fund) => (
                    <div key={fund.value} className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-lg ${getFundColor(fund.value)} flex items-center justify-center flex-shrink-0`}>
                        <fund.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{fund.label}</div>
                        <div className="text-xs text-gray-500">
                          {fund.value === 'general' && 'General operating expenses and ministry support'}
                          {fund.value === 'tithes' && 'Traditional tithes and offerings'}
                          {fund.value === 'building' && 'Building maintenance and facility improvements'}
                          {fund.value === 'missions' && 'Local and international mission work'}
                          {fund.value === 'youth' && 'Youth ministry programs and activities'}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Security & Privacy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>All donations are secure and encrypted</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Your information is kept confidential</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Tax receipts are automatically generated</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonatePage;