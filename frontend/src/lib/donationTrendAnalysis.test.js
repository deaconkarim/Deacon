// Simple test file for donation trend analysis
// This is for development verification only

import { calculateDonationTrend, getWeeklyDonationBreakdown } from './donationTrendAnalysis';

// Mock the dependencies for testing
jest.mock('./supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          gte: jest.fn(() => ({
            lte: jest.fn(() => Promise.resolve({
              data: [
                { amount: 100, date: '2024-01-01' },
                { amount: 150, date: '2024-01-02' },
                { amount: 200, date: '2024-01-08' }
              ],
              error: null
            }))
          }))
        }))
      }))
    }))
  }
}));

jest.mock('./userCache', () => ({
  userCacheService: {
    getCurrentUserOrganizationId: jest.fn(() => Promise.resolve('test-org-id'))
  }
}));

describe('Donation Trend Analysis', () => {
  test('should calculate week of month correctly', () => {
    // This would test the getWeekOfMonth function if it was exported
    const testDate = new Date('2024-01-15'); // Should be week 3
    // Implementation would go here
  });

  test('should calculate donation trend', async () => {
    const result = await calculateDonationTrend();
    expect(result).toHaveProperty('currentWeekDonations');
    expect(result).toHaveProperty('canCalculateTrend');
    expect(result).toHaveProperty('trendDescription');
  });

  test('should get weekly breakdown', async () => {
    const result = await getWeeklyDonationBreakdown();
    expect(Array.isArray(result)).toBe(true);
  });
});

// Manual test function for development
export const manualTest = async () => {

  try {
    const trendResult = await calculateDonationTrend();

    const breakdownResult = await getWeeklyDonationBreakdown();

    return { success: true, trendResult, breakdownResult };
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.message };
  }
}; 