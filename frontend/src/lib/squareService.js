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

    const { data, error } = await supabase
      .from('square_settings')
      .upsert({
        organization_id: organizationId,
        ...settings,
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
    
    const { data, error } = await supabase
      .from('donation_urls')
      .insert({
        organization_id: organizationId,
        name: urlData.name,
        description: urlData.description,
        slug: slug,
        campaign_id: urlData.campaign_id,
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

    const { data, error } = await supabase
      .from('donation_urls')
      .update({
        ...updates,
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
        organization:organizations(id, name, logo_url, primary_color, secondary_color),
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