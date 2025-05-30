const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fetchPrayerRequests() {
  try {
    const { data, error } = await supabase
      .from('prayer_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.length;
  } catch (error) {
    console.error('Error in fetchPrayerRequests:', error);
    throw error;
  }
}

module.exports = {
  fetchPrayerRequests
}; 