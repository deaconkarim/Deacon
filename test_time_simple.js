// Simple test for time formatting logic
console.log('🕐 Testing Time Formatting Logic...\n');

// Test with the specific event time mentioned in the issue
const eventStartDate = '2025-08-22T15:30:00.000Z'; // 3:30 PM UTC
console.log(`Original event time: ${eventStartDate}`);

// Test the old logic (problematic)
console.log('\n❌ Old Logic (Problematic):');
const oldEventDate = new Date(eventStartDate);
const oldFormattedDate = oldEventDate.toLocaleDateString('en-US', {
  month: '2-digit',
  day: '2-digit',
  year: 'numeric'
});
const oldFormattedTime = oldEventDate.toLocaleTimeString('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
});
console.log(`   Date: ${oldFormattedDate}`);
console.log(`   Time: ${oldFormattedTime}`);

// Test the new logic (fixed)
console.log('\n✅ New Logic (Fixed):');
const newEventDate = new Date(eventStartDate); // Parse as UTC
const newFormattedDate = newEventDate.toLocaleDateString('en-US', {
  month: '2-digit',
  day: '2-digit',
  year: 'numeric',
  timeZone: 'UTC'
});
const newFormattedTime = newEventDate.toLocaleTimeString('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZone: 'UTC'
});
console.log(`   Date: ${newFormattedDate}`);
console.log(`   Time: ${newFormattedTime}`);

// Test message template rendering
console.log('\n📱 Message Template Test:');
const template = 'Reminder: {event_title} on {event_date} at {event_time}. {event_location}';
const messageText = template
  .replace(/{event_title}/g, 'Test Event')
  .replace(/{event_time}/g, newFormattedTime)
  .replace(/{event_date}/g, newFormattedDate)
  .replace(/{event_location}/g, 'Fellowship Hall');

console.log(`   Template: ${template}`);
console.log(`   Result: ${messageText}`);

// Test different timezone scenarios
console.log('\n🌍 Timezone Comparison:');
const testTimes = [
  '2025-08-22T15:30:00.000Z', // 3:30 PM UTC
  '2025-08-22T15:30:00',      // 3:30 PM local
  '2025-08-22T22:30:00.000Z', // 10:30 PM UTC (what was showing incorrectly)
];

testTimes.forEach((time, index) => {
  const date = new Date(time);
  const utcTime = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC'
  });
  const localTime = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  console.log(`   ${index + 1}. ${time}`);
  console.log(`      UTC: ${utcTime}`);
  console.log(`      Local: ${localTime}`);
});

console.log('\n✅ Time formatting test completed');