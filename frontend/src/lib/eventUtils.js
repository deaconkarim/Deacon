export const getEventTypeColor = (type) => {
  const typeColors = {
    worship: 'bg-blue-100 text-blue-800',
    study: 'bg-purple-100 text-purple-800',
    youth: 'bg-green-100 text-green-800',
    fellowship: 'bg-amber-100 text-amber-800',
    prayer: 'bg-indigo-100 text-indigo-800',
    music: 'bg-pink-100 text-pink-800',
    outreach: 'bg-red-100 text-red-800',
    training: 'bg-cyan-100 text-cyan-800'
  };
  
  return typeColors[type] || 'bg-gray-100 text-gray-800';
};

export const getEventTypeLabel = (type) => {
  const typeLabels = {
    worship: 'Worship',
    study: 'Bible Study',
    youth: 'Youth',
    fellowship: 'Fellowship',
    prayer: 'Prayer',
    music: 'Music',
    outreach: 'Outreach',
    training: 'Training'
  };
  
  return typeLabels[type] || type;
};