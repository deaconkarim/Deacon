import { supabase } from './supabase';

// Mock data for development
const mockDonations = [
  {
    id: '1',
    date: '2024-05-19',
    amount: '1250.50',
    attendance: 45
  },
  {
    id: '2',
    date: '2024-05-12',
    amount: '1180.75',
    attendance: 42
  },
  {
    id: '3',
    date: '2024-05-05',
    amount: '1320.25',
    attendance: 48
  },
  {
    id: '4',
    date: '2024-04-28',
    amount: '1150.00',
    attendance: 40
  },
  {
    id: '5',
    date: '2024-04-21',
    amount: '1280.50',
    attendance: 44
  }
];

export const getRecentDonations = async () => {
  try {
    const { data: donations, error } = await supabase
      .from('donations')
      .select('*')
      .order('date', { ascending: false })
      .limit(10);

    if (error) throw error;
    return donations;
  } catch (error) {
    console.error('Error fetching donations:', error);
    // Return mock data in case of error
    return mockDonations;
  }
}; 