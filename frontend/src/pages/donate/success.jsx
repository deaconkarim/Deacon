import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function DonateSuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-blue-100 py-12 px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-bold text-emerald-700">
            <CheckCircle className="w-7 h-7 text-emerald-500" />
            Thank You!
          </CardTitle>
          <p className="text-muted-foreground mt-2">Your donation was received. We appreciate your support!</p>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full mt-4" size="lg">
            <a href="/">Return to Home</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}