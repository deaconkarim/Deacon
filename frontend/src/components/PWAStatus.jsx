import { useState, useEffect } from 'react';
import { Smartphone, Download, CheckCircle, XCircle, Info } from 'lucide-react';

const PWAStatus = () => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // Check if PWA is supported
    setSupportsPWA('serviceWorker' in navigator && 'PushManager' in window);

    // Check if app is installed
    const checkInstallation = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                       window.navigator.standalone === true;
      setIsStandalone(standalone);
      setIsInstalled(standalone);
    };

    checkInstallation();

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsStandalone(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setIsStandalone(true);
    }
    
    setDeferredPrompt(null);
  };

  const getStatusIcon = () => {
    if (isInstalled) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    if (deferredPrompt) {
      return <Download className="w-5 h-5 text-blue-500" />;
    }
    return <XCircle className="w-5 h-5 text-gray-400" />;
  };

  const getStatusText = () => {
    if (isInstalled) {
      return 'Installed';
    }
    if (deferredPrompt) {
      return 'Ready to install';
    }
    return 'Not installed';
  };

  const getStatusColor = () => {
    if (isInstalled) {
      return 'text-green-600';
    }
    if (deferredPrompt) {
      return 'text-blue-600';
    }
    return 'text-gray-500';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center">
          <Smartphone className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">PWA Status</h3>
          <p className="text-sm text-gray-600">Progressive Web App information</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Installation Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <p className="font-medium text-gray-900">Installation Status</p>
              <p className={`text-sm ${getStatusColor()}`}>{getStatusText()}</p>
            </div>
          </div>
          {deferredPrompt && !isInstalled && (
            <button
              onClick={handleInstall}
              className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
            >
              Install
            </button>
          )}
        </div>

        {/* PWA Support */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            {supportsPWA ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <div>
              <p className="font-medium text-gray-900">PWA Support</p>
              <p className="text-sm text-gray-600">
                {supportsPWA ? 'Supported' : 'Not supported'}
              </p>
            </div>
          </div>
        </div>

        {/* Display Mode */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-blue-500" />
            <div>
              <p className="font-medium text-gray-900">Display Mode</p>
              <p className="text-sm text-gray-600">
                {isStandalone ? 'Standalone (App-like)' : 'Browser'}
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-4">
          <h4 className="font-medium text-gray-900 mb-2">PWA Features</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Offline functionality
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              App-like experience
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Automatic updates
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Home screen installation
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PWAStatus;