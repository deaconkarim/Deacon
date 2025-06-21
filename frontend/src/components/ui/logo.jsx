import React from 'react';

export function Logo({ size = 40, className = "" }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      className={className}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Church building - main structure */}
      <rect 
        x="20" 
        y="45" 
        width="60" 
        height="35" 
        rx="2"
        fill="url(#churchGradient)"
      />
      
      {/* Church steeple */}
      <path 
        d="M50 15 L35 45 L65 45 Z" 
        fill="url(#churchGradient)"
      />
      
      {/* Church door */}
      <rect 
        x="42" 
        y="55" 
        width="16" 
        height="25" 
        rx="1"
        fill="white"
        opacity="0.9"
      />
      
      {/* Church windows */}
      <rect 
        x="25" 
        y="50" 
        width="8" 
        height="8" 
        rx="1"
        fill="white"
        opacity="0.8"
      />
      <rect 
        x="67" 
        y="50" 
        width="8" 
        height="8" 
        rx="1"
        fill="white"
        opacity="0.8"
      />
      
      {/* Cross on steeple */}
      <rect 
        x="48" 
        y="25" 
        width="4" 
        height="12" 
        fill="white"
        opacity="0.9"
      />
      <rect 
        x="45" 
        y="28" 
        width="10" 
        height="4" 
        fill="white"
        opacity="0.9"
      />
      
      {/* Gradient definition */}
      <defs>
        <linearGradient id="churchGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default Logo; 