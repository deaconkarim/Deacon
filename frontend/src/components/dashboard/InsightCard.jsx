import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
};

const InsightCard = ({ 
  title, 
  icon: Icon, 
  insights = [], 
  color = 'blue', 
  isLoading = false,
  actions = [],
  className = ""
}) => {
  const colorClasses = {
    blue: {
      gradient: 'from-blue-500 to-blue-600',
      background: 'from-blue-500/20 to-blue-600/20',
      text: 'text-blue-600',
      border: 'border-blue-200 dark:border-blue-800'
    },
    emerald: {
      gradient: 'from-emerald-500 to-emerald-600',
      background: 'from-emerald-500/20 to-emerald-600/20',
      text: 'text-emerald-600',
      border: 'border-emerald-200 dark:border-emerald-800'
    },
    amber: {
      gradient: 'from-amber-500 to-amber-600',
      background: 'from-amber-500/20 to-amber-600/20',
      text: 'text-amber-600',
      border: 'border-amber-200 dark:border-amber-800'
    },
    red: {
      gradient: 'from-red-500 to-red-600',
      background: 'from-red-500/20 to-red-600/20',
      text: 'text-red-600',
      border: 'border-red-200 dark:border-red-800'
    },
    purple: {
      gradient: 'from-purple-500 to-purple-600',
      background: 'from-purple-500/20 to-purple-600/20',
      text: 'text-purple-600',
      border: 'border-purple-200 dark:border-purple-800'
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  if (isLoading) {
    return (
      <motion.div className={`group/card relative ${className}`} variants={itemVariants}>
        <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-500/20 to-slate-600/20 rounded-2xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
        <div className="relative backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div className={`group relative ${className}`} variants={itemVariants}>
      <div className={`absolute -inset-1 bg-gradient-to-r ${colors.gradient} rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-300`}></div>
      <div className="relative backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border border-white/20 dark:border-slate-700/20 rounded-3xl p-3 sm:p-6 lg:p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-12 h-12 bg-gradient-to-br ${colors.gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h3>
            <p className="text-slate-600 dark:text-slate-400">
              {insights.length} {insights.length === 1 ? 'insight' : 'insights'}
            </p>
          </div>
        </div>
        
        {/* Insights */}
        <div className="grid gap-4 grid-cols-1">
          {insights.map((insight, index) => (
            <motion.div 
              key={index}
              className="group/insight relative"
              variants={itemVariants}
            >
              <div className={`absolute -inset-0.5 bg-gradient-to-r ${colors.background} rounded-2xl blur opacity-0 group-hover/insight:opacity-100 transition duration-300`}></div>
              <div className="relative backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-gradient-to-br ${colors.gradient} rounded-xl flex items-center justify-center`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                        {insight.title || 'Insight'}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {insight.category || 'AI-generated insight'}
                      </p>
                    </div>
                  </div>
                  {insight.score && (
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${colors.text}`}>
                        {insight.score}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-500">
                        {insight.scoreLabel || 'score'}
                      </p>
                    </div>
                  )}
                </div>
                
                {insight.description && (
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    {insight.description.split('\n').map((line, lineIndex) => (
                      <p key={lineIndex} className="mb-1">
                        {line}
                      </p>
                    ))}
                  </div>
                )}

                {insight.recommendations && insight.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-slate-900 dark:text-white">
                      Recommendations:
                    </h5>
                    <div className="space-y-1">
                      {insight.recommendations.map((rec, recIndex) => (
                        <div key={recIndex} className="flex items-start gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${colors.text.replace('text-', 'bg-')} mt-2`}></div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 flex-1">
                            {rec}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {insight.metrics && insight.metrics.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-2 gap-3">
                      {insight.metrics.map((metric, metricIndex) => (
                        <div key={metricIndex} className="text-center">
                          <div className={`text-lg font-bold ${colors.text}`}>
                            {metric.value}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-500">
                            {metric.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Actions */}
        {actions.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex gap-2 flex-wrap">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || "outline"}
                size="sm"
                onClick={action.onClick}
                className={action.className || ""}
              >
                {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default InsightCard;