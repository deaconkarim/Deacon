import { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';

const PWAUpdateNotification = () => {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    // Check if service worker is supported
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
        
        // Listen for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setShowUpdate(true);
            }
          });
        });
      });
    }
  }, []);

  const handleUpdate = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  if (!showUpdate) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 bg-blue-50 border border-blue-200 rounded-lg shadow-lg p-4 animate-in slide-in-from-top-4 duration-300">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <RefreshCw className="w-4 h-4 text-white" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-blue-900 mb-1">
            Update Available
          </h3>
          <p className="text-xs text-blue-700 mb-3">
            A new version of Deacon is available. Update now for the latest features and improvements.
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={handleUpdate}
              className="flex-1 bg-blue-500 text-white text-xs font-medium px-3 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Update Now
            </button>
            <button
              onClick={handleDismiss}
              className="text-xs text-blue-500 hover:text-blue-700 transition-colors px-2 py-2 rounded-md hover:bg-blue-100"
              aria-label="Dismiss update notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAUpdateNotification;