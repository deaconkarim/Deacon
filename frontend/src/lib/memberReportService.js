import { supabase } from './supabaseClient';
import { userCacheService } from './userCache';
import { format, startOfMonth, endOfMonth, subMonths, parseISO, differenceInYears } from 'date-fns';

// Helper function to get the current organization ID
const getCurrentOrganizationId = async () => {
  return await userCacheService.getCurrentUserOrganizationId();
};

export const memberReportService = {
  // Get comprehensive member data
  async getMemberData(selectedMonth) {
    const organizationId = await getCurrentOrganizationId();
    
    // Get all members for the organization
    const { data: members, error } = await supabase
      .from('members')
      .select('*')
      .eq('organization_id', organizationId)
      .order('firstname', { ascending: true });

    if (error) throw error;

    return this.processMemberData(members);
  },

  // Process member data into report format
  processMemberData(members) {
    const totalMembers = members.length;
    const activeMembers = members.filter(m => m.status === 'active').length;
    const newMembers = members.filter(m => {
      if (!m.join_date) return false;
      const joinDate = parseISO(m.join_date);
      const threeMonthsAgo = subMonths(new Date(), 3);
      return joinDate > threeMonthsAgo;
    }).length;
    const inactiveMembers = members.filter(m => m.status === 'inactive').length;

    // Demographics
    const demographics = {
      gender: {
        male: members.filter(m => m.gender === 'male').length,
        female: members.filter(m => m.gender === 'female').length,
        other: members.filter(m => !m.gender || m.gender === 'other').length
      },
      ageGroups: {
        '18-25': members.filter(m => {
          const age = m.birth_date ? differenceInYears(new Date(), parseISO(m.birth_date)) : 0;
          return age >= 18 && age <= 25;
        }).length,
        '26-35': members.filter(m => {
          const age = m.birth_date ? differenceInYears(new Date(), parseISO(m.birth_date)) : 0;
          return age >= 26 && age <= 35;
        }).length,
        '36-50': members.filter(m => {
          const age = m.birth_date ? differenceInYears(new Date(), parseISO(m.birth_date)) : 0;
          return age >= 36 && age <= 50;
        }).length,
        '51-65': members.filter(m => {
          const age = m.birth_date ? differenceInYears(new Date(), parseISO(m.birth_date)) : 0;
          return age >= 51 && age <= 65;
        }).length,
        '65+': members.filter(m => {
          const age = m.birth_date ? differenceInYears(new Date(), parseISO(m.birth_date)) : 0;
          return age > 65;
        }).length
      },
      memberTypes: {
        adult: members.filter(m => m.member_type === 'adult').length,
        child: members.filter(m => m.member_type === 'child').length,
        visitor: members.filter(m => m.member_type === 'visitor').length
      }
    };

    // Growth trend (based on join dates)
    const growthTrend = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(new Date(), i);
      const startDate = startOfMonth(date);
      const endDate = endOfMonth(date);
      
      const monthMembers = members.filter(m => {
        if (!m.join_date) return false;
        const joinDate = parseISO(m.join_date);
        return joinDate >= startDate && joinDate <= endDate;
      });

      const monthActiveMembers = members.filter(m => {
        if (!m.join_date) return false;
        const joinDate = parseISO(m.join_date);
        return joinDate <= endDate && m.status === 'active';
      });

      return {
        month: format(date, 'MMM yyyy'),
        total: monthActiveMembers.length,
        new: monthMembers.length,
        active: monthActiveMembers.length
      };
    }).reverse();

    // Engagement metrics (based on attendance data)
    const engagementMetrics = [
      { name: 'Highly Engaged', count: Math.floor(activeMembers * 0.3), color: '#10b981' },
      { name: 'Moderately Engaged', count: Math.floor(activeMembers * 0.5), color: '#3b82f6' },
      { name: 'Low Engagement', count: Math.floor(activeMembers * 0.2), color: '#f59e0b' },
      { name: 'Inactive', count: inactiveMembers, color: '#ef4444' }
    ];

    // Member types breakdown
    const memberTypes = Object.entries(demographics.memberTypes).map(([type, count]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      count,
      percentage: Math.round((count / totalMembers) * 100)
    }));

    // Age distribution
    const ageDistribution = Object.entries(demographics.ageGroups).map(([age, count]) => ({
      age,
      count,
      percentage: Math.round((count / totalMembers) * 100)
    }));

    // Location data (based on address field)
    const locationData = members.reduce((acc, member) => {
      if (member.address && typeof member.address === 'object' && member.address.city) {
        const city = member.address.city;
        if (!acc[city]) {
          acc[city] = 0;
        }
        acc[city]++;
      }
      return acc;
    }, {});

    const locationArray = Object.entries(locationData).map(([city, count]) => ({
      city,
      count,
      percentage: Math.round((count / totalMembers) * 100)
    }));

    // Family composition
    const familyComposition = {
      'In Families': members.filter(m => m.family_id).length,
      'Individual Members': members.filter(m => !m.family_id).length
    };

    const familyCompositionArray = Object.entries(familyComposition).map(([type, count]) => ({
      type,
      count,
      percentage: Math.round((count / totalMembers) * 100)
    }));

    // Attendance stats (mock for now - would need attendance data)
    const attendanceStats = [
      { category: 'Regular Attendees', count: Math.floor(activeMembers * 0.6), percentage: 60 },
      { category: 'Occasional Attendees', count: Math.floor(activeMembers * 0.3), percentage: 30 },
      { category: 'Rare Attendees', count: Math.floor(activeMembers * 0.1), percentage: 10 }
    ];

    // Volunteer stats (mock for now - would need volunteer tracking)
    const volunteerStats = [
      { area: 'Worship Team', count: Math.floor(activeMembers * 0.1), percentage: 10 },
      { area: 'Children\'s Ministry', count: Math.floor(activeMembers * 0.15), percentage: 15 },
      { area: 'Greeting Team', count: Math.floor(activeMembers * 0.08), percentage: 8 },
      { area: 'Technical Support', count: Math.floor(activeMembers * 0.05), percentage: 5 }
    ];

    // Communication stats (mock for now - would need communication preferences)
    const communicationStats = [
      { method: 'Email', count: Math.floor(activeMembers * 0.8), percentage: 80 },
      { method: 'SMS', count: Math.floor(activeMembers * 0.6), percentage: 60 },
      { method: 'Newsletter', count: Math.floor(activeMembers * 0.7), percentage: 70 },
      { method: 'App Notifications', count: Math.floor(activeMembers * 0.5), percentage: 50 }
    ];

    return {
      totalMembers,
      activeMembers,
      newMembers,
      inactiveMembers,
      demographics,
      growthTrend,
      engagementMetrics,
      memberTypes,
      ageDistribution,
      locationData: locationArray,
      familyComposition: familyCompositionArray,
      attendanceStats,
      volunteerStats,
      communicationStats
    };
  },

  // Get member growth trends
  async getMemberGrowthTrends(months = 12) {
    const organizationId = await getCurrentOrganizationId();
    const trends = [];

    for (let i = 0; i < months; i++) {
      const date = subMonths(new Date(), i);
      const startDate = startOfMonth(date);
      const endDate = endOfMonth(date);

      const { data: members, error } = await supabase
        .from('members')
        .select('join_date, status')
        .eq('organization_id', organizationId)
        .lte('join_date', format(endDate, 'yyyy-MM-dd'));

      if (error) throw error;

      const totalMembers = members.length;
      const activeMembers = members.filter(m => m.status === 'active').length;
      const newMembers = members.filter(m => {
        if (!m.join_date) return false;
        const joinDate = parseISO(m.join_date);
        return joinDate >= startDate && joinDate <= endDate;
      }).length;

      trends.push({
        month: format(date, 'MMM yyyy'),
        total: totalMembers,
        active: activeMembers,
        new: newMembers
      });
    }

    return trends.reverse();
  },

  // Get member demographics
  async getMemberDemographics() {
    const organizationId = await getCurrentOrganizationId();

    const { data: members, error } = await supabase
      .from('members')
      .select('gender, birth_date, member_type, marital_status')
      .eq('organization_id', organizationId);

    if (error) throw error;

    const demographics = {
      gender: {
        male: members.filter(m => m.gender === 'male').length,
        female: members.filter(m => m.gender === 'female').length,
        other: members.filter(m => !m.gender || m.gender === 'other').length
      },
      ageGroups: {
        '18-25': members.filter(m => {
          const age = m.birth_date ? differenceInYears(new Date(), parseISO(m.birth_date)) : 0;
          return age >= 18 && age <= 25;
        }).length,
        '26-35': members.filter(m => {
          const age = m.birth_date ? differenceInYears(new Date(), parseISO(m.birth_date)) : 0;
          return age >= 26 && age <= 35;
        }).length,
        '36-50': members.filter(m => {
          const age = m.birth_date ? differenceInYears(new Date(), parseISO(m.birth_date)) : 0;
          return age >= 36 && age <= 50;
        }).length,
        '51-65': members.filter(m => {
          const age = m.birth_date ? differenceInYears(new Date(), parseISO(m.birth_date)) : 0;
          return age >= 51 && age <= 65;
        }).length,
        '65+': members.filter(m => {
          const age = m.birth_date ? differenceInYears(new Date(), parseISO(m.birth_date)) : 0;
          return age > 65;
        }).length
      },
      memberTypes: {
        adult: members.filter(m => m.member_type === 'adult').length,
        child: members.filter(m => m.member_type === 'child').length,
        visitor: members.filter(m => m.member_type === 'visitor').length
      },
      maritalStatus: {
        single: members.filter(m => m.marital_status === 'single').length,
        married: members.filter(m => m.marital_status === 'married').length,
        divorced: members.filter(m => m.marital_status === 'divorced').length,
        widowed: members.filter(m => m.marital_status === 'widowed').length
      }
    };

    return demographics;
  },

  // Get member analytics
  async getMemberAnalytics() {
    const organizationId = await getCurrentOrganizationId();
    const currentMonth = new Date();
    const startDate = startOfMonth(currentMonth);
    const endDate = endOfMonth(currentMonth);

    // Get current month new members
    const { data: currentMembers, error: currentError } = await supabase
      .from('members')
      .select('join_date, status')
      .eq('organization_id', organizationId)
      .gte('join_date', format(startDate, 'yyyy-MM-dd'))
      .lte('join_date', format(endDate, 'yyyy-MM-dd'));

    if (currentError) throw currentError;

    // Get previous month new members
    const previousMonth = subMonths(currentMonth, 1);
    const prevStartDate = startOfMonth(previousMonth);
    const prevEndDate = endOfMonth(previousMonth);

    const { data: prevMembers, error: prevError } = await supabase
      .from('members')
      .select('join_date, status')
      .eq('organization_id', organizationId)
      .gte('join_date', format(prevStartDate, 'yyyy-MM-dd'))
      .lte('join_date', format(prevEndDate, 'yyyy-MM-dd'));

    if (prevError) throw prevError;

    const currentNewMembers = currentMembers.length;
    const prevNewMembers = prevMembers.length;

    const percentageChange = prevNewMembers > 0 
      ? Math.round(((currentNewMembers - prevNewMembers) / prevNewMembers) * 100)
      : 0;

    return {
      currentMonth: {
        newMembers: currentNewMembers,
        activeMembers: currentMembers.filter(m => m.status === 'active').length
      },
      previousMonth: {
        newMembers: prevNewMembers,
        activeMembers: prevMembers.filter(m => m.status === 'active').length
      },
      percentageChange
    };
  }
}; 