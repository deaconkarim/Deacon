import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Users, 
  Calendar, 
  DollarSign, 
  UserPlus, 
  Settings as SettingsIcon, 
  Menu, 
  X, 
  ChevronDown,
  Church,
  BarChart2,
  FileText,
  ClipboardList,
  MoreHorizontal,
  Baby
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/authContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, currentOrganization, loading, isAdmin } = useAuth();
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'Children Check-In', href: '/children-check-in', icon: Baby },
    { name: 'People', href: '/members', icon: Users },
    { name: 'Donations', href: '/donations', icon: DollarSign },
    { name: 'Groups', href: '/groups', icon: UserPlus },
    { name: 'Tasks', href: '/tasks', icon: ClipboardList },
    { name: 'Reports', href: '/reports', icon: BarChart2 },
    { name: 'Bulletin', href: '/bulletin', icon: FileText },
    { name: 'Settings', href: '/settings', icon: SettingsIcon, adminOnly: true },
  ];

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter(item => 
    !item.adminOnly || isAdmin
  );

  const mainNavItems = filteredNavigation.slice(0, 5); // Show 5 main items on tablet
  const moreNavItems = filteredNavigation.slice(5);
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Show organization selection if no organization is selected
  if (!currentOrganization) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with Organization Switcher */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-900">
                {currentOrganization.name}
              </h1>
            </div>
          </div>
        </div>
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
                    "flex flex-col items-center justify-center px-2 py-1 text-[9px] font-medium rounded-md transition-all",
                    isActive
                      ? "text-primary"
                      : "text-gray-500 hover:text-gray-900"
                  )}
                >
                  <item.icon className={cn("h-4 w-4 mb-0.5", isActive ? "text-primary" : "text-gray-500")} />
                  <span>{item.name}</span>
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
                {filteredNavigation.slice(4).map((item) => (
                  <DropdownMenuItem key={item.name} asChild>
                    <NavLink
                      to={item.href}
                      className={cn(
                        "flex items-center gap-2",
                        location.pathname === item.href ? "text-primary" : ""
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
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
                    "flex flex-col items-center justify-center px-3 py-2 text-xs font-medium rounded-md transition-all min-h-[44px] min-w-[44px]",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                  )}
                >
                  <item.icon className={cn("h-5 w-5 mb-1", isActive ? "text-primary" : "text-gray-500")} />
                  <span className="text-[10px] leading-tight">{item.name}</span>
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
                        "flex items-center gap-3 px-4 py-3 text-sm",
                        location.pathname === item.href ? "text-primary bg-primary/10" : ""
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
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
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) => cn(
                    "flex flex-col items-center justify-center px-3 py-2 text-xs font-medium rounded-md transition-all",
                    isActive
                      ? "text-primary"
                      : "text-gray-500 hover:text-gray-900"
                  )}
                >
                  <item.icon className={cn("h-5 w-5 mb-1", isActive ? "text-primary" : "text-gray-500")} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <footer className="py-4 px-6 border-t mt-16 tablet:mt-20 lg:mt-0">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">
            © 2025 {currentOrganization.name}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}