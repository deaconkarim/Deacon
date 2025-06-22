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
  BarChart2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/authContext';
import { isUserAdmin, getApprovalNotifications, getOrganizationName } from '@/lib/data';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';

export function Layout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [organizationName, setOrganizationName] = useState('Church App');

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'Children Check-In', href: '/children-check-in', icon: Baby },
    { name: 'People', href: '/members', icon: Users },
    { name: 'Donations', href: '/donations', icon: DollarSign },
    { name: 'Groups', href: '/groups', icon: UserPlus },
    { name: 'Tasks', href: '/tasks', icon: ClipboardList },
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
        console.log('Fetching organization name...');
        const name = await getOrganizationName();
        console.log('Organization name received:', name);
        if (name) {
          setOrganizationName(name);
          console.log('Organization name set to:', name);
        } else {
          console.log('No organization name received, keeping default');
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
      console.log('Sign out initiated...');
      
      // Clear any local storage or session data
      localStorage.clear();
      sessionStorage.clear();
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      console.log('Sign out successful, navigating to login...');
      
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with User Menu */}
      <header className="bg-white border-b px-4 py-3 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Church className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg">Deacon - {organizationName}</span>
        </div>
        
        {user && (
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
        )}
      </header>

      <div className="flex-1 pb-20 tablet:pb-16 lg:pb-0">
        <main className="p-4 sm:p-6 tablet:p-8 pb-24 tablet:pb-20 lg:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Navigation (phones only) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg md:hidden z-50">
        <div className="max-w-screen-xl mx-auto px-2">
          <div className="flex justify-around items-center h-14">
            {mainNavItems.slice(0, 4).map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) => cn(
                    "flex flex-col items-center justify-center px-2 py-1 text-[9px] font-medium rounded-md transition-all relative",
                    isActive
                      ? "text-primary"
                      : "text-gray-500 hover:text-gray-900"
                  )}
                >
                  <item.icon className={cn("h-4 w-4 mb-0.5", isActive ? "text-primary" : "text-gray-500")} />
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
                <Button variant="ghost" className="flex flex-col items-center justify-center px-2 py-1 h-auto">
                  <MoreHorizontal className="h-4 w-4 mb-0.5 text-gray-500" />
                  <span className="text-[9px] font-medium">More</span>
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

      {/* Tablet Navigation */}
      <nav className="hidden md:block lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex justify-around items-center h-16">
            {mainNavItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) => cn(
                    "flex flex-col items-center justify-center px-3 py-2 text-xs font-medium rounded-md transition-all min-h-[44px] min-w-[44px] relative",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                  )}
                >
                  <item.icon className={cn("h-5 w-5 mb-1", isActive ? "text-primary" : "text-gray-500")} />
                  <span className="text-[10px] leading-tight">{item.name}</span>
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
                <Button variant="ghost" className="flex flex-col items-center justify-center px-3 py-2 min-h-[44px] min-w-[44px] h-auto">
                  <MoreHorizontal className="h-5 w-5 mb-1 text-gray-500" />
                  <span className="text-[10px] font-medium">More</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {moreNavItems.map((item) => (
                  <DropdownMenuItem key={item.name} asChild>
                    <NavLink
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 text-sm relative",
                        location.pathname === item.href ? "text-primary bg-primary/10" : ""
                      )}
                    >
                      <item.icon className="h-5 w-5" />
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

      {/* Desktop Navigation */}
      <nav className="hidden lg:block border-t">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex justify-around items-center h-16">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) => cn(
                    "flex flex-col items-center justify-center px-3 py-2 text-xs font-medium rounded-md transition-all relative",
                    isActive
                      ? "text-primary"
                      : "text-gray-500 hover:text-gray-900"
                  )}
                >
                  <item.icon className={cn("h-5 w-5 mb-1", isActive ? "text-primary" : "text-gray-500")} />
                  <span>{item.name}</span>
                  {item.name === 'Settings' && isAdmin && pendingApprovals > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {pendingApprovals}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <footer className="py-4 px-6 border-t mt-16 tablet:mt-20 lg:mt-0">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">© 2025 Deacon - Church Command Center. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}