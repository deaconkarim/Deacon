import React from 'react';

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center">
        {children}
      </main>
      <footer className="py-4 px-6 border-t bg-card">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">© 2025 Deacon - Church Command Center. All rights reserved.</p>
          <p className="text-xs text-muted-foreground mt-2 sm:mt-0 sm:ml-4 text-center">
            <a href="/privacy-policy" className="underline hover:text-primary">Privacy Policy</a>
          </p>
        </div>
      </footer>
    </div>
  );
} 