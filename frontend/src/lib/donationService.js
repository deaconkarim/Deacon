import { supabase } from './supabaseClient';

// Helper function to get current user's organization ID
const getCurrentUserOrganizationId = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('approval_status', 'approved')
      .limit(1);

    if (error) throw error;
    return data && data.length > 0 ? data[0].organization_id : null;
  } catch (error) {
    console.error('Error getting user organization:', error);
    return null;
  }
};

// ================== DONATIONS ==================

export async function getDonations(filters = {}) {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    let query = supabase
      .from('donations')
      .select(`
        *,
        donor:members(id, firstname, lastname, email, phone),
        campaign:donation_campaigns(id, name),
        pledge:donation_pledges(id, pledge_amount),
        batch:donation_batches(id, name, batch_number, description, status)
      `)
      .eq('organization_id', organizationId);

    // Option to exclude legacy batch summaries (for individual donation view)
    if (filters.excludeLegacyBatches) {
      query = query.eq('is_legacy_batch_summary', false);
    }

    // Apply filters
    if (filters.startDate) {
      query = query.gte('date', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('date', filters.endDate);
    }
    if (filters.donorId) {
      query = query.eq('donor_id', filters.donorId);
    }
    if (filters.campaignId) {
      query = query.eq('campaign_id', filters.campaignId);
    }
    if (filters.fundDesignation && filters.fundDesignation !== 'all') {
      query = query.eq('fund_designation', filters.fundDesignation);
    }
    if (filters.paymentMethod && filters.paymentMethod !== 'all') {
      query = query.eq('payment_method', filters.paymentMethod);
    }
    if (filters.minAmount) {
      query = query.gte('amount', filters.minAmount);
    }
    if (filters.maxAmount) {
      query = query.lte('amount', filters.maxAmount);
    }
    if (filters.search) {
      // Search in notes, check number, or donor name
      query = query.or(`notes.ilike.%${filters.search}%,check_number.ilike.%${filters.search}%`);
    }

    query = query.order('date', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error;
  }
}

export async function getDonation(id) {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    const { data, error } = await supabase
      .from('donations')
      .select(`
        *,
        donor:members(id, firstname, lastname, email, phone),
        campaign:donation_campaigns(id, name),
        pledge:donation_pledges(id, pledge_amount),
        batch:donation_batches(id, name, batch_number, description, status)
      `)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

export async function addDonation(donation) {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('donations')
      .insert([{
        ...donation,
        organization_id: organizationId,
        processed_by: user?.id
      }])
      .select(`
        *,
        donor:members(id, firstname, lastname, email, phone),
        campaign:donation_campaigns(id, name),
        pledge:donation_pledges(id, pledge_amount),
        batch:donation_batches(id, name, batch_number, description, status)
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

export async function updateDonation(id, updates) {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    const { data, error } = await supabase
      .from('donations')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select(`
        *,
        donor:members(id, firstname, lastname, email, phone),
        campaign:donation_campaigns(id, name),
        pledge:donation_pledges(id, pledge_amount),
        batch:donation_batches(id, name, batch_number, description, status)
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

export async function deleteDonation(id) {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    const { error } = await supabase
      .from('donations')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) throw error;
    return true;
  } catch (error) {
    throw error;
  }
}

// ================== DONATION CAMPAIGNS ==================

export async function getCampaigns(includeInactive = false) {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    let query = supabase
      .from('donation_campaigns')
      .select('*')
      .eq('organization_id', organizationId);

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error;
  }
}

export async function getCampaign(id) {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    const { data, error } = await supabase
      .from('donation_campaigns')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

export async function addCampaign(campaign) {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    const { data, error } = await supabase
      .from('donation_campaigns')
      .insert([{
        ...campaign,
        organization_id: organizationId
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

export async function updateCampaign(id, updates) {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    const { data, error } = await supabase
      .from('donation_campaigns')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

export async function deleteCampaign(id) {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    const { error } = await supabase
      .from('donation_campaigns')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) throw error;
    return true;
  } catch (error) {
    throw error;
  }
}

// ================== DONATION PLEDGES ==================

export async function getPledges(filters = {}) {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    let query = supabase
      .from('donation_pledges')
      .select(`
        *,
        donor:members(id, firstname, lastname, email, phone),
        campaign:donation_campaigns(id, name)
      `)
      .eq('organization_id', organizationId);

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters.donorId) {
      query = query.eq('donor_id', filters.donorId);
    }
    if (filters.campaignId) {
      query = query.eq('campaign_id', filters.campaignId);
    }

    query = query.order('pledge_date', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error;
  }
}

export async function addPledge(pledge) {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    const { data, error } = await supabase
      .from('donation_pledges')
      .insert([{
        ...pledge,
        organization_id: organizationId
      }])
      .select(`
        *,
        donor:members(id, firstname, lastname, email, phone),
        campaign:donation_campaigns(id, name)
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

export async function updatePledge(id, updates) {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    const { data, error } = await supabase
      .from('donation_pledges')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select(`
        *,
        donor:members(id, firstname, lastname, email, phone),
        campaign:donation_campaigns(id, name)
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

// ================== DONATION RECEIPTS ==================

export async function getReceipts(filters = {}) {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    let query = supabase
      .from('donation_receipts')
      .select(`
        *,
        donor:members(id, firstname, lastname, email, phone)
      `)
      .eq('organization_id', organizationId);

    if (filters.taxYear) {
      query = query.eq('tax_year', filters.taxYear);
    }
    if (filters.donorId) {
      query = query.eq('donor_id', filters.donorId);
    }

    query = query.order('receipt_date', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error;
  }
}

export async function generateReceipt(receiptData) {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    // Generate receipt number
    const { data: receiptNumberData, error: receiptNumberError } = await supabase
      .rpc('generate_receipt_number', {
        org_id: organizationId,
        receipt_year: receiptData.tax_year
      });

    if (receiptNumberError) throw receiptNumberError;

    const { data, error } = await supabase
      .from('donation_receipts')
      .insert([{
        ...receiptData,
        organization_id: organizationId,
        receipt_number: receiptNumberData
      }])
      .select(`
        *,
        donor:members(id, firstname, lastname, email, phone)
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

// ================== DONATION CATEGORIES ==================

export async function getCategories() {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    const { data, error } = await supabase
      .from('donation_categories')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error;
  }
}

export async function addCategory(category) {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    const { data, error } = await supabase
      .from('donation_categories')
      .insert([{
        ...category,
        organization_id: organizationId
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

// ================== DONATION BATCHES ==================

// Generate a unique batch number for the organization
async function generateBatchNumber(organizationId) {
  try {
    // Get organization info for prefix
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single();

    if (orgError) throw orgError;

    // Create organization prefix (first 3 letters of name, uppercase)
    const orgPrefix = orgData.name.replace(/\s+/g, '').substring(0, 3).toUpperCase();

    // Get current year
    const currentYear = new Date().getFullYear();

    // Get count of batches for this year and organization
    const { data: batchData, error: batchError } = await supabase
      .from('donation_batches')
      .select('batch_number')
      .eq('organization_id', organizationId)
      .like('batch_number', `${orgPrefix}-${currentYear}-%`);

    if (batchError) throw batchError;

    const batchCount = (batchData || []).length + 1;

    // Generate batch number: ORG-YEAR-###
    const batchNumber = `${orgPrefix}-${currentYear}-${String(batchCount).padStart(3, '0')}`;

    return batchNumber;
  } catch (error) {
    console.error('Error generating batch number:', error);
    // Fallback to timestamp-based number if generation fails
    const timestamp = Date.now().toString().slice(-6);
    return `BATCH-${timestamp}`;
  }
}

export async function getBatches(status = 'all') {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    let query = supabase
      .from('donation_batches')
      .select(`
        *,
        donations:donations(amount)
      `)
      .eq('organization_id', organizationId);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    // Add calculated statistics to each batch
    const batchesWithStats = (data || []).map(batch => {
      const donations = batch.donations || [];
      const totalAmount = donations.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
      const donationCount = donations.length;

      return {
        ...batch,
        total_amount: totalAmount,
        donation_count: donationCount,
        donations: undefined // Remove the donations array to keep response clean
      };
    });

    return batchesWithStats;
  } catch (error) {
    throw error;
  }
}

export async function createBatch(batch) {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    const { data: { user } } = await supabase.auth.getUser();

    // Generate batch number
    const batchNumber = await generateBatchNumber(organizationId);

    const { data, error } = await supabase
      .from('donation_batches')
      .insert([{
        ...batch,
        batch_number: batchNumber,
        batch_date: new Date().toISOString().split('T')[0], // Current date
        organization_id: organizationId,
        processed_by: user?.id
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

// Backward compatibility alias
export async function addBatch(batch) {
  return createBatch(batch);
}

export async function updateBatch(id, updates) {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    const { data, error } = await supabase
      .from('donation_batches')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

export async function closeBatch(id) {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    const { data, error } = await supabase
      .from('donation_batches')
      .update({ 
        status: 'closed',
        closed_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

export async function getBatchDetails(id) {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    // Get batch details with donations
    const { data: batchData, error: batchError } = await supabase
      .from('donation_batches')
      .select(`
        *,
        donations:donations(
          id,
          amount,
          date,
          fund_designation,
          payment_method,
          check_number,
          notes,
          donor:members(id, firstname, lastname, email)
        )
      `)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (batchError) throw batchError;

    // Calculate batch statistics
    const donations = batchData.donations || [];
    const totalAmount = donations.reduce((sum, d) => sum + parseFloat(d.amount), 0);
    const donationCount = donations.length;

    return {
      ...batchData,
      statistics: {
        total_amount: totalAmount,
        donation_count: donationCount,
        average_donation: donationCount > 0 ? totalAmount / donationCount : 0
      }
    };
  } catch (error) {
    throw error;
  }
}

// ================== RECURRING DONATIONS ==================

export async function getRecurringDonations() {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    const { data, error } = await supabase
      .from('recurring_donations')
      .select(`
        *,
        donor:members(id, firstname, lastname, email, phone)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error;
  }
}

export async function addRecurringDonation(recurringDonation) {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    const { data, error } = await supabase
      .from('recurring_donations')
      .insert([{
        ...recurringDonation,
        organization_id: organizationId
      }])
      .select(`
        *,
        donor:members(id, firstname, lastname, email, phone)
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

// ================== ANALYTICS ==================

export async function getDonationAnalytics(startDate, endDate) {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    // Get total donations
    const { data: totalData, error: totalError } = await supabase
      .from('donations')
      .select('amount, date, fund_designation, payment_method')
      .eq('organization_id', organizationId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (totalError) throw totalError;

    // Get top donors
    const { data: topDonorsData, error: topDonorsError } = await supabase
      .from('donations')
      .select(`
        donor_id,
        amount,
        donor:members(firstname, lastname)
      `)
      .eq('organization_id', organizationId)
      .gte('date', startDate)
      .lte('date', endDate)
      .not('donor_id', 'is', null);

    if (topDonorsError) throw topDonorsError;

    // Process analytics
    const analytics = {
      totalAmount: totalData.reduce((sum, d) => sum + parseFloat(d.amount), 0),
      donationCount: totalData.length,
      averageDonation: totalData.length > 0 ? totalData.reduce((sum, d) => sum + parseFloat(d.amount), 0) / totalData.length : 0,
      
      byFundDesignation: totalData.reduce((acc, d) => {
        acc[d.fund_designation] = (acc[d.fund_designation] || 0) + parseFloat(d.amount);
        return acc;
      }, {}),
      
      byPaymentMethod: totalData.reduce((acc, d) => {
        acc[d.payment_method] = (acc[d.payment_method] || 0) + parseFloat(d.amount);
        return acc;
      }, {}),
      
      topDonors: Object.values(
        topDonorsData.reduce((acc, d) => {
          const key = d.donor_id;
          if (!acc[key]) {
            acc[key] = {
              donorId: d.donor_id,
              name: `${d.donor.firstname} ${d.donor.lastname}`,
              totalAmount: 0,
              donationCount: 0
            };
          }
          acc[key].totalAmount += parseFloat(d.amount);
          acc[key].donationCount += 1;
          return acc;
        }, {})
      ).sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 10)
    };

    return analytics;
  } catch (error) {
    throw error;
  }
}

// ================== REPORTING ==================

export async function generateDonationReport(reportType, filters = {}) {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    let query = supabase
      .from('donations')
      .select(`
        *,
        donor:members(id, firstname, lastname, email, phone),
        campaign:donation_campaigns(id, name),
        batch:donation_batches(id, name, batch_number, description, status)
      `)
      .eq('organization_id', organizationId);

    // Apply filters
    if (filters.startDate) query = query.gte('date', filters.startDate);
    if (filters.endDate) query = query.lte('date', filters.endDate);
    if (filters.donorId) query = query.eq('donor_id', filters.donorId);
    if (filters.campaignId) query = query.eq('campaign_id', filters.campaignId);

    query = query.order('date', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    return {
      type: reportType,
      filters,
      data: data || [],
      summary: {
        totalAmount: data.reduce((sum, d) => sum + parseFloat(d.amount), 0),
        donationCount: data.length,
        dateRange: {
          start: filters.startDate,
          end: filters.endDate
        }
      }
    };
  } catch (error) {
    throw error;
  }
}

// ================== LEGACY BATCH MIGRATION HELPERS ==================

export async function getLegacyDonations() {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    const { data, error } = await supabase
      .from('donations')
      .select(`
        *,
        batch:donation_batches(id, name, batch_number, description, status)
      `)
      .eq('organization_id', organizationId)
      .eq('is_legacy_batch_summary', true)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error;
  }
}

export async function checkMigrationStatus() {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    const { data, error } = await supabase
      .from('automation_settings')
      .select('setting_value')
      .eq('organization_id', organizationId)
      .eq('setting_key', 'donation_migration_completed')
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    
    return data?.setting_value || { migration_completed: false };
  } catch (error) {
    throw error;
  }
}

export async function getMigrationSummary() {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    // Get counts of legacy vs new donations
    const { data: legacyCount, error: legacyError } = await supabase
      .from('donations')
      .select('id', { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('is_legacy_batch_summary', true);

    const { data: newCount, error: newError } = await supabase
      .from('donations')
      .select('id', { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('is_legacy_batch_summary', false);

    const { data: batchCount, error: batchError } = await supabase
      .from('donation_batches')
      .select('id', { count: 'exact' })
      .eq('organization_id', organizationId);

    if (legacyError || newError || batchError) {
      throw legacyError || newError || batchError;
    }

    return {
      legacyDonations: legacyCount?.length || 0,
      newDonations: newCount?.length || 0,
      totalBatches: batchCount?.length || 0,
      migrationStatus: await checkMigrationStatus()
    };
  } catch (error) {
    throw error;
  }
} 