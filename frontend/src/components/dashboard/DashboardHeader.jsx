import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import LeadershipVerse from '@/components/LeadershipVerse';

const DashboardHeader = ({ 
  title = "Command Center",
  subtitle = "Intelligent Church Management System",
  isLoading = false,
  onRefresh,
  showBadges = true
}) => {
  const [badgeStates, setBadgeStates] = useState({
    liveData: false,
    analyticsActive: false,
    aiIntelligence: false
  });

  // Badge activation sequence
  useEffect(() => {
    if (!isLoading && showBadges) {
      // Reset badges first
      setBadgeStates({
        liveData: false,
        analyticsActive: false,
        aiIntelligence: false
      });
      
      // Start badge activation sequence after data loads
      const activateBadges = async () => {
        // 1. Activate Live Data badge (500ms delay)
        setTimeout(() => {
          setBadgeStates(prev => ({ ...prev, liveData: true }));
        }, 500);
        
        // 2. Activate Analytics Active badge (1.5s delay)
        setTimeout(() => {
          setBadgeStates(prev => ({ ...prev, analyticsActive: true }));
        }, 1500);
        
        // 3. Activate AI Intelligence badge (2.5s delay)
        setTimeout(() => {
          setBadgeStates(prev => ({ ...prev, aiIntelligence: true }));
        }, 2500);
      };
      
      activateBadges();
    } else if (isLoading) {
      // Reset badges when loading
      setBadgeStates({
        liveData: false,
        analyticsActive: false,
        aiIntelligence: false
      });
    }
  }, [isLoading, showBadges]);

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <motion.div className="mb-4 sm:mb-8 relative" variants={itemVariants}>
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 blur-3xl rounded-3xl"></div>
      <div className="relative backdrop-blur-sm bg-white/90 dark:bg-slate-900/95 border border-white/30 dark:border-slate-700/50 rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-6 lg:space-y-0">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent mb-2">
              {title}
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-lg font-medium">
              {subtitle}
            </p>
            
            {showBadges && (
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-4">
                <div className={`flex items-center space-x-2 transition-all duration-500 ${badgeStates.liveData ? 'opacity-100 scale-100' : 'opacity-50 scale-95'}`}>
                  <div className={`w-3 h-3 bg-emerald-500 rounded-full transition-all duration-500 ${badgeStates.liveData ? 'animate-pulse shadow-lg shadow-emerald-500/50' : ''}`}></div>
                  <span className={`text-sm transition-all duration-500 ${badgeStates.liveData ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>Live Data</span>
                </div>
                <div className={`flex items-center space-x-2 transition-all duration-500 ${badgeStates.analyticsActive ? 'opacity-100 scale-100' : 'opacity-50 scale-95'}`}>
                  <div className={`w-3 h-3 bg-blue-500 rounded-full transition-all duration-500 ${badgeStates.analyticsActive ? 'animate-pulse shadow-lg shadow-blue-500/50' : ''}`}></div>
                  <span className={`text-sm transition-all duration-500 ${badgeStates.analyticsActive ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>Analytics Active</span>
                </div>
                <div className={`flex items-center space-x-2 transition-all duration-500 ${badgeStates.aiIntelligence ? 'opacity-100 scale-100' : 'opacity-50 scale-95'}`}>
                  <div className={`w-3 h-3 bg-purple-500 rounded-full transition-all duration-500 ${badgeStates.aiIntelligence ? 'animate-pulse shadow-lg shadow-purple-500/50' : ''}`}></div>
                  <span className={`text-sm transition-all duration-500 ${badgeStates.aiIntelligence ? 'text-purple-600 dark:text-purple-400 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>AI Intelligence</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex-shrink-0 max-w-md">
            <div className="relative backdrop-blur-sm bg-white/60 dark:bg-slate-800/90 border border-white/40 dark:border-slate-700/60 rounded-2xl p-4 shadow-lg">
              <LeadershipVerse />
            </div>
            {onRefresh && (
              <Button
                onClick={onRefresh}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="mt-2 w-full bg-white/60 dark:bg-slate-800/60 border-white/40 dark:border-slate-700/60 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-300"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardHeader;