import { supabase } from './supabaseClient';
import { userCacheService } from './userCache';

// Helper function to get current user's organization ID
const getCurrentUserOrganizationId = async () => {
  return await userCacheService.getCurrentUserOrganizationId();
};

// ================== SQUARE ORGANIZATION SETTINGS ==================

export async function getSquareSettings() {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    const { data, error } = await supabase
      .from('square_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw error;
    }

    return data || null;
  } catch (error) {
    throw error;
  }
}

export async function updateSquareSettings(settings) {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    // Remove location_id if it's empty or not provided
    const { location_id, ...otherSettings } = settings;
    const cleanSettings = location_id ? { ...otherSettings, location_id } : otherSettings;

    const { data, error } = await supabase
      .from('square_settings')
      .upsert({
        organization_id: organizationId,
        ...cleanSettings,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'organization_id'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

// ================== DONATION URLS ==================

export async function getDonationUrls() {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    const { data, error } = await supabase
      .from('donation_urls')
      .select(`
        *,
        campaign:donation_campaigns(id, name, description)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error;
  }
}

export async function createDonationUrl(urlData) {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    // Generate a unique URL slug
    const slug = generateUrlSlug(urlData.name || 'Donation');
    
    // Handle "none" campaign_id as null
    const campaignId = urlData.campaign_id === 'none' ? null : urlData.campaign_id;
    
    const { data, error } = await supabase
      .from('donation_urls')
      .insert({
        organization_id: organizationId,
        name: urlData.name,
        description: urlData.description,
        slug: slug,
        campaign_id: campaignId,
        suggested_amounts: urlData.suggested_amounts || [],
        custom_message: urlData.custom_message,
        is_active: urlData.is_active !== false,
        metadata: urlData.metadata || {}
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

export async function updateDonationUrl(id, updates) {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    // Handle "none" campaign_id as null
    const cleanUpdates = { ...updates };
    if (cleanUpdates.campaign_id === 'none') {
      cleanUpdates.campaign_id = null;
    }

    const { data, error } = await supabase
      .from('donation_urls')
      .update({
        ...cleanUpdates,
        updated_at: new Date().toISOString()
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

export async function deleteDonationUrl(id) {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    const { error } = await supabase
      .from('donation_urls')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) throw error;
    return true;
  } catch (error) {
    throw error;
  }
}

// ================== PUBLIC DONATION PAGE ==================

export async function getDonationUrlBySlug(slug) {
  try {
    const { data, error } = await supabase
      .from('donation_urls')
      .select(`
        *,
        organization:organizations(id, name, logo_url),
        campaign:donation_campaigns(id, name, description, goal_amount, current_amount)
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

export async function processSquareDonation(donationData) {
  try {
    const { data, error } = await supabase
      .from('square_donations')
      .insert({
        donation_url_id: donationData.donation_url_id,
        organization_id: donationData.organization_id,
        donor_name: donationData.donor_name,
        donor_email: donationData.donor_email,
        amount: donationData.amount,
        square_payment_id: donationData.square_payment_id,
        square_transaction_id: donationData.square_transaction_id,
        fund_designation: donationData.fund_designation,
        message: donationData.message,
        is_anonymous: donationData.is_anonymous || false,
        metadata: donationData.metadata || {}
      })
      .select()
      .single();

    if (error) throw error;

    // Automatically sync to main donations table
    try {
      await syncSquareDonationToMainSystem(data.id);
    } catch (syncError) {
      console.error('Failed to sync Square donation to main system:', syncError);
      // Don't fail the entire transaction if sync fails
    }

    return data;
  } catch (error) {
    throw error;
  }
}

// ================== SQUARE PAYMENT PROCESSING ==================

export async function createSquarePayment(paymentData) {
  try {
    // This would typically call your backend API that handles Square payments
    // For now, we'll simulate the process
    const response = await fetch('/api/square/create-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      throw new Error('Payment processing failed');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

// ================== ANALYTICS ==================

export async function getSquareDonationAnalytics(startDate, endDate) {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    const { data, error } = await supabase
      .from('square_donations')
      .select(`
        *,
        donation_url:donation_urls(name, slug),
        campaign:donation_campaigns(name)
      `)
      .eq('organization_id', organizationId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Calculate analytics
    const totalAmount = data.reduce((sum, donation) => sum + parseFloat(donation.amount), 0);
    const totalDonations = data.length;
    const uniqueDonors = new Set(data.map(d => d.donor_email)).size;
    const averageDonation = totalDonations > 0 ? totalAmount / totalDonations : 0;

    // Group by donation URL
    const byUrl = data.reduce((acc, donation) => {
      const urlName = donation.donation_url?.name || 'Unknown';
      if (!acc[urlName]) {
        acc[urlName] = { count: 0, amount: 0 };
      }
      acc[urlName].count++;
      acc[urlName].amount += parseFloat(donation.amount);
      return acc;
    }, {});

    return {
      totalAmount,
      totalDonations,
      uniqueDonors,
      averageDonation,
      byUrl,
      donations: data
    };
  } catch (error) {
    throw error;
  }
}

// ================== UTILITY FUNCTIONS ==================

function generateUrlSlug(name) {
  const timestamp = Date.now().toString(36);
  const cleanName = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  return `${cleanName}-${timestamp}`;
}

export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function generateDonationUrl(baseUrl, slug) {
  return `${baseUrl}/donate/${slug}`;
}

// ================== SQUARE WEB SDK INTEGRATION ==================

export async function initializeSquareWebPayments(applicationId, locationId) {
  try {
    // This would be called from the donation page component
    // The actual Square Web SDK initialization happens in the component
    return {
      applicationId,
      locationId
    };
  } catch (error) {
    throw error;
  }
}

export function createSquarePaymentForm(amount, currency = 'USD') {
  // This function returns the configuration for the Square payment form
  return {
    amount: amount * 100, // Square expects amounts in cents
    currency: currency,
    intent: 'CAPTURE'
  };
}

// ================== DEBUG FUNCTIONS ==================

export async function debugDonationUrls() {
  try {
    console.log('Checking if donation_urls table exists...');
    
    // Try to query the table
    const { data, error } = await supabase
      .from('donation_urls')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error accessing donation_urls table:', error);
      return {
        tableExists: false,
        error: error.message,
        code: error.code
      };
    }

    console.log('donation_urls table exists, found', data?.length || 0, 'records');
    
    // Get all donation URLs for debugging
    const { data: allUrls, error: allError } = await supabase
      .from('donation_urls')
      .select('*');

    if (allError) {
      console.error('Error getting all donation URLs:', allError);
    } else {
      console.log('All donation URLs:', allUrls);
    }

    return {
      tableExists: true,
      recordCount: data?.length || 0,
      allUrls: allUrls || []
    };
  } catch (error) {
    console.error('Debug function error:', error);
    return {
      tableExists: false,
      error: error.message
    };
  }
}

// ================== INTEGRATION WITH EXISTING DONATION SYSTEM ==================

export async function syncSquareDonationToMainSystem(squareDonationId) {
  try {
    // Get the Square donation with full details
    const { data: squareDonation, error: squareError } = await supabase
      .from('square_donations')
      .select(`
        *,
        donation_url:donation_urls(
          id,
          name,
          campaign_id,
          organization_id
        )
      `)
      .eq('id', squareDonationId)
      .single();

    if (squareError) throw squareError;

    // Check if this Square donation has already been synced
    const { data: existingDonation, error: checkError } = await supabase
      .from('donations')
      .select('id')
      .eq('square_donation_id', squareDonationId)
      .single();

    if (existingDonation) {
      console.log('Square donation already synced to main system');
      return existingDonation;
    }

    // Create donation in main donations table
    const mainDonation = {
      organization_id: squareDonation.organization_id,
      date: new Date().toISOString().split('T')[0], // Today's date
      amount: squareDonation.amount,
      payment_method: 'online',
      fund_designation: squareDonation.fund_designation,
      notes: `Online donation via Square - ${squareDonation.donation_url?.name || 'Donation Page'}`,
      is_anonymous: squareDonation.is_anonymous,
      campaign_id: squareDonation.donation_url?.campaign_id,
      donation_url_id: squareDonation.donation_url_id,
      square_donation_id: squareDonation.id, // Link back to Square donation
      metadata: {
        square_payment_id: squareDonation.square_payment_id,
        square_transaction_id: squareDonation.square_transaction_id,
        donor_email: squareDonation.donor_email,
        donor_name: squareDonation.donor_name,
        message: squareDonation.message,
        source: 'square_online'
      }
    };

    const { data: newDonation, error: insertError } = await supabase
      .from('donations')
      .insert(mainDonation)
      .select()
      .single();

    if (insertError) throw insertError;

    console.log('Square donation synced to main donation system:', newDonation.id);
    return newDonation;
  } catch (error) {
    console.error('Error syncing Square donation to main system:', error);
    throw error;
  }
}

export async function syncAllSquareDonations() {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    // Get all Square donations that haven't been synced yet
    const { data: unsyncedDonations, error } = await supabase
      .from('square_donations')
      .select('id')
      .eq('organization_id', organizationId)
      .not('id', 'in', `(
        SELECT square_donation_id 
        FROM donations 
        WHERE square_donation_id IS NOT NULL
      )`);

    if (error) throw error;

    console.log(`Found ${unsyncedDonations?.length || 0} unsynced Square donations`);

    // Sync each unsynced donation
    const syncPromises = unsyncedDonations?.map(donation => 
      syncSquareDonationToMainSystem(donation.id)
    ) || [];

    const results = await Promise.allSettled(syncPromises);
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Sync completed: ${successful} successful, ${failed} failed`);
    
    return {
      total: unsyncedDonations?.length || 0,
      successful,
      failed
    };
  } catch (error) {
    console.error('Error syncing all Square donations:', error);
    throw error;
  }
}

export async function getIntegratedDonations(filters = {}) {
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
        batch:donation_batches(id, name, batch_number, description, status),
        square_donation:square_donations(id, square_payment_id, square_transaction_id, donor_email, donor_name)
      `)
      .eq('organization_id', organizationId);

    // Apply filters
    if (filters.startDate) {
      query = query.gte('date', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('date', filters.endDate);
    }
    if (filters.paymentMethod && filters.paymentMethod !== 'all') {
      query = query.eq('payment_method', filters.paymentMethod);
    }
    if (filters.source === 'square') {
      query = query.not('square_donation_id', 'is', null);
    }
    if (filters.source === 'manual') {
      query = query.is('square_donation_id', null);
    }

    query = query.order('date', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error;
  }
}