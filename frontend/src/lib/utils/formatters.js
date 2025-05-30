export const formatName = (firstName, lastName) => {
  if (!firstName && !lastName) return '';
  const formattedFirstName = firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase() : '';
  const formattedLastName = lastName ? lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase() : '';
  return `${formattedFirstName} ${formattedLastName}`.trim();
};

export const getInitials = (firstName, lastName) => {
  const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
  const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
  return `${firstInitial}${lastInitial}`;
}; 