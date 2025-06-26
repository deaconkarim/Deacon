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
  Heart
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
import { useAuth } from '@/lib/authContext';
import { isUserAdmin, getApprovalNotifications, getOrganizationName } from '@/lib/data';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { Logo } from '@/components/ui/logo';

export function Layout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [organizationName, setOrganizationName] = useState('Church App');
  const [hoveredNav, setHoveredNav] = useState(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'Children', href: '/children-check-in', icon: Baby },
    { name: 'People', href: '/members', icon: Users },
    { name: 'Donations', href: '/donations', icon: DollarSign },
    { name: 'Groups', href: '/groups', icon: UserPlus },
    { name: 'Tasks', href: '/tasks', icon: ClipboardList },
    { name: 'SMS', href: '/sms', icon: MessageSquare },
    { name: 'Reports', href: '/reports', icon: BarChart2 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const mainNavItems = navigation.slice(0, 5); // Show 5 main items on tablet
  const moreNavItems = navigation.slice(5);
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    const checkAdminAndNotifications = async () => {
      try {
        const adminStatus = await isUserAdmin();
        setIsAdmin(adminStatus);
        
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
        // console.log('Fetching organization name...');
        const name = await getOrganizationName();
        // console.log('Organization name received:', name);
        if (name) {
          setOrganizationName(name);
          // console.log('Organization name set to:', name);
        } else {
          // console.log('No organization name received, keeping default');
        }
      } catch (error) {
        console.error('Error fetching organization name:', error);
      }
    };

    checkAdminAndNotifications();
    fetchOrganizationName();
  }, []);

  const handleSignOut = async () => {
    try {
      // console.log('Sign out initiated...');
      
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
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) => cn(
                "flex items-center gap-3 w-full h-12 px-3 rounded-lg transition-all",
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
              )}
              title={item.name}
            >
              <item.icon className={cn("h-6 w-6 flex-shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
              {sidebarExpanded && <span className="truncate text-base font-medium">{item.name}</span>}
              {item.name === 'Settings' && isAdmin && pendingApprovals > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">
                  {pendingApprovals}
                </span>
              )}
            </NavLink>
          );
        })}
      </aside>
      {/* Main Content with Header */}
      <div className="flex-1 flex flex-col md:ml-16 transition-all duration-200">
        {/* Header stays at the top, full width */}
        <header className="bg-card border-b px-4 py-3 flex justify-between items-center sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block w-10 h-10 sm:w-8 sm:h-8 rounded-xl overflow-hidden flex items-center justify-center">
              <Logo size={32} />
            </span>
            <span className="font-semibold text-lg sm:text-base text-foreground">Deacon - {organizationName}</span>
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
          <div className="flex justify-around items-center h-20">
            {mainNavItems.slice(0, 4).map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) => cn(
                    "flex flex-col items-center justify-center px-3 py-2 text-xs font-medium rounded-md transition-all relative",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("h-6 w-6 mb-1", isActive ? "text-primary" : "text-muted-foreground")} />
                  <span>{item.name}</span>
                  {item.name === 'Settings' && isAdmin && pendingApprovals > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {pendingApprovals}
                    </span>
                  )}
                </NavLink>
              );
            })}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex flex-col items-center justify-center px-3 py-2 h-auto">
                  <MoreHorizontal className="h-6 w-6 mb-1 text-muted-foreground" />
                  <span className="text-xs font-medium">More</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {navigation.slice(4).map((item) => (
                  <DropdownMenuItem key={item.name} asChild>
                    <NavLink
                      to={item.href}
                      className={cn(
                        "flex items-center gap-2 relative",
                        location.pathname === item.href ? "text-primary" : ""
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                      {item.name === 'Settings' && isAdmin && pendingApprovals > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {pendingApprovals}
                        </span>
                      )}
                    </NavLink>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>
    </div>
  );
}