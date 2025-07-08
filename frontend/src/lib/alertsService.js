import { supabase } from './supabaseClient';

// Helper function to get current user's organization ID
async function getCurrentUserOrganizationId() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: orgUser, error: orgError } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('approval_status', 'approved')
      .limit(1);

    if (orgError || !orgUser || orgUser.length === 0) {
      throw new Error('User not associated with any organization');
    }

    return orgUser[0].organization_id;
  } catch (error) {
    console.error('Error getting organization ID:', error);
    throw error;
  }
}

// Get all alerts for the current organization
export async function getAlerts() {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching alerts:', error);
    throw error;
  }
}

// Get a single alert by ID
export async function getAlert(alertId) {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('id', alertId)
      .eq('organization_id', organizationId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching alert:', error);
    throw error;
  }
}

// Create a new alert
export async function createAlert(alertData) {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    
    const { data, error } = await supabase
      .from('alerts')
      .insert({
        ...alertData,
        organization_id: organizationId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating alert:', error);
    throw error;
  }
}

// Update an existing alert
export async function updateAlert(alertId, alertData) {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    
    const { data, error } = await supabase
      .from('alerts')
      .update({
        ...alertData,
        updated_at: new Date().toISOString()
      })
      .eq('id', alertId)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating alert:', error);
    throw error;
  }
}

// Delete an alert
export async function deleteAlert(alertId) {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    
    const { error } = await supabase
      .from('alerts')
      .delete()
      .eq('id', alertId)
      .eq('organization_id', organizationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting alert:', error);
    throw error;
  }
}

// Toggle alert active status
export async function toggleAlertStatus(alertId, isActive) {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    
    const { data, error } = await supabase
      .from('alerts')
      .update({ 
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', alertId)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error toggling alert status:', error);
    throw error;
  }
}

