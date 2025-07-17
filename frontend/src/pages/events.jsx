import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format, parse, isAfter, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
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
  TrendingUp,
  AlertCircle,
  Info,
  Zap,
  Target,
  Award,
  Gift,
  Heart,
  Crown,
  Shield,
  Music,
  BookOpen,
  Camera,
  Building,
  Home,
  Car,
  GraduationCap,
  Briefcase,
  Activity,
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
  Wifi,
  Video,
  Mic,
  Lightbulb,
  Coffee,
  UtensilsCrossed,
  Baby,
  UserCheck,
  UserX,
  UserMinus,
  UserPlus2,
  MoreHorizontal,
  Church,
  Droplets,
  Wine,
  Cross,
  Copy,
  FileText
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
  'Sunday Worship Service': Church,
  'Bible Study': BookOpen,
  'Prayer Meeting': Heart,
  'Youth Group': Users,
  'Children\'s Ministry': Baby,
  'Potluck': UtensilsCrossed,
  'Fellowship': Coffee,
  'Meeting': Building,
  'Conference': GraduationCap,
  'Workshop': Lightbulb,
  'Concert': Music,
  'Mission Trip': Globe,
  'Community Service': Shield,
  'Wedding': Heart,
  'Funeral': Shield,
  'Baptism': Droplets,
  'Communion': Wine,
  'Easter Service': Cross,
  'Christmas Service': Gift,
  'Thanksgiving': Calendar,
  'New Year': Calendar,
  'Other': Calendar
};

