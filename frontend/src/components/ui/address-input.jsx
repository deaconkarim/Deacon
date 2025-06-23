import React from 'react';
import { Input } from './input';

export function AddressInput({ value, onChange, className }) {
  // Handle both string and object value formats
  let addressParts = ['', '', '', ''];
  let street = '', city = '', state = '', zip = '';

  if (typeof value === 'string') {
    // Handle string format (comma-separated)
    addressParts = value ? value.split(',') : ['', '', '', ''];
    [street, city, stateZip] = addressParts;
    [state, zip] = stateZip ? stateZip.trim().split(' ') : ['', ''];
  } else if (value && typeof value === 'object') {
    // Handle object format
    street = value.street || '';
    city = value.city || '';
    state = value.state || '';
    zip = value.zip || '';
  }

  const handleChange = (field, newValue) => {
    let updatedStreet = street;
    let updatedCity = city;
    let updatedState = state;
    let updatedZip = zip;

    switch (field) {
      case 'street':
        updatedStreet = newValue;
        break;
      case 'city':
        updatedCity = newValue;
        break;
      case 'state':
        updatedState = newValue;
        break;
      case 'zip':
        updatedZip = newValue;
        break;
    }

    // Return object format
    const addressObj = {
      street: updatedStreet,
      city: updatedCity,
      state: updatedState,
      zip: updatedZip
    };
    onChange(addressObj);
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