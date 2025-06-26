import React from 'react';
import logoImg from './logo.png';

export function Logo({ size = 40, className = "" }) {
  return (
    <img
      src={logoImg}
      alt="Deacon Logo"
      width={size}
      height={size}
      className={className}
      style={{ display: 'inline-block', objectFit: 'contain', borderRadius: 8 }}
    />
  );
}

export default Logo; 