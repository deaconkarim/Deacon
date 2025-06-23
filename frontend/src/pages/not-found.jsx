import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] pattern-bg">
      <Card className="w-full max-w-md text-center glass-card">
        <CardHeader>
          <div className="mx-auto bg-destructive/20 p-3 rounded-full w-fit">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="mt-4 text-3xl font-bold">Page Not Found</CardTitle>
          <CardDescription className="text-lg">
            Oops! The page you're looking for doesn't exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            It seems you've taken a wrong turn. Let's get you back on track.
          </p>
          <Button asChild size="lg" className="gradient-bg text-white hover:opacity-90 transition-opacity">
            <Link to="/">
              <Home className="mr-2 h-5 w-5" />
              Go to Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}