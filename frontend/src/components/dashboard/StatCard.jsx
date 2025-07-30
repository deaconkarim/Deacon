import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { dashboardCalculations } from '@/lib/dashboardDataManager';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
};

const StatCard = ({ 
  title, 
  icon: Icon, 
  value, 
  subValue, 
  description, 
  color = 'blue', 
  isLoading = false,
  trend,
  metrics = [],
  actionLabel,
  actionUrl,
  className = ""
}) => {
  const colorClasses = {
    blue: {
      gradient: 'from-blue-600 to-indigo-600',
      background: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-600 dark:text-blue-400',
      hover: 'hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30'
    },
    emerald: {
      gradient: 'from-emerald-600 to-teal-600',
      background: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20',
      border: 'border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-600',
      hover: 'hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-900/30 dark:hover:to-teal-900/30'
    },
    orange: {
      gradient: 'from-orange-500 to-red-500',
      background: 'from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20',
      border: 'border-orange-200 dark:border-orange-800',
      text: 'text-orange-600',
      hover: 'hover:from-orange-100 hover:to-red-100 dark:hover:from-orange-900/30 dark:hover:to-red-900/30'
    },
    purple: {
      gradient: 'from-purple-500 to-violet-500',
      background: 'from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      text: 'text-purple-600',
      hover: 'hover:from-purple-100 hover:to-violet-100 dark:hover:from-purple-900/30 dark:hover:to-violet-900/30'
    },
    amber: {
      gradient: 'from-yellow-500 to-orange-500',
      background: 'from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-600',
      hover: 'hover:from-yellow-100 hover:to-orange-100 dark:hover:from-yellow-900/30 dark:hover:to-orange-900/30'
    },
    teal: {
      gradient: 'from-teal-500 to-cyan-500',
      background: 'from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20',
      border: 'border-teal-200 dark:border-teal-800',
      text: 'text-teal-600',
      hover: 'hover:from-teal-100 hover:to-cyan-100 dark:hover:from-teal-900/30 dark:hover:to-cyan-900/30'
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  const TrendIcon = trend?.direction === 'up' ? TrendingUp : 
                   trend?.direction === 'down' ? TrendingDown : Minus;

  return (
    <motion.div variants={itemVariants} className={className}>
      <div className="group relative">
        <div className={`absolute -inset-1 bg-gradient-to-r ${colors.gradient} rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-300`}></div>
        <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-3 sm:p-6 lg:p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 bg-gradient-to-br ${colors.gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
                {description && (
                  <p className="text-slate-600 dark:text-slate-400 text-sm">{description}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${colors.text} mb-1`}>
                {isLoading ? '---' : value}
              </div>
              {trend && (
                <div className={`flex items-center text-sm ${colors.text}`}>
                  <TrendIcon className="h-4 w-4 mr-1" />
                  {trend.direction === 'stable' ? 'Stable' : `${trend.percentage.toFixed(1)}%`}
                </div>
              )}
              {subValue && (
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {subValue}
                </div>
              )}
            </div>
          </div>

          {/* Metrics */}
          {metrics.length > 0 && (
            <div className="space-y-4 mb-6">
              {metrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">{metric.label}</span>
                  <div className="flex items-center space-x-2">
                    {metric.progress && (
                      <div className="w-20 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r ${colors.gradient} rounded-full transition-all duration-700`}
                          style={{ width: `${Math.min(metric.progress, 100)}%` }}
                        ></div>
                      </div>
                    )}
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {isLoading ? '...' : metric.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Button */}
          {actionLabel && actionUrl && (
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button 
                variant="outline" 
                className={`w-full bg-gradient-to-r ${colors.background} ${colors.border} ${colors.hover} transition-all duration-300`}
                asChild
              >
                <a href={actionUrl} className="flex items-center justify-center space-x-2">
                  <span>{actionLabel}</span>
                  <ChevronRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;