import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, X } from 'lucide-react';

export default function DonateSuccess() {
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
            <CheckCircle className="w-7 h-7 text-emerald-500" />
            Thank You!
          </CardTitle>
          <p className="text-muted-foreground mt-2">Your donation was received and has been recorded to your account. We appreciate your support!</p>
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