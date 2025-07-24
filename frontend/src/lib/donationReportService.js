import { supabase } from './supabaseClient';
import { userCacheService } from './userCache';
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';

// Helper function to get the current organization ID
const getCurrentOrganizationId = async () => {
  return await userCacheService.getCurrentUserOrganizationId();
};

export const donationReportService = {
  // Get comprehensive donation data for a specific period
  async getDonationData(selectedMonth) {
    const organizationId = await getCurrentOrganizationId();
    const startDate = startOfMonth(selectedMonth);
    const endDate = endOfMonth(selectedMonth);
    
    // Get donations for the selected period
    const { data: donations, error } = await supabase
      .from('donations')
      .select(`
        *,
        members (
          firstname,
          lastname
        )
      `)
      .eq('organization_id', organizationId)
      .gte('date', format(startDate, 'yyyy-MM-dd'))
      .lte('date', format(endDate, 'yyyy-MM-dd'))
      .order('date', { ascending: false });

    if (error) throw error;

    return this.processDonationData(donations);
  },

  // Process donation data into report format
  processDonationData(donations) {
    const totalDonations = donations.length;
    const totalAmount = donations.reduce((sum, donation) => sum + (donation.amount || 0), 0);
    const averageGift = totalDonations > 0 ? Math.round(totalAmount / totalDonations) : 0;
    
    // Get unique donors
    const uniqueDonors = new Set(donations.map(d => {
      if (d.members) {
        return `${d.members.firstname} ${d.members.lastname}`;
      }
      return d.donor_name || 'Anonymous';
    }));
    const donorCount = uniqueDonors.size;

    // Giving trends (last 12 months)
    const givingTrends = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(new Date(), i);
      const monthDonations = donations.filter(d => {
        const donationDate = parseISO(d.date);
        return donationDate.getMonth() === date.getMonth() && 
               donationDate.getFullYear() === date.getFullYear();
      });
      return {
        month: format(date, 'MMM yyyy'),
        amount: monthDonations.reduce((sum, d) => sum + (d.amount || 0), 0),
        count: monthDonations.length,
        donors: new Set(monthDonations.map(d => {
          if (d.members) {
            return `${d.members.firstname} ${d.members.lastname}`;
          }
          return d.donor_name || 'Anonymous';
        })).size
      };
    }).reverse();

    // Donation categories
    const donationCategories = donations.reduce((acc, donation) => {
      const category = donation.fund_designation || 'General';
      if (!acc[category]) {
        acc[category] = { amount: 0, count: 0 };
      }
      acc[category].amount += donation.amount || 0;
      acc[category].count += 1;
      return acc;
    }, {});

    const categoryData = Object.entries(donationCategories).map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count,
      avgAmount: Math.round(data.amount / data.count)
    }));

    // Top donors
    const donorStats = donations.reduce((acc, donation) => {
      const donorName = donation.members 
        ? `${donation.members.firstname} ${donation.members.lastname}`
        : donation.donor_name || 'Anonymous';
      
      if (!acc[donorName]) {
        acc[donorName] = { total: 0, count: 0, lastDonation: null };
      }
      acc[donorName].total += donation.amount || 0;
      acc[donorName].count += 1;
      if (!acc[donorName].lastDonation || donation.date > acc[donorName].lastDonation) {
        acc[donorName].lastDonation = donation.date;
      }
      return acc;
    }, {});

    const topDonors = Object.entries(donorStats)
      .map(([name, data]) => ({
        name,
        total: data.total,
        count: data.count,
        lastDonation: data.lastDonation,
        avgGift: Math.round(data.total / data.count)
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Giving methods
    const givingMethods = donations.reduce((acc, donation) => {
      const method = donation.payment_method || 'Cash';
      if (!acc[method]) {
        acc[method] = { amount: 0, count: 0 };
      }
      acc[method].amount += donation.amount || 0;
      acc[method].count += 1;
      return acc;
    }, {});

    const givingMethodsData = Object.entries(givingMethods).map(([method, data]) => ({
      method,
      amount: data.amount,
      count: data.count,
      percentage: Math.round((data.amount / totalAmount) * 100)
    }));

    // Donor demographics (based on available data)
    const donorDemographics = {
      newDonors: 0,
      returningDonors: 0,
      anonymousDonors: donations.filter(d => d.is_anonymous || !d.donor_id).length
    };

    // Calculate new vs returning donors
    const donorHistory = {};
    donations.forEach(donation => {
      const donorName = donation.members 
        ? `${donation.members.firstname} ${donation.members.lastname}`
        : donation.donor_name || 'Anonymous';
      
      if (!donorHistory[donorName]) {
        donorHistory[donorName] = [];
      }
      donorHistory[donorName].push(donation.date);
    });

    Object.values(donorHistory).forEach(dates => {
      if (dates.length === 1) {
        donorDemographics.newDonors++;
      } else {
        donorDemographics.returningDonors++;
      }
    });

    // Seasonal giving patterns
    const seasonalGiving = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const monthDonations = donations.filter(d => {
        const donationDate = parseISO(d.date);
        return donationDate.getMonth() === i;
      });
      return {
        month: format(new Date(2024, i, 1), 'MMM'),
        amount: monthDonations.reduce((sum, d) => sum + (d.amount || 0), 0),
        count: monthDonations.length
      };
    });

    return {
      totalDonations,
      totalAmount,
      averageGift,
      donorCount,
      givingTrends,
      donationCategories: categoryData,
      topDonors,
      givingMethods: givingMethodsData,
      donorDemographics,
      seasonalGiving,
      // Mock data for features not yet implemented
      givingGoals: [
        { name: 'Monthly Goal', target: 15000, actual: Math.round(totalAmount * 0.8), percentage: Math.round((totalAmount * 0.8 / 15000) * 100) },
        { name: 'Building Fund', target: 50000, actual: Math.round(totalAmount * 0.3), percentage: Math.round((totalAmount * 0.3 / 50000) * 100) },
        { name: 'Missions', target: 10000, actual: Math.round(totalAmount * 0.2), percentage: Math.round((totalAmount * 0.2 / 10000) * 100) }
      ],
      recurringDonations: [],
      campaignPerformance: [],
      donorRetention: []
    };
  },

  // Get donation trends over time
  async getDonationTrends(months = 12) {
    const organizationId = await getCurrentOrganizationId();
    const trends = [];

    for (let i = 0; i < months; i++) {
      const date = subMonths(new Date(), i);
      const startDate = startOfMonth(date);
      const endDate = endOfMonth(date);

      const { data: donations, error } = await supabase
        .from('donations')
        .select('amount, date')
        .eq('organization_id', organizationId)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'));

      if (error) throw error;

      const monthTotal = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
      const uniqueDonors = new Set(donations.map(d => d.donor_id)).size;

      trends.push({
        month: format(date, 'MMM yyyy'),
        amount: monthTotal,
        count: donations.length,
        donors: uniqueDonors,
        avgGift: donations.length > 0 ? Math.round(monthTotal / donations.length) : 0
      });
    }

    return trends.reverse();
  },

  // Get donor analytics
  async getDonorAnalytics() {
    const organizationId = await getCurrentOrganizationId();
    const currentMonth = new Date();
    const startDate = startOfMonth(currentMonth);
    const endDate = endOfMonth(currentMonth);

    // Get current month donations
    const { data: currentDonations, error: currentError } = await supabase
      .from('donations')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('date', format(startDate, 'yyyy-MM-dd'))
      .lte('date', format(endDate, 'yyyy-MM-dd'));

    if (currentError) throw currentError;

    // Get previous month donations
    const previousMonth = subMonths(currentMonth, 1);
    const prevStartDate = startOfMonth(previousMonth);
    const prevEndDate = endOfMonth(previousMonth);

    const { data: prevDonations, error: prevError } = await supabase
      .from('donations')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('date', format(prevStartDate, 'yyyy-MM-dd'))
      .lte('date', format(prevEndDate, 'yyyy-MM-dd'));

    if (prevError) throw prevError;

    const currentTotal = currentDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const prevTotal = prevDonations.reduce((sum, d) => sum + (d.amount || 0), 0);

    const percentageChange = prevTotal > 0 
      ? Math.round(((currentTotal - prevTotal) / prevTotal) * 100)
      : 0;

    return {
      currentMonth: {
        total: currentTotal,
        count: currentDonations.length,
        donors: new Set(currentDonations.map(d => d.donor_id)).size
      },
      previousMonth: {
        total: prevTotal,
        count: prevDonations.length,
        donors: new Set(prevDonations.map(d => d.donor_id)).size
      },
      percentageChange
    };
  },

  // Get donation categories breakdown
  async getDonationCategories() {
    const organizationId = await getCurrentOrganizationId();
    const sixMonthsAgo = subMonths(new Date(), 6);

    const { data: donations, error } = await supabase
      .from('donations')
      .select('amount, fund_designation')
      .eq('organization_id', organizationId)
      .gte('date', format(sixMonthsAgo, 'yyyy-MM-dd'));

    if (error) throw error;

    const categories = donations.reduce((acc, donation) => {
      const category = donation.fund_designation || 'General';
      if (!acc[category]) {
        acc[category] = { amount: 0, count: 0 };
      }
      acc[category].amount += donation.amount || 0;
      acc[category].count += 1;
      return acc;
    }, {});

    return Object.entries(categories).map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count,
      percentage: Math.round((data.amount / donations.reduce((sum, d) => sum + (d.amount || 0), 0)) * 100)
    }));
  }
}; 