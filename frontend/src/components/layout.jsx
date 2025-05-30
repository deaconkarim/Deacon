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
  FileText
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
    { name: 'Reports', href: '/reports', icon: BarChart2 },
    { name: 'Bulletin', href: '/bulletin', icon: FileText },
    { name: 'Settings', href: '/settings', icon: SettingsIcon },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1">
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg lg:static lg:border-t-0 lg:shadow-none">
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
                  {item.name}
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
          <div className="flex space-x-4 mt-2 sm:mt-0">
            <span className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer">Privacy Policy</span>
            <span className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer">Terms of Service</span>
            <span className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer">Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
}