// Get upcoming events (birthdays, membership anniversaries, wedding anniversaries)
export async function getUpcomingEvents(daysAhead = 30) {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    
    const { data: members, error } = await supabase
      .from('members')
      .select('id, firstname, lastname, birth_date, anniversary_date, join_date, phone, email, spouse_name, status')
      .eq('organization_id', organizationId)
      .eq('status', 'active');

    if (error) throw error;

    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);
    
    const upcoming = [];

    members?.forEach(member => {
      // Check birthdays
      if (member.birth_date) {
        const birthDate = new Date(member.birth_date);
        const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        const nextYearBirthday = new Date(today.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());
        
        let nextBirthday = thisYearBirthday;
        if (thisYearBirthday < today) {
          nextBirthday = nextYearBirthday;
        }

        if (nextBirthday <= futureDate) {
          const isToday = nextBirthday.toDateString() === today.toDateString();
          const isTomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000).toDateString() === nextBirthday.toDateString();
          const daysUntil = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
          
          upcoming.push({
            id: `birthday-${member.id}`,
            type: 'birthday',
            member: member,
            date: nextBirthday,
            daysUntil,
            isToday,
            isTomorrow,
            title: `${member.firstname} ${member.lastname}'s Birthday`,
            description: `Birthday on ${nextBirthday.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
          });
        }
      }

      // Check wedding anniversaries
      if (member.anniversary_date) {
        const anniversaryDate = new Date(member.anniversary_date);
        const thisYearAnniversary = new Date(today.getFullYear(), anniversaryDate.getMonth(), anniversaryDate.getDate());
        const nextYearAnniversary = new Date(today.getFullYear() + 1, anniversaryDate.getMonth(), anniversaryDate.getDate());
        
        let nextAnniversary = thisYearAnniversary;
        if (thisYearAnniversary < today) {
          nextAnniversary = nextYearAnniversary;
        }

        if (nextAnniversary <= futureDate) {
          const isToday = nextAnniversary.toDateString() === today.toDateString();
          const isTomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000).toDateString() === nextAnniversary.toDateString();
          const daysUntil = Math.ceil((nextAnniversary - today) / (1000 * 60 * 60 * 24));
          
          upcoming.push({
            id: `anniversary-${member.id}`,
            type: 'anniversary',
            member: member,
            date: nextAnniversary,
            daysUntil,
            isToday,
            isTomorrow,
            title: `${member.firstname} & ${member.spouse_name || 'Spouse'}'s Anniversary`,
            description: `Wedding anniversary on ${nextAnniversary.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
          });
        }
      }

      // Check membership anniversaries (join date)
      if (member.join_date) {
        const joinDate = new Date(member.join_date);
        const thisYearJoinAnniversary = new Date(today.getFullYear(), joinDate.getMonth(), joinDate.getDate());
        const nextYearJoinAnniversary = new Date(today.getFullYear() + 1, joinDate.getMonth(), joinDate.getDate());
        
        let nextJoinAnniversary = thisYearJoinAnniversary;
        if (thisYearJoinAnniversary < today) {
          nextJoinAnniversary = nextYearJoinAnniversary;
        }

        if (nextJoinAnniversary <= futureDate) {
          const isToday = nextJoinAnniversary.toDateString() === today.toDateString();
          const isTomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000).toDateString() === nextJoinAnniversary.toDateString();
          const daysUntil = Math.ceil((nextJoinAnniversary - today) / (1000 * 60 * 60 * 24));
          const yearsOfMembership = today.getFullYear() - joinDate.getFullYear();
          
          upcoming.push({
            id: `membership-${member.id}`,
            type: 'membership',
            member: member,
            date: nextJoinAnniversary,
            daysUntil,
            isToday,
            isTomorrow,
            yearsOfMembership,
            title: `${member.firstname} ${member.lastname}'s Membership Anniversary`,
            description: `${yearsOfMembership} year${yearsOfMembership !== 1 ? 's' : ''} of membership on ${nextJoinAnniversary.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
          });
        }
      }
    });

    // Sort by date (closest first)
    upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
    return upcoming;
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    throw error;
  }
}

// Get alert statistics for dashboard
export async function getAlertStats() {
  try {
    const upcomingEvents = await getUpcomingEvents(30);
    
    const birthdays = upcomingEvents.filter(event => event.type === 'birthday');
    const anniversaries = upcomingEvents.filter(event => event.type === 'anniversary');
    const memberships = upcomingEvents.filter(event => event.type === 'membership');
    
    const today = new Date();
    const thisWeek = upcomingEvents.filter(event => {
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return event.date <= weekFromNow;
    });

    return {
      totalUpcoming: upcomingEvents.length,
      birthdays: birthdays.length,
      anniversaries: anniversaries.length,
      memberships: memberships.length,
      thisWeek: thisWeek.length,
      today: upcomingEvents.filter(event => event.isToday).length,
      tomorrow: upcomingEvents.filter(event => event.isTomorrow).length
    };
  } catch (error) {
    console.error('Error fetching alert stats:', error);
    throw error;
  }
}

// Get events by type
export async function getEventsByType(type, daysAhead = 30) {
  try {
    const upcomingEvents = await getUpcomingEvents(daysAhead);
    return upcomingEvents.filter(event => event.type === type);
  } catch (error) {
    console.error(`Error fetching ${type} events:`, error);
    throw error;
  }
}

// Get today's events
export async function getTodaysEvents() {
  try {
    const upcomingEvents = await getUpcomingEvents(1);
    return upcomingEvents.filter(event => event.isToday);
  } catch (error) {
    console.error('Error fetching today\'s events:', error);
    throw error;
  }
}

// Get this week's events
export async function getThisWeeksEvents() {
  try {
    const upcomingEvents = await getUpcomingEvents(7);
    return upcomingEvents;
  } catch (error) {
    console.error('Error fetching this week\'s events:', error);
    throw error;
  }
}

// Get alert logs for monitoring
export async function getAlertLogs(limit = 50) {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    
    const { data, error } = await supabase
      .from('alert_logs')
      .select(`
        *,
        alerts (name, type),
        members (firstname, lastname)
      `)
      .eq('organization_id', organizationId)
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching alert logs:', error);
    throw error;
  }
}

// Process message template with member data
export function processMessageTemplate(template, member) {
  if (!template || !member) return template;
  
  return template
    .replace(/{first_name}/g, member.firstname || '')
    .replace(/{last_name}/g, member.lastname || '')
    .replace(/{spouse_name}/g, member.spouse_name || '')
    .replace(/{full_name}/g, `${member.firstname || ''} ${member.lastname || ''}`.trim());
}

// Get members for recipient selection
export async function getMembersForRecipients(recipientType) {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    
    let query = supabase
      .from('members')
      .select('id, firstname, lastname, status, phone, email')
      .eq('organization_id', organizationId);

    // Filter based on recipient type
    switch (recipientType) {
      case 'active':
        query = query.eq('status', 'active');
        break;
      case 'visitors':
        query = query.eq('status', 'visitor');
        break;
      case 'married':
        query = query.not('spouse_name', 'is', null);
        break;
      case 'leaders':
        // You might want to add a 'role' field to members table for this
        query = query.eq('status', 'active');
        break;
      default:
        // 'all' - no additional filter
        break;
    }

    const { data, error } = await query.order('firstname', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching members for recipients:', error);
    throw error;
  }
} 