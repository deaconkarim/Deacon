import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';

const PWAInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showManualPrompt, setShowManualPrompt] = useState(false);

  useEffect(() => {
    // Check if the app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    // Listen for the appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if user has dismissed the prompt before
    const hasDismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (hasDismissed) {
      setShowPrompt(false);
      setShowManualPrompt(false);
    }

    // Show manual prompt after a delay if no automatic prompt
    const timer = setTimeout(() => {
      if (!deferredPrompt && !isInstalled && !hasDismissed) {
        setShowManualPrompt(true);
      }
    }, 5000); // Show after 5 seconds

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt || typeof deferredPrompt.prompt !== 'function') {

      setShowManualPrompt(true);
      setShowPrompt(false);
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setShowPrompt(false);
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error during PWA install:', error);
      setShowManualPrompt(true);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowManualPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // Don't show if already installed
  if (isInstalled || (!showPrompt && !showManualPrompt)) {
    return null;
  }

  // Don't show install button if we don't have a valid prompt
  const hasValidPrompt = deferredPrompt && typeof deferredPrompt.prompt === 'function';

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 bg-gradient-to-r from-blue-600 to-blue-700 border border-blue-700 rounded-lg shadow-lg p-4 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white mb-1">
            Install Deacon App
          </h3>
          <p className="text-xs text-blue-100 mb-3">
            Get quick access to your church management tools. Install the app for a better experience.
          </p>
          
          <div className="flex gap-2">
            {hasValidPrompt ? (
              <button
                onClick={handleInstall}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-blue-500 text-white text-xs font-medium px-3 py-2 rounded-md hover:from-emerald-600 hover:to-blue-600 transition-colors flex items-center justify-center gap-1"
              >
                <Download className="w-3 h-3" />
                Install
              </button>
            ) : (
              <div className="flex-1 text-xs text-blue-100">
                <p>To install: Tap the share button and select "Add to Home Screen"</p>
              </div>
            )}
            <button
              onClick={handleDismiss}
              className="text-xs text-blue-200 hover:text-white transition-colors px-2 py-2 rounded-md hover:bg-blue-600/20"
              aria-label="Dismiss install prompt"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;