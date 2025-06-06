import { addMultipleDonations } from '../frontend/src/lib/data.js';

const donations = [
  {
    amount: 3600,
    date: '2025-05-04',
    attendance: 35,
    type: 'weekly'
  },
  {
    amount: 550,
    date: '2025-05-11',
    attendance: 30,
    type: 'weekly'
  },
  {
    amount: 605,
    date: '2025-05-18',
    attendance: 25,
    type: 'weekly'
  },
  {
    amount: 1421,
    date: '2025-05-25',
    attendance: 36,
    type: 'weekly'
  }
];

async function importDonations() {
  try {
    console.log('Starting donation import...');
    const result = await addMultipleDonations(donations);
    console.log('Successfully imported donations:', result);
  } catch (error) {
    console.error('Error importing donations:', error);
  }
}

importDonations(); 