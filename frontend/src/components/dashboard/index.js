// Dashboard Components - Reusable and streamlined
export { default as DashboardHeader } from './DashboardHeader';
export { default as StatCard } from './StatCard';
export { default as InsightCard } from './InsightCard';
export { default as UnifiedAIInsights } from './UnifiedAIInsights';

// Re-export the dashboard data manager
export { useDashboardData, dashboardCalculations } from '../../lib/dashboardDataManager';