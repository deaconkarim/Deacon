import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { format, parse, isAfter, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import Papa from 'papaparse';
import { motion } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  Search, 
  RefreshCw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  UserPlus,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  ExternalLink,
  CheckCircle,
  Utensils,
  Users,
  Calendar,
  Clock,
  X,
  Handshake,
  Star,
  Filter,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  Eye,
  BarChart3,
  Zap,
  Target,
  Heart,
  Crown,
  Shield,
  BookOpen,
  Building,
  GraduationCap,
  PieChart,
  LineChart,
  Settings,
  Download,
  Share2,
  Bell,
  MessageSquare,
  Phone,
  Mail,
  Globe,
  Coffee,
  MoreHorizontal,
  Church,
  Copy,
  FileText,
  DollarSign,
  Tag,
  Tent,
  Baby,
  User,
  Music,
  Droplets,
  Wine,
  Gift,
  Monitor,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { getMembers, getCurrentUserOrganizationId } from '../lib/data';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/lib/authContext';
import EventForm from '@/components/events/EventForm';
import { addEvent, updateEvent, deleteEvent, getEventVolunteers, addEventVolunteer, updateEventVolunteer, removeEventVolunteer, parseVolunteerRoles } from '@/lib/data';
import { getInitials } from '@/lib/utils/formatters';
import { PotluckRSVPDialog } from '@/components/events/PotluckRSVPDialog';
import { VolunteerList } from '@/components/events/VolunteerList';
import { AddVolunteerForm } from '@/components/events/AddVolunteerForm';
import { automationService } from '@/lib/automationService';
import { PermissionGuard, PermissionButton, PermissionFeature } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/lib/permissions.jsx';
import { cn } from '@/lib/utils';
import LocationManager from '@/components/locations/LocationManager';
// Chart components from recharts
import { LineChart as RechartsLineChart, BarChart as RechartsBarChart, XAxis, YAxis, Tooltip, Legend, Line, Bar, ResponsiveContainer, CartesianGrid } from 'recharts';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
};

// Event type icons mapping
const eventTypeIcons = {
  'Worship Service': Church,
  'Sunday Worship Service': Church,
  'Bible Study or Class': BookOpen,
  'Wednesday Bible Study': BookOpen,
  'Prayer Meeting': Heart,
  'Ministry Meeting': Building,
  'Outreach Event': Globe,
  'Fellowship Gathering': Coffee,
  'Special Event': Star,
  'Training or Workshop': GraduationCap,
  'Fundraiser': DollarSign,
  'Trip or Retreat': Tent,
  'Youth Group': Users,
  "Children's Ministry": Baby,
  "Men's Ministry": User,
  "Women's Ministry": User,
  'Choir Practice': Music,
  'Board Meeting': Building,
  'Deacon Meeting': Shield,
  'Potluck': Utensils,
  'Community Service': Heart,
  'Mission Trip': Globe,
  'Conference': GraduationCap,
  'Seminar': GraduationCap,
  'Concert': Music,
  'Wedding': Heart,
  'Funeral': Heart,
  'Baptism': Droplets,
  'Communion': Wine,
  'Dedication': Gift,
  'Graduation': GraduationCap,
  'Anniversary': Heart,
  'Holiday Service': Star,
  'Easter Service': Church,
  'Christmas Service': Church,
  'Thanksgiving Service': Church,
  "New Year's Service": Church,
  'Other': Calendar
};

// Event type colors
const eventTypeColors = {
  'Worship Service': 'blue',
  'Sunday Worship Service': 'blue',
  'Bible Study or Class': 'purple',
  'Wednesday Bible Study': 'purple',
  'Prayer Meeting': 'pink',
  'Ministry Meeting': 'gray',
  'Outreach Event': 'cyan',
  'Fellowship Gathering': 'orange',
  'Special Event': 'red',
  'Training or Workshop': 'emerald',
  'Fundraiser': 'green',
  'Trip or Retreat': 'indigo',
  'Youth Group': 'cyan',
  "Children's Ministry": 'amber',
  "Men's Ministry": 'slate',
  "Women's Ministry": 'rose',
  'Choir Practice': 'violet',
  'Board Meeting': 'gray',
  'Deacon Meeting': 'indigo',
  'Potluck': 'lime',
  'Community Service': 'pink',
  'Mission Trip': 'cyan',
  'Conference': 'emerald',
  'Seminar': 'emerald',
  'Concert': 'violet',
  'Wedding': 'pink',
  'Funeral': 'gray',
  'Baptism': 'cyan',
  'Communion': 'purple',
  'Dedication': 'amber',
  'Graduation': 'emerald',
  'Anniversary': 'pink',
  'Holiday Service': 'red',
  'Easter Service': 'blue',
  'Christmas Service': 'blue',
  'Thanksgiving Service': 'blue',
  "New Year's Service": 'blue',
  'Other': 'gray'
};

const formatRecurrencePattern = (pattern, monthlyWeek, monthlyWeekday) => {
  switch (pattern) {
    case 'daily':
      return 'Daily';
    case 'weekly':
      return 'Weekly';
    case 'biweekly':
      return 'Bi-weekly';
    case 'monthly':
      return 'Monthly';
    case 'monthly_weekday':
      const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const weekLabels = ['First', 'Second', 'Third', 'Fourth', 'Last'];
      const weekday = weekdays[parseInt(monthlyWeekday)];
      const week = weekLabels[parseInt(monthlyWeek) - 1];
      return `${week} ${weekday}`;
    case 'fifth_sunday':
      return 'Fifth Sunday';
    default:
      return pattern;
  }
};

