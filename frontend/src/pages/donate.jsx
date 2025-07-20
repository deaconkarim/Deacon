import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Heart, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ArrowLeft,
  Share2,
  Copy,
  ExternalLink,
  DollarSign,
  Users,
  Target,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  getDonationUrlBySlug,
  processSquareDonation,
  formatCurrency
} from '@/lib/squareService';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
};

export function DonatePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State management
  const [donationUrl, setDonationUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('idle'); // idle, processing, success, error
  
  // Form state
  const [donationForm, setDonationForm] = useState({
    amount: '',
    donor_name: '',
    donor_email: '',
    message: '',
    is_anonymous: false,
    fund_designation: 'general'
  });
  
  // Square Web SDK state
  const [squarePayments, setSquarePayments] = useState(null);
  const [card, setCard] = useState(null);
  const [paymentForm, setPaymentForm] = useState(null);

  useEffect(() => {
    loadDonationUrl();
  }, [slug]);

  const loadDonationUrl = async () => {
    try {
      setIsLoading(true);
      const urlData = await getDonationUrlBySlug(slug);
      setDonationUrl(urlData);
      
      // Initialize Square Web SDK if settings are available
      if (urlData?.organization?.square_settings?.is_active) {
        await initializeSquarePayments(urlData.organization.square_settings);
      }
    } catch (error) {
      console.error('Error loading donation URL:', error);
      toast({
        title: "Error",
        description: "Failed to load donation page",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const initializeSquarePayments = async (settings) => {
    try {
      // Load Square Web SDK
      const { Payments } = await import('@square/web-sdk');
      
      const payments = Payments.load({
        applicationId: settings.application_id,
        locationId: settings.location_id,
        environment: settings.environment
      });
      
      setSquarePayments(payments);
      
      // Create card component
      const card = await payments.card({
        style: {
          '.input-container.is-focus': {
            borderColor: '#3b82f6'
          },
          '.input-container.is-error': {
            borderColor: '#ef4444'
          }
        }
      });
      
      setCard(card);
      
      // Create payment form
      const paymentForm = await payments.paymentForm({
        card,
        style: {
          '.input-container.is-focus': {
            borderColor: '#3b82f6'
          },
          '.input-container.is-error': {
            borderColor: '#ef4444'
          }
        }
      });
      
      setPaymentForm(paymentForm);
    } catch (error) {
      console.error('Error initializing Square payments:', error);
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and decimal point
    if (/^\d*\.?\d{0,2}$/.test(value) || value === '') {
      setDonationForm(prev => ({ ...prev, amount: value }));
    }
  };

  const handleSuggestedAmount = (amount) => {
    setDonationForm(prev => ({ ...prev, amount: amount.toString() }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!donationForm.amount || parseFloat(donationForm.amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid donation amount",
        variant: "destructive"
      });
      return;
    }

    if (!donationForm.donor_name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your name",
        variant: "destructive"
      });
      return;
    }

    if (!donationForm.donor_email.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);
      setPaymentStatus('processing');

      // Create payment request
      const paymentRequest = {
        amount: Math.round(parseFloat(donationForm.amount) * 100), // Convert to cents
        currency: 'USD',
        intent: 'CAPTURE'
      };

      // Process payment with Square
      const result = await paymentForm.submit(paymentRequest);
      
      if (result.status === 'OK') {
        // Process the donation in our system
        await processSquareDonation({
          donation_url_id: donationUrl.id,
          organization_id: donationUrl.organization_id,
          donor_name: donationForm.donor_name,
          donor_email: donationForm.donor_email,
          amount: parseFloat(donationForm.amount),
          square_payment_id: result.paymentId,
          square_transaction_id: result.transactionId,
          fund_designation: donationForm.fund_designation,
          message: donationForm.message,
          is_anonymous: donationForm.is_anonymous
        });

        setPaymentStatus('success');
        toast({
          title: "Thank You!",
          description: "Your donation has been processed successfully",
        });
      } else {
        throw new Error('Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('error');
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "URL copied to clipboard",
    });
  };

  const sharePage = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: donationUrl?.name || 'Donation Page',
        url: url
      });
    } else {
      copyToClipboard(url);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading donation page...</p>
        </div>
      </div>
    );
  }

  if (!donationUrl) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
          <p className="text-gray-600 mb-4">This donation page could not be found or is no longer active.</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <motion.div 
          className="text-center max-w-md mx-auto p-8"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <CheckCircle className="w-16 h-16 mx-auto mb-6 text-green-500" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h1>
          <p className="text-gray-600 mb-6">
            Your donation of {formatCurrency(parseFloat(donationForm.amount))} has been processed successfully.
            You will receive a confirmation email shortly.
          </p>
          <div className="space-y-3">
            <Button onClick={() => window.location.reload()} className="w-full">
              Make Another Donation
            </Button>
            <Button variant="outline" onClick={() => navigate('/')} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return Home
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <motion.div 
          className="max-w-2xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-8">
            <div className="flex items-center justify-between mb-6">
              <Button variant="ghost" onClick={() => navigate('/')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button variant="ghost" onClick={sharePage}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
            
            {donationUrl.organization?.logo_url && (
              <img 
                src={donationUrl.organization.logo_url} 
                alt={donationUrl.organization.name}
                className="w-16 h-16 mx-auto mb-4 rounded-full"
              />
            )}
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {donationUrl.name}
            </h1>
            
            {donationUrl.description && (
              <p className="text-gray-600 mb-4">{donationUrl.description}</p>
            )}
            
            {donationUrl.custom_message && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-800">{donationUrl.custom_message}</p>
              </div>
            )}
          </motion.div>

          {/* Campaign Progress */}
          {donationUrl.campaign && (
            <motion.div variants={itemVariants} className="mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    {donationUrl.campaign.name}
                  </CardTitle>
                  <CardDescription>{donationUrl.campaign.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span>Goal: {formatCurrency(donationUrl.campaign.goal_amount)}</span>
                      <span>Raised: {formatCurrency(donationUrl.campaign.current_amount)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min((donationUrl.campaign.current_amount / donationUrl.campaign.goal_amount) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                    <div className="text-center text-sm text-gray-600">
                      {Math.round((donationUrl.campaign.current_amount / donationUrl.campaign.goal_amount) * 100)}% Complete
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Donation Form */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="w-5 h-5 mr-2 text-red-500" />
                  Make a Donation
                </CardTitle>
                <CardDescription>
                  Your generous gift helps us continue our mission
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Amount Selection */}
                  <div>
                    <Label htmlFor="amount">Donation Amount</Label>
                    <div className="mt-2">
                      <Input
                        id="amount"
                        type="text"
                        value={donationForm.amount}
                        onChange={handleAmountChange}
                        placeholder="0.00"
                        className="text-lg font-semibold"
                        required
                      />
                    </div>
                    
                    {/* Suggested Amounts */}
                    {donationUrl.suggested_amounts && donationUrl.suggested_amounts.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {donationUrl.suggested_amounts.map((amount, index) => (
                          <Button
                            key={index}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleSuggestedAmount(amount)}
                          >
                            {formatCurrency(amount)}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Donor Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="donor_name">Your Name *</Label>
                      <Input
                        id="donor_name"
                        value={donationForm.donor_name}
                        onChange={(e) => setDonationForm(prev => ({ ...prev, donor_name: e.target.value }))}
                        placeholder="Enter your name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="donor_email">Email Address *</Label>
                      <Input
                        id="donor_email"
                        type="email"
                        value={donationForm.donor_email}
                        onChange={(e) => setDonationForm(prev => ({ ...prev, donor_email: e.target.value }))}
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>

                  {/* Fund Designation */}
                  <div>
                    <Label htmlFor="fund_designation">Fund Designation</Label>
                    <Select
                      value={donationForm.fund_designation}
                      onValueChange={(value) => setDonationForm(prev => ({ ...prev, fund_designation: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Fund</SelectItem>
                        <SelectItem value="tithe">Tithe</SelectItem>
                        <SelectItem value="building_fund">Building Fund</SelectItem>
                        <SelectItem value="missions">Missions</SelectItem>
                        <SelectItem value="youth_ministry">Youth Ministry</SelectItem>
                        <SelectItem value="outreach">Outreach</SelectItem>
                        <SelectItem value="benevolence">Benevolence</SelectItem>
                        <SelectItem value="special_events">Special Events</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Message */}
                  <div>
                    <Label htmlFor="message">Message (Optional)</Label>
                    <Textarea
                      id="message"
                      value={donationForm.message}
                      onChange={(e) => setDonationForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Add a personal message with your donation"
                      rows={3}
                    />
                  </div>

                  {/* Anonymous Option */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_anonymous"
                      checked={donationForm.is_anonymous}
                      onChange={(e) => setDonationForm(prev => ({ ...prev, is_anonymous: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="is_anonymous">Make this donation anonymous</Label>
                  </div>

                  {/* Payment Section */}
                  {squarePayments && card && (
                    <div>
                      <Label>Payment Information</Label>
                      <div id="card-container" className="mt-2">
                        {/* Square Card component will be mounted here */}
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    disabled={isProcessing || !squarePayments} 
                    className="w-full"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Heart className="w-4 h-4 mr-2" />
                        Donate {donationForm.amount ? formatCurrency(parseFloat(donationForm.amount)) : ''}
                      </>
                    )}
                  </Button>

                  {!squarePayments && (
                    <div className="text-center text-sm text-gray-500">
                      <AlertCircle className="w-4 h-4 inline mr-1" />
                      Payment processing is currently unavailable
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Footer */}
          <motion.div variants={itemVariants} className="mt-8 text-center text-sm text-gray-500">
            <p>Your donation is secure and encrypted</p>
            <p className="mt-1">Powered by Square</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}