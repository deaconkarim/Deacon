// Script to add test donations for the current month
const { createClient } = require('@supabase/supabase-js');

// You'll need to add your Supabase URL and anon key here
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addTestDonations() {
  try {
    // Get current date
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12 format
    
    console.log(`Adding test donations for ${currentYear}-${currentMonth.toString().padStart(2, '0')}`);
    
    // Get the first organization (assuming it exists)
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);
    
    if (orgError || !orgs || orgs.length === 0) {
      console.error('No organizations found');
      return;
    }
    
    const organizationId = orgs[0].id;
    console.log('Using organization ID:', organizationId);
    
    // Add test donations for current month
    const testDonations = [
      {
        amount: 1000,
        date: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`,
        type: 'weekly',
        attendance: 25,
        organization_id: organizationId
      },
      {
        amount: 1200,
        date: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-08`,
        type: 'weekly',
        attendance: 30,
        organization_id: organizationId
      },
      {
        amount: 800,
        date: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-15`,
        type: 'weekly',
        attendance: 20,
        organization_id: organizationId
      },
      {
        amount: 1500,
        date: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-22`,
        type: 'weekly',
        attendance: 35,
        organization_id: organizationId
      }
    ];
    
    const { data, error } = await supabase
      .from('donations')
      .insert(testDonations)
      .select();
    
    if (error) {
      console.error('Error adding test donations:', error);
    } else {
      console.log('Test donations added successfully:', data);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Uncomment the line below to run the script
// addTestDonations(); 