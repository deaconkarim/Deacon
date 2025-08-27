import { supabase } from './supabaseClient';

// Common timezone options for US churches
export const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern Time (ET)', offset: '-05:00' },
  { value: 'America/Chicago', label: 'Central Time (CT)', offset: '-06:00' },
  { value: 'America/Denver', label: 'Mountain Time (MT)', offset: '-07:00' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: '-08:00' },
  { value: 'America/Phoenix', label: 'Arizona Time (MST)', offset: '-07:00' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)', offset: '-09:00' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)', offset: '-10:00' },
  { value: 'America/Indiana/Indianapolis', label: 'Indiana Time (ET)', offset: '-05:00' },
  { value: 'America/Detroit', label: 'Michigan Time (ET)', offset: '-05:00' },
  { value: 'America/Kentucky/Louisville', label: 'Kentucky Time (ET)', offset: '-05:00' },
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)', offset: '+00:00' }
];

// Get organization timezone
export const getOrganizationTimezone = async (organizationId) => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('timezone')
      .eq('id', organizationId)
      .single();

    if (error) throw error;
    return data?.timezone || 'America/New_York';
  } catch (error) {
    console.error('Error getting organization timezone:', error);
    return 'America/New_York'; // Default fallback
  }
};

// Update organization timezone
export const updateOrganizationTimezone = async (organizationId, timezone) => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .update({ timezone })
      .eq('id', organizationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating organization timezone:', error);
    throw error;
  }
};

// Convert UTC date to organization timezone
export const convertToOrganizationTimezone = (utcDate, organizationTimezone) => {
  if (!utcDate) return null;
  
  try {
    const date = new Date(utcDate);
    const options = {
      timeZone: organizationTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };
    
    return new Intl.DateTimeFormat('en-CA', options).format(date);
  } catch (error) {
    console.error('Error converting to organization timezone:', error);
    return utcDate; // Fallback to original date
  }
};

// Convert organization timezone date to UTC
export const convertFromOrganizationTimezone = (localDate, organizationTimezone) => {
  if (!localDate) return null;
  
  try {
    // Create a date object from the local date string
    const date = new Date(localDate);
    
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', localDate);
      return null;
    }
    
    // Create a date string in the organization's timezone
    const localDateString = date.toLocaleString('en-CA', { 
      timeZone: organizationTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    // Parse the local date string and convert to UTC
    const [datePart, timePart] = localDateString.split(', ');
    const [year, month, day] = datePart.split('/').map(Number);
    const [hour, minute, second] = timePart.split(':').map(Number);
    
    // Create UTC date using the local components
    const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    return utcDate.toISOString();
  } catch (error) {
    console.error('Error converting from organization timezone:', error);
    return null;
  }
};

// Format date in organization timezone for display
export const formatDateInOrganizationTimezone = (date, organizationTimezone, format = 'full') => {
  if (!date) return '';
  
  try {
    const dateObj = new Date(date);
    const options = {
      timeZone: organizationTimezone,
      hour12: true
    };
    
    switch (format) {
      case 'date':
        options.year = 'numeric';
        options.month = 'long';
        options.day = 'numeric';
        break;
      case 'time':
        options.hour = '2-digit';
        options.minute = '2-digit';
        break;
      case 'datetime':
        options.year = 'numeric';
        options.month = 'short';
        options.day = 'numeric';
        options.hour = '2-digit';
        options.minute = '2-digit';
        break;
      case 'full':
      default:
        options.year = 'numeric';
        options.month = 'long';
        options.day = 'numeric';
        options.hour = '2-digit';
        options.minute = '2-digit';
        options.weekday = 'long';
        break;
    }
    
    return new Intl.DateTimeFormat('en-US', options).format(dateObj);
  } catch (error) {
    console.error('Error formatting date in organization timezone:', error);
    return date; // Fallback to original date
  }
};

// Get current time in organization timezone
export const getCurrentTimeInOrganizationTimezone = (organizationTimezone) => {
  try {
    const now = new Date();
    return formatDateInOrganizationTimezone(now, organizationTimezone, 'time');
  } catch (error) {
    console.error('Error getting current time in organization timezone:', error);
    return new Date().toLocaleTimeString();
  }
};

// Validate timezone
export const isValidTimezone = (timezone) => {
  return TIMEZONE_OPTIONS.some(option => option.value === timezone);
};

// Get timezone offset for display
export const getTimezoneOffset = (timezone) => {
  const option = TIMEZONE_OPTIONS.find(opt => opt.value === timezone);
  return option ? option.offset : '';
};

// Get timezone label for display
export const getTimezoneLabel = (timezone) => {
  const option = TIMEZONE_OPTIONS.find(opt => opt.value === timezone);
  return option ? option.label : timezone;
};

// Create a timezone-aware date input value
export const createTimezoneAwareDateInput = (date, organizationTimezone) => {
  if (!date) return '';
  
  try {
    const dateObj = new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      console.error('Invalid date for timezone conversion:', date);
      return '';
    }
    
    // Get the date components in the organization's timezone
    const utcYear = dateObj.getUTCFullYear();
    const utcMonth = dateObj.getUTCMonth();
    const utcDay = dateObj.getUTCDate();
    const utcHour = dateObj.getUTCHours();
    const utcMinute = dateObj.getUTCMinutes();
    
    // Create a new date object in the organization's timezone
    const localDate = new Date(Date.UTC(utcYear, utcMonth, utcDay, utcHour, utcMinute));
    
    // Format as YYYY-MM-DDTHH:MM
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    const hour = String(localDate.getHours()).padStart(2, '0');
    const minute = String(localDate.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hour}:${minute}`;
  } catch (error) {
    console.error('Error creating timezone-aware date input:', error);
    return '';
  }
};

// Parse timezone-aware date input
export const parseTimezoneAwareDateInput = (dateInput, organizationTimezone) => {
  if (!dateInput) return null;
  
  try {
    // Create a date object from the input (assumes local timezone)
    const date = new Date(dateInput);
    
    if (isNaN(date.getTime())) {
      console.error('Invalid date input:', dateInput);
      return null;
    }
    
    // Convert to UTC using the organization timezone
    return convertFromOrganizationTimezone(date, organizationTimezone);
  } catch (error) {
    console.error('Error parsing timezone-aware date input:', error);
    return null;
  }
};
