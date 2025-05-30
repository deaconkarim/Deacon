import React from 'react';
import { Input } from './input';

export function AddressInput({ value, onChange, className }) {
  // Split the address into components
  const addressParts = value ? value.split(',') : ['', '', '', ''];
  const [street, city, stateZip] = addressParts;
  const [state, zip] = stateZip ? stateZip.trim().split(' ') : ['', ''];

  const handleChange = (field, newValue) => {
    let newAddress = '';
    switch (field) {
      case 'street':
        newAddress = `${newValue}, ${city}, ${state} ${zip}`.trim();
        break;
      case 'city':
        newAddress = `${street}, ${newValue}, ${state} ${zip}`.trim();
        break;
      case 'state':
        newAddress = `${street}, ${city}, ${newValue} ${zip}`.trim();
        break;
      case 'zip':
        newAddress = `${street}, ${city}, ${state} ${newValue}`.trim();
        break;
    }
    // Remove any double commas or extra spaces
    newAddress = newAddress.replace(/,\s*,/g, ',').replace(/\s+/g, ' ').trim();
    onChange(newAddress);
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      <div className="md:col-span-2">
        <Input
          type="text"
          value={street}
          onChange={(e) => handleChange('street', e.target.value)}
          placeholder="Street Address"
          className="w-full"
        />
      </div>
      <Input
        type="text"
        value={city}
        onChange={(e) => handleChange('city', e.target.value)}
        placeholder="City"
        className="w-full"
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          type="text"
          value={state}
          onChange={(e) => handleChange('state', e.target.value)}
          placeholder="State"
          className="w-full"
          maxLength={2}
        />
        <Input
          type="text"
          value={zip}
          onChange={(e) => handleChange('zip', e.target.value)}
          placeholder="ZIP Code"
          className="w-full"
          maxLength={5}
        />
      </div>
    </div>
  );
} 