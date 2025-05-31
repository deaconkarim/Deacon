import { 
  Home, 
  Users, 
  Calendar, 
  Settings,
  MessageSquare,
  FileText,
  ClipboardList
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'People', href: '/people', icon: Users },
  { name: 'Events', href: '/events', icon: Calendar },
  { name: 'Groups', href: '/groups', icon: Users },
  { name: 'Tasks', href: '/tasks', icon: ClipboardList },
  { name: 'Prayer Requests', href: '/prayer-requests', icon: MessageSquare },
  { name: 'Settings', href: '/settings', icon: Settings },
]; 