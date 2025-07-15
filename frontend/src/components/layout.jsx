import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Users2, 
  Calendar, 
  DollarSign, 
  Settings, 
  LogOut, 
  User, 
  ChevronDown, 
  MoreHorizontal,
  Church,
  FileText,
  BarChart3,
  Users,
  CheckSquare,
  MessageSquare,
  Baby,
  UserPlus,
  ClipboardList,
  BarChart2,
  Heart,
  Bell,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Shield,
  Download,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Logo } from '@/components/ui/logo';
import { useAuth } from '@/lib/authContext';
import { isUserAdmin, isSystemAdmin, getApprovalNotifications, getOrganizationName } from '@/lib/data';
import { usePermissions, PERMISSIONS } from '@/lib/permissions.jsx';
import { PermissionNavItem } from '@/components/PermissionGuard';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useIsMobile } from '@/lib/utils/useIsMobile';

export function Layout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSystemAdminUser, setIsSystemAdminUser] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [organizationName, setOrganizationName] = useState('Church App');
  const [hoveredNav, setHoveredNav] = useState(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonationData, setImpersonationData] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  const isMobile = useIsMobile();

  // Generate navigation items based on user permissions - this runs immediately
  const generateNavigation = () => {
    const baseNavigation = [
      { 
        name: 'Dashboard', 
        href: '/dashboard', 
        icon: Home, 
        color: 'text-blue-500',
        permission: PERMISSIONS.REPORTS_VIEW // Basic view permission
      },
      { 
        name: 'Events', 
        href: '/events', 
        icon: Calendar, 
        color: 'text-green-500',
        permission: PERMISSIONS.EVENTS_VIEW
      },
      { 
        name: 'Children Check-In', 
        href: '/children-check-in', 
        icon: Baby, 
        color: 'text-pink-500',
        permission: PERMISSIONS.CHILDREN_VIEW
      },
      { 
        name: 'People', 
        href: '/members', 
        icon: Users, 
        color: 'text-purple-500',
        permission: PERMISSIONS.MEMBERS_VIEW
      },
      { 
        name: 'Donations', 
        href: '/donations', 
        icon: DollarSign, 
        color: 'text-yellow-500',
        permission: PERMISSIONS.DONATIONS_VIEW
      },
      { 
        name: 'Groups', 
        href: '/groups', 
        icon: UserPlus, 
        color: 'text-indigo-500',
        permission: PERMISSIONS.GROUPS_VIEW
      },
      { 
        name: 'Tasks', 
        href: '/tasks', 
        icon: ClipboardList, 
        color: 'text-orange-500',
        permission: PERMISSIONS.TASKS_VIEW
      },
      { 
        name: 'SMS', 
        href: '/sms', 
        icon: MessageSquare, 
        color: 'text-teal-500',
        permission: PERMISSIONS.SETTINGS_VIEW // Basic access
      },
      { 
        name: 'Alerts', 
        href: '/alerts', 
        icon: Bell, 
        color: 'text-red-500',
        permission: PERMISSIONS.REPORTS_VIEW // Basic access
      },
      { 
        name: 'Reports', 
        href: '/reports', 
        icon: BarChart2, 
        color: 'text-emerald-500',
        permission: PERMISSIONS.REPORTS_VIEW
      },
    ];

    // Add Admin Center for system administrators only
    if (isSystemAdminUser) {
      baseNavigation.push({
        name: 'Admin Center',
        href: '/admin-center',
        icon: Shield,
        color: 'text-red-600',
        isSystemAdmin: true,
        permission: PERMISSIONS.SYSTEM_ADMIN
      });
    }

    baseNavigation.push({ 
      name: 'Permissions', 
      href: '/permissions', 
      icon: Shield, 
      color: 'text-purple-500',
      permission: PERMISSIONS.USERS_EDIT
    });
    baseNavigation.push({ 
      name: 'Settings', 
      href: '/settings', 
      icon: Settings, 
      color: 'text-gray-500',
      permission: PERMISSIONS.SETTINGS_VIEW
    });

    return baseNavigation;
  };

  const navigation = generateNavigation();

  const mainNavItems = navigation.slice(0, 5); // Show 5 main items on tablet
  const moreNavItems = navigation.slice(5);
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Load admin data in the background after initial render
  useEffect(() => {
    const loadAdminData = async () => {
      if (!user) return;
      
      try {
        const [adminStatus, systemAdminStatus] = await Promise.all([
          isUserAdmin(),
          isSystemAdmin()
        ]);
        
        setIsAdmin(adminStatus);
        setIsSystemAdminUser(systemAdminStatus);
        
        if (adminStatus) {
          try {
            const notifications = await getApprovalNotifications();
            setPendingApprovals(notifications.length);
          } catch (error) {
            console.error('Error fetching approval notifications:', error);
            setPendingApprovals(0);
          }
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };

    const fetchOrganizationName = async () => {
      try {
        const name = await getOrganizationName();
        if (name) {
          setOrganizationName(name);
        }
      } catch (error) {
        console.error('Error fetching organization name:', error);
      }
    };

    // Load data in the background
    loadAdminData();
    fetchOrganizationName();
  }, [user]);

  // Check for admin center redirect flag
  useEffect(() => {
    const shouldRedirectToAdminCenter = localStorage.getItem('redirect_to_admin_center');
    if (shouldRedirectToAdminCenter === 'true') {
      localStorage.removeItem('redirect_to_admin_center');
      navigate('/admin-center');
    }
  }, [navigate]);

  // Check for impersonation state
  useEffect(() => {
    const checkImpersonationState = () => {
      const impersonatingUser = localStorage.getItem('impersonating_user');
      if (impersonatingUser) {
        setIsImpersonating(true);
        setImpersonationData(JSON.parse(impersonatingUser));
      } else {
        setIsImpersonating(false);
        setImpersonationData(null);
      }
    };

    checkImpersonationState();
    
    // Listen for localStorage changes
    window.addEventListener('storage', checkImpersonationState);
    
    return () => {
      window.removeEventListener('storage', checkImpersonationState);
    };
  }, []);

  // PWA Install functionality
  useEffect(() => {
    // Check if app is installed
    const checkInstallation = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                       window.navigator.standalone === true;
      setIsInstalled(standalone);
      
      // Debug logging
      console.log('PWA Debug Info:', {
        isStandalone: standalone,
        isInstalled: standalone,
        protocol: window.location.protocol,
        hostname: window.location.hostname,
        isLocalhost: window.location.hostname === 'localhost',
        isSecure: window.location.protocol === 'https:',
        hasServiceWorker: 'serviceWorker' in navigator,
        hasPushManager: 'PushManager' in window,
        userAgent: navigator.userAgent,
        displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser',
        navigatorStandalone: window.navigator.standalone,
        hasBeforeInstallPrompt: 'beforeinstallprompt' in window,
        hasAppInstalled: 'appinstalled' in window
      });
    };

    checkInstallation();

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e) => {
      console.log('beforeinstallprompt event fired!');
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      console.log('appinstalled event fired!');
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handlePWAInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
  };

  const handleLaunchApp = () => {
    // If the app is installed, try to launch it in standalone mode
    if (isInstalled) {
      // Try to open in a new window with standalone display mode
      window.open(window.location.href, '_blank', 'standalone=yes');
    }
  };

  const testPWAInstall = () => {
    console.log('Testing PWA install...');
    console.log('Deferred prompt:', deferredPrompt);
    console.log('Is installed:', isInstalled);
    console.log('Is standalone:', window.matchMedia('(display-mode: standalone)').matches);
    
    // Try to manually trigger the beforeinstallprompt event for testing
    if (!deferredPrompt) {
      console.log('No deferred prompt available. Creating test event...');
      const testEvent = new Event('beforeinstallprompt');
      window.dispatchEvent(testEvent);
    }
  };

  const handleReturnToAdminCenter = async () => {
    try {
      // Clear impersonation flags
      localStorage.removeItem('impersonating_user');
      setIsImpersonating(false);
      setImpersonationData(null);
      
      // Store a flag to redirect to admin center after login
      localStorage.setItem('redirect_to_admin_center', 'true');
      
      // Sign out current user
      await supabase.auth.signOut();
      
      // Force page reload to go to login
      window.location.href = '/login';
      
    } catch (error) {
      console.error('Error returning to admin center:', error);
      toast({
        title: "Error",
        description: "Failed to return to admin center",
        variant: "destructive"
      });
    }
  };

  const handleSignOut = async () => {
    try {
      // console.log('Sign out initiated...');
      
      // Clear impersonation state
      setIsImpersonating(false);
      setImpersonationData(null);
      
      // Clear any local storage or session data
      localStorage.clear();
      sessionStorage.clear();
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // console.log('Sign out successful, navigating to login...');
      
      // Force a page reload to ensure clean state
      window.location.href = '/login';
      
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Overlaying Expand-on-hover Sidebar for Desktop/Tablet */}
      <aside
        className={cn(
          "hidden md:flex fixed inset-y-0 left-0 z-50 bg-card border-r flex-col items-center py-4 transition-all duration-200",
          sidebarExpanded ? "w-56 shadow-xl" : "w-16"
        )}
        style={{ pointerEvents: 'auto' }}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <PermissionNavItem key={item.name} permission={item.permission}>
              <NavLink
                to={item.href}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 w-full h-12 px-3 rounded-lg transition-all",
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                )}
                title={item.name}
              >
                <item.icon className={cn("h-6 w-6 flex-shrink-0", isActive ? "text-primary" : item.color)} />
                {sidebarExpanded && <span className="truncate text-base font-medium">{item.name}</span>}
                {item.name === 'Settings' && isAdmin && pendingApprovals > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">
                    {pendingApprovals}
                  </span>
                )}
              </NavLink>
            </PermissionNavItem>
          );
        })}
      </aside>
      {/* Main Content with Header */}
      <div className="flex-1 flex flex-col md:ml-16 transition-all duration-200">
        {/* Impersonation Banner */}
        {isImpersonating && impersonationData && (
          <div className="bg-amber-100 dark:bg-amber-900/30 border-b border-amber-300 dark:border-amber-700/50 px-4 py-2 sticky top-0 z-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  System Admin Mode: Viewing as {impersonationData.admin_name} 
                  ({impersonationData.organization_name})
                </span>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                className="border-amber-300 text-amber-700 hover:bg-amber-200 dark:border-amber-600 dark:text-amber-300 dark:hover:bg-amber-800"
                onClick={handleReturnToAdminCenter}
              >
                <Shield className="h-3 w-3 mr-1" />
                Return to Admin Center
              </Button>
            </div>
          </div>
        )}

        {/* Header stays at the top, full width */}
        <header className="bg-card border-b px-4 py-3 flex justify-between items-center sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <Logo showText={false} size={40} />
            {isMobile ? (
              <span className="font-semibold text-lg text-foreground">{organizationName}</span>
            ) : (
              <span className="font-semibold text-lg text-foreground">Deacon - {organizationName}</span>
            )}
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">{user.email}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="text-sm text-muted-foreground">{user.email}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {!isInstalled && deferredPrompt && (
                    <DropdownMenuItem onClick={handlePWAInstall} className="flex items-center gap-2 text-blue-600">
                      <Download className="h-4 w-4" />
                      Install App
                    </DropdownMenuItem>
                  )}
                  {isInstalled && (
                    <DropdownMenuItem onClick={handleLaunchApp} className="flex items-center gap-2 text-green-600">
                      <Smartphone className="h-4 w-4" />
                      <span className="text-sm">Launch App</span>
                    </DropdownMenuItem>
                  )}
                  {!isInstalled && !deferredPrompt && (
                    <DropdownMenuItem className="flex items-center gap-2 text-gray-500">
                      <Smartphone className="h-4 w-4" />
                      <span className="text-sm">Install not available</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={testPWAInstall} className="flex items-center gap-2 text-gray-600">
                    <Smartphone className="h-4 w-4" />
                    <span className="text-sm">Test PWA Install</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 text-red-600">
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </header>
        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <Outlet />
        </main>
        {/* Footer */}
        <footer className="py-4 px-6 border-t bg-card">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">© 2025 Deacon - Church Command Center. All rights reserved.</p>
            <p className="text-xs text-muted-foreground mt-2 sm:mt-0 sm:ml-4 text-center">
              <a href="/privacy-policy" className="underline hover:text-primary">Privacy Policy</a>
            </p>
          </div>
        </footer>
      </div>
      {/* Mobile Navigation (phones only) remains unchanged */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t md:hidden z-50">
        <div className="max-w-screen-xl mx-auto px-2">
          <div className="flex justify-around items-center h-14">
            {mainNavItems.slice(0, 4).map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <PermissionNavItem key={item.name} permission={item.permission}>
                  <NavLink
                    to={item.href}
                    className={({ isActive }) => cn(
                      "flex flex-col items-center justify-center px-2 py-1 text-[9px] font-medium rounded-md transition-all relative",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4 mb-0.5", isActive ? "text-primary" : item.color)} />
                    <span>{item.name}</span>
                    {item.name === 'Settings' && isAdmin && pendingApprovals > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {pendingApprovals}
                      </span>
                    )}
                  </NavLink>
                </PermissionNavItem>
              );
            })}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex flex-col items-center justify-center px-2 py-1 h-auto">
                  <MoreHorizontal className="h-4 w-4 mb-0.5 text-muted-foreground" />
                  <span className="text-[9px] font-medium">More</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {navigation.slice(4).map((item) => (
                  <PermissionNavItem key={item.name} permission={item.permission}>
                    <DropdownMenuItem asChild>
                      <NavLink
                        to={item.href}
                        className={cn(
                          "flex items-center gap-2 relative",
                          location.pathname === item.href ? "text-primary" : ""
                        )}
                      >
                        <item.icon className={cn("h-4 w-4", location.pathname === item.href ? "text-primary" : item.color)} />
                        <span>{item.name}</span>
                        {item.name === 'Settings' && isAdmin && pendingApprovals > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {pendingApprovals}
                          </span>
                        )}
                      </NavLink>
                    </DropdownMenuItem>
                  </PermissionNavItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>
    </div>
  );
}