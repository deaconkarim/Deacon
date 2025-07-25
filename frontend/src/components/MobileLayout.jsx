import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Users, 
  Calendar, 
  DollarSign, 
  Settings,
  Menu,
  X,
  ChevronLeft,
  Bell,
  Camera
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CapacitorService from '@/lib/capacitorService';
import MobileNotificationService from '@/lib/mobileNotificationService';

export function MobileLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const [networkStatus, setNetworkStatus] = useState({ connected: true });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if running on native platform
    setIsNative(CapacitorService.isNative());
    
    // Initialize notifications
    MobileNotificationService.initialize();
    
    // Get initial network status
    CapacitorService.getNetworkStatus().then(setNetworkStatus);
    
    // Listen for network changes
    CapacitorService.onNetworkChange(setNetworkStatus);
  }, []);

  const navigationItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/members', icon: Users, label: 'Members' },
    { path: '/events', icon: Calendar, label: 'Events' },
    { path: '/donations', icon: DollarSign, label: 'Donations' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setIsSidebarOpen(false);
    CapacitorService.triggerHaptic();
  };

  const handleBack = () => {
    navigate(-1);
    CapacitorService.triggerHaptic();
  };

  const handleNotification = async () => {
    await MobileNotificationService.showAnnouncement(
      'Deacon',
      'Welcome to your mobile church management app!'
    );
  };

  const handleCamera = async () => {
    try {
      const photoPath = await CapacitorService.takePhoto();
      if (photoPath) {
        console.log('Photo taken:', photoPath);
        // Handle the photo (e.g., upload to server)
      }
    } catch (error) {
      console.error('Camera error:', error);
    }
  };

  const currentPath = location.pathname;
  const currentItem = navigationItems.find(item => item.path === currentPath);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(true)}
              className="p-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            {currentPath !== '/dashboard' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="p-2"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {currentItem?.label || 'Deacon'}
              </h1>
              {!networkStatus.connected && (
                <Badge variant="destructive" className="text-xs">
                  Offline
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isNative && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCamera}
                  className="p-2"
                >
                  <Camera className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNotification}
                  className="p-2"
                >
                  <Bell className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPath}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex items-center justify-around px-2 py-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            
            return (
              <Button
                key={item.path}
                variant="ghost"
                size="sm"
                onClick={() => handleNavigation(item.path)}
                className={`flex flex-col items-center gap-1 p-2 min-w-0 ${
                  isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </nav>

      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50"
              onClick={() => setIsSidebarOpen(false)}
            />
            
            {/* Sidebar */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-white shadow-xl z-50"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold">Menu</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                
                {/* Navigation */}
                <nav className="flex-1 p-4">
                  <div className="space-y-2">
                    {navigationItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentPath === item.path;
                      
                      return (
                        <Button
                          key={item.path}
                          variant="ghost"
                          className={`w-full justify-start gap-3 ${
                            isActive ? 'bg-blue-50 text-blue-600' : ''
                          }`}
                          onClick={() => handleNavigation(item.path)}
                        >
                          <Icon className="h-5 w-5" />
                          {item.label}
                        </Button>
                      );
                    })}
                  </div>
                  
                  {/* Native Features */}
                  {isNative && (
                    <div className="mt-8 pt-4 border-t border-gray-200">
                      <h3 className="text-sm font-medium text-gray-500 mb-3">
                        Native Features
                      </h3>
                      <div className="space-y-2">
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3"
                          onClick={handleCamera}
                        >
                          <Camera className="h-5 w-5" />
                          Take Photo
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3"
                          onClick={handleNotification}
                        >
                          <Bell className="h-5 w-5" />
                          Test Notification
                        </Button>
                      </div>
                    </div>
                  )}
                </nav>
                
                {/* Footer */}
                <div className="p-4 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    {isNative ? 'Native App' : 'Web App'} • 
                    {networkStatus.connected ? ' Online' : ' Offline'}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MobileLayout; 