// Event type colors
const eventTypeColors = {
  'Sunday Worship Service': 'blue',
  'Bible Study': 'purple',
  'Prayer Meeting': 'pink',
  'Youth Group': 'green',
  'Children\'s Ministry': 'yellow',
  'Potluck': 'orange',
  'Fellowship': 'teal',
  'Meeting': 'gray',
  'Conference': 'indigo',
  'Workshop': 'emerald',
  'Concert': 'rose',
  'Mission Trip': 'cyan',
  'Community Service': 'amber',
  'Wedding': 'pink',
  'Funeral': 'slate',
  'Baptism': 'blue',
  'Communion': 'red',
  'Easter Service': 'green',
  'Christmas Service': 'red',
  'Thanksgiving': 'orange',
  'New Year': 'purple',
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
const EventCard = ({ event, onRSVP, onPotluckRSVP, onEdit, onDelete, onManageVolunteers, onViewDetails, isPastEvent = false, viewMode = 'list', onBulkSelect, isBulkSelected = false }) => {
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

  return (
    <motion.div variants={itemVariants}>
      <Card className="group hover:shadow-lg transition-all duration-200 border-l-4" style={{ borderLeftColor: `var(--${eventColor}-500)` }}>
        <CardHeader className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 md:gap-0">
            <div className="flex-1">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-${eventColor}-100 text-${eventColor}-600`}>
                  <EventIcon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg md:text-xl font-bold flex flex-wrap items-center gap-2 mb-2">
                    {event.title}
                    {isRecurring && (
                      <Badge variant="secondary" className="text-xs">
                        {formatRecurrencePattern(event.recurrence_pattern, event.monthly_week, event.monthly_weekday)}
                      </Badge>
                    )}
                    {isPotluck && (
                      <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                        <Utensils className="w-3 h-3 mr-1" />
                        Potluck
                      </Badge>
                    )}
                    {event.needs_volunteers && (
                      <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-600">
                        <Handshake className="w-3 h-3 mr-1" />
                        Volunteers Needed
                      </Badge>
                    )}
                    {isPastEvent && (
                      <Badge variant="outline" className="text-xs text-gray-600 border-gray-600">
                        Past Event
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="text-sm md:text-base text-muted-foreground">
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(startDate, 'EEEE, MMMM d, yyyy')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {event.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
        
        <CardContent className="p-4 md:p-6 pt-0">
          {event.description && (
            <div className="text-sm text-gray-600 mb-4 line-clamp-2">{event.description}</div>
          )}
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {event.allow_rsvp ? (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{event.attendance || 0} {event.attendance === 1 ? 'person' : 'people'} {isCheckIn ? 'checked in' : 'attending'}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  <span>Announcement only</span>
                </div>
              )}
              
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
            </div>
            
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
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
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
  const analytics = useMemo(() => {
    const totalEvents = events.length + pastEvents.length;
    const upcomingEvents = events.length;
    const pastEventsCount = pastEvents.length;
    
    const eventTypes = {};
    const attendanceStats = {
      total: 0,
      average: 0,
      max: 0
    };
    
    [...events, ...pastEvents].forEach(event => {
      // Count event types
      const type = event.event_type || 'Other';
      eventTypes[type] = (eventTypes[type] || 0) + 1;
      
      // Calculate attendance stats
      const attendance = event.attendance || 0;
      attendanceStats.total += attendance;
      attendanceStats.max = Math.max(attendanceStats.max, attendance);
    });
    
    attendanceStats.average = totalEvents > 0 ? Math.round(attendanceStats.total / totalEvents) : 0;
    
    return {
      totalEvents,
      upcomingEvents,
      pastEventsCount,
      eventTypes,
      attendanceStats
    };
  }, [events, pastEvents]);

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Events</p>
                <p className="text-2xl font-bold">{analytics.totalEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold">{analytics.upcomingEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Attendance</p>
                <p className="text-2xl font-bold">{analytics.attendanceStats.average}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Target className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Max Attendance</p>
                <p className="text-2xl font-bold">{analytics.attendanceStats.max}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Type Breakdown */}
      {Object.keys(analytics.eventTypes).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Event Type Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(analytics.eventTypes)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 6)
                .map(([type, count]) => {
                  const EventIcon = eventTypeIcons[type] || Calendar;
                  const eventColor = eventTypeColors[type] || 'gray';
                  const percentage = Math.round((count / analytics.totalEvents) * 100);
                  
                  return (
                    <div key={type} className="flex items-center gap-3 p-3 rounded-lg border">
                      <div className={`p-2 rounded-lg bg-${eventColor}-100 text-${eventColor}-600`}>
                        <EventIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{type}</p>
                        <p className="text-xs text-gray-500">{count} events ({percentage}%)</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default function Events() {
  const { toast } = useToast();
  const { user } = useAuth();

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
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
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

      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 30000)
      );
      
      const eventsPromise = supabase
        .from('events')
        .select('*, event_attendance(*)')
        .eq('organization_id', organizationId)
        .gte('start_date', today.toISOString())
        .order('start_date', { ascending: true });

      const { data, error } = await Promise.race([eventsPromise, timeoutPromise]);

      if (error) throw error;
      console.log('[Events] Upcoming events count:', data.length);

      // Process events to only show next instance of recurring events and add attendance count
      const processedEvents = data.reduce((acc, event) => {
        // Add attendance count to the event
        const eventWithAttendance = {
          ...event,
          attendance: event.event_attendance?.length || 0
        };

        // If it's not a recurring event, add it
        if (!event.recurrence_pattern) {
          acc.push(eventWithAttendance);
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
            acc.push(eventWithAttendance);
          }
        } else {
          acc.push(eventWithAttendance);
        }
        return acc;
      }, []);

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
  }, [toast]);

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
      
      // Get events from the last week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      oneWeekAgo.setHours(0, 0, 0, 0);

      // Get current user's organization ID (including impersonation)
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) throw new Error('Unable to determine organization');
      
      console.log('[Events] Using organization_id (past):', organizationId);

      const { data, error } = await supabase
        .from('events')
        .select('*, event_attendance(*)')
        .eq('organization_id', organizationId)
        .gte('start_date', oneWeekAgo.toISOString())
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
  }, [toast]);

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
        if (attendanceFilter === 'attending') {
          return event.attendance > 0;
        } else if (attendanceFilter === 'not_attending') {
          return !event.attendance || event.attendance === 0;
        }
        return true;
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
      attendance: event.event_attendance?.filter(a => a.status === 'attending').length || 0,
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
      const { data, error } = await supabase
        .from('event_attendance')
        .select(`
          member_id,
          status,
          events!inner (
            start_date
          )
        `)
        .eq('event_id', eventId)
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

  const handleRSVP = async (eventId) => {
    try {
      // Reset all state first
      setSelectedEvent({ id: eventId });
      setSelectedMembers([]);
      setMemberSearchQuery('');
      setIsMemberDialogOpen(true);
      
      // Fetch existing attendance records
      const { data: existingRecords, error: fetchError } = await supabase
        .from('event_attendance')
        .select('*')
        .eq('event_id', eventId);

      if (fetchError) {
        throw fetchError;
      }

      // Set selected members based on existing records
      if (existingRecords && existingRecords.length > 0) {
              const memberIds = existingRecords.map(record => record.member_id);
      setSelectedMembers(memberIds);
      }

      // Fetch last event attendance
      await fetchLastEventAttendance(eventId);
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
      // Add Person to event attendance
      const { data: attendanceData, error } = await supabase
        .from('event_attendance')
        .upsert({
          event_id: selectedEvent.id,
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
            event_id: selectedEvent.id,
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

      // For check-in events, refresh the available members list to ensure consistency
      if (selectedEvent?.attendance_type === 'check-in') {
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
            .eq('event_id', selectedEvent.id);

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
      // Add anonymous person to event attendance
      const { data: attendanceData, error } = await supabase
        .from('event_attendance')
        .upsert({
          event_id: selectedEvent.id,
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
            event_id: selectedEvent.id,
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
        const { error } = await supabase
          .from('event_attendance')
          .delete()
          .eq('event_id', selectedEvent.id)
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
      const rsvpsToAdd = selectedMembers.map(memberId => ({
        event_id: selectedEvent.id,
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
                  event_id: selectedEvent.id,
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

  const getRSVPButton = (eventId) => {
    return (
      <Button 
        variant="default" 
        size="sm"
        className="bg-blue-600 hover:bg-blue-700"
        onClick={() => handleRSVP(eventId)}
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
        .eq('event_id', eventId)
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
        .eq('event_id', eventId);

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
    try {
      await updateEvent(editingEvent.id, eventData);
      setIsEditEventOpen(false);
      setEditingEvent(null);
      fetchEvents();
      toast({
        title: "Success",
        description: "Event updated successfully."
      });
    } catch (error) {
      console.error('Error updating event:', error);
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
        .eq('event_id', event.id);

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
      await deleteEvent(eventId);
      fetchEvents();
      toast({
        title: "Success",
        description: "Event deleted successfully."
      });
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
    setEditingEvent(event);
    setIsEditEventOpen(true);
  };

  const handleOpenDialog = async (event) => {
    setSelectedEvent(event);
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
        .eq('event_id', event.id);

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
    
    try {
      const { data: rsvps, error } = await supabase
        .from('potluck_rsvps')
        .select('*')
        .eq('event_id', event.id);
      
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
    setVolunteerDialogEvent(event);
    setIsVolunteerDialogOpen(true);
  };

  const renderEventCard = useCallback((event) => {
    return (
      <EventCard
        key={event.id}
        event={event}
        onRSVP={handleOpenDialog}
        onPotluckRSVP={handlePotluckRSVP}
        onEdit={handleEditClick}
        onDelete={handleDeleteEvent}
        onManageVolunteers={handleManageVolunteers}
      />
    );
  }, [handleOpenDialog, handlePotluckRSVP, handleEditClick, handleDeleteEvent, handleManageVolunteers]);

  const processRecurringEvents = (events) => {
    const processedEvents = [];
    const now = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3); // Show events for next 3 months

    events.forEach(event => {
      if (!event.is_recurring) {
        processedEvents.push(event);
        return;
      }

      const startDate = new Date(event.start_date);
      const endTime = new Date(event.end_date);
      const duration = endTime - startDate;

      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        if (currentDate >= now) {
          const eventInstance = {
            ...event,
            id: `${event.id}_${currentDate.toISOString()}`,
            start_date: new Date(currentDate),
            end_date: new Date(currentDate.getTime() + duration),
            is_instance: true
          };
          processedEvents.push(eventInstance);
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
            break;
          default:
            currentDate = endDate; // Stop processing for unknown patterns
        }
      }
    });

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
      <motion.div 
        className="w-full px-0 md:px-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Enhanced Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 px-2 md:px-0">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Events</h1>
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

        {/* Analytics Section */}
        {showAnalytics && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <EventAnalytics events={events} pastEvents={pastEvents} />
          </motion.div>
        )}

        {/* Enhanced Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full px-2 md:px-0">
          <TabsList className="grid w-full grid-cols-2 h-14 mb-6">
            <TabsTrigger value="upcoming" className="text-lg">Upcoming Events</TabsTrigger>
            <TabsTrigger value="past" className="text-lg">Past Events</TabsTrigger>
          </TabsList>

          {/* Upcoming Events Tab */}
          <TabsContent value="upcoming" className="space-y-6">
            {/* Enhanced Search and Filters */}
            <div className="space-y-4">
              {/* View Mode Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="mr-2 h-4 w-4" />
                    List View
                  </Button>
                  <Button
                    variant={viewMode === 'calendar' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('calendar')}
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
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                <div className="md:col-span-2">
                  <Input
                    placeholder="Search upcoming events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10"
                  />
                </div>
                <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Event Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Sunday Worship Service">Sunday Worship</SelectItem>
                    <SelectItem value="Bible Study">Bible Study</SelectItem>
                    <SelectItem value="Prayer Meeting">Prayer Meeting</SelectItem>
                    <SelectItem value="Youth Group">Youth Group</SelectItem>
                    <SelectItem value="Children's Ministry">Children's Ministry</SelectItem>
                    <SelectItem value="Potluck">Potluck</SelectItem>
                    <SelectItem value="Fellowship">Fellowship</SelectItem>
                    <SelectItem value="Meeting">Meeting</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={attendanceFilter} onValueChange={setAttendanceFilter}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Attendance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="attending">With Attendance</SelectItem>
                    <SelectItem value="not_attending">No Attendance</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="attendance">Attendance</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="h-10"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              </div>
            </div>

            {/* Quick Actions Bar */}
            {filteredEvents.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
                  </span>
                  {bulkSelectedEvents.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {bulkSelectedEvents.length} selected
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {bulkSelectedEvents.length > 0 && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsBulkActionsOpen(true)}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Bulk Actions
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setBulkSelectedEvents([])}
                      >
                        Clear Selection
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowQuickActions(!showQuickActions)}
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    Quick Actions
                  </Button>
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
                        setEditingEvent({
                          ...lastEvent,
                          title: `${lastEvent.title} (Copy)`,
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
                              onClick={() => setViewMode('list')}
                            >
                              Switch to List View
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
                             onClick={() => setViewMode('list')}
                           >
                             Switch to List View
                           </Button>
                           <Button 
                             onClick={() => {
                               setViewMode('list');
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
                  {searchQuery || attendanceFilter !== 'all' || eventTypeFilter !== 'all'
                    ? 'No events match your current filters.' 
                    : 'Get started by creating your first event.'}
                </p>
                {!searchQuery && attendanceFilter === 'all' && eventTypeFilter === 'all' && (
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
                event_type: 'Sunday Worship Service'
              }}
              onSave={handleCreateEvent}
              onCancel={() => setIsCreateEventOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Member Selection Dialog */}
      <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
        <DialogContent className="w-full max-w-full h-full md:h-auto md:max-w-3xl p-0">
          <DialogHeader className="p-3 md:p-6 border-b">
            <div className="space-y-2">
              <DialogTitle className="text-2xl md:text-3xl">
                {isEditingPastEvent 
                  ? 'Edit Attendance' 
                  : selectedEvent?.attendance_type === 'check-in' 
                    ? 'Check In People' 
                    : 'RSVP Members'
                } - {selectedEvent?.title}
              </DialogTitle>
              {suggestedMembers.length > 0 && (
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-green-600" />
                  <span className="text-lg text-green-600 font-normal">
                    Smart suggestions available
                  </span>
                </div>
              )}
            </div>
            <DialogDescription className="text-lg mt-2">
              {isEditingPastEvent
                ? `Edit attendance records for ${selectedEvent?.title}`
                : selectedEvent?.attendance_type === 'check-in'
                ? 'Check In People for the event'
                  : `Select members to RSVP for ${selectedEvent?.title}`
              }
            </DialogDescription>
            {suggestedMembers.length > 0 && (
              <div className="mt-2 text-sm text-green-600">
                Members who frequently attend similar events are highlighted below
              </div>
            )}
          </DialogHeader>

          <div className="p-3 md:p-6">
            <Tabs defaultValue="available" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-14">
                <TabsTrigger value="available" className="text-lg">
                  {isEditingPastEvent ? 'Add Attendance' : 'Available People'}
                </TabsTrigger>
                <TabsTrigger value="checked-in" className="text-lg">
                  {selectedEvent?.attendance_type === 'check-in' ? 'Checked In' : 'RSVP\'d'}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="available" className="mt-4 md:mt-8">
                <div className="space-y-4 md:space-y-6">
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1">
                      <Input
                        placeholder="Search people..."
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                        className="w-full h-14 text-lg"
                      />
                    </div>
                    <Button
                      onClick={() => setIsCreateMemberOpen(true)}
                      className="w-full md:w-auto h-14 text-lg bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Person
                    </Button>
                    {selectedEvent?.attendance_type === 'check-in' && (
                      <Button
                        onClick={() => setIsAnonymousCheckinOpen(true)}
                        className="w-full md:w-auto h-14 text-lg bg-orange-600 hover:bg-orange-700"
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Anonymous Check-in
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {suggestedMembers.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-green-700 mb-2 flex items-center gap-2">
                          <Star className="h-5 w-5" />
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
                              className="flex items-center space-x-4 p-3 md:p-4 rounded-lg border-2 border-green-200 bg-green-50 cursor-pointer hover:bg-green-100 transition-colors"
                              onClick={() => handleMemberClick(member)}
                            >
                              <Avatar className="h-12 w-12 md:h-16 md:w-16">
                                <AvatarImage src={member.image_url} />
                                <AvatarFallback className="text-lg md:text-xl">
                                  {getInitials(member.firstname, member.lastname)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="text-lg md:text-xl font-medium">
                                  {member.firstname} {member.lastname}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                                    {memberAttendanceCount[member.id] || 0} previous attendances
                                  </Badge>
                                  <span className="text-sm text-green-600">Frequent attendee</span>
                                </div>
                              </div>
                              <Star className="h-5 w-5 text-green-600" />
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
                          className="flex items-center space-x-4 p-3 md:p-4 rounded-lg border cursor-pointer hover:bg-gray-50"
                          onClick={() => handleMemberClick(member)}
                        >
                          <Avatar className="h-12 w-12 md:h-16 md:w-16">
                            <AvatarImage src={member.image_url} />
                            <AvatarFallback className="text-lg md:text-xl">
                              {getInitials(member.firstname, member.lastname)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-lg md:text-xl font-medium">
                              {member.firstname} {member.lastname}
                            </p>
                            {memberAttendanceCount[member.id] && (
                              <div className="mt-1">
                                <Badge variant="outline" className="text-xs">
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

              <TabsContent value="checked-in" className="mt-4 md:mt-8">
                <div className="space-y-2">
                  {alreadyRSVPMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 md:p-4 rounded-lg border"
                    >
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12 md:h-16 md:w-16">
                          <AvatarImage src={member.image_url} />
                          <AvatarFallback className="text-lg md:text-xl">
                            {member.isAnonymous ? member.firstname.charAt(0) : getInitials(member.firstname, member.lastname)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-lg md:text-xl font-medium">
                            {member.firstname} {member.lastname}
                          </p>
                          {member.isAnonymous && (
                            <Badge variant="outline" className="text-xs text-orange-600 border-orange-600">
                              Anonymous Attendee
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="lg"
                        onClick={() => handleRemoveMember(member.id)}
                        className="h-12 w-12 md:h-14 md:w-14 p-0"
                      >
                        <X className="h-6 w-6" />
                      </Button>
                    </div>
                  ))}
                  {alreadyRSVPMembers.length === 0 && (
                    <p className="text-base md:text-lg text-gray-500 italic p-4">
                      {selectedEvent?.attendance_type === 'check-in'
                        ? 'No members have checked in yet'
                        : "No members have RSVP'd yet"}
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="p-3 md:p-6 border-t">
            <div className="flex flex-col md:flex-row gap-3 w-full">
              <Button
                onClick={() => setIsCreateMemberOpen(true)}
                className="w-full md:w-auto text-lg h-14 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Person
              </Button>
              <Button
                variant={selectedEvent?.attendance_type === 'check-in' ? 'default' : 'outline'}
                onClick={handleCloseDialog}
                className={`w-full md:w-auto text-lg h-14 ${
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
        <DialogContent className="w-full max-w-full h-full md:h-auto md:max-w-3xl p-0">
          <DialogHeader className="p-3 md:p-6 border-b">
            <DialogTitle className="text-2xl md:text-3xl">Create New Person</DialogTitle>
            <DialogDescription className="text-lg mt-2">
              Add a new person and automatically {selectedEvent?.attendance_type === 'check-in' ? 'check them in' : 'RSVP them'} to this event.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 md:p-6">
            <form onSubmit={handleCreateMember} className="space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstname" className="text-lg">First Name</Label>
                  <Input
                    id="firstname"
                    name="firstname"
                    value={newMember.firstname}
                    onChange={(e) => setNewMember({...newMember, firstname: e.target.value})}
                    className="h-14 text-lg"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastname" className="text-lg">Last Name</Label>
                  <Input
                    id="lastname"
                    name="lastname"
                    value={newMember.lastname}
                    onChange={(e) => setNewMember({...newMember, lastname: e.target.value})}
                    className="h-14 text-lg"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-lg">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                  className="h-14 text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-lg">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={newMember.phone}
                  onChange={(e) => setNewMember({...newMember, phone: e.target.value})}
                  className="h-14 text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-lg">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={newMember.notes}
                  onChange={(e) => setNewMember({...newMember, notes: e.target.value})}
                  className="h-32 text-lg"
                />
              </div>
            </form>
          </div>

          <DialogFooter className="p-3 md:p-6 border-t">
            <Button
              type="submit"
              onClick={handleCreateMember}
              className="w-full md:w-auto text-lg h-14"
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
                <EventForm
                  initialData={{
                    ...editingEvent,
                    startDate: new Date(editingEvent.start_date).toISOString().slice(0, 16),
                    endDate: new Date(editingEvent.end_date).toISOString().slice(0, 16),
                    allow_rsvp: editingEvent.allow_rsvp !== undefined ? editingEvent.allow_rsvp : true,
                    event_type: 'Sunday Worship Service'
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
        <DialogContent className="w-full max-w-full h-full md:h-auto md:max-w-2xl p-0">
          <DialogHeader className="p-3 md:p-6 border-b">
            <DialogTitle className="text-2xl md:text-3xl">Anonymous Check-in</DialogTitle>
            <DialogDescription className="text-lg mt-2">
              Check in an anonymous attendee to {selectedEvent?.title}. This will update the event attendance count but won't create a member record.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 md:p-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center w-16 h-16 mx-auto bg-orange-100 rounded-full">
                <UserPlus className="h-8 w-8 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Add Anonymous Attendee
                </h3>
                <p className="text-gray-600">
                  This will add one anonymous attendee to the event attendance count.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="p-3 md:p-6 border-t">
            <Button
              variant="outline"
              onClick={() => setIsAnonymousCheckinOpen(false)}
              className="w-full md:w-auto text-lg h-14"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAnonymousCheckin}
              className="w-full md:w-auto text-lg h-14 bg-orange-600 hover:bg-orange-700"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add Anonymous Attendee
            </Button>
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
    </PermissionGuard>
  );
}