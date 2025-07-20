const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MjU5MDksImV4cCI6MjA2MzAwMTkwOX0.W4AhQt8-ZGkQa7i7rfsdJ5L1ZEn8Yx3crcrWCOGR9pA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreAttendanceRecords() {
  console.log('🔄 Restoring attendance records...');
  
  try {
    // Attendance records that were deleted - based on cleanup output
    const attendanceRecords = [
      // Wednesday Bible Study - 2025-07-17
      { event_id: 'wednesday-bible-study-1749088800000-2025-07-17t02-00-00-000z', member_id: 'f49d869e-5150-478b-89ad-94cac5a6e302', status: 'attending' },
      { event_id: 'wednesday-bible-study-1749088800000-2025-07-17t02-00-00-000z', member_id: '91e32efe-eee5-42e6-98fc-691d52e3c8e3', status: 'attending' },
      { event_id: 'wednesday-bible-study-1749088800000-2025-07-17t02-00-00-000z', member_id: 'e599c3be-99e9-4781-a5c6-315ceb80cf5b', status: 'attending' },
      { event_id: 'wednesday-bible-study-1749088800000-2025-07-17t02-00-00-000z', member_id: '0c7e3d56-d283-4f05-812c-bd9119ed791f', status: 'attending' },
      { event_id: 'wednesday-bible-study-1749088800000-2025-07-17t02-00-00-000z', member_id: '66877faf-4fed-479b-bee7-f647941374c7', status: 'attending' },
      { event_id: 'wednesday-bible-study-1749088800000-2025-07-17t02-00-00-000z', member_id: '6f15fe41-bb25-41ef-9ca1-8d6b941c5886', status: 'attending' },
      { event_id: 'wednesday-bible-study-1749088800000-2025-07-17t02-00-00-000z', member_id: '66803f4c-3dec-4b30-a422-cdbe4cfdb037', status: 'attending' },
      { event_id: 'wednesday-bible-study-1749088800000-2025-07-17t02-00-00-000z', member_id: '09abe9cf-7656-4eed-ad09-e53b2a9ac260', status: 'attending' },
      { event_id: 'wednesday-bible-study-1749088800000-2025-07-17t02-00-00-000z', member_id: '42784a06-eb5c-477f-a839-c8f0649d0dc6', status: 'attending' },
      { event_id: 'wednesday-bible-study-1749088800000-2025-07-17t02-00-00-000z', member_id: '9ed7f11a-68a4-4323-a656-0de2e64ece3a', status: 'attending' },
      { event_id: 'wednesday-bible-study-1749088800000-2025-07-17t02-00-00-000z', member_id: '190ec3f4-5bb0-489b-abab-3bcaca2b4de0', status: 'attending' },
      { event_id: 'wednesday-bible-study-1749088800000-2025-07-17t02-00-00-000z', member_id: '0dc217f0-ae33-42e1-b967-ef62fdda46cf', status: 'attending' },
      { event_id: 'wednesday-bible-study-1749088800000-2025-07-17t02-00-00-000z', member_id: 'f36cc51c-9b35-4f65-a49c-91c4480940ca', status: 'attending' },

      // Tuesday Bible Study - 2025-07-15
      { event_id: 'tuesday-bible-study-1748980800000-2025-07-15t20-00-00-000z', member_id: '91e32efe-eee5-42e6-98fc-691d52e3c8e3', status: 'attending' },
      { event_id: 'tuesday-bible-study-1748980800000-2025-07-15t20-00-00-000z', member_id: 'e599c3be-99e9-4781-a5c6-315ceb80cf5b', status: 'attending' },
      { event_id: 'tuesday-bible-study-1748980800000-2025-07-15t20-00-00-000z', member_id: '66877faf-4fed-479b-bee7-f647941374c7', status: 'attending' },
      { event_id: 'tuesday-bible-study-1748980800000-2025-07-15t20-00-00-000z', member_id: '3f1079fc-6234-4d21-a4d0-b1e9de368cde', status: 'attending' },
      { event_id: 'tuesday-bible-study-1748980800000-2025-07-15t20-00-00-000z', member_id: 'bdb2c8de-a96a-47c4-ad61-3c149b9cafad', status: 'attending' },
      { event_id: 'tuesday-bible-study-1748980800000-2025-07-15t20-00-00-000z', member_id: 'f36cc51c-9b35-4f65-a49c-91c4480940ca', status: 'attending' },

      // Sunday Morning Worship Service - 2025-07-13
      { event_id: 'sunday-morning-worship-service-1746381600000-2025-07-13t18-00-00-000z', member_id: '0c5ca2bc-1b78-46f7-9451-c9c2c4830544', status: 'attending' },
      { event_id: 'sunday-morning-worship-service-1746381600000-2025-07-13t18-00-00-000z', member_id: 'f49d869e-5150-478b-89ad-94cac5a6e302', status: 'attending' },
      { event_id: 'sunday-morning-worship-service-1746381600000-2025-07-13t18-00-00-000z', member_id: 'e54704d0-9a83-4286-a60e-021ce49d348c', status: 'attending' },
      { event_id: 'sunday-morning-worship-service-1746381600000-2025-07-13t18-00-00-000z', member_id: '91e32efe-eee5-42e6-98fc-691d52e3c8e3', status: 'attending' },
      { event_id: 'sunday-morning-worship-service-1746381600000-2025-07-13t18-00-00-000z', member_id: '338ecc17-e359-4911-a488-fd443d814296', status: 'attending' },
      { event_id: 'sunday-morning-worship-service-1746381600000-2025-07-13t18-00-00-000z', member_id: 'c6ad9e65-12c6-4aec-aab9-67bf37fd2b57', status: 'attending' },
      { event_id: 'sunday-morning-worship-service-1746381600000-2025-07-13t18-00-00-000z', member_id: 'abc76532-0db7-4399-9c79-f3aabcd40d51', status: 'attending' },
      { event_id: 'sunday-morning-worship-service-1746381600000-2025-07-13t18-00-00-000z', member_id: 'c56703d2-52a7-4727-ae01-f9296c8997cd', status: 'attending' },
      { event_id: 'sunday-morning-worship-service-1746381600000-2025-07-13t18-00-00-000z', member_id: 'e599c3be-99e9-4781-a5c6-315ceb80cf5b', status: 'attending' },
      { event_id: 'sunday-morning-worship-service-1746381600000-2025-07-13t18-00-00-000z', member_id: '89978847-5e1b-4511-89df-2577f9ec0832', status: 'attending' },
      { event_id: 'sunday-morning-worship-service-1746381600000-2025-07-13t18-00-00-000z', member_id: '0c7e3d56-d283-4f05-812c-bd9119ed791f', status: 'attending' },
      { event_id: 'sunday-morning-worship-service-1746381600000-2025-07-13t18-00-00-000z', member_id: '6f15fe41-bb25-41ef-9ca1-8d6b941c5886', status: 'attending' },
      { event_id: 'sunday-morning-worship-service-1746381600000-2025-07-13t18-00-00-000z', member_id: '66877faf-4fed-479b-bee7-f647941374c7', status: 'attending' },
      { event_id: 'sunday-morning-worship-service-1746381600000-2025-07-13t18-00-00-000z', member_id: '251b90b3-10a4-48f5-b9a9-e0f1d583848f', status: 'attending' },
      { event_id: 'sunday-morning-worship-service-1746381600000-2025-07-13t18-00-00-000z', member_id: '7f04d456-afcd-4d50-9835-a7299dcc112a', status: 'attending' },
      { event_id: 'sunday-morning-worship-service-1746381600000-2025-07-13t18-00-00-000z', member_id: '3fc60c84-e41f-4c3b-91da-b757721f099d', status: 'attending' },
      { event_id: 'sunday-morning-worship-service-1746381600000-2025-07-13t18-00-00-000z', member_id: '66803f4c-3dec-4b30-a422-cdbe4cfdb037', status: 'attending' },
      { event_id: 'sunday-morning-worship-service-1746381600000-2025-07-13t18-00-00-000z', member_id: '3f97cb68-a643-495d-91d6-7a7478230474', status: 'attending' },
      { event_id: 'sunday-morning-worship-service-1746381600000-2025-07-13t18-00-00-000z', member_id: '09abe9cf-7656-4eed-ad09-e53b2a9ac260', status: 'attending' },
      { event_id: 'sunday-morning-worship-service-1746381600000-2025-07-13t18-00-00-000z', member_id: '3f1079fc-6234-4d21-a4d0-b1e9de368cde', status: 'attending' },
      { event_id: 'sunday-morning-worship-service-1746381600000-2025-07-13t18-00-00-000z', member_id: '9ed7f11a-68a4-4323-a656-0de2e64ece3a', status: 'attending' },
      { event_id: 'sunday-morning-worship-service-1746381600000-2025-07-13t18-00-00-000z', member_id: '190ec3f4-5bb0-489b-abab-3bcaca2b4de0', status: 'attending' },
      { event_id: 'sunday-morning-worship-service-1746381600000-2025-07-13t18-00-00-000z', member_id: '0dc217f0-ae33-42e1-b967-ef62fdda46cf', status: 'attending' },
      { event_id: 'sunday-morning-worship-service-1746381600000-2025-07-13t18-00-00-000z', member_id: 'e15b2538-06e5-4b0a-8ec5-d76fa5c679b1', status: 'attending' },
      { event_id: 'sunday-morning-worship-service-1746381600000-2025-07-13t18-00-00-000z', member_id: 'f36cc51c-9b35-4f65-a49c-91c4480940ca', status: 'attending' },
      { event_id: 'sunday-morning-worship-service-1746381600000-2025-07-13t18-00-00-000z', member_id: '33163ff8-59c6-4b48-94ae-0e4134919a34', status: 'attending' },
      { event_id: 'sunday-morning-worship-service-1746381600000-2025-07-13t18-00-00-000z', member_id: '6c1fc0b8-e0b2-42c9-853b-ff8e09a9de67', status: 'attending' },
      { event_id: 'sunday-morning-worship-service-1746381600000-2025-07-13t18-00-00-000z', member_id: null, status: 'attending' },
      { event_id: 'sunday-morning-worship-service-1746381600000-2025-07-13t18-00-00-000z', member_id: 'ce0214c2-34c0-499c-b296-45e9d0a23b1f', status: 'attending' },
      { event_id: 'sunday-morning-worship-service-1746381600000-2025-07-13t18-00-00-000z', member_id: '9ffc7e80-cde7-4ee9-942f-f8e865913b3b', status: 'attending' },
      { event_id: 'sunday-morning-worship-service-1746381600000-2025-07-13t18-00-00-000z', member_id: '106f0e0c-157d-4da7-aa61-25e6e0a9ecb8', status: 'attending' },
      { event_id: 'sunday-morning-worship-service-1746381600000-2025-07-13t18-00-00-000z', member_id: '095ac65a-bdd9-46e9-b708-8c1b383b26c8', status: 'attending' },
      { event_id: 'sunday-morning-worship-service-1746381600000-2025-07-13t18-00-00-000z', member_id: 'cbd9b6e8-3643-42d4-b9b5-39c5f8c86d4d', status: 'attending' },

      // Men's Ministry Breakfast - 2025-07-19
      { event_id: 'men-s-ministry-breakfast-1747497600000', member_id: '91e32efe-eee5-42e6-98fc-691d52e3c8e3', status: 'attending' },
      { event_id: 'men-s-ministry-breakfast-1747497600000', member_id: '7f04d456-afcd-4d50-9835-a7299dcc112a', status: 'attending' },
      { event_id: 'men-s-ministry-breakfast-1747497600000', member_id: 'e599c3be-99e9-4781-a5c6-315ceb80cf5b', status: 'attending' },
      { event_id: 'men-s-ministry-breakfast-1747497600000', member_id: '66803f4c-3dec-4b30-a422-cdbe4cfdb037', status: 'attending' },
      { event_id: 'men-s-ministry-breakfast-1747497600000', member_id: '0c7e3d56-d283-4f05-812c-bd9119ed791f', status: 'attending' },
      { event_id: 'men-s-ministry-breakfast-1747497600000', member_id: '68c96171-fc02-46ed-b619-9c20e5d81637', status: 'attending' },
      { event_id: 'men-s-ministry-breakfast-1747497600000', member_id: '9c52cb95-8394-4222-9950-f40a5db8228e', status: 'attending' },
      { event_id: 'men-s-ministry-breakfast-1747497600000', member_id: '09abe9cf-7656-4eed-ad09-e53b2a9ac260', status: 'attending' },
      { event_id: 'men-s-ministry-breakfast-1747497600000', member_id: 'b679d219-a4a8-432e-bf9f-f6e32d79c5b5', status: 'attending' },
      { event_id: 'men-s-ministry-breakfast-1747497600000', member_id: '0dc217f0-ae33-42e1-b967-ef62fdda46cf', status: 'attending' },
      { event_id: 'men-s-ministry-breakfast-1747497600000', member_id: '06965448-5e21-4e2f-914b-694de68ac2ef', status: 'attending' },
      { event_id: 'men-s-ministry-breakfast-1747497600000', member_id: 'f36cc51c-9b35-4f65-a49c-91c4480940ca', status: 'attending' },
      { event_id: 'men-s-ministry-breakfast-1747497600000', member_id: '6c1fc0b8-e0b2-42c9-853b-ff8e09a9de67', status: 'attending' },
      { event_id: 'men-s-ministry-breakfast-1747497600000', member_id: 'd99c0c0f-0d71-4099-aff2-635c29441268', status: 'attending' }
    ];

    console.log(`📊 Attempting to restore ${attendanceRecords.length} attendance records...`);

    // Filter out records with null member_id
    const validRecords = attendanceRecords.filter(record => record.member_id !== null);
    console.log(`📊 Valid records to restore: ${validRecords.length}`);

    // Insert the attendance records in batches
    const batchSize = 50;
    let createdCount = 0;

    for (let i = 0; i < validRecords.length; i += batchSize) {
      const batch = validRecords.slice(i, i + batchSize);
      
      const { data: createdBatch, error: batchError } = await supabase
        .from('event_attendance')
        .insert(batch)
        .select();

      if (batchError) {
        console.error(`❌ Error creating batch ${Math.floor(i/batchSize) + 1}:`, batchError);
        throw batchError;
      }

      createdCount += createdBatch?.length || 0;
      console.log(`✅ Created batch ${Math.floor(i/batchSize) + 1}: ${createdBatch?.length || 0} records`);
    }

    console.log(`✅ Successfully restored ${createdCount} attendance records`);

    // Verify the restoration
    const { data: allAttendance, error: verifyError } = await supabase
      .from('event_attendance')
      .select('*');

    if (verifyError) throw verifyError;

    console.log(`\n📊 Total attendance records in database: ${allAttendance?.length || 0}`);

    return {
      totalRecords: allAttendance?.length || 0,
      createdRecords: createdCount,
      originalCount: attendanceRecords.length
    };

  } catch (error) {
    console.error('❌ Error restoring attendance records:', error);
    throw error;
  }
}

// Run the restoration
restoreAttendanceRecords()
  .then((result) => {
    console.log('\n🎉 Attendance restoration completed!');
    console.log('📈 Summary:', result);
    console.log('\n🔄 Next steps:');
    console.log('   1. Refresh the dashboard page');
    console.log('   2. The attendance data should now show correctly');
    console.log('   3. Check that events show proper attendance counts');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to restore attendance records:', error);
    process.exit(1);
  });