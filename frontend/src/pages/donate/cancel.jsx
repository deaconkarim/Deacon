import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function DonateCancel() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-blue-100 py-12 px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-bold text-red-700">
            <AlertCircle className="w-7 h-7 text-red-500" />
            Donation Not Completed
          </CardTitle>
          <p className="text-muted-foreground mt-2">Your donation was not completed. You can try again or return to the main site.</p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mt-4">
            <Button asChild className="flex-1" size="lg" variant="outline">
              <a href="/donate">Try Again</a>
            </Button>
            <Button asChild className="flex-1" size="lg">
              <a href="/">Return Home</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}