// Enhanced Event Card Component
const EventCard = ({ event, onRSVP, onPotluckRSVP, onEdit, onDelete, onManageVolunteers, onViewDetails, isPastEvent = false, viewMode = 'admin', onBulkSelect, isBulkSelected = false }) => {
  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);
  const isRecurring = event.is_recurring;
  const isInstance = event.is_instance;
  const isPotluck = event.title.toLowerCase().includes('potluck');
  const isCheckIn = event.attendance_type === 'check-in';
  const isBibleStudy = event.title.toLowerCase().includes('bible study');

  const EventIcon = eventTypeIcons[event.event_type] || Calendar;
  const eventColor = eventTypeColors[event.event_type] || 'gray';

  if (viewMode === 'calendar') {
    const isPastEvent = startDate < new Date();
  return (
      <motion.div
        variants={itemVariants}
        className={cn(
          "p-2 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md",
          `bg-${eventColor}-50 border-${eventColor}-200 hover:bg-${eventColor}-100`,
          isPastEvent && "opacity-60"
        )}
        onClick={() => onViewDetails(event)}
      >
        <div className="flex items-start gap-2">
          <div className={cn(`p-1 rounded text-${eventColor}-600`)}>
            <EventIcon className="h-3 w-3" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-medium truncate">{event.title}</h4>
            <p className="text-xs text-gray-500">{format(startDate, 'h:mm a')}</p>
            {event.attendance > 0 && (
              <p className="text-xs text-green-600">{event.attendance} {isPastEvent ? 'attended' : 'attending'}</p>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  if (viewMode === 'mobile-calendar') {
    const isPastEvent = startDate < new Date();
    return (
      <motion.div
        variants={itemVariants}
        className={cn(
          "p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md bg-white",
          `border-${eventColor}-200 hover:bg-${eventColor}-50`,
          isPastEvent && "opacity-60"
        )}
        onClick={() => onViewDetails(event)}
      >
        <div className="flex items-start gap-3">
          <div className={cn(`p-2 rounded-lg bg-${eventColor}-100 text-${eventColor}-600`)}>
            <EventIcon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 mb-1">{event.title}</h4>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <Clock className="h-3 w-3" />
              <span>{format(startDate, 'h:mm a')}</span>
              {event.location && (
                <>
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{event.location}</span>
                </>
              )}
            </div>
            {event.attendance > 0 && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <Users className="h-3 w-3" />
                <span>{event.attendance} {isPastEvent ? 'attended' : 'attending'}</span>
              </div>
            )}
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
        </div>
      </motion.div>
    );
  }

  if (viewMode === 'admin') {
    const isPastEvent = startDate < new Date();
    return (
      <motion.div variants={itemVariants}>
        {/* Mobile Admin View */}
        <div className="lg:hidden">
          <Card className="group hover:shadow-lg transition-all duration-200 border-l-4 relative mb-3" style={{ borderLeftColor: `var(--${eventColor}-500)` }}>
            <CardContent className="p-4">
              {/* Mobile Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`p-2 rounded-lg bg-${eventColor}-100 text-${eventColor}-600 flex-shrink-0`}>
                    <EventIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">{event.title}</h3>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {isRecurring && (
                        <Badge variant="secondary" className="text-xs">
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Recurring
                        </Badge>
                      )}
                      {isPotluck && (
                        <Badge variant="outline" className="text-xs text-green-600">
                          <Utensils className="w-3 h-3 mr-1" />
                          Potluck
                        </Badge>
                      )}
                      {event.needs_volunteers && (
                        <Badge variant="outline" className="text-xs text-yellow-600">
                          <Handshake className="w-3 h-3 mr-1" />
                          Volunteers
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(startDate, 'MMM d, yyyy')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Mobile Action Buttons */}
                <div className="flex flex-col gap-2">
                  {event.allow_rsvp && (
                    <Button
                      onClick={() => onRSVP(event)}
                      size="sm"
                      className={cn(
                        "h-8 w-8 p-0",
                        isPastEvent 
                          ? "bg-orange-600 hover:bg-orange-700" 
                          : isCheckIn 
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-blue-600 hover:bg-blue-700"
                      )}
                    >
                      {isPastEvent ? (
                        <Pencil className="h-3 w-3" />
                      ) : isCheckIn ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <UserPlus className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Event Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onViewDetails(event)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(event)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Event
                      </DropdownMenuItem>
                      {event.needs_volunteers && (
                        <DropdownMenuItem onClick={() => onManageVolunteers(event)}>
                          <Handshake className="mr-2 h-4 w-4" />
                          Manage Volunteers
                        </DropdownMenuItem>
                      )}
                      {isPotluck && (
                        <DropdownMenuItem onClick={() => onPotluckRSVP(event)}>
                          <Utensils className="mr-2 h-4 w-4" />
                          Potluck RSVP
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onDelete(event.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Event
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Mobile Stats */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {event.allow_rsvp ? (
                    <div className="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                      <Users className="h-3 w-3 text-green-600" />
                      <span className="text-green-700 dark:text-green-300">
                        {event.attendance || 0} {isCheckIn ? 'checked in' : 'attending'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">
                      <HelpCircle className="h-3 w-3 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">Announcement</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                    <Clock className="h-3 w-3 text-blue-600" />
                    <span className="text-blue-700 dark:text-blue-300">
                      {Math.round((endDate - startDate) / (1000 * 60))} min
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  {event.needs_volunteers && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onManageVolunteers(event)}
                      className="h-6 text-xs"
                    >
                      <Handshake className="h-3 w-3 mr-1" />
                      Volunteers
                    </Button>
                  )}
                  
                  {isPotluck && !isPastEvent && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPotluckRSVP(event.id)}
                      className="h-6 text-xs border-green-600 text-green-600 hover:bg-green-50"
                    >
                      <Utensils className="h-3 w-3 mr-1" />
                      Potluck
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Desktop Admin View */}
        <div className="hidden lg:block">
          <Card className="group hover:shadow-lg transition-all duration-200 border-l-4 relative" style={{ borderLeftColor: `var(--${eventColor}-500)` }}>
            <CardContent className="p-4">
              {/* Main Event Info Row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`p-2 rounded-lg bg-${eventColor}-100 text-${eventColor}-600 flex-shrink-0`}>
                    <EventIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{event.title}</h3>
                      {isRecurring && (
                        <Badge variant="secondary" className="text-xs">
                          <RefreshCw className="w-3 h-3 mr-1" />
                          {formatRecurrencePattern(event.recurrence_pattern, event.monthly_week, event.monthly_weekday)}
                        </Badge>
                      )}
                      {isPotluck && (
                        <Badge variant="outline" className="text-xs text-green-600">
                          <Utensils className="w-3 h-3 mr-1" />
                          Potluck
                        </Badge>
                      )}
                      {event.needs_volunteers && (
                        <Badge variant="outline" className="text-xs text-yellow-600">
                          <Handshake className="w-3 h-3 mr-1" />
                          Volunteers
                        </Badge>
                      )}
                      {isPastEvent && (
                        <Badge variant="outline" className="text-xs text-gray-600">
                          Past
                        </Badge>
                      )}
                      {isInstance && (
                        <Badge variant="outline" className="text-xs text-purple-600">
                          <Copy className="w-3 h-3 mr-1" />
                          Instance
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(startDate, 'MMM d, yyyy')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  {event.allow_rsvp && (
                    <Button
                      onClick={() => onRSVP(event)}
                      size="sm"
                      className={cn(
                        "h-8",
                        isPastEvent 
                          ? "bg-orange-600 hover:bg-orange-700" 
                          : isCheckIn 
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-blue-600 hover:bg-blue-700"
                      )}
                    >
                      {isPastEvent ? (
                        <Pencil className="h-3 w-3" />
                      ) : isCheckIn ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <UserPlus className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Event Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onViewDetails(event)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(event)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Event
                      </DropdownMenuItem>
                      {event.needs_volunteers && (
                        <DropdownMenuItem onClick={() => onManageVolunteers(event)}>
                          <Handshake className="mr-2 h-4 w-4" />
                          Manage Volunteers
                        </DropdownMenuItem>
                      )}
                      {isPotluck && (
                        <DropdownMenuItem onClick={() => onPotluckRSVP(event)}>
                          <Utensils className="mr-2 h-4 w-4" />
                          Potluck RSVP
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onDelete(event.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Event
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Description */}
              {event.description && (
                <div className="text-xs text-gray-600 mb-3 line-clamp-2 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  {event.description}
                </div>
              )}

              {/* Enhanced Stats Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs">
                  {event.allow_rsvp ? (
                    <div className="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                      <Users className="h-3 w-3 text-green-600" />
                      <span className="text-green-700 dark:text-green-300">
                        {event.attendance || 0} {isCheckIn ? 'checked in' : 'attending'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">
                      <HelpCircle className="h-3 w-3 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">Announcement only</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                    <Clock className="h-3 w-3 text-blue-600" />
                    <span className="text-blue-700 dark:text-blue-300">
                      {Math.round((endDate - startDate) / (1000 * 60))} min
                    </span>
                  </div>
                  
                  {!isPastEvent && (
                    <div className="flex items-center gap-1 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded">
                      <Calendar className="h-3 w-3 text-orange-600" />
                      <span className="text-orange-700 dark:text-orange-300">
                        {Math.ceil((startDate - new Date()) / (1000 * 60 * 60 * 24))} days
                      </span>
                    </div>
                  )}

                  <span className="capitalize text-gray-500">{event.event_type || 'Event'}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {event.url && (
                    <a
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:underline text-xs"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Link
                    </a>
                  )}
                  
                  {event.needs_volunteers && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onManageVolunteers(event)}
                      className="h-6 text-xs"
                    >
                      <Handshake className="h-3 w-3 mr-1" />
                      Volunteers
                    </Button>
                  )}
                  
                  {isPotluck && !isPastEvent && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPotluckRSVP(event.id)}
                      className="h-6 text-xs border-green-600 text-green-600 hover:bg-green-50"
                    >
                      <Utensils className="h-3 w-3 mr-1" />
                      Potluck
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    );
  }

  // Kiosk mode (original spacious layout)
  if (viewMode === 'kiosk') {
    return (
      <motion.div variants={itemVariants}>
        <Card className="group hover:shadow-xl transition-all duration-300 border-l-4 relative overflow-hidden" style={{ borderLeftColor: `var(--${eventColor}-500)` }}>
        {/* Background gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-r from-${eventColor}-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
        
        <CardHeader className="p-4 md:p-6 relative">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 md:gap-0">
          <div className="flex-1">
              <div className="flex items-start gap-3">
                <div className={`p-3 rounded-xl bg-${eventColor}-100 text-${eventColor}-600 shadow-sm`}>
                  <EventIcon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg md:text-xl font-bold flex flex-wrap items-center gap-2 mb-3">
              {event.title}
              {isRecurring && (
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200">
                        <RefreshCw className="w-3 h-3 mr-1" />
                  {formatRecurrencePattern(event.recurrence_pattern, event.monthly_week, event.monthly_weekday)}
                </Badge>
              )}
              {isPotluck && (
                      <Badge variant="outline" className="text-xs text-green-600 border-green-600 bg-green-50">
                        <Utensils className="w-3 h-3 mr-1" />
                        Potluck
                </Badge>
              )}
              {event.needs_volunteers && (
                      <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-600 bg-yellow-50">
                        <Handshake className="w-3 h-3 mr-1" />
                  Volunteers Needed
                </Badge>
              )}
              {isPastEvent && (
                      <Badge variant="outline" className="text-xs text-gray-600 border-gray-600 bg-gray-50">
                        <CheckCircle className="w-3 h-3 mr-1" />
                  Past Event
                </Badge>
              )}
                    {isInstance && (
                      <Badge variant="outline" className="text-xs text-purple-600 border-purple-600 bg-purple-50">
                        <Copy className="w-3 h-3 mr-1" />
                        Recurring Instance
                </Badge>
              )}
            </CardTitle>
                  
                  {/* Enhanced event details */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
                      <span className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md">
                        <Calendar className="h-4 w-4 text-blue-600" />
              {format(startDate, 'EEEE, MMMM d, yyyy')}
                      </span>
                      <span className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md">
                        <Clock className="h-4 w-4 text-green-600" />
              {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-md">
                          <MapPin className="h-4 w-4 text-purple-600" />
                          {event.location}
                          {event.locations && (
                            <Badge variant="outline" className="text-xs ml-1">
                              {event.locations.capacity ? `${event.locations.capacity} capacity` : event.locations.location_type}
                            </Badge>
                          )}
                        </span>
                      )}
          </div>
                    
                    {/* Event type and additional info */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="capitalize">{event.event_type || 'Event'}</span>
                      {event.url && (
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          <a href={event.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            Event Link
                          </a>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {onBulkSelect && (
                <Checkbox
                  checked={isBulkSelected}
                  onCheckedChange={(checked) => onBulkSelect(event.id, checked)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                />
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="h-4 w-4" />
            </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Event Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => onViewDetails(event)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(event)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Event
                  </DropdownMenuItem>
                  {event.needs_volunteers && (
                    <DropdownMenuItem onClick={() => onManageVolunteers(event)}>
                      <Handshake className="mr-2 h-4 w-4" />
                      Manage Volunteers
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete(event.id)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Event
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
          </div>
        </div>
      </CardHeader>
        
        <CardContent className="p-4 md:p-6 pt-0 relative">
          {/* Description */}
        {event.description && (
            <div className="text-sm text-gray-600 mb-4 line-clamp-2 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              {event.description}
            </div>
          )}
          
                    {/* Enhanced stats and actions */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4 text-sm">
              {event.allow_rsvp ? (
                <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
                  <Users className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-700 dark:text-green-300">
                    {event.attendance || 0} {event.attendance === 1 ? 'person' : 'people'} {isCheckIn ? 'checked in' : 'attending'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
                  <HelpCircle className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">Announcement only</span>
                </div>
              )}
              
              {/* Duration indicator */}
              <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-blue-700 dark:text-blue-300">
                  {Math.round((endDate - startDate) / (1000 * 60))} min
                </span>
              </div>
              
              {/* Days until event */}
              {!isPastEvent && (
                <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 px-3 py-2 rounded-lg">
                  <Calendar className="h-4 w-4 text-orange-600" />
                  <span className="text-orange-700 dark:text-orange-300">
                    {Math.ceil((startDate - new Date()) / (1000 * 60 * 60 * 24))} days away
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        {event.url && (
          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:underline"
          >
                  <ExternalLink className="h-4 w-4" />
            Event Link
          </a>
        )}
              
              <div className="flex flex-col sm:flex-row gap-2">
            {event.needs_volunteers && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onManageVolunteers(event)}
                    className="h-9"
              >
                <Handshake className="mr-2 h-4 w-4" />
                Manage Volunteers
              </Button>
            )}
            {event.allow_rsvp && (
                  <Button
                    onClick={() => onRSVP(event)}
                    className={cn(
                      "h-9",
                      isPastEvent 
                        ? "bg-orange-600 hover:bg-orange-700" 
                        : isCheckIn 
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-blue-600 hover:bg-blue-700"
                    )}
                  >
                    {isPastEvent ? (
                      <>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Attendance
                      </>
                ) : isCheckIn ? (
                      <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                        Check In People
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        RSVP Members
                      </>
                    )}
                  </Button>
                )}

                {isPotluck && !isPastEvent && (
                  <Button
                    variant="outline"
                    onClick={() => onPotluckRSVP(event.id)}
                    className="border-green-600 text-green-600 hover:bg-green-50"
                  >
                    <Utensils className="mr-2 h-4 w-4" />
                    Potluck RSVP
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
  }
};

// Calendar View Component
const CalendarView = ({ events, onEventClick, currentMonth, onMonthChange }) => {
  console.log('[CalendarView] Received events:', events.length);
  console.log('[CalendarView] Current month:', format(currentMonth, 'MMMM yyyy'));
  console.log('[CalendarView] First day of month:', format(startOfMonth(currentMonth), 'EEEE, MMMM d, yyyy'));
  console.log('[CalendarView] First day weekday:', startOfMonth(currentMonth).getDay());
  
  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const eventsByDate = useMemo(() => {
    const eventsMap = {};
    events.forEach(event => {
      const eventDate = format(new Date(event.start_date), 'yyyy-MM-dd');
      if (!eventsMap[eventDate]) {
        eventsMap[eventDate] = [];
      }
      eventsMap[eventDate].push(event);
    });
    console.log('[CalendarView] Events by date:', Object.keys(eventsMap).length, 'days with events');
    
    // Debug: Show which events are on which dates
    Object.entries(eventsMap).forEach(([date, dayEvents]) => {
      console.log(`[CalendarView] ${date} (${format(new Date(date), 'EEEE')}):`, dayEvents.map(e => e.title));
    });
    
    return eventsMap;
  }, [events]);

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
                  <Button
          variant="outline"
          size="sm"
          onClick={() => onMonthChange(subMonths(currentMonth, 1))}
                  >
          <ChevronLeft className="h-4 w-4" />
                  </Button>
        <h2 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onMonthChange(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Desktop Calendar View */}
      <div className="hidden md:block">
        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
          
          {/* Add empty cells for days before the first day of the month */}
          {(() => {
            const firstDayOfMonth = startOfMonth(currentMonth);
            const startOffset = firstDayOfMonth.getDay();
            console.log('[CalendarView] Adding', startOffset, 'empty cells at start');
            return Array.from({ length: startOffset }, (_, i) => (
              <div key={`empty-start-${i}`} className="min-h-[100px] p-1 border border-gray-200 bg-gray-50"></div>
            ));
          })()}
          
          {days.map(day => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayEvents = eventsByDate[dayKey] || [];
            const isToday = isSameDay(day, new Date());
            const isPast = day < new Date();
            
            console.log(`[CalendarView] Rendering day ${format(day, 'd')} (${format(day, 'EEEE')}) - ${dayEvents.length} events`);
            
            return (
              <div
                key={dayKey}
                className={cn(
                  "min-h-[100px] p-1 border border-gray-200",
                  isToday && "bg-blue-50 border-blue-300",
                  isPast && "bg-gray-50"
                )}
              >
                <div className={cn(
                  "text-sm font-medium mb-1",
                  isToday && "text-blue-600 font-bold",
                  isPast && "text-gray-500"
                )}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      viewMode="calendar"
                      onViewDetails={onEventClick}
                      isPastEvent={isPast}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayEvents.length - 3} more
              </div>
            )}
                </div>
              </div>
            );
          })}
          
          {/* Add empty cells to complete the grid */}
          {(() => {
            const totalCells = startOfMonth(currentMonth).getDay() + days.length;
            const remainingCells = (7 - (totalCells % 7)) % 7;
            return Array.from({ length: remainingCells }, (_, i) => (
              <div key={`empty-end-${i}`} className="min-h-[100px] p-1 border border-gray-200 bg-gray-50"></div>
            ));
          })()}
        </div>
      </div>

      {/* Mobile Calendar View */}
      <div className="md:hidden space-y-4">
        {/* Month summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Calendar Overview</h3>
              <p className="text-sm text-blue-600">
                {events.length} event{events.length !== 1 ? 's' : ''} this month
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-900">
                {format(currentMonth, 'MMM')}
              </div>
              <div className="text-sm text-blue-600">
                {format(currentMonth, 'yyyy')}
              </div>
            </div>
          </div>
        </div>

        {/* Week view for mobile */}
        {(() => {
          const weeks = [];
          let currentWeek = [];
          
          // Add empty cells for days before the first day of the month
          const firstDayOfMonth = startOfMonth(currentMonth);
          const startOffset = firstDayOfMonth.getDay();
          for (let i = 0; i < startOffset; i++) {
            currentWeek.push(null);
          }
          
          // Add all days of the month
          days.forEach(day => {
            currentWeek.push(day);
            if (currentWeek.length === 7) {
              weeks.push([...currentWeek]);
              currentWeek = [];
            }
          });
          
          // Add remaining days to complete the last week
          if (currentWeek.length > 0) {
            while (currentWeek.length < 7) {
              currentWeek.push(null);
            }
            weeks.push(currentWeek);
          }
          
          return weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="space-y-2">
              {/* Week header */}
              <div className="grid grid-cols-7 gap-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                  <div key={`${weekIndex}-${day}`} className="p-2 text-center text-xs font-medium text-gray-500">
                    {day.charAt(0)}
                  </div>
                ))}
              </div>
              
              {/* Week days */}
              <div className="grid grid-cols-7 gap-1">
                {week.map((day, dayIndex) => {
                  if (!day) {
                    return (
                      <div key={`empty-${weekIndex}-${dayIndex}`} className="h-16 p-1 border border-gray-200 bg-gray-50 rounded"></div>
                    );
                  }
                  
                  const dayKey = format(day, 'yyyy-MM-dd');
                  const dayEvents = eventsByDate[dayKey] || [];
                  const isToday = isSameDay(day, new Date());
                  const isPast = day < new Date();
                  
                  return (
                    <div
                      key={dayKey}
                      className={cn(
                        "h-16 p-1 border border-gray-200 rounded flex flex-col relative",
                        isToday && "bg-blue-50 border-blue-300",
                        isPast && "bg-gray-50"
                      )}
                    >
                      <div className={cn(
                        "text-xs font-medium text-center",
                        isToday && "text-blue-600 font-bold",
                        isPast && "text-gray-500"
                      )}>
                        {format(day, 'd')}
                        {isToday && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 flex items-center justify-center">
                        {dayEvents.length > 0 && (
                          <div className="flex flex-col items-center gap-0.5">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                            {dayEvents.length > 1 && (
                              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                            )}
                            {dayEvents.length > 2 && (
                              <div className="w-1.5 h-1.5 bg-blue-300 rounded-full"></div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ));
        })()}
        
        {/* Mobile Events List for Selected Day */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Events This Month</h3>
            <Badge variant="outline" className="text-xs">
              {events.length} total
            </Badge>
          </div>
          <div className="space-y-4">
            {days
              .filter(day => {
                const dayKey = format(day, 'yyyy-MM-dd');
                return eventsByDate[dayKey] && eventsByDate[dayKey].length > 0;
              })
              .map(day => {
                const dayKey = format(day, 'yyyy-MM-dd');
                const dayEvents = eventsByDate[dayKey] || [];
                const isToday = isSameDay(day, new Date());
                const isPast = day < new Date();
                
                return (
                  <div key={dayKey} className="space-y-3">
                    <div className={cn(
                      "flex items-center gap-2 text-sm font-medium pb-2 border-b",
                      isToday && "text-blue-600 font-bold border-blue-200",
                      isPast && "text-gray-500 border-gray-200"
                    )}>
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        isToday && "bg-blue-500",
                        isPast && "bg-gray-400"
                      )}></div>
                      <span>{format(day, 'EEEE, MMMM d')}</span>
                      {isToday && (
                        <Badge variant="default" className="text-xs bg-blue-500">
                          Today
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs ml-auto">
                        {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="space-y-2 pl-4">
                      {dayEvents.map(event => (
                        <EventCard
                          key={event.id}
                          event={event}
                          viewMode="mobile-calendar"
                          onViewDetails={onEventClick}
                          isPastEvent={isPast}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            {events.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-2">No events this month</p>
                <p className="text-sm text-gray-400">Events will appear here when scheduled</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Event Analytics Component
const EventAnalytics = ({ events, pastEvents }) => {
  const [membersData, setMembersData] = useState({});
  const [allPastEventsWithAttendance, setAllPastEventsWithAttendance] = useState([]);

  // Fetch ALL past events with attendance from the database
  useEffect(() => {
    const fetchAllPastEventsWithAttendance = async () => {
      try {
        const organizationId = await getCurrentUserOrganizationId();
        if (!organizationId) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // First, get all past events
        const { data: pastEvents, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .eq('organization_id', organizationId)
          .lt('start_date', today.toISOString())
          .order('start_date', { ascending: false });

        if (eventsError) {
          console.error('Error fetching past events:', eventsError);
          return;
        }

        // Then, get all attendance records for these events
        const eventIds = pastEvents.map(event => event.id);
        const { data: attendanceRecords, error: attendanceError } = await supabase
          .from('event_attendance')
          .select('*')
          .in('event_id', eventIds);

        if (attendanceError) {
          console.error('Error fetching attendance records:', attendanceError);
          return;
        }

        // Group attendance by event_id
        const attendanceByEvent = {};
        attendanceRecords.forEach(record => {
          if (!attendanceByEvent[record.event_id]) {
            attendanceByEvent[record.event_id] = [];
          }
          attendanceByEvent[record.event_id].push(record);
        });

        // Combine events with their attendance data
        const eventsWithAttendance = pastEvents.filter(event => 
          attendanceByEvent[event.id] && attendanceByEvent[event.id].length > 0
        ).map(event => ({
          ...event,
          event_attendance: attendanceByEvent[event.id] || []
        }));

        console.log('📊 Analytics: Found', eventsWithAttendance.length, 'past events with attendance');
        setAllPastEventsWithAttendance(eventsWithAttendance);
      } catch (error) {
        console.error('Error fetching all past events with attendance:', error);
      }
    };

    fetchAllPastEventsWithAttendance();
  }, []);

  // Process attendance data from ALL past events with attendance
  const attendanceData = useMemo(() => {
    const attendanceByEvent = {};
    const membersById = {};
    
    // Process all past events with attendance (not just filtered ones)
    allPastEventsWithAttendance.forEach(event => {
      if (event.event_attendance && event.event_attendance.length > 0) {
        attendanceByEvent[event.id] = event.event_attendance;
        
        // Collect member IDs from attendance records
        event.event_attendance.forEach(record => {
          if (record.member_id) {
            membersById[record.member_id] = {
              id: record.member_id,
              firstname: 'Member',
              lastname: record.member_id.slice(0, 8)
            };
          }
        });
      }
    });
    
    console.log('📊 Analytics: Processed attendance data from ALL past events');
    console.log('📊 Events with attendance:', Object.keys(attendanceByEvent).length);
    console.log('📊 Total attendance records:', Object.values(attendanceByEvent).reduce((sum, records) => sum + records.length, 0));
    
    return { attendanceByEvent, membersById };
  }, [allPastEventsWithAttendance]);

  // Fetch member data for display
  useEffect(() => {
    const fetchMemberData = async () => {
      if (Object.keys(attendanceData.membersById).length > 0) {
        try {
          const memberIds = Object.keys(attendanceData.membersById);
          const { data: memberData, error: memberError } = await supabase
            .from('members')
            .select('id, firstname, lastname')
            .in('id', memberIds);
          
          if (!memberError && memberData) {
            const realMembersById = {};
            memberData.forEach(member => {
              realMembersById[member.id] = member;
            });
            setMembersData(realMembersById);
          } else {
            setMembersData(attendanceData.membersById); // Fallback to placeholder data
          }
        } catch (error) {
          console.error('Error fetching member data:', error);
          setMembersData(attendanceData.membersById); // Fallback to placeholder data
        }
      } else {
        setMembersData({});
      }
    };

    fetchMemberData();
  }, [attendanceData.membersById]);

  const analytics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get events that have attendance data AND have passed
    const allEventsWithAttendance = Object.keys(attendanceData.attendanceByEvent).map(eventId => {
      const eventAttendance = attendanceData.attendanceByEvent[eventId];
      // Find the event details from the allPastEventsWithAttendance array
      const event = allPastEventsWithAttendance.find(e => e.id === eventId);
      
      if (event) {
        return {
          id: eventId,
          title: event?.title || `Event ${eventId}`,
          event_type: event?.event_type || 'Other',
          start_date: event?.start_date || new Date().toISOString(),
          location: event?.location || 'Unknown',
          is_recurring: event?.is_recurring || false,
          recurrence_pattern: event?.recurrence_pattern || null
        };
      }
      return null;
    }).filter(Boolean); // Remove null entries
    
    const totalEvents = allEventsWithAttendance.length;
    const upcomingEvents = events.length;
    const pastEventsCount = pastEvents.length;
    
    const eventTypes = {};
    const attendanceStats = {
      total: 0,
      average: 0,
      max: 0,
      min: Infinity,
      median: 0
    };
    
    const monthlyStats = {};
    const weeklyStats = {};
    const locationStats = {};
    const recurringStats = {
      total: 0,
      weekly: 0,
      monthly: 0,
      biweekly: 0
    };
    
    const attendanceValues = [];
    
    // Calculate recurring stats from ALL events (past and future), not just those with attendance
    const allEventsForRecurring = [...events, ...pastEvents];
    allEventsForRecurring.forEach(event => {
      // Count recurring event templates (not instances)
      if (event.is_recurring && !event.parent_event_id) {
        recurringStats.total++;
        if (event.recurrence_pattern) {
          recurringStats[event.recurrence_pattern] = (recurringStats[event.recurrence_pattern] || 0) + 1;
        }
      }
    });
    
    allEventsWithAttendance.forEach(event => {
      // Get actual attendance count from event_attendance table
      const eventAttendance = attendanceData.attendanceByEvent[event.id] || [];
      const actualAttendance = eventAttendance.length;
      
      console.log(`📅 Event ${event.id} (${event.title}) has ${actualAttendance} attendance records`);
      
      // Debug: Log what statuses we have
      const statusCounts = {};
      eventAttendance.forEach(record => {
        statusCounts[record.status] = (statusCounts[record.status] || 0) + 1;
      });
      if (Object.keys(statusCounts).length > 0) {
        console.log(`📊 Event ${event.id} status breakdown:`, statusCounts);
      }
      
      // Calculate attendance stats by event type
      // First try to use the event_type field if it's meaningful
      let type = event.event_type;
      
      // If event_type is empty, null, or generic, extract from title
      if (!type || type === '' || type === 'Other' || type === 'other') {
        const title = event.title || event.id || '';
        if (title.toLowerCase().includes('worship') || title.toLowerCase().includes('service')) {
          type = 'Worship Service';
        } else if (title.toLowerCase().includes('bible study') || title.toLowerCase().includes('class')) {
          type = 'Bible Study or Class';
        } else if (title.toLowerCase().includes('potluck') || title.toLowerCase().includes('fellowship') || 
                   title.toLowerCase().includes('breakfast') || title.toLowerCase().includes('lunch') ||
                   title.toLowerCase().includes('dinner') || title.toLowerCase().includes('gathering')) {
          type = 'Fellowship Gathering';
        } else if (title.toLowerCase().includes('ministry') || title.toLowerCase().includes('group')) {
          type = 'Ministry/Group';
        } else {
          type = 'Other';
        }
      } else {
        // If event_type is set, normalize it to match our categories
        const normalizedType = type.toLowerCase();
        if (normalizedType.includes('worship') || normalizedType.includes('service')) {
          type = 'Worship Service';
        } else if (normalizedType.includes('bible') || normalizedType.includes('study') || normalizedType.includes('class')) {
          type = 'Bible Study or Class';
        } else if (normalizedType.includes('potluck') || normalizedType.includes('fellowship') || 
                   normalizedType.includes('breakfast') || normalizedType.includes('lunch') ||
                   normalizedType.includes('dinner') || normalizedType.includes('gathering')) {
          type = 'Fellowship Gathering';
        } else if (normalizedType.includes('ministry') || normalizedType.includes('group')) {
          type = 'Ministry/Group';
        }
        // If it doesn't match any of our categories, keep the original event_type
      }
      
      if (!eventTypes[type]) {
        eventTypes[type] = { count: 0, attendance: 0 };
      }
      eventTypes[type].count += 1;
      eventTypes[type].attendance += actualAttendance;
      
      // Debug: Log event type detection
      console.log(`📊 Event "${event.title}" (${event.id}) classified as: ${type} (original event_type: "${event.event_type}")`);
      
      // Calculate overall attendance stats
      attendanceStats.total += actualAttendance;
      attendanceStats.max = Math.max(attendanceStats.max, actualAttendance);
      attendanceStats.min = Math.min(attendanceStats.min, actualAttendance);
      attendanceValues.push(actualAttendance);
      
      // Monthly attendance stats
      const month = format(new Date(event.start_date), 'yyyy-MM');
      if (!monthlyStats[month]) {
        monthlyStats[month] = { events: 0, attendance: 0 };
      }
      monthlyStats[month].events += 1;
      monthlyStats[month].attendance += actualAttendance;
      
      // Weekly attendance stats
      const week = format(new Date(event.start_date), 'yyyy-\'W\'ww');
      if (!weeklyStats[week]) {
        weeklyStats[week] = { events: 0, attendance: 0 };
      }
      weeklyStats[week].events += 1;
      weeklyStats[week].attendance += actualAttendance;
      
      // Location attendance stats
      if (event.location) {
        if (!locationStats[event.location]) {
          locationStats[event.location] = { events: 0, attendance: 0 };
        }
        locationStats[event.location].events += 1;
        locationStats[event.location].attendance += actualAttendance;
      }
      
      // Recurring stats are calculated separately from all events (past and future)
      // This section only processes events with attendance data for other analytics
    });
    
    // Calculate median attendance
    attendanceValues.sort((a, b) => a - b);
    const mid = Math.floor(attendanceValues.length / 2);
    attendanceStats.median = attendanceValues.length % 2 === 0 
      ? (attendanceValues[mid - 1] + attendanceValues[mid]) / 2 
      : attendanceValues[mid];
    
    attendanceStats.average = totalEvents > 0 ? Math.round(attendanceStats.total / totalEvents) : 0;
    attendanceStats.min = attendanceStats.min === Infinity ? 0 : attendanceStats.min;
    
    // Debug: Log final analytics summary
    console.log('📊 Final Analytics Summary:');
    console.log('  - Total events with attendance:', totalEvents);
    console.log('  - Total attendance records:', attendanceStats.total);
    console.log('  - Average attendance per event:', attendanceStats.average);
    console.log('  - Event types found:', Object.keys(eventTypes));
    console.log('  - Event type breakdown:', eventTypes);
    
    // Top locations by attendance
    const topLocations = Object.entries(locationStats)
      .sort(([,a], [,b]) => b.attendance - a.attendance)
      .slice(0, 5)
      .map(([location, stats]) => ({
        location,
        events: stats.events,
        attendance: stats.attendance,
        avgAttendance: Math.round(stats.attendance / stats.events)
      }));
    
    // Top months by attendance
    const topMonths = Object.entries(monthlyStats)
      .sort(([,a], [,b]) => b.attendance - a.attendance)
      .slice(0, 6)
      .map(([month, stats]) => ({
        month: format(parse(month, 'yyyy-MM', new Date()), 'MMM yyyy'),
        events: stats.events,
        attendance: stats.attendance,
        avgAttendance: Math.round(stats.attendance / stats.events)
      }));
    
    // Calculate unique attendees per event type and individual event performance
    const uniqueAttendeesByType = {};
    const eventPerformance = [];
    
    allEventsWithAttendance.forEach(event => {
      const eventAttendance = attendanceData.attendanceByEvent[event.id] || [];
      const actualAttendance = eventAttendance.length;
      
      // Get unique attendees for this event
      const uniqueAttendees = new Set();
      eventAttendance.forEach(record => {
        if (record.member_id) {
          uniqueAttendees.add(record.member_id);
        }
      });
      
      // Determine event type (same logic as before)
      let type = event.event_type;
      if (!type || type === '' || type === 'Other' || type === 'other') {
        const title = event.title || event.id || '';
        if (title.toLowerCase().includes('worship') || title.toLowerCase().includes('service')) {
          type = 'Worship Service';
        } else if (title.toLowerCase().includes('bible study') || title.toLowerCase().includes('class')) {
          type = 'Bible Study or Class';
        } else if (title.toLowerCase().includes('potluck') || title.toLowerCase().includes('fellowship') || 
                   title.toLowerCase().includes('breakfast') || title.toLowerCase().includes('lunch') ||
                   title.toLowerCase().includes('dinner') || title.toLowerCase().includes('gathering')) {
          type = 'Fellowship Gathering';
        } else if (title.toLowerCase().includes('ministry') || title.toLowerCase().includes('group')) {
          type = 'Ministry/Group';
        } else {
          type = 'Other';
        }
      } else {
        const normalizedType = type.toLowerCase();
        if (normalizedType.includes('worship') || normalizedType.includes('service')) {
          type = 'Worship Service';
        } else if (normalizedType.includes('bible') || normalizedType.includes('study') || normalizedType.includes('class')) {
          type = 'Bible Study or Class';
        } else if (normalizedType.includes('potluck') || normalizedType.includes('fellowship') || 
                   normalizedType.includes('breakfast') || normalizedType.includes('lunch') ||
                   normalizedType.includes('dinner') || normalizedType.includes('gathering')) {
          type = 'Fellowship Gathering';
        } else if (normalizedType.includes('ministry') || normalizedType.includes('group')) {
          type = 'Ministry/Group';
        }
      }
      
      // Track unique attendees by type
      if (!uniqueAttendeesByType[type]) {
        uniqueAttendeesByType[type] = new Set();
      }
      uniqueAttendees.forEach(memberId => uniqueAttendeesByType[type].add(memberId));
      
      // Track individual event performance
      eventPerformance.push({
        id: event.id,
        title: event.title,
        type: type,
        date: event.start_date,
        totalAttendance: actualAttendance,
        uniqueAttendees: uniqueAttendees.size,
        anonymousCount: eventAttendance.filter(r => !r.member_id).length
      });
    });
    
    // Convert unique attendees sets to counts
    const uniqueAttendeesCounts = {};
    Object.entries(uniqueAttendeesByType).forEach(([type, attendeeSet]) => {
      uniqueAttendeesCounts[type] = attendeeSet.size;
    });
    
    // Sort event performance by attendance
    eventPerformance.sort((a, b) => b.totalAttendance - a.totalAttendance);
    
    // Get top performing events
    const topEvents = eventPerformance.slice(0, 5);
    
    // Get event type summary with unique attendees
    const eventTypeSummary = Object.entries(eventTypes).map(([type, stats]) => ({
      type,
      totalEvents: stats.count,
      totalAttendance: stats.attendance,
      uniqueAttendees: uniqueAttendeesCounts[type] || 0,
      avgAttendance: Math.round(stats.attendance / stats.count)
    })).sort((a, b) => b.uniqueAttendees - a.uniqueAttendees);
    
    return {
      totalEvents,
      upcomingEvents,
      pastEventsCount,
      eventTypes,
      attendanceStats,
      topLocations,
      topMonths,
      recurringStats,
      uniqueAttendeesCounts,
      topEvents,
      eventTypeSummary
    };
  }, [events, pastEvents, attendanceData.attendanceByEvent, allPastEventsWithAttendance]);

  // Prepare data for charts
  const attendanceTrendData = analytics.topMonths.map(({ month, attendance, avgAttendance }) => ({ 
    month, 
    attendance, 
    avgAttendance 
  }));
  const eventTypeBarData = Object.entries(analytics.eventTypes).map(([type, stats]) => ({ 
    type, 
    attendance: stats.attendance,
    events: stats.count,
    avgAttendance: Math.round(stats.attendance / stats.count)
  }));

  // Calculate top attendees based on actual attendance data
  const [topAttendees, setTopAttendees] = useState([]);

  // Load top attendees using unified service
  useEffect(() => {
    const loadTopAttendees = async () => {
      try {
        const { unifiedAttendanceService } = await import('../lib/unifiedAttendanceService');
        const attendees = await unifiedAttendanceService.getTopAttendees({
          limit: 10,
          useLast30Days: true, // Use last 30 days for consistency with dashboard
          includeFutureEvents: false,
          includeDeclined: false
        });
        setTopAttendees(attendees);
      } catch (error) {
        console.error('Error loading top attendees:', error);
      }
    };

    loadTopAttendees();
  }, []);

  // Calculate percentage change for attendance (month over month)
  // TODO: Integrate with previous month data for real calculation
  const attendanceChange = 0; // Placeholder

  // Debug: Show if we have any attendance data
  const totalAttendanceRecords = Object.values(attendanceData.attendanceByEvent).reduce((sum, records) => sum + records.length, 0);
  console.log(`🎯 Total attendance records found: ${totalAttendanceRecords}`);
  console.log(`📊 Events with attendance data: ${Object.keys(attendanceData.attendanceByEvent).length}`);
  console.log(`📊 Past events with attendance: ${analytics.totalEvents}`);

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">All Events (Past & Future)</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{analytics.totalEvents}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {analytics.upcomingEvents} future events
                </p>
              </div>
              <div className="p-3 bg-blue-500 rounded-xl">
                <Calendar className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Total Attendance (All Time)</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">{analytics.attendanceStats.total}</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Avg: {analytics.attendanceStats.average} per event
                  {totalAttendanceRecords === 0 && (
                    <span className="block text-orange-600">No attendance records found</span>
                  )}
                </p>
              </div>
              <div className="p-3 bg-green-500 rounded-xl">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Attendance Range (All Time)</p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{analytics.attendanceStats.max}</p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  Min: {analytics.attendanceStats.min} • Median: {analytics.attendanceStats.median}
                </p>
              </div>
              <div className="p-3 bg-purple-500 rounded-xl">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Recurring Event Templates</p>
                <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">{analytics.recurringStats.total}</p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  {analytics.recurringStats.weekly} weekly, {analytics.recurringStats.monthly} monthly
                </p>
              </div>
              <div className="p-3 bg-orange-500 rounded-xl">
                <RefreshCw className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Smart Insights & Recommendations - Moved right after top cards */}
      <Card className="border-0 shadow-lg mb-6">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
            <Zap className="h-5 w-5" />
            Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ul className="list-disc pl-6 space-y-2 text-blue-700 dark:text-blue-300">
            <li>Total attendance this month: <span className="font-bold">{analytics.attendanceStats.total}</span> ({attendanceChange >= 0 ? '+' : ''}{attendanceChange}%)</li>
            {analytics.eventTypeSummary && analytics.eventTypeSummary.length > 0 && (
              <>
                <li>Most popular event type: <span className="font-bold">{analytics.eventTypeSummary[0]?.type}</span> with <span className="font-bold">{analytics.eventTypeSummary[0]?.uniqueAttendees}</span> unique attendees across <span className="font-bold">{analytics.eventTypeSummary[0]?.totalEvents}</span> events</li>
                <li>Event type breakdown: {analytics.eventTypeSummary.slice(0, 3).map((summary, idx) => (
                  <span key={summary.type}>
                    {idx > 0 ? ', ' : ''}<span className="font-bold">{summary.type}</span> ({summary.uniqueAttendees} people, {summary.totalEvents} events)
                  </span>
                ))}</li>
              </>
            )}
            {analytics.topEvents && analytics.topEvents.length > 0 && (
              <li>Top performing event: <span className="font-bold">{analytics.topEvents[0]?.title}</span> with <span className="font-bold">{analytics.topEvents[0]?.totalAttendance}</span> total attendees ({analytics.topEvents[0]?.uniqueAttendees} unique)</li>
            )}
            <li>Consider promoting under-attended event types for better engagement.</li>
            <li>Review recurring events for consistency and growth opportunities.</li>
          </ul>
        </CardContent>
      </Card>

      {/* Enhanced Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Event Type Breakdown */}
        {Object.keys(analytics.eventTypes).length > 0 && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-b border-blue-200 dark:border-blue-800">
              <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                <PieChart className="h-5 w-5" />
                Event Type Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {Object.entries(analytics.eventTypes)
                  .sort(([,a], [,b]) => b.attendance - a.attendance)
                  .slice(0, 8)
                  .map(([type, stats]) => {
                    const EventIcon = eventTypeIcons[type] || Calendar;
                    const eventColor = eventTypeColors[type] || 'gray';
                    const percentage = Math.round((stats.attendance / analytics.attendanceStats.total) * 100);
                    
                    return (
                      <div key={type} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <div className={`p-2 rounded-lg bg-${eventColor}-100 text-${eventColor}-600`}>
                          <EventIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{type}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {stats.attendance} attendees • {stats.count} events • Avg: {Math.round(stats.attendance / stats.count)}
                          </p>
                        </div>
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className={`bg-${eventColor}-500 h-2 rounded-full`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Locations */}
        {analytics.topLocations.length > 0 && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-b border-green-200 dark:border-green-800">
              <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
                <MapPin className="h-5 w-5" />
                Popular Locations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {analytics.topLocations.map((locationData, index) => {
                  const percentage = Math.round((locationData.attendance / analytics.attendanceStats.total) * 100);
                  
                  return (
                    <div key={locationData.location} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg">
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{locationData.location}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {locationData.attendance} attendees • {locationData.events} events • Avg: {locationData.avgAttendance}
                        </p>
                      </div>
                      <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Monthly Trends */}
      {analytics.topMonths.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-b border-purple-200 dark:border-purple-800">
            <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-purple-100">
              <LineChart className="h-5 w-5" />
              Monthly Event Attendance Trends
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {analytics.topMonths.map(({ month, attendance, avgAttendance }) => (
                <div key={month} className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{attendance}</div>
                  <div className="text-sm text-purple-600 dark:text-purple-400">{month}</div>
                  <div className="text-xs text-purple-500 dark:text-purple-400">Avg: {avgAttendance}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendance Trend Line Chart */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
            <LineChart className="h-5 w-5" />
            Monthly Attendance Trends
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Interactive chart with recharts */}
          <ResponsiveContainer width="100%" height={250}>
            <RechartsLineChart data={attendanceTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="attendance" stroke="#6366f1" name="Total Attendance" strokeWidth={2} />
              <Line type="monotone" dataKey="avgAttendance" stroke="#10b981" name="Avg Attendance" strokeWidth={2} />
            </RechartsLineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Attendance by Event Type Bar Chart */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-b border-purple-200 dark:border-purple-800">
          <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-purple-100">
            <BarChart3 className="h-5 w-5" />
            Attendance by Event Type
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Interactive bar chart with recharts */}
          <ResponsiveContainer width="100%" height={300}>
            <RechartsBarChart data={eventTypeBarData} margin={{ top: 10, right: 30, left: 0, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="type" 
                angle={-45} 
                textAnchor="end" 
                height={80}
                tick={{ fontSize: 12 }}
                interval={0}
              />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="attendance" fill="#a78bfa" name="Total Attendance" radius={[4, 4, 0, 0]} />
              <Bar dataKey="avgAttendance" fill="#10b981" name="Avg Attendance" radius={[4, 4, 0, 0]} />
            </RechartsBarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Attendees Section */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-b border-green-200 dark:border-green-800">
          <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
            <Users className="h-5 w-5" />
            Top Attendees
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Top attendees based on actual attendance data */}
          <div className="space-y-3">
            <div className="text-center mb-4">
              <p className="text-sm text-green-600 dark:text-green-400">
                Most frequent attendees based on actual check-ins
              </p>
            </div>
            
            {topAttendees.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {topAttendees.map((attendee, idx) => (
                  <Link 
                    key={attendee.id} 
                    to={`/members/${attendee.id}`}
                    className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-green-500 rounded-lg text-white font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-green-200 dark:bg-green-800 flex items-center justify-center">
                        {attendee.image ? (
                          <img 
                            src={attendee.image} 
                            alt={attendee.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="w-full h-full flex items-center justify-center text-green-600 dark:text-green-400 font-medium text-sm" style={{ display: attendee.image ? 'none' : 'flex' }}>
                          {attendee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-green-900 dark:text-green-100">
                          {attendee.name}
                        </div>
                        <div className="text-sm text-green-600 dark:text-green-400">
                          {attendee.count} event{attendee.count !== 1 ? 's' : ''} attended
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-green-500 text-white">
                      {attendee.count}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <Users className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-green-600 dark:text-green-400">No attendance data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>


    </div>
  );
};

export default function Events() {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [events, setEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [filteredPastEvents, setFilteredPastEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPast, setIsLoadingPast] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pastSearchQuery, setPastSearchQuery] = useState('');
  const [attendance, setAttendance] = useState({});
  const [members, setMembers] = useState([]);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedEventOriginalId, setSelectedEventOriginalId] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [attendingMembers, setAttendingMembers] = useState([]);
  const [lastEventAttendance, setLastEventAttendance] = useState({});
  const [isCreateMemberOpen, setIsCreateMemberOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    status: 'visitor'
  });
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [isEditEventOpen, setIsEditEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isPotluckRSVPDialogOpen, setIsPotluckRSVPDialogOpen] = useState(false);
  const [selectedPotluckEvent, setSelectedPotluckEvent] = useState(null);
  const [potluckRSVPs, setPotluckRSVPs] = useState([]);
  const [alreadyRSVPMembers, setAlreadyRSVPMembers] = useState([]);
  const [attendanceFilter, setAttendanceFilter] = useState('all');
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogDescription, setDialogDescription] = useState('');
  const [dialogButtonText, setDialogButtonText] = useState('');
  const [dialogButtonVariant, setDialogButtonVariant] = useState('');
  const [dialogButtonClassName, setDialogButtonClassName] = useState('');
  const [dialogButtonIcon, setDialogButtonIcon] = useState(null);
  const [dialogSuccessMessage, setDialogSuccessMessage] = useState('');
  const [dialogErrorMessage, setDialogErrorMessage] = useState('');
  const [dialogSectionTitle, setDialogSectionTitle] = useState('');
  const [dialogSectionDescription, setDialogSectionDescription] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().split('T')[0]);
  const [months, setMonths] = useState([
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ]);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    attendance_type: 'rsvp'
  });
  const [isVolunteerDialogOpen, setIsVolunteerDialogOpen] = useState(false);
  const [volunteerDialogEvent, setVolunteerDialogEvent] = useState(null);
  const [suggestedMembers, setSuggestedMembers] = useState([]);
  
  // New state for enhanced features
  const [viewMode, setViewMode] = useState('admin'); // 'admin', 'kiosk', or 'calendar'
  const [isFullKioskMode, setIsFullKioskMode] = useState(false); // Track full kiosk mode

  // Dynamically generate event type options from actual data
  const eventTypeOptions = useMemo(() => {
    const types = new Set();
    events.forEach(event => {
      if (event.event_type) {
        types.add(event.event_type);
      }
    });
    return Array.from(types).sort();
  }, [events]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [timeWindowFilter, setTimeWindowFilter] = useState('month'); // 'all', 'today', 'week', 'month', 'quarter', 'year'
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedEventForDetails, setSelectedEventForDetails] = useState(null);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
  const [sortBy, setSortBy] = useState('date'); // 'date', 'title', 'attendance'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [bulkSelectedEvents, setBulkSelectedEvents] = useState([]);
  const [isBulkActionsOpen, setIsBulkActionsOpen] = useState(false);
  const [memberAttendanceCount, setMemberAttendanceCount] = useState({});
  const [activeTab, setActiveTab] = useState('upcoming');
  const [isEditingPastEvent, setIsEditingPastEvent] = useState(false);
  const [isAnonymousCheckinOpen, setIsAnonymousCheckinOpen] = useState(false);
  const [anonymousName, setAnonymousName] = useState('');

  // Effect to sync URL parameters with state
  useEffect(() => {
    const isKioskMode = location.pathname === '/events' && location.search.includes('kiosk=true');
    if (isKioskMode) {
      setViewMode('kiosk');
      setIsFullKioskMode(true);
    } else {
      setIsFullKioskMode(false);
    }
  }, [location.search]);

  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('[Events] Authentication error:', authError);
        throw new Error('Authentication required. Please log in again.');
      }

      // Get current user's organization ID (including impersonation)
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) throw new Error('Unable to determine organization');
      
      console.log('[Events] Using organization_id:', organizationId);
      console.log('[Events] User authenticated:', user.email);

      // Debug: Check all organizations and events in the database
      const { data: allOrgs, error: orgsError } = await supabase
        .from('organizations')
        .select('id, name');

      const { data: allEventsInDB, error: allEventsInDBError } = await supabase
        .from('events')
        .select('id, title, start_date, organization_id');

      if (orgsError) {
        console.error('[Events] Error fetching organizations:', orgsError);
      } else {
        console.log('[Events] All organizations:', allOrgs);
      }

      if (allEventsInDBError) {
        console.error('[Events] Error fetching all events:', allEventsInDBError);
      } else {
        console.log('[Events] All events in database:', allEventsInDB.length);
        if (allEventsInDB.length > 0) {
          console.log('[Events] Sample events:', allEventsInDB.slice(0, 3));
        }
      }

      // Debug: Check if there are any events at all for this organization
      const { data: allEvents, error: allEventsError } = await supabase
        .from('events')
        .select('id, title, start_date, organization_id')
        .eq('organization_id', organizationId);

      if (allEventsError) {
        console.error('[Events] Error fetching all events:', allEventsError);
      } else {
        console.log('[Events] Total events for organization:', allEvents.length);
        if (allEvents.length > 0) {
          console.log('[Events] Sample events:', allEvents.slice(0, 3));
        }
      }

      // Determine the date range based on time filter
      let startDate = today;
      let endDate = null;
      
      if (timeWindowFilter === 'month') {
        // For month filter, get events for the entire current month
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        console.log('[Events] Month filter - Date range:', startDate.toISOString(), 'to', endDate.toISOString());
      } else if (timeWindowFilter === 'week') {
        // For week filter, get events for the current week
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
        startDate = weekStart;
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)
        weekEnd.setHours(23, 59, 59, 999);
        endDate = weekEnd;
        console.log('[Events] Week filter - Date range:', startDate.toISOString(), 'to', endDate.toISOString());
      } else if (timeWindowFilter === 'quarter') {
        // For quarter filter, get events for the current quarter
        const quarter = Math.floor(today.getMonth() / 3);
        startDate = new Date(today.getFullYear(), quarter * 3, 1);
        endDate = new Date(today.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59, 999);
        console.log('[Events] Quarter filter - Date range:', startDate.toISOString(), 'to', endDate.toISOString());
      } else if (timeWindowFilter === 'year') {
        // For year filter, get events for the current year
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
        console.log('[Events] Year filter - Date range:', startDate.toISOString(), 'to', endDate.toISOString());
      } else {
        console.log('[Events] Default filter - Date range: from', startDate.toISOString(), 'onwards');
      }
      // For 'all' and 'today', keep the original logic (from today onwards)

      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 30000)
      );
      
      let eventsPromise;
      if (endDate) {
        // Use date range query
        eventsPromise = supabase
        .from('events')
        .select('*, event_attendance(*)')
        .eq('organization_id', organizationId)
          .gte('start_date', startDate.toISOString())
          .lte('start_date', endDate.toISOString())
        .order('start_date', { ascending: true });
      } else {
        // Use original query (from today onwards)
        eventsPromise = supabase
          .from('events')
          .select('*, event_attendance(*)')
          .eq('organization_id', organizationId)
          .gte('start_date', startDate.toISOString())
          .order('start_date', { ascending: true });
      }

      // For admin view with time filters, also fetch recurring events that started before the filter period
      // but could generate instances within the filter period
      let data, error;
      if (viewMode === 'admin' && endDate && timeWindowFilter !== 'all' && timeWindowFilter !== 'today') {
        const recurringEventsPromise = supabase
          .from('events')
          .select('*, event_attendance(*)')
          .eq('organization_id', organizationId)
          .lt('start_date', startDate.toISOString())
          .not('recurrence_pattern', 'eq', null)
          .order('start_date', { ascending: true });

        const [mainResult, recurringResult] = await Promise.all([
          Promise.race([eventsPromise, timeoutPromise]),
          Promise.race([recurringEventsPromise, timeoutPromise])
        ]);

        if (mainResult.error) throw mainResult.error;
        if (recurringResult.error) throw recurringResult.error;

        // Combine the results
        data = [...(mainResult.data || []), ...(recurringResult.data || [])];
        error = null;
        console.log('[Events] Main events:', mainResult.data?.length || 0);
        console.log('[Events] Recurring events from before filter period:', recurringResult.data?.length || 0);
        console.log('[Events] Combined events:', data.length);
      } else {
        const result = await Promise.race([eventsPromise, timeoutPromise]);
        data = result.data;
        error = result.error;
      }

      if (error) throw error;
      console.log('[Events] Fetched events count:', data.length);
      console.log('[Events] Time filter used:', timeWindowFilter);
      console.log('[Events] View mode:', viewMode);

      // Process events based on view mode and add attendance count
      let processedEvents;
      
      if (viewMode === 'kiosk') {
        // For kiosk view, filter out past events and respect time filter
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Filter out past events first
        const futureEvents = data.filter(event => {
          const eventDate = new Date(event.start_date);
          return eventDate >= today;
        });
        
        // Calculate the end date based on the time filter for kiosk view
        let filterEndDate = null;
        
        if (timeWindowFilter === 'month') {
          filterEndDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        } else if (timeWindowFilter === 'week') {
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);
          filterEndDate = weekEnd;
        } else if (timeWindowFilter === 'quarter') {
          const quarter = Math.floor(today.getMonth() / 3);
          filterEndDate = new Date(today.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59, 999);
        } else if (timeWindowFilter === 'year') {
          filterEndDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
        } else if (timeWindowFilter === 'today') {
          // For today, use the same day
          filterEndDate = new Date(today);
          filterEndDate.setHours(23, 59, 59, 999);
        } else {
          // For 'all', use 3 months as default
          filterEndDate = new Date();
          filterEndDate.setMonth(filterEndDate.getMonth() + 3);
        }
        
        // Filter events within the time window
        const timeFilteredEvents = futureEvents.filter(event => {
          const eventDate = new Date(event.start_date);
          return eventDate <= filterEndDate;
        });
        
        // Add attendance count to all events
        const eventsWithAttendance = timeFilteredEvents.map(event => ({
          ...event,
          attendance: event.event_attendance?.length || 0
        }));
        
        // For kiosk view, only show the next instance of recurring events
        processedEvents = eventsWithAttendance.reduce((acc, event) => {
          // If it's not a recurring event, add it
          if (!event.recurrence_pattern) {
            acc.push(event);
            return acc;
          }

          // For recurring events, check if we already have an instance of this event
          const existingEvent = acc.find(e => 
            e.title === event.title && 
            e.recurrence_pattern === event.recurrence_pattern
          );

          if (existingEvent) {
            // If we already have an instance, only keep the earlier one
            if (new Date(event.start_date) < new Date(existingEvent.start_date)) {
              acc = acc.filter(e => e.id !== existingEvent.id);
              acc.push(event);
            }
          } else {
            acc.push(event);
          }
          return acc;
        }, []);
        
        console.log('[Events] Kiosk view processing:');
        console.log('[Events] - Time filter:', timeWindowFilter);
        console.log('[Events] - Filter end date:', format(filterEndDate, 'yyyy-MM-dd'));
        console.log('[Events] - Future events count:', futureEvents.length);
        console.log('[Events] - Time filtered events count:', timeFilteredEvents.length);
        console.log('[Events] - Final processed events count:', processedEvents.length);
      } else {
        // For admin and calendar views, show all future events within the time filter
        // Filter out past events first
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const futureEvents = data.filter(event => {
          const eventDate = new Date(event.start_date);
          return eventDate >= today;
        });
        
        // Add attendance count to all events
        const eventsWithAttendance = futureEvents.map(event => ({
          ...event,
          attendance: event.event_attendance?.length || 0
        }));
        
        // For admin view, generate all recurring event instances within the time filter
        if (viewMode === 'admin') {
          // Calculate the end date based on the time filter
          let filterEndDate = null;
          const today = new Date();
          
          if (timeWindowFilter === 'month') {
            filterEndDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
          } else if (timeWindowFilter === 'week') {
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);
            filterEndDate = weekEnd;
          } else if (timeWindowFilter === 'quarter') {
            const quarter = Math.floor(today.getMonth() / 3);
            filterEndDate = new Date(today.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59, 999);
          } else if (timeWindowFilter === 'year') {
            filterEndDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
          } else if (timeWindowFilter === 'today') {
            // For today, use the same day
            filterEndDate = new Date(today);
            filterEndDate.setHours(23, 59, 59, 999);
          } else {
            // For 'all', use 3 months as default
            filterEndDate = new Date();
            filterEndDate.setMonth(filterEndDate.getMonth() + 3);
          }
          
          console.log('[Events] Time filter:', timeWindowFilter);
          console.log('[Events] Filter end date:', format(filterEndDate, 'yyyy-MM-dd'));
          
          processedEvents = processRecurringEvents(eventsWithAttendance, filterEndDate);
        } else {
          // For calendar view, use the events as-is (calendar handles recurring events separately)
          processedEvents = eventsWithAttendance;
        }
      }

      console.log('[Events] Processed events count:', processedEvents.length);
      console.log('[Events] View mode processing:', viewMode);
      
      // Debug: Show some sample events
      if (processedEvents.length > 0) {
        console.log('[Events] Sample processed events:', processedEvents.slice(0, 3).map(e => ({
          title: e.title,
          date: e.start_date,
          recurring: !!e.recurrence_pattern,
          is_instance: e.is_instance
        })));
      }

      setEvents(processedEvents);
      setFilteredEvents(processedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: 'Error',
        description: 'Failed to load events',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, timeWindowFilter, viewMode]);

  // New function to fetch events for the entire month
  const fetchMonthEvents = useCallback(async (month) => {
    try {
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) throw new Error('Unable to determine organization');
      
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('[Events] Authentication error:', authError);
        throw new Error('Authentication required. Please log in again.');
      }
      
      // Calculate start and end of the month
      const startOfMonthDate = startOfMonth(month);
      const endOfMonthDate = endOfMonth(month);
      
      console.log('[Events] Fetching events for month:', format(month, 'MMMM yyyy'));
      console.log('[Events] Date range:', format(startOfMonthDate, 'yyyy-MM-dd'), 'to', format(endOfMonthDate, 'yyyy-MM-dd'));
      console.log('[Events] User authenticated:', user.email);
      console.log('[Events] Organization ID:', organizationId);

      let data = [];

      try {
        // First, get events that start within the month
        const { data: monthEvents, error: monthError } = await supabase
          .from('events')
          .select('*, event_attendance(*)')
          .eq('organization_id', organizationId)
          .gte('start_date', startOfMonthDate.toISOString())
          .lte('start_date', endOfMonthDate.toISOString())
          .order('start_date', { ascending: true });

        if (monthError) {
          console.error('[Events] Month events query error:', monthError);
          throw monthError;
        }
        data = [...(monthEvents || [])];

        // Also get recurring events that started before this month but could generate instances for this month
        const { data: recurringEvents, error: recurringError } = await supabase
          .from('events')
          .select('*, event_attendance(*)')
          .eq('organization_id', organizationId)
          .lt('start_date', startOfMonthDate.toISOString())
          .not('recurrence_pattern', 'eq', null)
          .order('start_date', { ascending: true });

        if (recurringError) {
          console.error('[Events] Recurring events query error:', recurringError);
          throw recurringError;
        }
        data = [...data, ...(recurringEvents || [])];

      } catch (complexQueryError) {
        console.warn('[Events] Complex query failed, trying simpler approach:', complexQueryError);
        
        // Fallback: Just get events for the month without attendance data
        const { data: simpleEvents, error: simpleError } = await supabase
          .from('events')
          .select('*')
          .eq('organization_id', organizationId)
          .gte('start_date', startOfMonthDate.toISOString())
          .lte('start_date', endOfMonthDate.toISOString())
          .order('start_date', { ascending: true });

        if (simpleError) {
          console.error('[Events] Simple query also failed:', simpleError);
          throw simpleError;
        }
        data = simpleEvents || [];
      }

      console.log('[Events] Month events count:', data.length);

      // Process events and add attendance count
      const processedEvents = data.map(event => ({
        ...event,
        attendance: event.event_attendance?.length || 0
      }));

      // Deduplicate events by ID before processing recurring events
      const uniqueEvents = processedEvents.filter((event, index, self) => 
        index === self.findIndex(e => e.id === event.id)
      );
      
      console.log('[Events] Unique events after deduplication:', uniqueEvents.length);

      // Process recurring events to generate instances for the month
      const eventsWithRecurring = processRecurringEventsForMonth(uniqueEvents, month, processedEvents);

      // Helper function to normalize event titles for better deduplication
      const normalizeTitle = (title) => {
        return title
          .toLowerCase()
          .replace(/[^\w\s]/g, '') // Remove punctuation
          .replace(/\s+/g, ' ') // Normalize whitespace
          .replace(/minitry/g, 'ministry') // Fix common typo
          .trim();
      };

      // Final deduplication by normalized event title and date to ensure no duplicates in calendar
      const finalEvents = eventsWithRecurring.filter((event, index, self) => {
        const normalizedTitle = normalizeTitle(event.title);
        const eventKey = `${normalizedTitle}_${format(new Date(event.start_date), 'yyyy-MM-dd')}`;
        return index === self.findIndex(e => {
          const eNormalizedTitle = normalizeTitle(e.title);
          return `${eNormalizedTitle}_${format(new Date(e.start_date), 'yyyy-MM-dd')}` === eventKey;
        });
      });

      console.log('[Events] Final events after all deduplication:', finalEvents.length);
      
      // Debug: Show the final events and their dates
      finalEvents.forEach(event => {
        console.log(`[Events] Final event: ${event.title} on ${format(new Date(event.start_date), 'EEEE, MMMM d, yyyy')}`);
      });

      console.log('[Events] fetchMonthEvents completed successfully');
      return finalEvents;
    } catch (error) {
      console.error('Error fetching month events:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to load month events';
      if (error.message?.includes('Authentication required')) {
        errorMessage = 'Please log in again to view events';
      } else if (error.message?.includes('401')) {
        errorMessage = 'Authentication error. Please refresh the page and try again.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      return [];
    }
  }, [toast]);

  // State for calendar events
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);

  // Fetch calendar events when month changes
  useEffect(() => {
    if (viewMode === 'calendar') {
      const loadCalendarEvents = async () => {
        console.log('[Calendar] Starting calendar load...');
        setIsCalendarLoading(true);
        setCalendarEvents([]); // Clear previous events
        
        try {
          console.log('[Calendar] Loading events for month:', format(currentMonth, 'MMMM yyyy'));
          
          // Add a timeout to prevent hanging
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 30000)
          );
          
          console.log('[Calendar] About to fetch month events...');
          const monthEventsPromise = fetchMonthEvents(currentMonth);
          console.log('[Calendar] Fetch promise created, waiting for result...');
          const monthEvents = await Promise.race([monthEventsPromise, timeoutPromise]);
          
          console.log('[Calendar] Loaded events:', monthEvents.length);
          console.log('[Calendar] Setting calendar events...');
          setCalendarEvents(monthEvents);
          console.log('[Calendar] Calendar events set successfully');
        } catch (error) {
          console.error('[Calendar] Error loading events:', error);
          
          // If it's an authentication error, try to refresh the session
          if (error.message?.includes('Authentication required') || error.message?.includes('401')) {
            try {
              console.log('[Calendar] Attempting to refresh authentication...');
              const { data, error: refreshError } = await supabase.auth.refreshSession();
              if (refreshError) {
                console.error('[Calendar] Session refresh failed:', refreshError);
                toast({
                  title: 'Authentication Error',
                  description: 'Please log in again to continue.',
                  variant: 'destructive'
                });
              } else {
                console.log('[Calendar] Session refreshed, retrying...');
                // Retry the fetch after successful refresh
                const retryEvents = await fetchMonthEvents(currentMonth);
                setCalendarEvents(retryEvents);
                return;
              }
            } catch (refreshError) {
              console.error('[Calendar] Session refresh failed:', refreshError);
            }
          }
          
          toast({
            title: 'Error',
            description: error.message === 'Request timeout' 
              ? 'Request timed out. Please try again.' 
              : error.message || 'Failed to load calendar events',
            variant: 'destructive'
          });
          setCalendarEvents([]);
        } finally {
          console.log('[Calendar] Calendar load completed');
          setIsCalendarLoading(false);
        }
      };
      
      // Wrap in try-catch to prevent component from crashing
      loadCalendarEvents().catch(error => {
        console.error('[Calendar] Unhandled error in calendar load:', error);
        setIsCalendarLoading(false);
        setCalendarEvents([]);
        toast({
          title: 'Calendar Error',
          description: 'Failed to load calendar. Please try switching back to list view.',
          variant: 'destructive'
        });
      });
    } else {
      // Clear calendar events when switching away from calendar view
      setCalendarEvents([]);
      setIsCalendarLoading(false);
    }
  }, [viewMode, currentMonth, fetchMonthEvents, toast]);

  const fetchPastEvents = useCallback(async () => {
    try {
      setIsLoadingPast(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Determine the date range based on time filter for past events
      let startDate = new Date();
      startDate.setDate(startDate.getDate() - 7); // Default to 7 days ago
      startDate.setHours(0, 0, 0, 0);
      
      // Adjust the past events range based on the current time filter
      if (timeWindowFilter === 'month') {
        // For month filter, get past events from the beginning of the current month
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      } else if (timeWindowFilter === 'week') {
        // For week filter, get past events from the beginning of the current week
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
        startDate = weekStart;
      } else if (timeWindowFilter === 'quarter') {
        // For quarter filter, get past events from the beginning of the current quarter
        const quarter = Math.floor(today.getMonth() / 3);
        startDate = new Date(today.getFullYear(), quarter * 3, 1);
      } else if (timeWindowFilter === 'year') {
        // For year filter, get past events from the beginning of the current year
        startDate = new Date(today.getFullYear(), 0, 1);
      } else if (timeWindowFilter === 'today') {
        // For today filter, get past events from yesterday
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 1);
      }
      // For 'all', keep the default 7 days ago

      // Get current user's organization ID (including impersonation)
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) throw new Error('Unable to determine organization');
      
      console.log('[Events] Using organization_id (past):', organizationId);
      console.log('[Events] Past events date range:', startDate.toISOString(), 'to', today.toISOString());

      const { data, error } = await supabase
        .from('events')
        .select('*, event_attendance(*)')
        .eq('organization_id', organizationId)
        .gte('start_date', startDate.toISOString())
        .lt('start_date', today.toISOString())
        .order('start_date', { ascending: false });

      if (error) throw error;
      console.log('[Events] Past events count:', data.length);

      // Process past events and add attendance count
      const processedPastEvents = data.map(event => ({
        ...event,
        attendance: event.event_attendance?.length || 0
      }));

      setPastEvents(processedPastEvents);
      setFilteredPastEvents(processedPastEvents);
    } catch (error) {
      console.error('Error fetching past events:', error);
      toast({
        title: 'Error',
        description: 'Failed to load past events',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingPast(false);
    }
  }, [toast, timeWindowFilter]);

  // Enhanced filtering effect with event type filter
  useEffect(() => {
    let filtered = [...events];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply event type filter
    if (eventTypeFilter !== 'all') {
      filtered = filtered.filter(event => event.event_type === eventTypeFilter);
    }

    // Apply attendance filter
    if (attendanceFilter !== 'all') {
      filtered = filtered.filter(event => {
        const attendance = event.attendance || 0;
        switch (attendanceFilter) {
          case 'attending':
            return attendance > 0;
          case 'not_attending':
            return attendance === 0;
          case 'high_attendance':
            return attendance >= 10;
          case 'low_attendance':
            return attendance > 0 && attendance < 5;
          default:
        return true;
        }
      });
    }

    // Apply time window filter (only for 'today' since others are handled at DB level)
    if (timeWindowFilter === 'today') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.start_date);
        const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
        return eventDateOnly.getTime() === today.getTime();
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'attendance':
          aValue = a.attendance || 0;
          bValue = b.attendance || 0;
          break;
        case 'location':
          aValue = (a.location || '').toLowerCase();
          bValue = (b.location || '').toLowerCase();
          break;
        case 'created':
          aValue = new Date(a.created_at || a.start_date);
          bValue = new Date(b.created_at || b.start_date);
          break;
        case 'date':
        default:
          aValue = new Date(a.start_date);
          bValue = new Date(b.start_date);
          break;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredEvents(filtered);
  }, [events, searchQuery, eventTypeFilter, attendanceFilter, sortBy, sortOrder]);

  // Filter past events
  useEffect(() => {
    let filtered = [...pastEvents];

    // Apply search filter
    if (pastSearchQuery) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(pastSearchQuery.toLowerCase()) ||
        event.location?.toLowerCase().includes(pastSearchQuery.toLowerCase())
      );
    }

    setFilteredPastEvents(filtered);
  }, [pastEvents, pastSearchQuery]);

  // Initial fetch
  useEffect(() => {
    fetchEvents();
    fetchPastEvents();
  }, [fetchEvents, fetchPastEvents]);

  const generateNextInstance = (event) => {
    if (!event.is_recurring) return null;

    const lastDate = new Date(event.start_date);
    const duration = new Date(event.end_date) - lastDate;
    let nextDate;

    switch (event.recurrence_pattern) {
      case 'weekly':
        nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'biweekly':
        nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case 'monthly':
        nextDate = new Date(lastDate);
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'monthly_weekday':
        nextDate = new Date(lastDate);
        nextDate.setMonth(nextDate.getMonth() + 1);
        // Adjust to the correct week and weekday
        const week = parseInt(event.monthly_week);
        const weekday = parseInt(event.monthly_weekday);
        nextDate.setDate(1); // Start from the first day of the month
        while (nextDate.getDay() !== weekday) {
          nextDate.setDate(nextDate.getDate() + 1);
        }
        nextDate.setDate(nextDate.getDate() + (week - 1) * 7);
        break;
      default:
        return null;
    }

    const nextEndDate = new Date(nextDate.getTime() + duration);

    return {
      ...event,
      id: `${event.id}-${nextDate.toISOString()}`,
      start_date: nextDate.toISOString(),
      end_date: nextEndDate.toISOString(),
      is_instance: true,
      parent_event_id: event.id
    };
  };

  // Helper function to generate recurring events
  const generateRecurringEvents = (event) => {
    const occurrences = [];
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    const duration = endDate.getTime() - startDate.getTime();
    
    // Only generate the next occurrence
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentDate = new Date(startDate);
    
    // Find the next occurrence from today
    while (currentDate < today) {
      switch (event.recurrence_pattern) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'biweekly':
          currentDate.setDate(currentDate.getDate() + 14);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        default:
          currentDate.setDate(currentDate.getDate() + 7); // Default to weekly
      }
    }
    
    // Only add the next occurrence
    const occurrenceEndDate = new Date(currentDate.getTime() + duration);
    const instanceId = `${event.id}-${currentDate.toISOString()}`;
    
    occurrences.push({
      ...event,
      id: instanceId,
      start_date: currentDate.toISOString(),
      end_date: occurrenceEndDate.toISOString(),
              attendance: event.event_attendance?.length || 0,
      is_instance: true,
      parent_event_id: event.id
    });
    
    return occurrences;
  };

  const fetchEventsFromWebsite = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/events/fetch', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      toast({
        title: "Success",
        description: `Updated ${result.count} events.`
      });

      // Refresh the events list
      fetchEvents();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch events from website."
      });
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Add this debug log
  useEffect(() => {
    // console.log('Current events:', events);
  }, [events]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'attending':
        return 'bg-green-500';
      case 'declined':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

  // Helper function to extract actual event ID from generated instance IDs
  const getActualEventId = (eventId) => {
    if (!eventId) return eventId;
    
    // Check if this is a generated recurring event instance
    if ((eventId.includes('-') || eventId.includes('_')) && eventId.length > 36) {
      // Extract the original event ID from the generated instance ID
      if (eventId.includes('_')) {
        return eventId.split('_')[0];
      } else if (eventId.includes('-')) {
        // For the format like "sunday-morning-worship-service-1746381600000-2025-07-20t18-00-00-000z"
        const timestampPattern = /\d{4}-\d{2}-\d{2}t\d{2}-\d{2}-\d{2}-\d{3}z$/i;
        const match = eventId.match(timestampPattern);
        if (match) {
          return eventId.substring(0, match.index);
        } else {
          // Fallback: try to find the last numeric part that looks like a timestamp
          const parts = eventId.split('-');
          if (parts.length >= 2) {
            const timestampIndex = parts.findIndex(part => part.includes('t'));
            if (timestampIndex !== -1) {
              return parts.slice(0, timestampIndex).join('-');
            } else {
              return parts.slice(0, -1).join('-');
            }
          }
        }
      }
    }
    
    return eventId;
  };

  const fetchMembers = useCallback(async () => {
    try {
      // Get current user's organization ID (including impersonation)
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) throw new Error('Unable to determine organization');

      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('organization_id', organizationId)
        .order('firstname', { ascending: true });
      
      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      alert('Failed to load members. Please try again.');
    }
  }, []);

  // Load members when component mounts
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Add function to fetch last event attendance
  const fetchLastEventAttendance = async (eventId) => {
    try {
      // Get the actual event ID for database operations
      let actualEventId = eventId;
      
      // Check if this is a generated recurring event instance
      if (eventId && (eventId.includes('-') || eventId.includes('_')) && eventId.length > 36) {
        // Extract the original event ID from the generated instance ID
        if (eventId.includes('_')) {
          actualEventId = eventId.split('_')[0];
        } else if (eventId.includes('-')) {
          // For the format like "sunday-morning-worship-service-1746381600000-2025-07-20t18-00-00-000z"
          const timestampPattern = /\d{4}-\d{2}-\d{2}t\d{2}-\d{2}-\d{2}-\d{3}z$/i;
          const match = eventId.match(timestampPattern);
          if (match) {
            actualEventId = eventId.substring(0, match.index);
          } else {
            // Fallback: try to find the last numeric part that looks like a timestamp
            const parts = eventId.split('-');
            if (parts.length >= 2) {
              const timestampIndex = parts.findIndex(part => part.includes('t'));
              if (timestampIndex !== -1) {
                actualEventId = parts.slice(0, timestampIndex).join('-');
              } else {
                actualEventId = parts.slice(0, -1).join('-');
              }
            }
          }
        }
      }
      
      const { data, error } = await supabase
        .from('event_attendance')
        .select(`
          member_id,
          status,
          events!inner (
            start_date
          )
        `)
        .eq('event_id', actualEventId)
        .order('events(start_date)', { ascending: false })
        .limit(1);

      if (error) throw error;

      // Create a map of member_id to their attendance status
      const attendanceMap = {};
      if (data && data.length > 0) {
        data.forEach(record => {
          attendanceMap[record.member_id] = record.status;
        });
      }
      setLastEventAttendance(attendanceMap);
    } catch (error) {
      console.error('Error fetching last event attendance:', error);
    }
  };

  const handleRSVP = async (event) => {
    try {
      // For recurring events, we need to find the original event to get all the event data
      let eventToUse = event;
      
      // Check if this is a generated recurring event instance
      if (event.id && (event.id.includes('-') || event.id.includes('_')) && event.id.length > 36) {
        // Extract the original event ID from the generated instance ID
        let originalEventId;
        if (event.id.includes('_')) {
          originalEventId = event.id.split('_')[0];
        } else if (event.id.includes('-')) {
          // For the format like "sunday-morning-worship-service-1746381600000-2025-07-20t18-00-00-000z"
          const timestampPattern = /\d{4}-\d{2}-\d{2}t\d{2}-\d{2}-\d{2}-\d{3}z$/i;
          const match = event.id.match(timestampPattern);
          if (match) {
            originalEventId = event.id.substring(0, match.index);
          } else {
            // Fallback: try to find the last numeric part that looks like a timestamp
            const parts = event.id.split('-');
            if (parts.length >= 2) {
              const timestampIndex = parts.findIndex(part => part.includes('t'));
              if (timestampIndex !== -1) {
                originalEventId = parts.slice(0, timestampIndex).join('-');
              } else {
                originalEventId = parts.slice(0, -1).join('-');
              }
            }
          }
        }
        
        if (originalEventId) {
          // Find the original event in our events list
          const originalEvent = events.find(e => e.id === originalEventId);
          
          if (originalEvent) {
            eventToUse = originalEvent;
          }
        }
      }
      
      // Reset all state first
      setSelectedEvent(eventToUse);
      setSelectedMembers([]);
      setMemberSearchQuery('');
      setIsMemberDialogOpen(true);
      
      // Get the actual event ID for database operations
      const actualEventId = getActualEventId(event.id);
      


      // Fetch last event attendance
      await fetchLastEventAttendance(actualEventId);
      
      // Check if this is a past event
      const eventDate = new Date(eventToUse.start_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isPastEvent = eventDate < today;
      setIsEditingPastEvent(isPastEvent);
      
      try {
        // Fetch all members
        const { data: allMembers, error: membersError } = await supabase
          .from('members')
          .select('*')
          .order('firstname');

        if (membersError) throw membersError;

        // Fetch already RSVP'd/Checked In People (including anonymous attendees) with member data
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('event_attendance')
          .select(`
            id,
            member_id,
            anonymous_name,
            members (
              id,
              firstname,
              lastname,
              email,
              image_url
            )
          `)
          .eq('event_id', actualEventId);

        if (attendanceError) throw attendanceError;

        // Get IDs of members who have already RSVP'd/checked in
        const attendingMemberIds = attendanceData
          .filter(record => record.member_id) // Only include records with member_id
          .map(record => record.member_id);
        
        // Filter out members who have already RSVP'd/checked in
        const availableMembers = allMembers.filter(member => !attendingMemberIds.includes(member.id));
        
        // Get the full member data for already RSVP'd/Checked In People
        const alreadyAttendingMembers = attendanceData
          .filter(record => record.members) // Only include records with member data
          .map(record => record.members);
        
        // Add anonymous attendees to the already attending list
        const anonymousAttendees = attendanceData
          .filter(record => record.anonymous_name && !record.member_id)
          .map(record => ({
            id: `anonymous-${record.id}`,
            firstname: 'Anonymous',
            lastname: '',
            email: null,
            image_url: null,
            isAnonymous: true
          }));
        
        const allAttendingMembers = [...alreadyAttendingMembers, ...anonymousAttendees];

        // If this is a recurring event, get attendance suggestions based on previous instances
        let suggestedMembers = [];
        let attendanceCounts = {};
        if (eventToUse.is_recurring || eventToUse.recurrence_pattern) {
          try {
            // Get previous instances of this event (or similar events of the same type)
            const { data: previousAttendance, error: prevError } = await supabase
              .from('event_attendance')
              .select(`
                member_id,
                status,
                events!inner (
                  id,
                  title,
                  event_type,
                  start_date,
                  is_recurring,
                  recurrence_pattern
                )
              `)
              .eq('events.event_type', eventToUse.event_type)
              .eq('events.is_recurring', true)
              .gte('events.start_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()); // Last 90 days

            if (!prevError && previousAttendance) {
              // Count attendance frequency for each member
              previousAttendance.forEach(record => {
                const memberId = record.member_id;
                attendanceCounts[memberId] = (attendanceCounts[memberId] || 0) + 1;
              });

              // Sort members by attendance frequency (most frequent first)
              const sortedMemberIds = Object.keys(attendanceCounts)
                .sort((a, b) => attendanceCounts[b] - attendanceCounts[a]);

              // Get the top 10 most frequent attendees who are available
              const topAttendees = sortedMemberIds
                .slice(0, 10)
                .map(memberId => availableMembers.find(m => m.id === memberId))
                .filter(Boolean);

              suggestedMembers = topAttendees;
            }
          } catch (error) {
            console.error('Error fetching attendance suggestions:', error);
            // Continue without suggestions if there's an error
          }
        }

        // Sort available members: suggested members first, then alphabetically
        const sortedAvailableMembers = [
          ...suggestedMembers,
          ...availableMembers.filter(member => !suggestedMembers.find(s => s.id === member.id))
        ];

        setMembers(sortedAvailableMembers);
        setSuggestedMembers(suggestedMembers);
        setMemberAttendanceCount(attendanceCounts);
        setAlreadyRSVPMembers(allAttendingMembers || []);
      } catch (error) {
        console.error('Error fetching members:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load members. Please try again."
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load existing RSVPs. Please try again."
      });
    }
  };

  const handleMemberClick = async (member) => {
    try {
      // Use the original event ID for adding new attendance records
      // This is the ID that was passed to handleOpenDialog (could be a generated instance ID)
      const actualEventId = selectedEventOriginalId || selectedEvent.id;
      
      // Add Person to event attendance using the actual event ID
      const { data: attendanceData, error } = await supabase
        .from('event_attendance')
        .upsert({
          event_id: actualEventId,
          member_id: member.id,
          status: 'attending'
        })
        .select()
        .single();

      if (error) throw error;

      // Trigger automation for event attendance
      console.log('🔍 User object for event attendance:', user);
      
      // Get organization_id (including impersonation)
      const organizationId = await getCurrentUserOrganizationId();
      
      if (organizationId) {
        try {
          console.log('🚀 Triggering event_attendance automation for member:', member);
          console.log('🎯 Event data:', selectedEvent);
          const triggerData = {
            id: attendanceData.id,
            event_id: actualEventId,
            member_id: member.id,
            status: 'attending',
            event_type: selectedEvent.event_type,
            member_type: member.status === 'visitor' ? 'visitor' : (member.member_type || 'adult'),
            attendance_status: 'attended',
            is_first_visit: member.status === 'visitor',
            event_date: selectedEvent.start_date,
            firstname: member.firstname,
            lastname: member.lastname,
            phone: member.phone
          };
          console.log('📊 Trigger data:', triggerData);
          await automationService.triggerAutomation(
            'event_attendance',
            triggerData,
            organizationId
          );
        } catch (automationError) {
          console.error('Automation trigger failed:', automationError);
          // Don't fail the main operation if automation fails
        }
      } else {
        console.log('❌ No organization_id found for event attendance, skipping automation');
      }

      // Update local state
      setSelectedMembers(prev => [...prev, member.id]);
      setMemberSearchQuery('');

      // Add member to already checked-in list and remove from available list
      setAlreadyRSVPMembers(prev => [...prev, member]);
      setMembers(prev => prev.filter(m => m.id !== member.id));

      toast({
        title: "Success",
        description: "Member added to the event."
      });

      // Refresh the events list to update attendance count
      await fetchEvents();

      // Refresh the available members list to ensure consistency for all event types
      try {
        try {
          // Fetch current attendance data to get accurate lists
          const { data: attendanceData, error: attendanceError } = await supabase
            .from('event_attendance')
            .select(`
              member_id,
              members (
                id,
                firstname,
                lastname,
                email,
                image_url
              )
            `)
            .eq('event_id', actualEventId);

          if (!attendanceError && attendanceData) {
            // Get IDs of members who have already checked in
            const attendingMemberIds = attendanceData.map(record => record.member_id);
            
            // Get the full member data for already checked in people
            const alreadyAttendingMembers = attendanceData.map(record => record.members);
            
            // Update the already checked-in list
            setAlreadyRSVPMembers(alreadyAttendingMembers);
            
            // Fetch all members and filter out those who have already checked in
            const { data: allMembers, error: membersError } = await supabase
              .from('members')
              .select('*')
              .order('firstname');

            if (!membersError && allMembers) {
              // Filter out members who have already checked in
              const availableMembers = allMembers.filter(member => !attendingMemberIds.includes(member.id));
              
              // Recalculate suggested members based on available members only
              let suggestedMembers = [];
              let attendanceCounts = {};
              
              if (selectedEvent.is_recurring || selectedEvent.recurrence_pattern) {
                try {
                  // Get previous instances of this event (or similar events of the same type)
                  const { data: previousAttendance, error: prevError } = await supabase
                    .from('event_attendance')
                    .select(`
                      member_id,
                      status,
                      events!inner (
                        id,
                        title,
                        event_type,
                        start_date,
                        is_recurring,
                        recurrence_pattern
                      )
                    `)
                    .eq('events.event_type', selectedEvent.event_type)
                    .eq('events.is_recurring', true)
                    .gte('events.start_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()); // Last 90 days

                  if (!prevError && previousAttendance) {
                    // Count attendance frequency for each member
                    previousAttendance.forEach(record => {
                      const memberId = record.member_id;
                      attendanceCounts[memberId] = (attendanceCounts[memberId] || 0) + 1;
                    });

                    // Sort members by attendance frequency (most frequent first)
                    const sortedMemberIds = Object.keys(attendanceCounts)
                      .sort((a, b) => attendanceCounts[b] - attendanceCounts[a]);

                    // Get the top 10 most frequent attendees who are available
                    const topAttendees = sortedMemberIds
                      .slice(0, 10)
                      .map(memberId => availableMembers.find(m => m.id === memberId))
                      .filter(Boolean);

                    suggestedMembers = topAttendees;
                  }
                } catch (error) {
                  console.error('Error fetching attendance suggestions:', error);
                  // Continue without suggestions if there's an error
                }
              }

              // Sort available members: suggested members first, then alphabetically
              const sortedAvailableMembers = [
                ...suggestedMembers,
                ...availableMembers.filter(member => !suggestedMembers.find(s => s.id === member.id))
              ];

              setMembers(sortedAvailableMembers);
              setSuggestedMembers(suggestedMembers);
              setMemberAttendanceCount(attendanceCounts);
            }
          }
        } catch (error) {
          console.error('Error refreshing member lists:', error);
        }
      } catch (error) {
        console.error('Error refreshing member lists:', error);
      }

      // Keep dialog open for check-in events to allow multiple check-ins
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add person to the event. Please try again."
      });
    }
  };

  const handleAnonymousCheckin = async () => {
    try {
      // Get the actual event ID for database operations
      // If this is a generated instance ID, extract the original event ID
      let actualEventId = selectedEvent.id;
      
      // Check if this is a generated recurring event instance
      if (selectedEvent.id && (selectedEvent.id.includes('-') || selectedEvent.id.includes('_')) && selectedEvent.id.length > 36) {
        // Extract the original event ID from the generated instance ID
        if (selectedEvent.id.includes('_')) {
          actualEventId = selectedEvent.id.split('_')[0];
        } else if (selectedEvent.id.includes('-')) {
          // For the format like "sunday-morning-worship-service-1746381600000-2025-07-20t18-00-00-000z"
          const timestampPattern = /\d{4}-\d{2}-\d{2}t\d{2}-\d{2}-\d{2}-\d{3}z$/i;
          const match = selectedEvent.id.match(timestampPattern);
          if (match) {
            actualEventId = selectedEvent.id.substring(0, match.index);
          } else {
            // Fallback: try to find the last numeric part that looks like a timestamp
            const parts = selectedEvent.id.split('-');
            if (parts.length >= 2) {
              const timestampIndex = parts.findIndex(part => part.includes('t'));
              if (timestampIndex !== -1) {
                actualEventId = parts.slice(0, timestampIndex).join('-');
              } else {
                actualEventId = parts.slice(0, -1).join('-');
              }
            }
          }
        }
      }
      
      // Add anonymous person to event attendance using the actual event ID
      const { data: attendanceData, error } = await supabase
        .from('event_attendance')
        .upsert({
          event_id: actualEventId,
          member_id: null,
          anonymous_name: 'Anonymous',
          status: 'attending'
        })
        .select()
        .single();

      if (error) throw error;

      // Trigger automation for anonymous event attendance
      console.log('🔍 User object for anonymous event attendance:', user);
      
      // Get organization_id (including impersonation)
      const organizationId = await getCurrentUserOrganizationId();
      
      if (organizationId) {
        try {
          console.log('🚀 Triggering event_attendance automation for anonymous attendee');
          console.log('🎯 Event data:', selectedEvent);
          const triggerData = {
            id: attendanceData.id,
            event_id: actualEventId,
            member_id: null,
            anonymous_name: 'Anonymous',
            status: 'attending',
            event_type: selectedEvent.event_type,
            member_type: 'anonymous',
            attendance_status: 'attended',
            is_first_visit: true,
            event_date: selectedEvent.start_date,
            firstname: 'Anonymous',
            lastname: '',
            phone: null
          };
          console.log('📊 Trigger data:', triggerData);
          await automationService.triggerAutomation(
            'event_attendance',
            triggerData,
            organizationId
          );
        } catch (automationError) {
          console.error('Automation trigger failed:', automationError);
          // Don't fail the main operation if automation fails
        }
      } else {
        console.log('❌ No organization_id found for anonymous event attendance, skipping automation');
      }

      // Update local state
      setMemberSearchQuery('');

      // Add anonymous attendee to already checked-in list
      const anonymousAttendee = {
        id: `anonymous-${Date.now()}`,
        firstname: 'Anonymous',
        lastname: '',
        email: null,
        image_url: null,
        isAnonymous: true
      };

      setAlreadyRSVPMembers(prev => [...prev, anonymousAttendee]);

      // Reset form and close dialog
      setAnonymousName('');
      setIsAnonymousCheckinOpen(false);

      toast({
        title: "Success",
        description: "Anonymous attendee checked in to the event."
      });

      // Refresh the events list to update attendance count
      await fetchEvents();

      // Keep dialog open for check-in events to allow multiple check-ins
    } catch (error) {
      console.error('Error checking in anonymous attendee:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to check in anonymous attendee. Please try again."
      });
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      // Check if this is an anonymous attendee
      const isAnonymous = memberId.startsWith('anonymous-');
      
      if (isAnonymous) {
        // For anonymous attendees, we need to find them by their attendance record ID
        const member = alreadyRSVPMembers.find(m => m.id === memberId);
        if (member) {
          // Extract the attendance record ID from the anonymous ID
          const attendanceId = memberId.replace('anonymous-', '');
          const { error } = await supabase
            .from('event_attendance')
            .delete()
            .eq('id', attendanceId);

          if (error) throw error;
        }
      } else {
        // For regular members
        // Get the actual event ID for database operations
        let actualEventId = selectedEvent.id;
        
        // Check if this is a generated recurring event instance
        if (selectedEvent.id && (selectedEvent.id.includes('-') || selectedEvent.id.includes('_')) && selectedEvent.id.length > 36) {
          // Extract the original event ID from the generated instance ID
          if (selectedEvent.id.includes('_')) {
            actualEventId = selectedEvent.id.split('_')[0];
          } else if (selectedEvent.id.includes('-')) {
            // For the format like "sunday-morning-worship-service-1746381600000-2025-07-20t18-00-00-000z"
            const timestampPattern = /\d{4}-\d{2}-\d{2}t\d{2}-\d{2}-\d{2}-\d{3}z$/i;
            const match = selectedEvent.id.match(timestampPattern);
            if (match) {
              actualEventId = selectedEvent.id.substring(0, match.index);
            } else {
              // Fallback: try to find the last numeric part that looks like a timestamp
              const parts = selectedEvent.id.split('-');
              if (parts.length >= 2) {
                const timestampIndex = parts.findIndex(part => part.includes('t'));
                if (timestampIndex !== -1) {
                  actualEventId = parts.slice(0, timestampIndex).join('-');
                } else {
                  actualEventId = parts.slice(0, -1).join('-');
                }
              }
            }
          }
        }
        
        const { error } = await supabase
          .from('event_attendance')
          .delete()
          .eq('event_id', actualEventId)
          .eq('member_id', memberId);

        if (error) throw error;
      }

      // Update the alreadyRSVPMembers list
      setAlreadyRSVPMembers(alreadyRSVPMembers.filter(member => member.id !== memberId));
      
      // Refresh the members list to include the removed member (only for regular members)
      if (!isAnonymous) {
        const { data: memberData } = await supabase
          .from('members')
          .select('*')
          .eq('id', memberId)
          .single();

        if (memberData) {
          setMembers(prev => [...prev, memberData]);
        }
      }

      // Refresh the events list to update attendance count
      await fetchEvents();

      toast({
        title: "Success",
        description: isAnonymous ? "Anonymous attendee removed successfully" : "Member removed successfully"
      });
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove attendee. Please try again."
      });
    }
  };

  const handleDone = async () => {
    try {
      // Get the actual event ID for database operations
      // If this is a generated instance ID, extract the original event ID
      let actualEventId = selectedEvent.id;
      
      // Check if this is a generated recurring event instance
      if (selectedEvent.id && (selectedEvent.id.includes('-') || selectedEvent.id.includes('_')) && selectedEvent.id.length > 36) {
        // Extract the original event ID from the generated instance ID
        if (selectedEvent.id.includes('_')) {
          actualEventId = selectedEvent.id.split('_')[0];
        } else if (selectedEvent.id.includes('-')) {
          // For the format like "sunday-morning-worship-service-1746381600000-2025-07-20t18-00-00-000z"
          const timestampPattern = /\d{4}-\d{2}-\d{2}t\d{2}-\d{2}-\d{2}-\d{3}z$/i;
          const match = selectedEvent.id.match(timestampPattern);
          if (match) {
            actualEventId = selectedEvent.id.substring(0, match.index);
          } else {
            // Fallback: try to find the last numeric part that looks like a timestamp
            const parts = selectedEvent.id.split('-');
            if (parts.length >= 2) {
              const timestampIndex = parts.findIndex(part => part.includes('t'));
              if (timestampIndex !== -1) {
                actualEventId = parts.slice(0, timestampIndex).join('-');
              } else {
                actualEventId = parts.slice(0, -1).join('-');
              }
            }
          }
        }
      }
      
      const rsvpsToAdd = selectedMembers.map(memberId => ({
        event_id: actualEventId,
        member_id: memberId,
        status: 'attending'
      }));

      const { data: attendanceData, error } = await supabase
        .from('event_attendance')
        .insert(rsvpsToAdd)
        .select();

      if (error) throw error;

      // Trigger automation for each attendance record
      const organizationId = await getCurrentUserOrganizationId();
      if (organizationId && attendanceData) {
        for (const attendance of attendanceData) {
          try {
            // Get member details for automation
            const member = members.find(m => m.id === attendance.member_id);
            if (member) {
              await automationService.triggerAutomation(
                'event_attendance',
                {
                  id: attendance.id,
                  event_id: actualEventId,
                  member_id: attendance.member_id,
                  status: 'attending',
                  event_type: selectedEvent.event_type,
                  member_type: member.status === 'visitor' ? 'visitor' : (member.member_type || 'adult'),
                  attendance_status: 'attended',
                  is_first_visit: member.status === 'visitor',
                  firstname: member.firstname,
                  lastname: member.lastname,
                  phone: member.phone
                },
                organizationId
              );
            }
          } catch (automationError) {
            console.error('Automation trigger failed for member:', attendance.member_id, automationError);
            // Don't fail the main operation if automation fails
          }
        }
      }

      // Update the alreadyRSVPMembers list with the newly added members
      const { data: newMembers } = await supabase
        .from('members')
        .select('*')
        .in('id', selectedMembers);

      if (newMembers) {
        setAlreadyRSVPMembers(prev => [...prev, ...newMembers]);
      }

      // Remove the added members from the Available People list
      setMembers(prev => prev.filter(member => !selectedMembers.includes(member.id)));
      
      setSelectedMembers([]);
      setIsMemberDialogOpen(false);

      // Refresh the events list to update attendance count
      await fetchEvents();

      toast({
        title: "Success",
        description: "Members added successfully"
      });
    } catch (error) {
      console.error('Error adding members:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add members. Please try again."
      });
    }
  };

  const getRSVPButton = (event) => {
    return (
      <Button 
        variant="default" 
        size="sm"
        className="bg-blue-600 hover:bg-blue-700"
        onClick={() => handleOpenDialog(event)}
      >
        <HelpCircle className="mr-2 h-4 w-4 text-white" />
        RSVP
      </Button>
    );
  };

  // Filter members based on search query and exclude already RSVP'd members
  const filteredMembers = members
    .filter(member => {
      const fullName = `${member.firstname} ${member.lastname}`.toLowerCase();
      const query = memberSearchQuery.toLowerCase();
      const isSelected = selectedMembers.includes(member.id);
      // Only include members that haven't RSVP'd yet and match the search query
      return fullName.includes(query) && !isSelected;
    })
    .sort((a, b) => {
      // First sort by active status
      if (a.is_active && !b.is_active) return -1;
      if (!a.is_active && b.is_active) return 1;

      // Then sort by last event attendance
      const aAttendance = lastEventAttendance[a.id];
      const bAttendance = lastEventAttendance[b.id];
      
      // If one attended and the other didn't, put the attendee first
      if (aAttendance === 'attending' && bAttendance !== 'attending') return -1;
      if (aAttendance !== 'attending' && bAttendance === 'attending') return 1;

      // If both have the same attendance status or neither attended, sort by name
      return `${a.firstname} ${a.lastname}`.localeCompare(`${b.firstname} ${b.lastname}`);
    });

  const fetchAttendingMembers = async (eventId) => {
    try {
      // Get the actual event ID for database operations
      let actualEventId = eventId;
      
      // Check if this is a generated recurring event instance
      if (eventId && (eventId.includes('-') || eventId.includes('_')) && eventId.length > 36) {
        // Extract the original event ID from the generated instance ID
        if (eventId.includes('_')) {
          actualEventId = eventId.split('_')[0];
        } else if (eventId.includes('-')) {
          // For the format like "sunday-morning-worship-service-1746381600000-2025-07-20t18-00-00-000z"
          const timestampPattern = /\d{4}-\d{2}-\d{2}t\d{2}-\d{2}-\d{2}-\d{3}z$/i;
          const match = eventId.match(timestampPattern);
          if (match) {
            actualEventId = eventId.substring(0, match.index);
          } else {
            // Fallback: try to find the last numeric part that looks like a timestamp
            const parts = eventId.split('-');
            if (parts.length >= 2) {
              const timestampIndex = parts.findIndex(part => part.includes('t'));
              if (timestampIndex !== -1) {
                actualEventId = parts.slice(0, timestampIndex).join('-');
              } else {
                actualEventId = parts.slice(0, -1).join('-');
              }
            }
          }
        }
      }
      
      const { data, error } = await supabase
        .from('event_attendance')
        .select(`
          id,
          member_id,
          anonymous_name,
          members (
            id,
            firstname,
            lastname,
            email,
            phone
          )
        `)
        .eq('event_id', actualEventId)
        .eq('status', 'attending');

      if (error) throw error;
      
      // Transform the data to include both members and anonymous attendees
      const transformedData = data.map(item => {
        if (item.members) {
          // Regular member
          return {
            ...item.members,
            firstName: item.members.firstname,
            lastName: item.members.lastname,
            isAnonymous: false
          };
                 } else if (item.anonymous_name) {
           // Anonymous attendee
           return {
             id: `anonymous-${item.id}`,
             firstname: 'Anonymous',
             lastname: '',
             email: null,
             phone: null,
             firstName: 'Anonymous',
             lastName: '',
             isAnonymous: true
           };
        }
        return null;
      }).filter(Boolean);
      
      setAttendingMembers(transformedData);
    } catch (error) {
      console.error('Error fetching attending members:', error);
    }
  };

  const handleCreateMember = async () => {
    if (!newMember.firstname || !newMember.lastname) {
      toast({
        title: "Missing Information",
        description: "Please provide at least first and last name.",
        variant: "destructive"
      });
      return;
    }

    try {
      // If email is empty, set it to null to avoid unique constraint issues
      const memberData = {
        firstname: newMember.firstname,
        lastname: newMember.lastname,
        email: newMember.email || null,
        phone: newMember.phone || null,
        status: 'visitor' // Always set to visitor for new people added during check-in
      };

      const { data, error } = await supabase
        .from('members')
        .insert([memberData])
        .select()
        .single();

      if (error) {
        if (error.code === '23505' && error.message.includes('members_email_key')) {
          toast({
            title: "Email Already Exists",
            description: "A person with this email already exists. Please use a different email or leave it empty.",
            variant: "destructive"
          });
          return;
        }
        throw error;
      }

      // Add the new member to the event
      await handleMemberClick(data);

      // Trigger automation for new visitor creation
      console.log('🔍 User object:', user);
      console.log('🔍 Automation service:', automationService);
      
      // Get organization_id (including impersonation)
      const organizationId = await getCurrentUserOrganizationId();
      
      if (organizationId) {
        try {
          console.log('🚀 Triggering member_created automation for new visitor:', data);
          await automationService.triggerAutomation(
            'member_created',
            {
              id: data.id,
              firstname: data.firstname,
              lastname: data.lastname,
              email: data.email,
              phone: data.phone,
              status: 'visitor',
              member_type: 'visitor',
              created_at: data.created_at
            },
            organizationId
          );
        } catch (automationError) {
          console.error('Automation trigger failed for new visitor:', automationError);
          // Don't fail the main operation if automation fails
        }
      } else {
        console.log('❌ No organization_id found, skipping automation');
      }

      // Reset form and close dialog
      setNewMember({
        firstname: '',
        lastname: '',
        email: '',
        phone: '',
        status: 'visitor'
      });
      setIsCreateMemberOpen(false);

      toast({
        title: "Success",
        description: `New visitor created and ${selectedEvent?.attendance_type === 'check-in' ? 'checked in' : 'RSVP\'d'} to the event.`
      });

      // For check-in events, the member is already added to the event and lists via handleMemberClick
      // No need to refresh the entire members list as it would override our local state changes
    } catch (error) {
      console.error('Error creating member:', error);
      toast({
        title: "Error",
        description: "Failed to create new person. Please try again.",
        variant: "destructive"
      });
    }
  };

  const fetchEventAttendance = async (eventId) => {
    try {
      // Get the actual event ID for database operations
      let actualEventId = eventId;
      
      // Check if this is a generated recurring event instance
      if (eventId && (eventId.includes('-') || eventId.includes('_')) && eventId.length > 36) {
        // Extract the original event ID from the generated instance ID
        if (eventId.includes('_')) {
          actualEventId = eventId.split('_')[0];
        } else if (eventId.includes('-')) {
          // For the format like "sunday-morning-worship-service-1746381600000-2025-07-20t18-00-00-000z"
          const timestampPattern = /\d{4}-\d{2}-\d{2}t\d{2}-\d{2}-\d{2}-\d{3}z$/i;
          const match = eventId.match(timestampPattern);
          if (match) {
            actualEventId = eventId.substring(0, match.index);
          } else {
            // Fallback: try to find the last numeric part that looks like a timestamp
            const parts = eventId.split('-');
            if (parts.length >= 2) {
              const timestampIndex = parts.findIndex(part => part.includes('t'));
              if (timestampIndex !== -1) {
                actualEventId = parts.slice(0, timestampIndex).join('-');
              } else {
                actualEventId = parts.slice(0, -1).join('-');
              }
            }
          }
        }
      }
      
      const { data, error } = await supabase
        .from('event_attendance')
        .select(`
          *,
          members (
            id,
            firstname,
            lastname
          )
        `)
        .eq('event_id', actualEventId);

      if (error) throw error;

      setAttendance(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch attendance",
        variant: "destructive",
      });
    }
  };

  const handleCreateEvent = async (eventData) => {
    try {
      await addEvent(eventData);
      setIsCreateEventOpen(false);
      fetchEvents();
      toast({
        title: "Success",
        description: "Event created successfully."
      });
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create event. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEditEvent = async (eventData) => {
    let eventIdToUpdate = editingEvent.id; // Declare at function scope
    
    try {
      console.log('handleEditEvent called with editingEvent:', editingEvent);
      console.log('editingEvent.id:', editingEvent?.id);
      console.log('editingEvent.is_instance:', editingEvent?.is_instance);
      
      // Check if this is a generated recurring event instance
      // Look for patterns like: originalId_timestamp or originalId-timestamp
      if (editingEvent.id && (editingEvent.id.includes('-') || editingEvent.id.includes('_')) && editingEvent.id.length > 36) {
        console.log('Event ID contains hyphens/underscores and is long, checking if it\'s a generated instance...');
        
        // Try to extract the original event ID from the generated instance ID
        // Handle both formats: originalId_timestamp and originalId-timestamp
        let originalEventId;
        if (editingEvent.id.includes('_')) {
          originalEventId = editingEvent.id.split('_')[0];
        } else if (editingEvent.id.includes('-')) {
          // For the format like "sunday-morning-worship-service-1746381600000-2025-07-20t18-00-00-000z"
          // We need to find where the timestamp starts (after the original ID)
          // The timestamp format is: YYYY-MM-DDTHH-MM-SS-000Z
          const timestampPattern = /\d{4}-\d{2}-\d{2}t\d{2}-\d{2}-\d{2}-\d{3}z$/i;
          const match = editingEvent.id.match(timestampPattern);
          if (match) {
            // Remove the timestamp part from the end
            originalEventId = editingEvent.id.substring(0, match.index);
          } else {
            // Fallback: try to find the last numeric part that looks like a timestamp
            const parts = editingEvent.id.split('-');
            if (parts.length >= 2) {
              // Look for the part that contains 't' (indicating timestamp)
              const timestampIndex = parts.findIndex(part => part.includes('t'));
              if (timestampIndex !== -1) {
                originalEventId = parts.slice(0, timestampIndex).join('-');
              } else {
                // Remove the last part as fallback
                originalEventId = parts.slice(0, -1).join('-');
              }
            }
          }
        }
        
        console.log('Extracted original event ID:', originalEventId);
        
        if (originalEventId) {
          // Find the original event in our events list
          const originalEvent = events.find(e => e.id === originalEventId);
          
          if (originalEvent) {
            eventIdToUpdate = originalEvent.id;
            console.log('Found original event, using ID:', eventIdToUpdate);
            console.log('Original event details:', originalEvent);
          } else {
            console.log('Could not find original event with ID:', originalEventId);
            console.log('Available events:', events.map(e => ({ id: e.id, title: e.title, idLength: e.id.length })));
            
            // If we can't find the original event, try to find it by title
            const eventByTitle = events.find(e => e.title === editingEvent.title && !e.is_instance);
            if (eventByTitle) {
              eventIdToUpdate = eventByTitle.id;
              console.log('Found event by title, using ID:', eventIdToUpdate);
            } else {
              console.log('Could not find event by title either');
              // If we still can't find it, try to use the parent_event_id if available
              if (editingEvent.parent_event_id) {
                eventIdToUpdate = editingEvent.parent_event_id;
                console.log('Using parent_event_id:', eventIdToUpdate);
              }
            }
          }
        }
      }
      
      console.log('Final event ID to update:', eventIdToUpdate);
      console.log('Event ID type:', typeof eventIdToUpdate);
      console.log('Event ID length:', eventIdToUpdate?.length);
      
      await updateEvent(eventIdToUpdate, eventData);
      setIsEditEventOpen(false);
      setEditingEvent(null);
      fetchEvents();
      toast({
        title: "Success",
        description: "Event updated successfully."
      });
    } catch (error) {
      console.error('Error updating event:', error);
      console.error('Error details:', {
        editingEventId: editingEvent?.id,
        eventIdToUpdate: eventIdToUpdate,
        error: error
      });
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update event. Please try again."
      });
    }
  };

  const handleViewAttendance = async (event) => {
    try {
      setSelectedEvent(event);
      setIsMemberDialogOpen(true);
      
      // Get the actual event ID for database operations
      let actualEventId = event.id;
      
      // Check if this is a generated recurring event instance
      if (event.id && (event.id.includes('-') || event.id.includes('_')) && event.id.length > 36) {
        // Extract the original event ID from the generated instance ID
        if (event.id.includes('_')) {
          actualEventId = event.id.split('_')[0];
        } else if (event.id.includes('-')) {
          // For the format like "sunday-morning-worship-service-1746381600000-2025-07-20t18-00-00-000z"
          const timestampPattern = /\d{4}-\d{2}-\d{2}t\d{2}-\d{2}-\d{2}-\d{3}z$/i;
          const match = event.id.match(timestampPattern);
          if (match) {
            actualEventId = event.id.substring(0, match.index);
          } else {
            // Fallback: try to find the last numeric part that looks like a timestamp
            const parts = event.id.split('-');
            if (parts.length >= 2) {
              const timestampIndex = parts.findIndex(part => part.includes('t'));
              if (timestampIndex !== -1) {
                actualEventId = parts.slice(0, timestampIndex).join('-');
              } else {
                actualEventId = parts.slice(0, -1).join('-');
              }
            }
          }
        }
      }
      
      // First get all members who have already RSVP'd/checked in (including anonymous attendees)
      const { data: attendingMembers, error: attendanceError } = await supabase
        .from('event_attendance')
        .select(`
          id,
          member_id,
          anonymous_name,
          members (
            id,
            firstname,
            lastname,
            email,
            image_url
          )
        `)
        .eq('event_id', actualEventId);

      if (attendanceError) throw attendanceError;
      
      // Get the IDs of members who have already RSVP'd/checked in
      const attendingMemberIds = attendingMembers
        ?.filter(a => a.member_id) // Only include records with member_id
        .map(a => a.member_id) || [];
      
      // Then get all members who haven't RSVP'd/checked in
      const { data: availableMembers, error: membersError } = await supabase
        .from('members')
        .select('*')
        .not('id', 'in', `(${attendingMemberIds.join(',')})`);

      if (membersError) throw membersError;
      
      // Get the full member data for already RSVP'd/Checked In People
      const alreadyAttendingMembers = attendingMembers
        ?.filter(a => a.members) // Only include records with member data
        .map(a => a.members) || [];
      
      // Add anonymous attendees to the already attending list
      const anonymousAttendees = attendingMembers
        ?.filter(a => a.anonymous_name && !a.member_id)
        .map(a => ({
          id: `anonymous-${a.id}`,
          firstname: 'Anonymous',
          lastname: '',
          email: null,
          image_url: null,
          isAnonymous: true
        })) || [];
      
      const allAttendingMembers = [...alreadyAttendingMembers, ...anonymousAttendees];
      
      setMembers(availableMembers || []);
      setAlreadyRSVPMembers(allAttendingMembers || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch attendance data. Please try again."
      });
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
      // Find the event object to check if it's a generated instance
      const event = events.find(e => e.id === eventId);
      
      // Check if this is an old event with a malformed ID (like gjhgjhgh-1752854400000)
      const isOldMalformedId = eventId && eventId.includes('-') && eventId.length > 36 && !eventId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      
      // If this is a generated recurring event instance, we need to delete the master event
      // Only try to find original event if it's not an old malformed ID
      if (!isOldMalformedId && event && (eventId.includes('-') || eventId.includes('_')) && eventId.length > 36) {
        // Try to extract the original event ID from the generated instance ID
        let originalEventId;
        if (eventId.includes('_')) {
          originalEventId = eventId.split('_')[0];
        } else if (eventId.includes('-')) {
          // For the format like "sunday-morning-worship-service-1746381600000-2025-07-20t18-00-00-000z"
          // We need to find where the timestamp starts (after the original ID)
          // The timestamp format is: YYYY-MM-DDTHH-MM-SS-000Z
          const timestampPattern = /\d{4}-\d{2}-\d{2}t\d{2}-\d{2}-\d{2}-\d{3}z$/i;
          const match = eventId.match(timestampPattern);
          if (match) {
            // Remove the timestamp part from the end
            originalEventId = eventId.substring(0, match.index);
          } else {
            // Fallback: try to find the last numeric part that looks like a timestamp
            const parts = eventId.split('-');
            if (parts.length >= 2) {
              // Look for the part that contains 't' (indicating timestamp)
              const timestampIndex = parts.findIndex(part => part.includes('t'));
              if (timestampIndex !== -1) {
                originalEventId = parts.slice(0, timestampIndex).join('-');
              } else {
                // Remove the last part as fallback
                originalEventId = parts.slice(0, -1).join('-');
              }
            }
          }
        }
        
        if (originalEventId) {
          // Find the original event in our events list
          const originalEvent = events.find(e => e.id === originalEventId);
          
          if (originalEvent) {
            await deleteEvent(originalEventId);
            toast({
              title: "Success",
              description: "Recurring event deleted successfully. All future instances have been removed."
            });
          } else {
            // For old events, just delete the event as-is instead of showing an error
            console.log('Could not find original event to delete, deleting event as-is:', eventId);
      await deleteEvent(eventId);
      toast({
        title: "Success",
        description: "Event deleted successfully."
      });
          }
        } else {
          // Could not extract original ID, delete normally
          await deleteEvent(eventId);
          toast({
            title: "Success",
            description: "Event deleted successfully."
          });
        }
      } else {
        // For non-recurring events or master events, delete normally
        await deleteEvent(eventId);
        toast({
          title: "Success",
          description: "Event deleted successfully."
        });
      }
      
      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete event. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEditClick = (event) => {
    console.log('handleEditClick called with event:', event);
    console.log('Event ID:', event.id);
    console.log('Event is_instance:', event.is_instance);
    console.log('Event ID includes hyphen:', event.id.includes('-'));
    
    // Check if this is a generated recurring event instance
    // Look for patterns like: originalId_timestamp or originalId-timestamp
    if (event.id && (event.id.includes('-') || event.id.includes('_')) && event.id.length > 36) {
      console.log('Event ID contains hyphens/underscores and is long, checking if it\'s a generated instance...');
      
      // Try to extract the original event ID from the generated instance ID
      // Handle both formats: originalId_timestamp and originalId-timestamp
      let originalEventId;
      if (event.id.includes('_')) {
        originalEventId = event.id.split('_')[0];
      } else if (event.id.includes('-')) {
        // For the format like "sunday-morning-worship-service-1746381600000-2025-07-20t18-00-00-000z"
        // We need to find where the timestamp starts (after the original ID)
        // The timestamp format is: YYYY-MM-DDTHH-MM-SS-000Z
        const timestampPattern = /\d{4}-\d{2}-\d{2}t\d{2}-\d{2}-\d{2}-\d{3}z$/i;
        const match = event.id.match(timestampPattern);
        if (match) {
          // Remove the timestamp part from the end
          originalEventId = event.id.substring(0, match.index);
        } else {
          // Fallback: try to find the last numeric part that looks like a timestamp
          const parts = event.id.split('-');
          if (parts.length >= 2) {
            // Look for the part that contains 't' (indicating timestamp)
            const timestampIndex = parts.findIndex(part => part.includes('t'));
            if (timestampIndex !== -1) {
              originalEventId = parts.slice(0, timestampIndex).join('-');
            } else {
              // Remove the last part as fallback
              originalEventId = parts.slice(0, -1).join('-');
            }
          }
        }
      }
      
      console.log('Extracted original event ID:', originalEventId);
      
      if (originalEventId) {
        // Find the original event in our events list
        const originalEvent = events.find(e => e.id === originalEventId);
        
        if (originalEvent) {
          console.log('Found original event, using for editing:', originalEvent);
          setEditingEvent(originalEvent);
          setIsEditEventOpen(true);
        } else {
          console.log('Could not find original event with ID:', originalEventId);
          console.log('Available events:', events.map(e => ({ id: e.id, title: e.title, idLength: e.id.length })));
          console.log('Editing as regular event:', event);
    setEditingEvent(event);
    setIsEditEventOpen(true);
        }
      } else {
        console.log('Could not extract original event ID, editing as regular event:', event);
        setEditingEvent(event);
        setIsEditEventOpen(true);
      }
    } else {
      // For non-recurring events or master events, edit normally
      console.log('Editing regular event:', event);
      setEditingEvent(event);
      setIsEditEventOpen(true);
    }
  };

  const handleOpenDialog = async (event) => {
    // Store the original event ID that was passed to us (for adding new attendance)
    const originalEventId = event.id;
    
    // If this is a generated recurring event instance, we need to use the master event for RSVP
    let eventToUse = event;
    let actualEventId = event.id; // Default to the event ID as-is
    
    // Check if this is an old event with a malformed ID (like gjhgjhgh-1752854400000)
    const isOldMalformedId = event.id && event.id.includes('-') && event.id.length > 36 && !event.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    
    // Only try to find original event if it's not an old malformed ID
    if (!isOldMalformedId && event.id && (event.id.includes('-') || event.id.includes('_')) && event.id.length > 36) {
      // Try to extract the original event ID from the generated instance ID
      let originalEventId;
      if (event.id.includes('_')) {
        originalEventId = event.id.split('_')[0];
      } else if (event.id.includes('-')) {
        // For the format like "sunday-morning-worship-service-1746381600000-2025-07-20t18-00-00-000z"
        // We need to find where the timestamp starts (after the original ID)
        // The timestamp format is: YYYY-MM-DDTHH-MM-SS-000Z
        const timestampPattern = /\d{4}-\d{2}-\d{2}t\d{2}-\d{2}-\d{2}-\d{3}z$/i;
        const match = event.id.match(timestampPattern);
        if (match) {
          // Remove the timestamp part from the end
          originalEventId = event.id.substring(0, match.index);
        } else {
          // Fallback: try to find the last numeric part that looks like a timestamp
          const parts = event.id.split('-');
          if (parts.length >= 2) {
            // Look for the part that contains 't' (indicating timestamp)
            const timestampIndex = parts.findIndex(part => part.includes('t'));
            if (timestampIndex !== -1) {
              originalEventId = parts.slice(0, timestampIndex).join('-');
            } else {
              // Remove the last part as fallback
              originalEventId = parts.slice(0, -1).join('-');
            }
          }
        }
      }
      
      if (originalEventId) {
        // Find the original event in our events list
        const originalEvent = events.find(e => e.id === originalEventId);
        
        if (originalEvent) {
          eventToUse = originalEvent;
          actualEventId = originalEventId; // Use the original event ID for database queries
        } else {
          // For old events, just use the event as-is instead of showing an error
          console.log('Could not find original event, using event as-is:', event.id);
        }
      }
    }
    
    setSelectedEvent(eventToUse);
    // Store the original event ID for adding new attendance records
    setSelectedEventOriginalId(originalEventId);
    setSelectedMembers([]);
    setMemberSearchQuery('');
    setIsMemberDialogOpen(true);
    
    // Check if this is a past event
    const eventDate = new Date(event.start_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPastEvent = eventDate < today;
    setIsEditingPastEvent(isPastEvent);
    
    try {
      // Fetch all members
      const { data: allMembers, error: membersError } = await supabase
        .from('members')
        .select('*')
        .order('firstname');

      if (membersError) throw membersError;

      // Use the actual event ID for database operations
      console.log('🔍 Using actualEventId for database query:', actualEventId);
      console.log('🔍 Original event.id:', event.id);
      
      // Fetch already RSVP'd/Checked In People (including anonymous attendees)
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('event_attendance')
        .select(`
          id,
          member_id,
          anonymous_name,
          members (
            id,
            firstname,
            lastname,
            email,
            image_url
          )
        `)
        .eq('event_id', actualEventId);

      if (attendanceError) throw attendanceError;
      
      console.log('🔍 Attendance data found:', attendanceData?.length || 0, 'records');
      console.log('🔍 Attendance data:', attendanceData);

      // Get IDs of members who have already RSVP'd/checked in
      const attendingMemberIds = attendanceData
        .filter(record => record.member_id) // Only include records with member_id
        .map(record => record.member_id);
      
      // Filter out members who have already RSVP'd/checked in
      const availableMembers = allMembers.filter(member => !attendingMemberIds.includes(member.id));
      
      // Get the full member data for already RSVP'd/Checked In People
      const alreadyAttendingMembers = attendanceData
        .filter(record => record.members) // Only include records with member data
        .map(record => record.members);
      
      // Add anonymous attendees to the already attending list
      const anonymousAttendees = attendanceData
        .filter(record => record.anonymous_name && !record.member_id)
        .map(record => ({
          id: `anonymous-${record.id}`,
          firstname: 'Anonymous',
          lastname: '',
          email: null,
          image_url: null,
          isAnonymous: true
        }));
      
      const allAttendingMembers = [...alreadyAttendingMembers, ...anonymousAttendees];

      // If this is a recurring event, get attendance suggestions based on previous instances
      let suggestedMembers = [];
      let attendanceCounts = {};
      if (event.is_recurring || event.recurrence_pattern) {
        try {
          // Get previous instances of this event (or similar events of the same type)
          const { data: previousAttendance, error: prevError } = await supabase
            .from('event_attendance')
            .select(`
              member_id,
              status,
              events!inner (
                id,
                title,
                event_type,
                start_date,
                is_recurring,
                recurrence_pattern
              )
            `)
            .eq('events.event_type', event.event_type)
            .eq('events.is_recurring', true)
            .gte('events.start_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()); // Last 90 days

          if (!prevError && previousAttendance) {
            // Count attendance frequency for each member
            previousAttendance.forEach(record => {
              const memberId = record.member_id;
              attendanceCounts[memberId] = (attendanceCounts[memberId] || 0) + 1;
            });

            // Sort members by attendance frequency (most frequent first)
            const sortedMemberIds = Object.keys(attendanceCounts)
              .sort((a, b) => attendanceCounts[b] - attendanceCounts[a]);

            // Get the top 10 most frequent attendees who are available
            const topAttendees = sortedMemberIds
              .slice(0, 10)
              .map(memberId => availableMembers.find(m => m.id === memberId))
              .filter(Boolean);

            suggestedMembers = topAttendees;
          }
        } catch (error) {
          console.error('Error fetching attendance suggestions:', error);
          // Continue without suggestions if there's an error
        }
      }

      // Sort available members: suggested members first, then alphabetically
      const sortedAvailableMembers = [
        ...suggestedMembers,
        ...availableMembers.filter(member => !suggestedMembers.find(s => s.id === member.id))
      ];

      console.log('🔍 Setting alreadyRSVPMembers:', allAttendingMembers?.length || 0, 'members');
      console.log('🔍 Already attending members:', allAttendingMembers);
      
      setMembers(sortedAvailableMembers);
      setSuggestedMembers(suggestedMembers);
      setMemberAttendanceCount(attendanceCounts);
      setAlreadyRSVPMembers(allAttendingMembers || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load members. Please try again."
      });
    }
  };

  const handleCloseDialog = () => {
    setIsMemberDialogOpen(false);
    setSelectedEvent(null);
    setSelectedEventOriginalId(null);
    setSelectedMembers([]);
    setMembers([]);
    setAlreadyRSVPMembers([]);
    setSuggestedMembers([]);
    setMemberAttendanceCount({});
    setIsEditingPastEvent(false);
    setIsAnonymousCheckinOpen(false);
    setAnonymousName('');
  };

  const handlePotluckRSVP = useCallback(async (event) => {
    setSelectedPotluckEvent(event);
    setIsPotluckRSVPDialogOpen(true);
    
    // Get the actual event ID for database operations
    let actualEventId = event.id;
    
    // Check if this is a generated recurring event instance
    if (event.id && (event.id.includes('-') || event.id.includes('_')) && event.id.length > 36) {
      // Extract the original event ID from the generated instance ID
      if (event.id.includes('_')) {
        actualEventId = event.id.split('_')[0];
      } else if (event.id.includes('-')) {
        // For the format like "sunday-morning-worship-service-1746381600000-2025-07-20t18-00-00-000z"
        const timestampPattern = /\d{4}-\d{2}-\d{2}t\d{2}-\d{2}-\d{2}-\d{3}z$/i;
        const match = event.id.match(timestampPattern);
        if (match) {
          actualEventId = event.id.substring(0, match.index);
        } else {
          // Fallback: try to find the last numeric part that looks like a timestamp
          const parts = event.id.split('-');
          if (parts.length >= 2) {
            const timestampIndex = parts.findIndex(part => part.includes('t'));
            if (timestampIndex !== -1) {
              actualEventId = parts.slice(0, timestampIndex).join('-');
            } else {
              actualEventId = parts.slice(0, -1).join('-');
            }
          }
        }
      }
    }
    
    try {
      const { data: rsvps, error } = await supabase
        .from('potluck_rsvps')
        .select('*')
        .eq('event_id', actualEventId);
      
      if (error) throw error;
      setPotluckRSVPs(rsvps || []);
    } catch (error) {
      console.error('Error fetching potluck RSVPs:', error);
      alert('Failed to load potluck RSVPs. Please try again.');
    }
  }, []);

  const handlePotluckRSVPUpdate = useCallback(async () => {
    // Refresh the events list to update attendance counts
    await fetchEvents();
    
    if (selectedPotluckEvent) {
      handlePotluckRSVP(selectedPotluckEvent);
    }
  }, [selectedPotluckEvent, handlePotluckRSVP, fetchEvents]);

  const handleManageVolunteers = (event) => {
    // If this is a generated recurring event instance, we need to use the master event for volunteer management
    let eventToUse = event;
    
    // Check if this is an old event with a malformed ID (like gjhgjhgh-1752854400000)
    const isOldMalformedId = event.id && event.id.includes('-') && event.id.length > 36 && !event.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    
    // Only try to find original event if it's not an old malformed ID
    if (!isOldMalformedId && event.id && (event.id.includes('-') || event.id.includes('_')) && event.id.length > 36) {
      // Try to extract the original event ID from the generated instance ID
      let originalEventId;
      if (event.id.includes('_')) {
        originalEventId = event.id.split('_')[0];
      } else if (event.id.includes('-')) {
        // For the format like "sunday-morning-worship-service-1746381600000-2025-07-20t18-00-00-000z"
        // We need to find where the timestamp starts (after the original ID)
        // The timestamp format is: YYYY-MM-DDTHH-MM-SS-000Z
        const timestampPattern = /\d{4}-\d{2}-\d{2}t\d{2}-\d{2}-\d{2}-\d{3}z$/i;
        const match = event.id.match(timestampPattern);
        if (match) {
          // Remove the timestamp part from the end
          originalEventId = event.id.substring(0, match.index);
        } else {
          // Fallback: try to find the last numeric part that looks like a timestamp
          const parts = event.id.split('-');
          if (parts.length >= 2) {
            // Look for the part that contains 't' (indicating timestamp)
            const timestampIndex = parts.findIndex(part => part.includes('t'));
            if (timestampIndex !== -1) {
              originalEventId = parts.slice(0, timestampIndex).join('-');
            } else {
              // Remove the last part as fallback
              originalEventId = parts.slice(0, -1).join('-');
            }
          }
        }
      }
      
      if (originalEventId) {
        // Find the original event in our events list
        const originalEvent = events.find(e => e.id === originalEventId);
        
        if (originalEvent) {
          eventToUse = originalEvent;
        } else {
          // For old events, just use the event as-is instead of showing an error
          console.log('Could not find original event for volunteers, using event as-is:', event.id);
        }
      }
    }
    
    setVolunteerDialogEvent(eventToUse);
    setIsVolunteerDialogOpen(true);
  };

  const renderEventCard = useCallback((event) => {
    return (
      <EventCard
        key={event.id}
        event={event}
        viewMode={viewMode}
        onRSVP={handleOpenDialog}
        onPotluckRSVP={handlePotluckRSVP}
        onEdit={handleEditClick}
        onDelete={handleDeleteEvent}
        onManageVolunteers={handleManageVolunteers}
      />
    );
  }, [viewMode, handleOpenDialog, handlePotluckRSVP, handleEditClick, handleDeleteEvent, handleManageVolunteers]);

  const processRecurringEvents = (events, customEndDate = null) => {
    const processedEvents = [];
    const now = new Date();
    const endDate = customEndDate || new Date();
    if (!customEndDate) {
      endDate.setMonth(endDate.getMonth() + 3); // Default: Show events for next 3 months
    }
    const seenEventKeys = new Set(); // Track seen events to avoid duplicates

    // Helper function to normalize event titles for better deduplication
    const normalizeTitle = (title) => {
      return title
        .toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/minitry/g, 'ministry') // Fix common typo
        .trim();
    };

    events.forEach(event => {
      if (!event.recurrence_pattern) {
        // For non-recurring events, add them directly
        processedEvents.push(event);
        return;
      }

      console.log('[processRecurringEvents] Processing recurring event:', {
        title: event.title,
        pattern: event.recurrence_pattern,
        startDate: event.start_date,
        monthly_week: event.monthly_week,
        monthly_weekday: event.monthly_weekday
      });

      const startDate = new Date(event.start_date);
      const endTime = new Date(event.end_date);
      const duration = endTime - startDate;

      let currentDate = new Date(startDate);
      let instanceCount = 0;
      const maxInstances = 12; // Limit to prevent infinite loops

      while (currentDate <= endDate && instanceCount < maxInstances) {
        if (currentDate >= now) {
          // Create a unique key for this event instance
          const normalizedTitle = normalizeTitle(event.title);
          const eventKey = `${normalizedTitle}_${format(currentDate, 'yyyy-MM-dd')}`;
          
          // Only add if we haven't seen this event instance before
          if (!seenEventKeys.has(eventKey)) {
          const eventInstance = {
            ...event,
            id: `${event.id}_${currentDate.toISOString()}`,
            start_date: new Date(currentDate),
            end_date: new Date(currentDate.getTime() + duration),
            is_instance: true
          };
          processedEvents.push(eventInstance);
            seenEventKeys.add(eventKey);
            instanceCount++;
            
            console.log('[processRecurringEvents] Created instance:', {
              title: event.title,
              date: format(currentDate, 'yyyy-MM-dd'),
              key: eventKey,
              instanceCount
            });
          } else {
            console.log('[processRecurringEvents] Skipped duplicate:', {
              title: event.title,
              date: format(currentDate, 'yyyy-MM-dd'),
              key: eventKey
            });
          }
        }

        // Calculate next occurrence based on recurrence pattern
        switch (event.recurrence_pattern) {
          case 'daily':
            currentDate.setDate(currentDate.getDate() + 1);
            break;
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case 'biweekly':
            currentDate.setDate(currentDate.getDate() + 14);
            break;
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
          case 'monthly_weekday':
            // Get the next month
            currentDate.setMonth(currentDate.getMonth() + 1);
            // Set to first day of the month
            currentDate.setDate(1);
            
            // Get the target weekday (0-6, where 0 is Sunday)
            const targetWeekday = parseInt(event.monthly_weekday);
            // Get the target week (1-5, where 5 means last week)
            const targetWeek = parseInt(event.monthly_week);
            
            // Find the target date
            if (targetWeek === 5) {
              // For last week, start from the end of the month
              currentDate.setMonth(currentDate.getMonth() + 1);
              currentDate.setDate(0); // Last day of the month
              // Go backwards to find the target weekday
              while (currentDate.getDay() !== targetWeekday) {
                currentDate.setDate(currentDate.getDate() - 1);
              }
            } else {
              // For other weeks, find the first occurrence of the target weekday
              while (currentDate.getDay() !== targetWeekday) {
                currentDate.setDate(currentDate.getDate() + 1);
              }
              // Add weeks to get to the target week
              currentDate.setDate(currentDate.getDate() + (targetWeek - 1) * 7);
            }
            
            // Ensure we don't go beyond the current month
            const currentMonth = currentDate.getMonth();
            if (currentDate.getMonth() !== currentMonth) {
              // If we've moved to the next month, adjust back
              currentDate.setMonth(currentMonth);
              currentDate.setDate(0); // Last day of the current month
            }
            break;
          default:
            currentDate = endDate; // Stop processing for unknown patterns
        }
      }
    });

    console.log('[processRecurringEvents] Processed events:', processedEvents.length);
    console.log('[processRecurringEvents] Unique event keys:', seenEventKeys.size);
    console.log('[processRecurringEvents] Time range:', format(now, 'yyyy-MM-dd'), 'to', format(endDate, 'yyyy-MM-dd'));
    
    return processedEvents;
  };

  // Function to process recurring events for a specific month
  const processRecurringEventsForMonth = (events, month, originalData = []) => {
    const processedEvents = [];
    const startOfMonthDate = startOfMonth(month);
    const endOfMonthDate = endOfMonth(month);
    const seenEvents = new Set(); // Track seen events to avoid duplicates

    // Helper function to normalize event titles for better deduplication
    const normalizeTitle = (title) => {
      return title
        .toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/minitry/g, 'ministry') // Fix common typo
        .trim();
    };

    // Group events by normalized title and recurrence pattern to handle duplicates and typos
    const eventGroups = {};
    events.forEach(event => {
      const normalizedTitle = normalizeTitle(event.title);
      const key = `${normalizedTitle}_${event.recurrence_pattern || 'non-recurring'}`;
      if (!eventGroups[key]) {
        eventGroups[key] = [];
      }
      eventGroups[key].push(event);
      
      // Debug logging for duplicate detection
      if (eventGroups[key].length > 1) {
        console.log(`[processRecurringEventsForMonth] Found potential duplicates for key "${key}":`, 
          eventGroups[key].map(e => e.title));
        console.log(`[processRecurringEventsForMonth] Original titles:`, eventGroups[key].map(e => e.title));
        console.log(`[processRecurringEventsForMonth] Normalized title: "${normalizedTitle}"`);
      }
    });

    // Debug: Check what's in originalData
    console.log('[processRecurringEventsForMonth] originalData sample:', originalData.slice(0, 3).map(e => ({
      title: e.title,
      date: e.start_date,
      attendance: e.attendance,
      event_attendance_count: e.event_attendance?.length || 0
    })));

    // Process each group, keeping only the earliest event
    Object.values(eventGroups).forEach(group => {
      // Sort by start_date and take the earliest one
      const sortedGroup = group.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
      const event = sortedGroup[0]; // Take the earliest event

      if (!event.recurrence_pattern) {
        // For non-recurring events, check if we've already seen this exact event
        const normalizedTitle = normalizeTitle(event.title);
        const eventKey = `${normalizedTitle}_${format(new Date(event.start_date), 'yyyy-MM-dd')}`;
        if (!seenEvents.has(eventKey)) {
          processedEvents.push(event);
          seenEvents.add(eventKey);
        }
        return;
      }

      const startDate = new Date(event.start_date);
      const endTime = new Date(event.end_date);
      const duration = endTime - startDate;

      // For weekly recurring events, we need to find the correct day of the week
      // and generate instances for that specific day throughout the month
      if (event.recurrence_pattern === 'weekly') {
        // Get the day of the week from the original event (0-6, where 0 is Sunday)
        const targetDayOfWeek = startDate.getDay();
        
        // Start from the beginning of the month
        let currentDate = new Date(startOfMonthDate);
        
        // Find the first occurrence of the target day of week in this month
        while (currentDate.getDay() !== targetDayOfWeek) {
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Generate instances for each week of the month
        let weekCount = 0;
        const maxWeeks = 10; // Safety limit to prevent infinite loops
        
        while (currentDate <= endOfMonthDate && weekCount < maxWeeks) {
          const normalizedTitle = normalizeTitle(event.title);
          const eventKey = `${normalizedTitle}_${format(currentDate, 'yyyy-MM-dd')}`;
          
          // Only add if we haven't seen this event instance before
          if (!seenEvents.has(eventKey)) {
            // Preserve the original time from the event
            const originalStartTime = new Date(event.start_date);
            const originalEndTime = new Date(event.end_date);
            
            // Create new dates with the correct date but original time
            const newStartDate = new Date(currentDate);
            newStartDate.setHours(originalStartTime.getHours(), originalStartTime.getMinutes(), 0, 0);
            
            const newEndDate = new Date(currentDate);
            newEndDate.setHours(originalEndTime.getHours(), originalEndTime.getMinutes(), 0, 0);
            
                          // Check if this specific date already exists as a real event in the database
              const existingEvent = originalData.find(e => {
                const eventDate = new Date(e.start_date);
                const instanceDate = new Date(currentDate);
                return e.title === event.title && 
                       eventDate.getDate() === instanceDate.getDate() &&
                       eventDate.getMonth() === instanceDate.getMonth() &&
                       eventDate.getFullYear() === instanceDate.getFullYear();
              });

              const eventInstance = {
                ...event,
                id: `${event.id}_${currentDate.toISOString()}`,
                start_date: newStartDate,
                end_date: newEndDate,
                is_instance: true,
                // Use existing attendance if this date already exists as a real event
                attendance: existingEvent ? (existingEvent.attendance || 0) : 0,
                event_attendance: existingEvent ? (existingEvent.event_attendance || []) : []
              };
            processedEvents.push(eventInstance);
            seenEvents.add(eventKey);
            console.log(`[processRecurringEventsForMonth] Generated: ${event.title} on ${format(currentDate, 'EEEE, MMMM d, yyyy')}`);
          }
          
          // Move to next week
          currentDate.setDate(currentDate.getDate() + 7);
          weekCount++;
        }
        
        if (weekCount >= maxWeeks) {
          console.warn(`[processRecurringEventsForMonth] Safety limit reached for event: ${event.title}`);
        }
      } else {
        // For other recurrence patterns, use the original logic
        let currentDate = new Date(startDate);
        
        // Generate instances for the month
        let instanceCount = 0;
        const maxInstances = 50; // Safety limit to prevent infinite loops
        
        while (currentDate <= endOfMonthDate && instanceCount < maxInstances) {
          if (currentDate >= startOfMonthDate) {
            const normalizedTitle = normalizeTitle(event.title);
            const eventKey = `${normalizedTitle}_${format(currentDate, 'yyyy-MM-dd')}`;
            
            // Only add if we haven't seen this event instance before
            if (!seenEvents.has(eventKey)) {
              // Preserve the original time from the event
              const originalStartTime = new Date(event.start_date);
              const originalEndTime = new Date(event.end_date);
              
              // Create new dates with the correct date but original time
              const newStartDate = new Date(currentDate);
              newStartDate.setHours(originalStartTime.getHours(), originalStartTime.getMinutes(), 0, 0);
              
              const newEndDate = new Date(currentDate);
              newEndDate.setHours(originalEndTime.getHours(), originalEndTime.getMinutes(), 0, 0);
              
              // Check if this specific date already exists as a real event in the database
              const existingEvent = originalData.find(e => {
                const eventDate = new Date(e.start_date);
                const instanceDate = new Date(currentDate);
                return e.title === event.title && 
                       eventDate.getDate() === instanceDate.getDate() &&
                       eventDate.getMonth() === instanceDate.getMonth() &&
                       eventDate.getFullYear() === instanceDate.getFullYear();
              });

              const eventInstance = {
                ...event,
                id: `${event.id}_${currentDate.toISOString()}`,
                start_date: newStartDate,
                end_date: newEndDate,
                is_instance: true,
                // Use existing attendance if this date already exists as a real event
                attendance: existingEvent ? (existingEvent.attendance || 0) : 0,
                event_attendance: existingEvent ? (existingEvent.event_attendance || []) : []
              };
              processedEvents.push(eventInstance);
              seenEvents.add(eventKey);
              console.log(`[processRecurringEventsForMonth] Generated: ${event.title} on ${format(currentDate, 'EEEE, MMMM d, yyyy')}`);
            }
          }

          // Calculate next occurrence based on recurrence pattern
          switch (event.recurrence_pattern) {
            case 'daily':
              currentDate.setDate(currentDate.getDate() + 1);
              break;
            case 'biweekly':
              currentDate.setDate(currentDate.getDate() + 14);
              break;
            case 'monthly':
              currentDate.setMonth(currentDate.getMonth() + 1);
              break;
            case 'monthly_weekday':
              // Get the next month
              currentDate.setMonth(currentDate.getMonth() + 1);
              // Set to first day of the month
              currentDate.setDate(1);
              
              // Get the target weekday (0-6, where 0 is Sunday)
              const targetWeekday = parseInt(event.monthly_weekday);
              // Get the target week (1-5, where 5 means last week)
              const targetWeek = parseInt(event.monthly_week);
              
              // Find the target date
              if (targetWeek === 5) {
                // For last week, start from the end of the month
                currentDate.setMonth(currentDate.getMonth() + 1);
                currentDate.setDate(0); // Last day of the month
                // Go backwards to find the target weekday
                while (currentDate.getDay() !== targetWeekday) {
                  currentDate.setDate(currentDate.getDate() - 1);
                }
              } else {
                // For other weeks, find the first occurrence of the target weekday
                while (currentDate.getDay() !== targetWeekday) {
                  currentDate.setDate(currentDate.getDate() + 1);
                }
                // Add weeks to get to the target week
                currentDate.setDate(currentDate.getDate() + (targetWeek - 1) * 7);
              }
              break;
            default:
              currentDate = endOfMonthDate; // Stop processing for unknown patterns
          }
          
          instanceCount++;
        }
        
        if (instanceCount >= maxInstances) {
          console.warn(`[processRecurringEventsForMonth] Safety limit reached for event: ${event.title}`);
        }
      }
    });

    console.log('[processRecurringEventsForMonth] Input events:', events.length);
    console.log('[processRecurringEventsForMonth] Output events:', processedEvents.length);
    console.log('[processRecurringEventsForMonth] Unique events:', seenEvents.size);
    console.log('[processRecurringEventsForMonth] Event groups:', Object.keys(eventGroups).length);
    console.log('[processRecurringEventsForMonth] Function completed successfully');

    return processedEvents;
  };

  return (
    <PermissionGuard permission={PERMISSIONS.EVENTS_VIEW}>
      {/* Full Kiosk Mode - Mobile Optimized */}
      {isFullKioskMode ? (
        <div className="fixed inset-0 bg-white z-40 overflow-hidden">
          {/* Kiosk Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold">Check-In Kiosk</h1>
                <p className="text-blue-100 text-xl">Select an event to check in</p>
              </div>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setIsFullKioskMode(false);
                  setViewMode('admin');
                  navigate('/events');
                }}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 text-lg px-6 py-3"
              >
                <X className="mr-3 h-6 w-6" />
                Exit Kiosk
              </Button>
            </div>
          </div>

          {/* Kiosk Event List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isLoading ? (
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="p-8">
                    <div className="animate-pulse">
                      <div className="h-8 bg-gray-200 rounded w-3/4 mb-6"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : filteredEvents.length > 0 ? (
              <div className="space-y-6">
                {filteredEvents.map((event) => (
                  <Card key={event.id} className="hover:shadow-xl transition-shadow cursor-pointer border-2 hover:border-blue-300" onClick={() => handleOpenDialog(event)}>
                    <CardContent className="p-8">
                      <div className="flex items-start gap-6">
                        <div className="flex-shrink-0">
                          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                            <Calendar className="h-10 w-10 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h3>
                          <div className="space-y-3 text-xl text-gray-600">
                            <div className="flex items-center gap-3">
                              <Calendar className="h-6 w-6 text-gray-400" />
                              <span>{format(new Date(event.start_date), 'EEEE, MMMM d, yyyy')}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Clock className="h-6 w-6 text-gray-400" />
                              <span>{format(new Date(event.start_date), 'h:mm a')} - {format(new Date(event.end_date), 'h:mm a')}</span>
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-3">
                                <MapPin className="h-6 w-6 text-gray-400" />
                                <span>{event.location}</span>
                              </div>
                            )}
                          </div>
                          <div className="mt-4">
                            <Badge variant="secondary" className="bg-green-100 text-green-800 text-lg px-4 py-2">
                              <Users className="mr-2 h-5 w-5" />
                              {event.attendance || 0} checked in
                            </Badge>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-xl px-8 py-4 h-auto">
                            Check In
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Calendar className="mx-auto h-24 w-24 text-gray-400 mb-6" />
                <h3 className="text-3xl font-bold text-gray-900 mb-4">No upcoming events</h3>
                <p className="text-xl text-gray-500">No events available for check-in at this time.</p>
              </div>
            )}
          </div>

          {/* Member Selection Dialog for Kiosk Mode */}
          <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
            <DialogContent className="w-[95vw] max-w-full h-[90vh] md:h-auto md:max-w-4xl p-0 z-50">
              <DialogHeader className="p-4 md:p-6 border-b">
                <div className="space-y-2">
                  <DialogTitle className="text-xl md:text-2xl lg:text-3xl">
                    {isEditingPastEvent 
                      ? 'Edit Attendance' 
                      : selectedEvent?.attendance_type === 'check-in' 
                        ? 'Check In People' 
                        : 'RSVP Members'
                    } - {selectedEvent?.title}
                  </DialogTitle>
                  {suggestedMembers.length > 0 && (
                    <div className="flex items-center gap-3">
                      <Star className="h-6 w-6 md:h-7 md:w-7 text-green-600" />
                      <span className="text-lg md:text-xl text-green-600 font-normal">
                        Smart suggestions available
                      </span>
                    </div>
                  )}
                </div>
                <DialogDescription className="text-lg md:text-xl mt-4">
                  {isEditingPastEvent
                    ? `Edit attendance records for ${selectedEvent?.title}`
                    : selectedEvent?.attendance_type === 'check-in'
                    ? 'Check In People for the event'
                      : `Select members to RSVP for ${selectedEvent?.title}`
                  }
                </DialogDescription>
                {suggestedMembers.length > 0 && (
                  <div className="mt-3 text-sm md:text-base text-green-600">
                    Members who frequently attend similar events are highlighted below
                  </div>
                )}
              </DialogHeader>

              <div className="p-6 md:p-8 flex-1 overflow-hidden">
                <Tabs defaultValue="available" className="w-full h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-2 h-14 md:h-16">
                    <TabsTrigger value="available" className="text-lg md:text-xl">
                      {isEditingPastEvent ? 'Add Attendance' : 'Available People'}
                    </TabsTrigger>
                    <TabsTrigger value="checked-in" className="text-lg md:text-xl">
                      {selectedEvent?.attendance_type === 'check-in' ? 'Checked In' : 'RSVP\'d'}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="available" className="mt-6 md:mt-8 flex-1 overflow-y-auto">
                    <div className="space-y-6 md:space-y-8">
                      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                        <div className="flex-1">
                          <Input
                            placeholder="Search people..."
                            value={memberSearchQuery}
                            onChange={(e) => setMemberSearchQuery(e.target.value)}
                            className="w-full h-16 md:h-20 text-lg md:text-xl"
                          />
                        </div>
                        <Button
                          onClick={() => setIsCreateMemberOpen(true)}
                          className="w-full md:w-auto h-16 md:h-20 text-lg md:text-xl bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="mr-2 md:mr-3 h-5 w-5 md:h-6 md:w-6" />
                          Add New Person
                        </Button>
                        {selectedEvent?.attendance_type === 'check-in' && (
                          <Button
                            onClick={() => setIsAnonymousCheckinOpen(true)}
                            className="w-full md:w-auto h-16 md:h-20 text-lg md:text-xl bg-orange-600 hover:bg-orange-700"
                          >
                            <UserPlus className="mr-2 md:mr-3 h-5 w-5 md:h-6 md:w-6" />
                            Anonymous Check-in
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2">
                        {suggestedMembers.length > 0 && (
                          <div className="mb-6 md:mb-8">
                            <h3 className="text-xl md:text-2xl font-bold text-green-700 mb-4 flex items-center gap-3">
                              <Star className="h-6 w-6 md:h-7 md:w-7" />
                              Suggested Based on Previous Attendance
                            </h3>
                            <div className="space-y-2">
                              {suggestedMembers
                                .filter(member => 
                                  member.firstname?.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                                  member.lastname?.toLowerCase().includes(memberSearchQuery.toLowerCase())
                                )
                                .map((member) => (
                                <div
                                  key={member.id}
                                  className="flex items-center space-x-3 md:space-x-4 p-3 md:p-4 lg:p-5 rounded-lg border-2 border-green-200 bg-green-50 cursor-pointer hover:bg-green-100 transition-colors"
                                  onClick={() => handleMemberClick(member)}
                                >
                                                                    <Avatar className="h-16 w-16 md:h-20 md:w-20 lg:h-24 lg:w-24">
                                    <AvatarImage src={member.image_url} />
                                    <AvatarFallback className="text-lg md:text-xl lg:text-2xl">
                                      {getInitials(member.firstname, member.lastname)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-lg md:text-xl lg:text-2xl font-bold truncate">
                                      {member.firstname} {member.lastname}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-sm px-2 py-1">
                                        {memberAttendanceCount[member.id] || 0} previous attendances
                                      </Badge>
                                      <span className="text-sm md:text-base text-green-600">Frequent attendee</span>
                                    </div>
                                  </div>
                                <Star className="h-5 w-5 md:h-6 md:w-6 text-green-600 flex-shrink-0" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                        
                        <div className="space-y-2">
                          {members
                            .filter(member => 
                              !suggestedMembers.find(s => s.id === member.id) &&
                              (member.firstname?.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                               member.lastname?.toLowerCase().includes(memberSearchQuery.toLowerCase()))
                            )
                            .map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center space-x-3 md:space-x-4 p-3 md:p-4 lg:p-5 rounded-lg border-2 cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => handleMemberClick(member)}
                            >
                              <Avatar className="h-16 w-16 md:h-20 md:w-20 lg:h-24 lg:w-24">
                                <AvatarImage src={member.image_url} />
                                <AvatarFallback className="text-lg md:text-xl lg:text-2xl">
                                  {getInitials(member.firstname, member.lastname)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-lg md:text-xl lg:text-2xl font-bold truncate">
                                  {member.firstname} {member.lastname}
                                </p>
                                {memberAttendanceCount[member.id] && (
                                  <div className="mt-1">
                                    <Badge variant="outline" className="text-sm px-2 py-1">
                                      {memberAttendanceCount[member.id]} previous attendances
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="checked-in" className="mt-3 md:mt-8 flex-1 overflow-y-auto">
                    <div className="space-y-2">
                      {alreadyRSVPMembers.filter(member => member && member.id).map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3 md:p-4 lg:p-5 rounded-lg border-2"
                        >
                          <div className="flex items-center space-x-3 md:space-x-4 min-w-0 flex-1">
                            <Avatar className="h-16 w-16 md:h-20 md:w-20 lg:h-24 lg:w-24">
                              <AvatarImage src={member.image_url} />
                              <AvatarFallback className="text-lg md:text-xl lg:text-2xl">
                                {member.isAnonymous ? member.firstname.charAt(0) : getInitials(member.firstname, member.lastname)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="text-lg md:text-xl lg:text-2xl font-bold truncate">
                                {member.firstname} {member.lastname}
                              </p>
                              {member.isAnonymous && (
                                <Badge variant="outline" className="text-sm px-3 py-1 text-orange-600 border-orange-600">
                                  Anonymous Attendee
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="lg"
                            onClick={() => handleRemoveMember(member.id)}
                            className="h-12 w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 p-0 flex-shrink-0"
                          >
                            <X className="h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8" />
                          </Button>
                        </div>
                      ))}
                      {alreadyRSVPMembers.length === 0 && (
                        <p className="text-sm md:text-base lg:text-lg text-gray-500 italic p-4">
                          {selectedEvent?.attendance_type === 'check-in'
                            ? 'No members have checked in yet'
                            : 'No members have RSVP\'d yet'}
                        </p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <DialogFooter className="p-6 md:p-8 border-t">
                <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full">
                  <Button
                    variant="outline"
                    onClick={handleCloseDialog}
                    className="w-full md:w-auto text-lg md:text-xl h-16 md:h-20"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDone}
                    className="w-full md:w-auto text-lg md:text-xl h-16 md:h-20"
                  >
                    Done
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <motion.div 
          className="w-full px-0 md:px-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
        {/* Mobile Header - Hidden on Desktop */}
        <div className="lg:hidden sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between p-4">
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                Events
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Manage and track events</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              <PermissionButton
                permission={PERMISSIONS.EVENTS_CREATE}
                onClick={() => setIsCreateEventOpen(true)}
                size="icon"
                className="hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
              </PermissionButton>
            </div>
          </div>
        </div>

        {/* Desktop Header - Hidden on Mobile */}
        <div className="hidden lg:block mb-8 px-2 md:px-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Events
              </h1>
              <p className="text-gray-600 text-lg">Manage and track event attendance</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="h-10"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                {showAnalytics ? 'Hide' : 'Show'} Analytics
              </Button>
              <PermissionButton
                permission={PERMISSIONS.EVENTS_CREATE}
                onClick={() => setIsCreateEventOpen(true)}
                className="h-10"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Event
              </PermissionButton>
            </div>
          </div>

          {/* Quick Stats Cards - Desktop Only */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">All Future Events</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{events.length}</p>
                  </div>
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">Next 7 Days</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {events.filter(e => {
                        const eventDate = new Date(e.start_date);
                        const weekFromNow = new Date();
                        weekFromNow.setDate(weekFromNow.getDate() + 7);
                        return eventDate <= weekFromNow && eventDate >= new Date();
                      }).length}
                    </p>
                  </div>
                  <div className="p-2 bg-green-500 rounded-lg">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">This Month's Attendance</p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                      {(() => {
                        const now = new Date();
                        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                        
                        return pastEvents
                          .filter(e => {
                            const eventDate = new Date(e.start_date);
                            return eventDate >= startOfMonth && eventDate <= endOfMonth;
                          })
                          .reduce((sum, e) => sum + (e.attendance || 0), 0);
                      })()}
                    </p>
                  </div>
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">All Past Events</p>
                    <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{pastEvents.length}</p>
                  </div>
                  <div className="p-2 bg-orange-500 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Kiosk Mode Button - Desktop */}
          <div className="mt-6">
            <Button
              onClick={() => {
                setViewMode('kiosk');
                setIsFullKioskMode(true);
                navigate('/events?kiosk=true');
              }}
              className="w-full h-16 text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Monitor className="mr-3 h-7 w-7" />
              Check-In Kiosk Mode
            </Button>
          </div>
        </div>

        {/* Mobile Stats Cards */}
        <div className="lg:hidden p-4">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
              <CardContent className="p-3 text-center">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-1">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
                <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  {events.length}
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400">Future Events</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
              <CardContent className="p-3 text-center">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-1">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <div className="text-lg font-bold text-green-900 dark:text-green-100">
                  {events.filter(e => {
                    const eventDate = new Date(e.start_date);
                    const weekFromNow = new Date();
                    weekFromNow.setDate(weekFromNow.getDate() + 7);
                    return eventDate <= weekFromNow && eventDate >= new Date();
                  }).length}
                </div>
                <p className="text-xs text-green-600 dark:text-green-400">Next 7 Days</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
              <CardContent className="p-3 text-center">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-1">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                  {(() => {
                    const now = new Date();
                    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    
                    return pastEvents
                      .filter(e => {
                        const eventDate = new Date(e.start_date);
                        return eventDate >= startOfMonth && eventDate <= endOfMonth;
                      })
                      .reduce((sum, e) => sum + (e.attendance || 0), 0);
                  })()}
                </div>
                <p className="text-xs text-purple-600 dark:text-purple-400">This Month's Attendance</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
              <CardContent className="p-3 text-center">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mx-auto mb-1">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <div className="text-lg font-bold text-orange-900 dark:text-orange-100">
                  {pastEvents.length}
                </div>
                <p className="text-xs text-orange-600 dark:text-orange-400">Past Events</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Kiosk Mode Button */}
          <Button
            onClick={() => {
              setViewMode('kiosk');
              setIsFullKioskMode(true);
              navigate('/events?kiosk=true');
            }}
            className="w-full h-16 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Monitor className="mr-3 h-6 w-6" />
            Check-In Kiosk Mode
          </Button>
        </div>

        {/* Analytics Section */}
        {showAnalytics && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 px-4 lg:px-0"
          >
            <EventAnalytics events={filteredEvents} pastEvents={filteredPastEvents} />
          </motion.div>
        )}

        {/* Enhanced Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full px-2 md:px-0">
          {/* Mobile Tabs */}
          <div className="lg:hidden">
            <TabsList className="grid w-full grid-cols-3 h-12 mb-4">
              <TabsTrigger value="upcoming" className="text-sm">Upcoming</TabsTrigger>
              <TabsTrigger value="past" className="text-sm">Past</TabsTrigger>
              <TabsTrigger value="locations" className="text-sm">Locations</TabsTrigger>
            </TabsList>
          </div>

          {/* Desktop Tabs */}
          <div className="hidden lg:block">
            <TabsList className="grid w-full grid-cols-3 h-14 mb-6">
              <TabsTrigger value="upcoming" className="text-lg">Upcoming Events</TabsTrigger>
              <TabsTrigger value="past" className="text-lg">Past Events</TabsTrigger>
              <TabsTrigger value="locations" className="text-lg">Locations</TabsTrigger>
            </TabsList>
          </div>

          {/* Upcoming Events Tab */}
          <TabsContent value="upcoming" className="space-y-6 px-4 lg:px-0">
            {/* Enhanced Search and Filters */}
            <div className="space-y-4">
              {/* View Mode Toggle - Mobile */}
              <div className="lg:hidden space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">View Mode</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchEvents}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={viewMode === 'admin' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setViewMode('admin');
                      setIsFullKioskMode(false);
                      navigate('/events');
                    }}
                    className="text-xs"
                  >
                    <List className="mr-1 h-3 w-3" />
                    Admin
                  </Button>
                  <Button
                    variant={viewMode === 'kiosk' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setViewMode('kiosk');
                      setIsFullKioskMode(true);
                      navigate('/events?kiosk=true');
                    }}
                    className="text-xs"
                  >
                    <Monitor className="mr-1 h-3 w-3" />
                    Kiosk
                  </Button>
                  <Button
                    variant={viewMode === 'calendar' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setViewMode('calendar');
                      setIsFullKioskMode(false);
                      navigate('/events');
                    }}
                    className="text-xs"
                  >
                    <Grid className="mr-1 h-3 w-3" />
                    Calendar
                  </Button>
                </div>
              </div>

              {/* View Mode Toggle - Desktop */}
              <div className="hidden lg:flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'admin' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setViewMode('admin');
                      setIsFullKioskMode(false);
                      navigate('/events');
                    }}
                  >
                    <List className="mr-2 h-4 w-4" />
                    Admin View
                  </Button>
                  <Button
                    variant={viewMode === 'kiosk' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setViewMode('kiosk');
                      setIsFullKioskMode(true);
                      navigate('/events?kiosk=true');
                    }}
                  >
                    <Monitor className="mr-2 h-4 w-4" />
                    Kiosk View
                  </Button>
                  <Button
                    variant={viewMode === 'calendar' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setViewMode('calendar');
                      setIsFullKioskMode(false);
                      navigate('/events');
                    }}
                  >
                    <Grid className="mr-2 h-4 w-4" />
                    Calendar View
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchEvents}
                  disabled={isLoading}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {/* Enhanced Filters and Sorting */}
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search events by title, location, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-12 pl-10 pr-4"
                  />
                </div>

                {/* Filter Grid - Mobile */}
                <div className="lg:hidden space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                      <SelectTrigger className="h-10 text-sm">
                        <SelectValue placeholder="Event Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {eventTypeOptions.map(type => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={timeWindowFilter} onValueChange={setTimeWindowFilter}>
                      <SelectTrigger className="h-10 text-sm">
                        <SelectValue placeholder="Time Window" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="quarter">This Quarter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Select value={attendanceFilter} onValueChange={setAttendanceFilter}>
                      <SelectTrigger className="h-10 text-sm">
                        <SelectValue placeholder="Attendance" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Events</SelectItem>
                        <SelectItem value="high">High Attendance</SelectItem>
                        <SelectItem value="low">Low Attendance</SelectItem>
                        <SelectItem value="none">No Attendance</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="h-10 text-sm">
                        <SelectValue placeholder="Sort By" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="title">Title</SelectItem>
                        <SelectItem value="attendance">Attendance</SelectItem>
                        <SelectItem value="type">Type</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Filter Grid - Desktop */}
                <div className="hidden lg:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
                  <div className="lg:col-span-2">
                    <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Event Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {eventTypeOptions.map(type => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Select value={timeWindowFilter} onValueChange={setTimeWindowFilter}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Time Window" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="quarter">This Quarter</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                  
            <Select value={attendanceFilter} onValueChange={setAttendanceFilter}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Attendance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="attending">With Attendance</SelectItem>
                <SelectItem value="not_attending">No Attendance</SelectItem>
                      <SelectItem value="high_attendance">High Attendance (10+)</SelectItem>
                      <SelectItem value="low_attendance">Low Attendance (&lt;5)</SelectItem>
              </SelectContent>
            </Select>
                  
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                      <SelectItem value="attendance">Attendance</SelectItem>
                      <SelectItem value="location">Location</SelectItem>
                      <SelectItem value="created">Recently Created</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="h-12 w-full"
                  >
                    {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
                  </Button>
          </div>

                {/* Quick Filter Chips */}
                <div className="space-y-3">
                  {/* Event Type Quick Filters */}
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Type:</span>
                    <Button
                      variant={eventTypeFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setEventTypeFilter('all')}
                    >
                      All
                    </Button>
                    {eventTypeOptions.slice(0, 6).map(type => (
                      <Button
                        key={type}
                        variant={eventTypeFilter === type ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setEventTypeFilter(type)}
                      >
                        {type.length > 12 ? type.substring(0, 12) + '...' : type}
                      </Button>
                    ))}
                    {eventTypeOptions.length > 6 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEventTypeFilter('all')}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        +{eventTypeOptions.length - 6} more
                      </Button>
                    )}
                  </div>
                  
                  {/* Time Window Quick Filters */}
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Time:</span>
                    <Button
                      variant={timeWindowFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTimeWindowFilter('all')}
                    >
                      All Time
                    </Button>
                    <Button
                      variant={timeWindowFilter === 'today' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTimeWindowFilter('today')}
                    >
                      Today
                    </Button>
                    <Button
                      variant={timeWindowFilter === 'week' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTimeWindowFilter('week')}
                    >
                      This Week
                    </Button>
                    <Button
                      variant={timeWindowFilter === 'month' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTimeWindowFilter('month')}
                    >
                      This Month
                    </Button>
                    <Button
                      variant={timeWindowFilter === 'quarter' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTimeWindowFilter('quarter')}
                    >
                      This Quarter
                    </Button>
                    <Button
                      variant={timeWindowFilter === 'year' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTimeWindowFilter('year')}
                    >
                      This Year
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Quick Actions Bar */}
            {filteredEvents.length > 0 && (
              <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900/20 border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
                      </span>
                    </div>
                    {bulkSelectedEvents.length > 0 && (
                      <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {bulkSelectedEvents.length} selected
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    {bulkSelectedEvents.length > 0 && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setIsBulkActionsOpen(true)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Bulk Actions
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setBulkSelectedEvents([])}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Clear
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowQuickActions(!showQuickActions)}
                      className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20"
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      Quick Actions
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const csvContent = filteredEvents.map(event => ({
                          Title: event.title,
                          Date: format(new Date(event.start_date), 'MMM d, yyyy'),
                          Time: format(new Date(event.start_date), 'h:mm a'),
                          Location: event.location || 'N/A',
                          Type: event.event_type || 'N/A',
                          Attendance: event.attendance || 0
                        }));
                        const csv = Papa.unparse(csvContent);
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `events-${format(new Date(), 'yyyy-MM-dd')}.csv`;
                        a.click();
                        window.URL.revokeObjectURL(url);
                      }}
                      className="border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions Panel */}
            {showQuickActions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
              >
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quick Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsCreateEventOpen(true);
                      setShowQuickActions(false);
                    }}
                    className="h-12"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Event
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Quick duplicate last event
                      const lastEvent = filteredEvents[0];
                      if (lastEvent) {
                        // If this is a generated recurring event instance, use the master event for duplication
                        let eventToDuplicate = lastEvent;
                        
                        if (lastEvent.is_instance && lastEvent.id.includes('_')) {
                          // Extract the original event ID from the generated instance ID
                          const originalEventId = lastEvent.id.split('_')[0];
                          
                          // Check if this is an old event with a malformed ID
                          const isOldMalformedId = lastEvent.id && lastEvent.id.includes('-') && lastEvent.id.length > 36 && !lastEvent.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
                          
                          // Only try to find original event if it's not an old malformed ID
                          if (!isOldMalformedId) {
                            // Find the original event in our events list
                            const originalEvent = events.find(e => e.id === originalEventId);
                            
                            if (originalEvent) {
                              eventToDuplicate = originalEvent;
                            } else {
                              // For old events, just use the event as-is instead of showing an error
                              console.log('Could not find original event to duplicate, using event as-is:', lastEvent.id);
                              eventToDuplicate = lastEvent;
                            }
                          } else {
                            // For old malformed IDs, use the event as-is
                            eventToDuplicate = lastEvent;
                          }
                        }
                        
                        setEditingEvent({
                          ...eventToDuplicate,
                          title: `${eventToDuplicate.title} (Copy)`,
                          start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Next week
                          end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), // 2 hours later
                        });
                        setIsEditEventOpen(true);
                        setShowQuickActions(false);
                      }
                    }}
                    className="h-12"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate Last Event
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Quick template creation
                      toast({
                        title: "Feature Coming Soon",
                        description: "Event templates will be available soon!",
                      });
                      setShowQuickActions(false);
                    }}
                    className="h-12"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Create Template
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Enhanced Events Display */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="p-6">
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredEvents.length > 0 ? (
                            viewMode === 'calendar' ? (
                (() => {
                  try {
                    if (isCalendarLoading) {
                      return (
                        <div className="text-center py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                          <p className="text-gray-500">Loading calendar events...</p>
                          <p className="text-sm text-gray-400 mt-2">This may take a moment for large datasets</p>
                        </div>
                      );
                    }
                    
                    if (calendarEvents.length > 0) {
                      try {
                        return (
                          <CalendarView
                            events={calendarEvents}
                            onEventClick={(event) => {
                              setSelectedEventForDetails(event);
                              setIsEventDetailsOpen(true);
                            }}
                            currentMonth={currentMonth}
                            onMonthChange={setCurrentMonth}
                          />
                        );
                      } catch (calendarError) {
                        console.error('[Calendar] Error rendering CalendarView:', calendarError);
                        return (
                          <div className="text-center py-12">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <XCircle className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Calendar Error</h3>
                            <p className="text-gray-500 mb-4">
                              There was an error rendering the calendar view.
                            </p>
                            <Button 
                              variant="outline" 
                              onClick={() => setViewMode('admin')}
                            >
                              Switch to Admin View
                            </Button>
                          </div>
                        );
                      }
                    }
                    
                                         return (
                       <div className="text-center py-12">
                         <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                         <h3 className="text-lg font-medium text-gray-900 mb-2">No events this month</h3>
                         <p className="text-gray-500 mb-4">
                           No events scheduled for {format(currentMonth, 'MMMM yyyy')}.
                         </p>
                         <div className="flex gap-2 justify-center">
                           <Button onClick={() => setIsCreateEventOpen(true)}>
                             <Plus className="mr-2 h-4 w-4" />
                             Create Event
                           </Button>
                           <Button 
                             variant="outline" 
                             onClick={async () => {
                               setCalendarEvents([]);
                               setIsCalendarLoading(true);
                               
                               try {
                                 // First try to refresh the session
                                 console.log('[Calendar] Manual retry - refreshing session...');
                                 const { data, error: refreshError } = await supabase.auth.refreshSession();
                                 
                                 if (refreshError) {
                                   console.error('[Calendar] Session refresh failed:', refreshError);
                                   toast({
                                     title: 'Authentication Error',
                                     description: 'Please log in again to continue.',
                                     variant: 'destructive'
                                   });
                                   setIsCalendarLoading(false);
                                   return;
                                 }
                                 
                                 console.log('[Calendar] Session refreshed, fetching events...');
                                 const monthEvents = await fetchMonthEvents(currentMonth);
                                 setCalendarEvents(monthEvents);
                               } catch (error) {
                                 console.error('[Calendar] Manual retry failed:', error);
                                 toast({
                                   title: 'Error',
                                   description: error.message || 'Failed to load events',
                                   variant: 'destructive'
                                 });
                               } finally {
                                 setIsCalendarLoading(false);
                               }
                             }}
                           >
                             <RefreshCw className="mr-2 h-4 w-4" />
                             Retry
                           </Button>
                         </div>
                       </div>
                     );
                   } catch (error) {
                     console.error('[Calendar] Error rendering calendar view:', error);
                     return (
                       <div className="text-center py-12">
                         <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                           <XCircle className="h-6 w-6 text-red-600" />
                         </div>
                         <h3 className="text-lg font-medium text-gray-900 mb-2">Calendar Error</h3>
                         <p className="text-gray-500 mb-4">
                           There was an error loading the calendar view.
                         </p>
                         <div className="flex gap-2 justify-center">
                           <Button 
                             variant="outline" 
                             onClick={() => setViewMode('admin')}
                           >
                             Switch to Admin View
                           </Button>
                           <Button 
                             onClick={() => {
                               setViewMode('admin');
                               setTimeout(() => setViewMode('calendar'), 100);
                             }}
                           >
                             <RefreshCw className="mr-2 h-4 w-4" />
                             Retry Calendar
                           </Button>
                         </div>
                       </div>
                     );
                   }
                 })()
              ) : (
            <div className="space-y-4">
        {filteredEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
                      viewMode={viewMode}
            onRSVP={handleOpenDialog}
            onPotluckRSVP={handlePotluckRSVP}
            onEdit={handleEditClick}
            onDelete={handleDeleteEvent}
            onManageVolunteers={handleManageVolunteers}
                      onViewDetails={(event) => {
                        setSelectedEventForDetails(event);
                        setIsEventDetailsOpen(true);
                      }}
                      onBulkSelect={(eventId, checked) => {
                        if (checked) {
                          setBulkSelectedEvents(prev => [...prev, eventId]);
                        } else {
                          setBulkSelectedEvents(prev => prev.filter(id => id !== eventId));
                        }
                      }}
                      isBulkSelected={bulkSelectedEvents.includes(event.id)}
          />
        ))}
      </div>
              )
          ) : (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming events</h3>
              <p className="text-gray-500 mb-4">
                                  {searchQuery || attendanceFilter !== 'all' || eventTypeFilter !== 'all' || timeWindowFilter !== 'month'
                  ? 'No events match your current filters.' 
                  : 'Get started by creating your first event.'}
              </p>
                {!searchQuery && attendanceFilter === 'all' && eventTypeFilter === 'all' && timeWindowFilter === 'month' && (
                <Button onClick={() => setIsCreateEventOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                  Create Event
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        {/* Past Events Tab */}
        <TabsContent value="past" className="space-y-4">
          {/* Search for Past Events */}
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search past events..."
                value={pastSearchQuery}
                onChange={(e) => setPastSearchQuery(e.target.value)}
                className="w-full h-14 text-lg"
              />
            </div>
            <Button
              onClick={fetchPastEvents}
              variant="outline"
              className="w-full md:w-auto h-14 text-lg"
              disabled={isLoadingPast}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingPast ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Past Events List */}
          {isLoadingPast ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="p-6">
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredPastEvents.length > 0 ? (
            <div className="space-y-4">
              {filteredPastEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  viewMode={viewMode}
                  onRSVP={handleOpenDialog}
                  onPotluckRSVP={handlePotluckRSVP}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteEvent}
                  onManageVolunteers={handleManageVolunteers}
                  isPastEvent={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No past events</h3>
              <p className="text-gray-500 mb-4">
                {pastSearchQuery 
                  ? 'No past events match your search.' 
                  : 'No events from the last week found.'}
              </p>
            </div>
          )}
        </TabsContent>

        {/* Locations Tab */}
        <TabsContent value="locations" className="space-y-4">
          <LocationManager />
        </TabsContent>
      </Tabs>

      {/* Create/Edit Event Dialog */}
      <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
        <DialogContent className="w-full max-w-full h-full md:h-auto md:max-w-3xl p-0">
          <DialogHeader className="p-3 md:p-6 border-b">
            <DialogTitle className="text-2xl md:text-3xl">
              {editingEvent ? 'Edit Event' : 'Create New Event'}
            </DialogTitle>
          </DialogHeader>

          <div className="p-3 md:p-6">
            <EventForm
              initialData={{
                title: '',
                description: '',
                startDate: '',
                endDate: '',
                location: '',
                url: '',
                is_recurring: false,
                recurrence_pattern: '',
                allow_rsvp: true,
                attendance_type: 'rsvp',
                event_type: 'Worship Service'
              }}
              onSave={handleCreateEvent}
              onCancel={() => setIsCreateEventOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Member Selection Dialog for Regular Mode */}
      <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
        <DialogContent className="w-[95vw] max-w-full h-[90vh] md:h-auto md:max-w-3xl p-0 z-50">
          <DialogHeader className="p-3 md:p-6 border-b">
            <div className="space-y-2">
              <DialogTitle className="text-lg md:text-2xl lg:text-3xl">
                {isEditingPastEvent 
                  ? 'Edit Attendance' 
                  : selectedEvent?.attendance_type === 'check-in' 
                    ? 'Check In People' 
                    : 'RSVP Members'
                } - {selectedEvent?.title}
              </DialogTitle>
              {suggestedMembers.length > 0 && (
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                  <span className="text-sm md:text-lg text-green-600 font-normal">
                    Smart suggestions available
                  </span>
                </div>
              )}
            </div>
            <DialogDescription className="text-sm md:text-lg mt-2">
              {isEditingPastEvent
                ? `Edit attendance records for ${selectedEvent?.title}`
                : selectedEvent?.attendance_type === 'check-in'
                ? 'Check In People for the event'
                  : `Select members to RSVP for ${selectedEvent?.title}`
              }
            </DialogDescription>
            {suggestedMembers.length > 0 && (
              <div className="mt-2 text-xs md:text-sm text-green-600">
                Members who frequently attend similar events are highlighted below
              </div>
            )}
          </DialogHeader>

          <div className="p-3 md:p-6 flex-1 overflow-hidden">
            <Tabs defaultValue="available" className="w-full h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2 h-10 md:h-14">
                <TabsTrigger value="available" className="text-sm md:text-lg">
                  {isEditingPastEvent ? 'Add Attendance' : 'Available People'}
                </TabsTrigger>
                <TabsTrigger value="checked-in" className="text-sm md:text-lg">
                  {selectedEvent?.attendance_type === 'check-in' ? 'Checked In' : 'RSVP\'d'}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="available" className="mt-3 md:mt-8 flex-1 overflow-y-auto">
                <div className="space-y-3 md:space-y-6">
                  <div className="flex flex-col md:flex-row gap-2 md:gap-3">
                    <div className="flex-1">
                      <Input
                        placeholder="Search people..."
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                        className="w-full h-10 md:h-14 text-sm md:text-lg"
                      />
                    </div>
                    <Button
                      onClick={() => setIsCreateMemberOpen(true)}
                      className="w-full md:w-auto h-10 md:h-14 text-sm md:text-lg bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                      Add New Person
                    </Button>
                    {selectedEvent?.attendance_type === 'check-in' && (
                      <Button
                        onClick={() => setIsAnonymousCheckinOpen(true)}
                        className="w-full md:w-auto h-10 md:h-14 text-sm md:text-lg bg-orange-600 hover:bg-orange-700"
                      >
                        <UserPlus className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                        Anonymous Check-in
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {suggestedMembers.length > 0 && (
                      <div className="mb-3 md:mb-4">
                        <h3 className="text-sm md:text-lg font-semibold text-green-700 mb-2 flex items-center gap-2">
                          <Star className="h-4 w-4 md:h-5 md:w-5" />
                          Suggested Based on Previous Attendance
                        </h3>
                        <div className="space-y-2">
                          {suggestedMembers
                            .filter(member => 
                              member.firstname?.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                              member.lastname?.toLowerCase().includes(memberSearchQuery.toLowerCase())
                            )
                            .map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center space-x-3 md:space-x-4 p-2 md:p-3 lg:p-4 rounded-lg border-2 border-green-200 bg-green-50 cursor-pointer hover:bg-green-100 transition-colors"
                              onClick={() => handleMemberClick(member)}
                            >
                              <Avatar className="h-10 w-10 md:h-12 md:w-12 lg:h-16 lg:w-16">
                                <AvatarImage src={member.image_url} />
                                <AvatarFallback className="text-sm md:text-lg lg:text-xl">
                                  {getInitials(member.firstname, member.lastname)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm md:text-lg lg:text-xl font-medium truncate">
                                  {member.firstname} {member.lastname}
                                </p>
                                <div className="flex items-center gap-1 md:gap-2 mt-1">
                                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                    {memberAttendanceCount[member.id] || 0} previous attendances
                                  </Badge>
                                  <span className="text-xs md:text-sm text-green-600">Frequent attendee</span>
                                </div>
                              </div>
                              <Star className="h-4 w-4 md:h-5 md:w-5 text-green-600 flex-shrink-0" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                                            <div className="space-y-2">
                          {members
                        .filter(member => 
                          !suggestedMembers.find(s => s.id === member.id) &&
                          (member.firstname?.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                           member.lastname?.toLowerCase().includes(memberSearchQuery.toLowerCase()))
                        )
                        .map((member) => (
                                                    <div
                              key={member.id}
                              className="flex items-center space-x-3 md:space-x-4 p-3 md:p-4 lg:p-5 rounded-lg border-2 cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => handleMemberClick(member)}
                            >
                          <Avatar className="h-16 w-16 md:h-20 md:w-20 lg:h-24 lg:w-24">
                            <AvatarImage src={member.image_url} />
                            <AvatarFallback className="text-lg md:text-xl lg:text-2xl">
                              {getInitials(member.firstname, member.lastname)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-lg md:text-xl lg:text-2xl font-bold truncate">
                              {member.firstname} {member.lastname}
                            </p>
                            {memberAttendanceCount[member.id] && (
                              <div className="mt-1">
                                <Badge variant="outline" className="text-sm px-2 py-1">
                                  {memberAttendanceCount[member.id]} previous attendances
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="checked-in" className="mt-6 md:mt-8 flex-1 overflow-y-auto">
                <div className="space-y-2">
                  {alreadyRSVPMembers.filter(member => member && member.id).map((member) => (
                                            <div
                          key={member.id}
                          className="flex items-center justify-between p-3 md:p-4 lg:p-5 rounded-lg border-2"
                        >
                          <div className="flex items-center space-x-3 md:space-x-4 min-w-0 flex-1">
                        <Avatar className="h-16 w-16 md:h-20 md:w-20 lg:h-24 lg:w-24">
                          <AvatarImage src={member.image_url} />
                          <AvatarFallback className="text-lg md:text-xl lg:text-2xl">
                            {member.isAnonymous ? member.firstname.charAt(0) : getInitials(member.firstname, member.lastname)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-lg md:text-xl lg:text-2xl font-bold truncate">
                            {member.firstname} {member.lastname}
                          </p>
                          {member.isAnonymous && (
                            <Badge variant="outline" className="text-sm px-3 py-1 text-orange-600 border-orange-600">
                              Anonymous Attendee
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="lg"
                        onClick={() => handleRemoveMember(member.id)}
                        className="h-12 w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 p-0 flex-shrink-0"
                      >
                        <X className="h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8" />
                      </Button>
                    </div>
                  ))}
                  {alreadyRSVPMembers.length === 0 && (
                    <p className="text-xl md:text-2xl text-gray-500 italic p-8">
                      {selectedEvent?.attendance_type === 'check-in'
                        ? 'No members have checked in yet'
                        : "No members have RSVP'd yet"}
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="p-6 md:p-8 border-t">
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full">
              <Button
                onClick={() => setIsCreateMemberOpen(true)}
                className="w-full md:w-auto text-lg md:text-xl h-16 md:h-20 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="mr-2 md:mr-3 h-5 w-5 md:h-6 md:w-6" />
                Create New Person
              </Button>
              <Button
                variant={selectedEvent?.attendance_type === 'check-in' ? 'default' : 'outline'}
                onClick={handleCloseDialog}
                className={`w-full md:w-auto text-lg md:text-xl h-16 md:h-20 ${
                  selectedEvent?.attendance_type === 'check-in' ? 'bg-green-600 hover:bg-green-700' : ''
                }`}
              >
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create New Member Dialog */}
      <Dialog open={isCreateMemberOpen} onOpenChange={setIsCreateMemberOpen}>
        <DialogContent className="w-[95vw] max-w-full h-[90vh] md:h-auto md:max-w-3xl p-0">
          <DialogHeader className="p-3 md:p-6 border-b">
            <DialogTitle className="text-lg md:text-2xl lg:text-3xl">Create New Person</DialogTitle>
            <DialogDescription className="text-sm md:text-lg mt-2">
              Add a new person and automatically {selectedEvent?.attendance_type === 'check-in' ? 'check them in' : 'RSVP them'} to this event.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 md:p-6 flex-1 overflow-y-auto">
            <form onSubmit={handleCreateMember} className="space-y-3 md:space-y-4 lg:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 lg:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstname" className="text-sm md:text-lg">First Name</Label>
                  <Input
                    id="firstname"
                    name="firstname"
                    value={newMember.firstname}
                    onChange={(e) => setNewMember({...newMember, firstname: e.target.value})}
                    className="h-10 md:h-14 text-sm md:text-lg"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastname" className="text-sm md:text-lg">Last Name</Label>
                  <Input
                    id="lastname"
                    name="lastname"
                    value={newMember.lastname}
                    onChange={(e) => setNewMember({...newMember, lastname: e.target.value})}
                    className="h-10 md:h-14 text-sm md:text-lg"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm md:text-lg">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                  className="h-10 md:h-14 text-sm md:text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm md:text-lg">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={newMember.phone}
                  onChange={(e) => setNewMember({...newMember, phone: e.target.value})}
                  className="h-10 md:h-14 text-sm md:text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm md:text-lg">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={newMember.notes}
                  onChange={(e) => setNewMember({...newMember, notes: e.target.value})}
                  className="h-24 md:h-32 text-sm md:text-lg"
                />
              </div>
            </form>
          </div>

          <DialogFooter className="p-3 md:p-6 border-t">
            <Button
              type="submit"
              onClick={handleCreateMember}
              className="w-full md:w-auto text-sm md:text-lg h-10 md:h-14"
            >
              Create and {selectedEvent?.attendance_type === 'check-in' ? 'Check In' : 'RSVP'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={isEditEventOpen} onOpenChange={setIsEditEventOpen}>
        <DialogContent className="w-full max-w-full h-full md:h-auto md:max-w-3xl p-0">
          <DialogHeader className="p-3 md:p-6 border-b">
            <DialogTitle className="text-2xl md:text-3xl">
              Edit {editingEvent?.is_recurring ? 'Recurring Event Series' : 'Event'}
            </DialogTitle>
            <DialogDescription className="text-lg mt-2">
              {editingEvent?.is_recurring 
                ? `Update event details. Changes will apply to "${editingEvent.title}" and all future instances.`
                : 'Update event details.'
              }
            </DialogDescription>
          </DialogHeader>
          {editingEvent && (
            <>
              <div className="p-3 md:p-6">
                {/* EventForm for editing - uses editingEvent data */}
                <EventForm
                  initialData={{
                    ...editingEvent,
                    startDate: editingEvent.start_date,
                    endDate: editingEvent.end_date,
                    allow_rsvp: editingEvent.allow_rsvp !== undefined ? editingEvent.allow_rsvp : true,
                    event_type: editingEvent.event_type || 'Worship Service'
                  }}
                  onSave={handleEditEvent}
                  onCancel={() => {
                    setIsEditEventOpen(false);
                    setEditingEvent(null);
                  }}
                />
              </div>
              <div className="p-3 md:p-6 border-t">
                <Button
                  variant="destructive"
                  onClick={() => {
                    const eventType = editingEvent.is_recurring ? 'recurring event series' : 'event';
                    const message = editingEvent.is_recurring 
                      ? `Are you sure you want to delete "${editingEvent.title}" and all its recurring instances? This cannot be undone.`
                      : `Are you sure you want to delete "${editingEvent.title}"? This cannot be undone.`;
                    
                    if (confirm(message)) {
                      const deleteId = editingEvent.master_id || editingEvent.id;
                      handleDeleteEvent(deleteId);
                      setIsEditEventOpen(false);
                      setEditingEvent(null);
                    }
                  }}
                  className="w-full md:w-auto text-lg h-14"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete {editingEvent?.is_recurring ? 'Series' : 'Event'}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <PotluckRSVPDialog
        isOpen={isPotluckRSVPDialogOpen}
        onClose={() => {
          setIsPotluckRSVPDialogOpen(false);
          setSelectedPotluckEvent(null);
          setPotluckRSVPs([]);
        }}
        event={selectedPotluckEvent}
        onRSVP={handlePotluckRSVPUpdate}
      />

      {/* Volunteer Management Dialog */}
      <Dialog open={isVolunteerDialogOpen} onOpenChange={setIsVolunteerDialogOpen}>
        <DialogContent className="w-full max-w-full h-full md:h-auto md:max-w-4xl p-0">
          <DialogHeader className="p-3 md:p-6 border-b">
            <DialogTitle className="text-2xl md:text-3xl">
              Manage Volunteers - {volunteerDialogEvent?.title}
            </DialogTitle>
            <DialogDescription className="text-lg mt-2">
              Assign and manage volunteers for this event. {volunteerDialogEvent?.volunteer_roles && 
                `Available roles: ${parseVolunteerRoles(volunteerDialogEvent.volunteer_roles).map(r => r.role || r).join(', ')}`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 md:p-6 flex-1 overflow-hidden">
            <Tabs defaultValue="current" className="h-full">
              <TabsList className="grid w-full grid-cols-2 h-14">
                <TabsTrigger value="current" className="text-lg">Current Volunteers</TabsTrigger>
                <TabsTrigger value="add" className="text-lg">Add Volunteer</TabsTrigger>
              </TabsList>

              <TabsContent value="current" className="mt-4 h-full overflow-y-auto">
                <VolunteerList 
                  eventId={volunteerDialogEvent?.id}
                  availableRoles={parseVolunteerRoles(volunteerDialogEvent?.volunteer_roles)}
                  onVolunteerUpdated={() => {
                    // Refresh volunteer list
                  }}
                  onVolunteerRemoved={() => {
                    // Refresh volunteer list
                  }}
                />
              </TabsContent>

              <TabsContent value="add" className="mt-4 h-full overflow-y-auto">
                <AddVolunteerForm 
                  eventId={volunteerDialogEvent?.id}
                  availableRoles={parseVolunteerRoles(volunteerDialogEvent?.volunteer_roles)}
                  onVolunteerAdded={() => {
                    // Refresh volunteer list
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="p-3 md:p-6 border-t">
            <Button 
              onClick={() => setIsVolunteerDialogOpen(false)}
              className="w-full md:w-auto text-lg h-14"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Anonymous Check-in Dialog */}
      <Dialog open={isAnonymousCheckinOpen} onOpenChange={setIsAnonymousCheckinOpen}>
        <DialogContent className="w-[95vw] max-w-full h-[90vh] md:h-auto md:max-w-2xl p-0">
          <DialogHeader className="p-3 md:p-6 border-b">
            <DialogTitle className="text-lg md:text-2xl lg:text-3xl">Anonymous Check-in</DialogTitle>
            <DialogDescription className="text-sm md:text-lg mt-2">
              Check in an anonymous attendee to {selectedEvent?.title}. This will update the event attendance count but won't create a member record.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 md:p-6 flex-1 flex items-center justify-center">
            <div className="text-center space-y-3 md:space-y-4">
              <div className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 mx-auto bg-orange-100 rounded-full">
                <UserPlus className="h-6 w-6 md:h-8 md:w-8 text-orange-600" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-medium text-gray-900 mb-1 md:mb-2">
                  Add Anonymous Attendee
                </h3>
                <p className="text-sm md:text-base text-gray-600">
                  This will add one anonymous attendee to the event attendance count.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="p-3 md:p-6 border-t">
            <div className="flex flex-col md:flex-row gap-2 md:gap-3 w-full">
              <Button
                variant="outline"
                onClick={() => setIsAnonymousCheckinOpen(false)}
                className="w-full md:w-auto text-sm md:text-lg h-10 md:h-14"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAnonymousCheckin}
                className="w-full md:w-auto text-sm md:text-lg h-10 md:h-14 bg-orange-600 hover:bg-orange-700"
              >
                <UserPlus className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                Add Anonymous Attendee
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Actions Dialog */}
      <Dialog open={isBulkActionsOpen} onOpenChange={setIsBulkActionsOpen}>
        <DialogContent className="w-full max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Actions</DialogTitle>
            <DialogDescription>
              Perform actions on {bulkSelectedEvents.length} selected event{bulkSelectedEvents.length !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                // Bulk delete functionality
                if (confirm(`Are you sure you want to delete ${bulkSelectedEvents.length} event${bulkSelectedEvents.length !== 1 ? 's' : ''}?`)) {
                  bulkSelectedEvents.forEach(eventId => handleDeleteEvent(eventId));
                  setBulkSelectedEvents([]);
                  setIsBulkActionsOpen(false);
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected Events
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                // Bulk duplicate functionality
                toast({
                  title: "Feature Coming Soon",
                  description: "Bulk duplicate functionality will be available soon!",
                });
                setIsBulkActionsOpen(false);
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Duplicate Selected Events
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                // Bulk export functionality
                toast({
                  title: "Feature Coming Soon",
                  description: "Bulk export functionality will be available soon!",
                });
                setIsBulkActionsOpen(false);
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Selected Events
            </Button>
    </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBulkActionsOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Details Dialog */}
      <Dialog open={isEventDetailsOpen} onOpenChange={setIsEventDetailsOpen}>
        <DialogContent className="w-full max-w-full h-full md:h-auto md:max-w-4xl p-0">
          <DialogHeader className="p-3 md:p-6 border-b">
            <DialogTitle className="text-2xl md:text-3xl">
              Event Details - {selectedEventForDetails?.title}
            </DialogTitle>
            <DialogDescription className="text-lg mt-2">
              View detailed information about this event
            </DialogDescription>
          </DialogHeader>
          {selectedEventForDetails && (
            <div className="p-3 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Event Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Title</label>
                      <p className="text-base">{selectedEventForDetails.title}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Description</label>
                      <p className="text-base">{selectedEventForDetails.description || 'No description'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Location</label>
                      <p className="text-base">{selectedEventForDetails.location || 'No location specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Date & Time</label>
                      <p className="text-base">
                        {format(new Date(selectedEventForDetails.start_date), 'EEEE, MMMM d, yyyy')}
                        <br />
                        {format(new Date(selectedEventForDetails.start_date), 'h:mm a')} - {format(new Date(selectedEventForDetails.end_date), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3">Attendance & Settings</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Attendance Type</label>
                      <p className="text-base capitalize">{selectedEventForDetails.attendance_type}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Current Attendance</label>
                      <p className="text-base">{selectedEventForDetails.attendance || 0} people</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">RSVP Allowed</label>
                      <p className="text-base">{selectedEventForDetails.allow_rsvp ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Needs Volunteers</label>
                      <p className="text-base">{selectedEventForDetails.needs_volunteers ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="p-3 md:p-6 border-t">
            <Button
              variant="outline"
              onClick={() => setIsEventDetailsOpen(false)}
              className="w-full md:w-auto"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </motion.div>
      )}
    </PermissionGuard>
  );
}