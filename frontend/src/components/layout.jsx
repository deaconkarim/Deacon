import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
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
  ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'People', href: '/people', icon: Users },
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'Donations', href: '/donations', icon: DollarSign },
    { name: 'Groups', href: '/groups', icon: UserPlus },
    { name: 'Tasks', href: '/tasks', icon: ClipboardList },
    { name: 'Reports', href: '/reports', icon: BarChart2 },
    { name: 'Bulletin', href: '/bulletin', icon: FileText },
    { name: 'Settings', href: '/settings', icon: SettingsIcon },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 pb-20 lg:pb-0">
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg lg:static lg:border-t-0 lg:shadow-none z-50">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex justify-around items-center h-16">
            {navigation.map((item) => {
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
                  <span className="text-[10px]">{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <footer className="py-4 px-6 border-t mt-16 lg:mt-0">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">© 2025 Brentwood Lighthouse Baptist Church</p>
        </div>
      </footer>
    </div>
  );
}