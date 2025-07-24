import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, X, RefreshCw } from 'lucide-react';

export default function DonateSuccess() {
  const [searchParams] = useSearchParams();
  const isRecurring = searchParams.get('recurring') === 'true';
  const interval = searchParams.get('interval') || 'month';
  
  const handleClose = () => {
    window.close();
    // Fallback: if window.close() doesn't work (e.g., window wasn't opened by script)
    // redirect to a blank page or the original site
    window.location.href = 'about:blank';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-blue-100 py-12 px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-bold text-emerald-700">
            {isRecurring ? (
              <RefreshCw className="w-7 h-7 text-blue-500" />
            ) : (
              <CheckCircle className="w-7 h-7 text-emerald-500" />
            )}
            {isRecurring ? 'Recurring Donation Set Up!' : 'Thank You!'}
          </CardTitle>
                     <p className="text-muted-foreground mt-2">
             {isRecurring 
               ? `Your recurring donation has been set up successfully! You'll be charged ${interval}ly until you cancel. You can manage your subscription anytime.`
               : 'Your donation was received and has been recorded to your account. We appreciate your support!'
             }
           </p>
           {isRecurring && (
             <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
               <h3 className="font-semibold text-blue-800 mb-2">Manage Your Recurring Donation</h3>
               <p className="text-sm text-blue-700 mb-3">
                 You can view, modify, or cancel your recurring donation anytime using the link below.
               </p>
               <Button 
                 onClick={() => {
                   // For now, we'll redirect to a general management page
                   // The customer can enter their email to find their subscriptions
                   window.open(`/donate/manage`, '_blank');
                 }}
                 variant="outline"
                 className="w-full"
               >
                 Manage Recurring Donation
               </Button>
             </div>
           )}
        </CardHeader>
        <CardContent>
          <Button onClick={handleClose} className="w-full mt-4" size="lg">
            <X className="w-5 h-5 mr-2" />
            Close Window
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}