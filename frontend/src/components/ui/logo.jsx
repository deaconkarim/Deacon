import React from 'react';

export function Logo({ size = 60, className = "", showText = true }) {
  // Calculate sizes
  const iconSize = showText ? Math.floor(size * 0.6) : size;
  const textSize = Math.floor(size * 0.4);
  
  console.log('Logo component rendering with showText:', showText, 'size:', size);
  
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {/* Church Icon */}
      <span className="inline-block rounded-lg overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center" style={{ width: iconSize, height: iconSize }}>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width={showText ? Math.floor(iconSize * .8) : Math.floor(iconSize * .8)} 
          height={showText ? Math.floor(iconSize * .8) : Math.floor(iconSize * .8)} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="text-white"
        >
          <path d="m18 7 4 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9l4-2"></path>
          <path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4"></path>
          <path d="M18 22V5l-6-3-6 3v17"></path>
          <path d="M12 7v5"></path>
          <path d="M10 9h4"></path>
        </svg>
      </span>
      
      {/* Deacon Text */}
      {showText && (
        <span 
          className="font-bold text-gray-900"
          style={{ fontSize: `${textSize}px` }}
        >
          Deacon
        </span>
      )}
    </div>
  );
}

export default Logo; 