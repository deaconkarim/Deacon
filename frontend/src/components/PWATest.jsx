import { useState, useEffect } from 'react';
import { Smartphone, Download, CheckCircle, XCircle, Info, AlertCircle } from 'lucide-react';
import PWAInstallInstructions from './PWAInstallInstructions';

const PWATest = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    // Check PWA support
    const pwaSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    setSupportsPWA(pwaSupported);

    // Check if app is installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                     window.navigator.standalone === true;
    setIsStandalone(standalone);
    setIsInstalled(standalone);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e) => {
      console.log('beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      console.log('appinstalled event fired');
      setIsInstalled(true);
      setIsStandalone(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Collect debug info
    setDebugInfo({
      userAgent: navigator.userAgent,
      isStandalone: standalone,
      supportsServiceWorker: 'serviceWorker' in navigator,
      supportsPushManager: 'PushManager' in window,
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      isLocalhost: window.location.hostname === 'localhost',
      isSecure: window.location.protocol === 'https:',
      displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser'
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      console.log('No deferred prompt available');
      return;
    }

    console.log('Triggering install prompt');
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('Install outcome:', outcome);
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setIsStandalone(true);
    }
    
    setDeferredPrompt(null);
  };

  const forceShowPrompt = () => {
    // Simulate the beforeinstallprompt event for testing
    const event = new Event('beforeinstallprompt');
    window.dispatchEvent(event);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center">
          <Smartphone className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">PWA Test & Debug</h2>
          <p className="text-sm text-gray-600">Test Progressive Web App functionality</p>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            {supportsPWA ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <span className="font-medium">PWA Support</span>
          </div>
          <p className="text-sm text-gray-600">
            {supportsPWA ? 'Supported' : 'Not supported'}
          </p>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            {isInstalled ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-gray-400" />
            )}
            <span className="font-medium">Installation</span>
          </div>
          <p className="text-sm text-gray-600">
            {isInstalled ? 'Installed' : 'Not installed'}
          </p>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-5 h-5 text-blue-500" />
            <span className="font-medium">Display Mode</span>
          </div>
          <p className="text-sm text-gray-600">
            {isStandalone ? 'Standalone' : 'Browser'}
          </p>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            {deferredPrompt ? (
              <Download className="w-5 h-5 text-blue-500" />
            ) : (
              <XCircle className="w-5 h-5 text-gray-400" />
            )}
            <span className="font-medium">Install Prompt</span>
          </div>
          <p className="text-sm text-gray-600">
            {deferredPrompt ? 'Available' : 'Not available'}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        {deferredPrompt && !isInstalled && (
          <button
            onClick={handleInstall}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-md hover:from-emerald-600 hover:to-blue-600 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Install App
          </button>
        )}
        
        <button
          onClick={forceShowPrompt}
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
        >
          Force Show Prompt (Test)
        </button>

        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Reload Page
        </button>
      </div>

      {/* Debug Information */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-500" />
          Debug Information
        </h3>
        
        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
          <div><strong>Protocol:</strong> {debugInfo.protocol}</div>
          <div><strong>Hostname:</strong> {debugInfo.hostname}</div>
          <div><strong>Is Localhost:</strong> {debugInfo.isLocalhost ? 'Yes' : 'No'}</div>
          <div><strong>Is Secure:</strong> {debugInfo.isSecure ? 'Yes' : 'No'}</div>
          <div><strong>Display Mode:</strong> {debugInfo.displayMode}</div>
          <div><strong>Service Worker Support:</strong> {debugInfo.supportsServiceWorker ? 'Yes' : 'No'}</div>
          <div><strong>Push Manager Support:</strong> {debugInfo.supportsPushManager ? 'Yes' : 'No'}</div>
          <div><strong>User Agent:</strong> <span className="text-xs break-all">{debugInfo.userAgent}</span></div>
        </div>
      </div>

      {/* Requirements Check */}
      <div className="mt-6 border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">PWA Requirements</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            {debugInfo.isSecure || debugInfo.isLocalhost ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
            <span>HTTPS or localhost</span>
          </div>
          <div className="flex items-center gap-2">
            {debugInfo.supportsServiceWorker ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
            <span>Service Worker support</span>
          </div>
          <div className="flex items-center gap-2">
            {debugInfo.supportsPushManager ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
            <span>Push Manager support</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Valid web app manifest</span>
          </div>
                 </div>
       </div>

       {/* Installation Instructions */}
       <div className="mt-8">
         <PWAInstallInstructions />
       </div>
     </div>
   );
 };

export default PWATest;