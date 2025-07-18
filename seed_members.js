const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cccxexvoahyeookqmxpl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3hleHZvYWh5ZW9va3FteHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MjU5MDksImV4cCI6MjA2MzAwMTkwOX0.W4AhQt8-ZGkQa7i7rfsdJ5L1ZEn8Yx3crcrWCOGR9pA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedMembers() {
  console.log('🔄 Seeding members data...');
  
  try {
    // Get the organization ID
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('name', 'Brentwood Lighthouse Baptist Church')
      .limit(1);
    
    if (orgError) throw orgError;
    if (!orgs || orgs.length === 0) {
      throw new Error('Organization not found');
    }
    
    const orgId = orgs[0].id;
    console.log(`📋 Using organization: ${orgs[0].name} (${orgId})`);
    
    // Insert members with organization_id
    const members = [
      { firstname: 'JONATHAN', lastname: 'BAKER', email: null, phone: null, address: { street: '169 EVENINGSTAR CT', city: 'PITTSBURG', state: 'CA', zip: '94565-3616' }, role: 'member', status: 'active', notes: 'Additional member: LAURA BAKER', join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'LAURA', lastname: 'BAKER', email: null, phone: null, address: { street: '169 EVENINGSTAR CT', city: 'PITTSBURG', state: 'CA', zip: '94565-3616' }, role: 'member', status: 'active', notes: 'Additional member: JONATHAN BAKER', join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'CAROL', lastname: 'BALDWIN', email: 'cjbaldiwn@comcast.net', phone: '925-516-8949', address: { street: '894 BLOSSOM DR', city: 'BRENTWOOD', state: 'CA', zip: '94513-6142' }, role: 'member', status: 'active', notes: null, join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'WENDY', lastname: 'BERMAN', email: null, phone: '510-641-8056', address: { street: '146 REDOLDO DR', city: 'PITTSBURG', state: 'CA', zip: '94565' }, role: 'member', status: 'active', notes: null, join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'ROY', lastname: 'BLANCHARD', email: null, phone: '925-234-1805', address: { street: 'PO BOX 592', city: 'BYRON', state: 'CA', zip: '94514' }, role: 'member', status: 'active', notes: 'Additional member: MILLIE BLANCHARD', join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'MILLIE', lastname: 'BLANCHARD', email: null, phone: '925-234-1806', address: { street: 'PO BOX 592', city: 'BYRON', state: 'CA', zip: '94514' }, role: 'member', status: 'active', notes: 'Additional member: ROY BLANCHARD', join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'JOHN', lastname: 'BORSDORF', email: null, phone: null, address: { street: '260 SPINDRIFT CT', city: 'OAKLEY', state: 'CA', zip: '94561' }, role: 'member', status: 'active', notes: 'Additional member: KATHY BORSDORF', join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'KATHY', lastname: 'BORSDORF', email: null, phone: null, address: { street: '260 SPINDRIFT CT', city: 'OAKLEY', state: 'CA', zip: '94561' }, role: 'member', status: 'active', notes: 'Additional member: JOHN BORSDORF', join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'DAN', lastname: 'BURCH', email: null, phone: null, address: { street: '260 SPINDRIFT CT', city: 'OAKLEY', state: 'CA', zip: '94561' }, role: 'member', status: 'active', notes: 'Additional member: JANE BURCH', join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'JANE', lastname: 'BURCH', email: null, phone: null, address: { street: '260 SPINDRIFT CT', city: 'OAKLEY', state: 'CA', zip: '94561' }, role: 'member', status: 'active', notes: 'Additional member: DAN BURCH', join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'LESLIE', lastname: 'BUTLER', email: 'butlerleslie91@gmail.com', phone: '925-206-8709', address: { street: '101 SHADY LN', city: 'ANTIOCH', state: 'CA', zip: '94509' }, role: 'member', status: 'active', notes: null, join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'DEBORA', lastname: 'CHEW', email: null, phone: null, address: { street: '330 SHADY OAK DRIVE', city: 'OAKLEY', state: 'CA', zip: '94561' }, role: 'member', status: 'active', notes: null, join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'CORAL', lastname: 'EGGERS', email: null, phone: null, address: { street: '1546 MELLISSA CIRCLE', city: 'ANTIOCH', state: 'CA', zip: '94509' }, role: 'member', status: 'active', notes: null, join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'DONALD', lastname: 'FRAASCH', email: null, phone: '925-238-6849', address: { street: '4021 WOODHILL DR', city: 'OAKLEY', state: 'CA', zip: '94561' }, role: 'member', status: 'active', notes: 'Additional member: ANNA FRAASCH', join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'ANNA', lastname: 'FRAASCH', email: null, phone: null, address: { street: '4021 WOODHILL DR', city: 'OAKLEY', state: 'CA', zip: '94561' }, role: 'member', status: 'active', notes: 'Additional member: DONALD FRAASCH', join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'ANGELA', lastname: 'GALLEGO', email: 'creationbyangela@gmail.com', phone: '925-437-3245', address: { street: '321 LAVENDER WAY', city: 'ANTIOCH', state: 'CA', zip: '94509' }, role: 'member', status: 'active', notes: null, join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'MARK', lastname: 'GARRO', email: null, phone: null, address: { street: '1809 BLOSSOM DR', city: 'OAKLEY', state: 'CA', zip: '94509-2823' }, role: 'member', status: 'active', notes: 'Additional member: VARAN GARRO', join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'VARAN', lastname: 'GARRO', email: null, phone: null, address: { street: '1809 BLOSSOM DR', city: 'OAKLEY', state: 'CA', zip: '94509-2823' }, role: 'member', status: 'active', notes: 'Additional member: MARK GARRO', join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'FELECIA', lastname: 'GAYE', email: null, phone: null, address: { street: '2641 RANCHWOOD DR', city: 'BRENTWOOD', state: 'CA', zip: '94513' }, role: 'member', status: 'active', notes: null, join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'CESAR', lastname: 'GOMEZ', email: null, phone: '408-646-9232', address: { street: '90 DE FREMERY DR', city: 'BRENTWOOD', state: 'CA', zip: '94513' }, role: 'member', status: 'active', notes: null, join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'MARILYN', lastname: 'GOULD', email: null, phone: null, address: { street: '49 CAROL LN APT 213', city: 'OAKLEY', state: 'CA', zip: '94561' }, role: 'member', status: 'active', notes: null, join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'ANTHONY', lastname: 'GROSE', email: 'blbchurchpastor@gmail.com', phone: '925-550-1617', address: { street: '1057 CLEAR LAKE DR', city: 'OAKLEY', state: 'CA', zip: '94561' }, role: 'member', status: 'active', notes: 'Additional member: MARYJANE GROSE', join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'MARYJANE', lastname: 'GROSE', email: null, phone: null, address: { street: '1057 CLEAR LAKE DR', city: 'OAKLEY', state: 'CA', zip: '94561' }, role: 'member', status: 'active', notes: 'Additional member: ANTHONY GROSE', join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'JEANNE', lastname: 'HORGAN', email: null, phone: null, address: { street: '4905 CHISM WAY', city: 'ANTIOCH', state: 'CA', zip: '94531' }, role: 'member', status: 'active', notes: null, join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'FOREST', lastname: 'HUEY', email: 'frhuey@gmail.com', phone: '925-518-8439', address: { street: '510 CHRYSTY ST', city: 'OAKLEY', state: 'CA', zip: '94561' }, role: 'member', status: 'active', notes: 'Additional email: hueyfr@aol.com', join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'DOROTHY', lastname: 'JONES', email: null, phone: null, address: { street: '1708 MEDITERRANEO PL', city: 'BRENTWOOD', state: 'CA', zip: '94513-1767' }, role: 'member', status: 'active', notes: 'Additional member: JOSCELYN JONES', join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'JOSCELYN', lastname: 'JONES', email: null, phone: null, address: { street: '1708 MEDITERRANEO PL', city: 'BRENTWOOD', state: 'CA', zip: '94513-1767' }, role: 'member', status: 'active', notes: 'Additional member: DOROTHY JONES', join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'MELVIN', lastname: 'JONES', email: null, phone: null, address: { street: '278 EVELYN DR', city: 'PLEASANT HILL', state: 'CA', zip: '94523-2256' }, role: 'member', status: 'active', notes: null, join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'KATHY', lastname: 'KILLIPS', email: 'kskillips1121@gmail.com', phone: '925-499-5136', address: { street: '2141CRESTVIEW LANE', city: 'PITTSBURG', state: 'CA', zip: '94565' }, role: 'member', status: 'active', notes: null, join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'ROSE', lastname: 'LEVYAS', email: null, phone: '510-846-2824', address: { street: '1552 SPUMANTE LN', city: 'BRENTWOOD', state: 'CA', zip: '94513' }, role: 'member', status: 'active', notes: null, join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'KARIM', lastname: 'MAGUID', email: 'kmaguid@gmail.com', phone: '925-813-9893', address: { street: '1363 SUNFLOWER LN', city: 'BRENTWOOD', state: 'CA', zip: '94513' }, role: 'member', status: 'active', notes: 'Additional member: AMBER MAGUID', join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'AMBER', lastname: 'MAGUID', email: 'ambermbesser@gmail.com', phone: '925-813-9860', address: { street: '1363 SUNFLOWER LN', city: 'BRENTWOOD', state: 'CA', zip: '94513' }, role: 'member', status: 'active', notes: 'Additional member: KARIM MAGUID', join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'DIANNE', lastname: 'MELGOZA', email: null, phone: null, address: { street: '441 ANNIL DR', city: 'OAKLEY', state: 'CA', zip: '94561' }, role: 'member', status: 'active', notes: null, join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'ERICA', lastname: 'MILLER', email: null, phone: '925-856-7073', address: { street: '5321 FAIRSIDE WAY', city: 'ANTIOCH', state: 'CA', zip: '94531' }, role: 'member', status: 'active', notes: null, join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'DEBRA', lastname: 'MINAKER', email: 'debrad1202@yahoo.com', phone: '925-783-1802', address: { street: '213 UPTON PYNE DR', city: 'BRENTWOOD', state: 'CA', zip: '94513-6425' }, role: 'member', status: 'active', notes: null, join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'MICHAEL', lastname: 'MURRAY', email: null, phone: '925-783-6404', address: { street: '3020 HARRIS DR', city: 'ANTIOCH', state: 'CA', zip: '94509-6344' }, role: 'member', status: 'active', notes: null, join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'YUKI', lastname: 'NAGASAWA', email: null, phone: null, address: { street: '64 CANAL DR', city: 'BAYPOINT', state: 'CA', zip: '94565' }, role: 'member', status: 'active', notes: null, join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'RON', lastname: 'NARO', email: null, phone: null, address: { street: '2904 BELLFLOWER CT', city: 'ANTIOCH', state: 'CA', zip: '94509' }, role: 'member', status: 'active', notes: null, join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'DAVID', lastname: 'NAVARRETTE', email: 'totaleliteca@gmail.com', phone: '925-813-1319', address: { street: '726 BEATRICE ST', city: 'BRENTWOOD', state: 'CA', zip: '94513' }, role: 'member', status: 'active', notes: null, join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'ELAYNE', lastname: 'NAVARRETTE', email: null, phone: null, address: { street: 'PO BOX 660', city: 'COPPEROPOLIS', state: 'CA', zip: '95228-0668' }, role: 'member', status: 'active', notes: 'Additional member: JOE NAVARRETTE', join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'JOE', lastname: 'NAVARRETTE', email: null, phone: null, address: { street: 'PO BOX 660', city: 'COPPEROPOLIS', state: 'CA', zip: '95228-0668' }, role: 'member', status: 'active', notes: 'Additional member: ELAYNE NAVARRETTE', join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'BERTHA', lastname: 'OCHOA', email: null, phone: null, address: { street: '108 E TRIDENT', city: 'PITTSBURG', state: 'CA', zip: '94565' }, role: 'member', status: 'active', notes: null, join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'LORI', lastname: 'POWELL', email: null, phone: '925-219-7534', address: { street: '101 SEENO ST', city: 'PITTSBURG', state: 'CA', zip: '94565' }, role: 'member', status: 'active', notes: null, join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'ROGER', lastname: 'POWELL', email: 'rdpowellags@comcast.net', phone: '925-477-0725', address: { street: '3385 CONTRA LOMA BLVD APT 220A', city: 'ANTIOCH', state: 'CA', zip: '94509' }, role: 'member', status: 'active', notes: null, join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'ANTONIO', lastname: 'SALDANA', email: null, phone: null, address: { street: '47 PALM AV', city: 'PITTSBURG', state: 'CA', zip: '94565' }, role: 'member', status: 'active', notes: null, join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'DON', lastname: 'SCHULTE', email: null, phone: null, address: { street: '502 H ST', city: 'ANTIOCH', state: 'CA', zip: '94509-1266' }, role: 'member', status: 'active', notes: 'Additional member: CHERIL SCHULTE', join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'CHERIL', lastname: 'SCHULTE', email: null, phone: null, address: { street: '502 H ST', city: 'ANTIOCH', state: 'CA', zip: '94509-1266' }, role: 'member', status: 'active', notes: 'Additional member: DON SCHULTE', join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'ERIN', lastname: 'SPEDA', email: null, phone: null, address: { street: '90 DE FREMERY DR', city: 'BRENTWOOD', state: 'CA', zip: '94513' }, role: 'member', status: 'active', notes: null, join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'FERMINA', lastname: 'SOUZA', email: null, phone: null, address: { street: '4132 S. ROYAL LINKS CIRCLE', city: 'ANTIOCH', state: 'CA', zip: '94509-' }, role: 'member', status: 'active', notes: null, join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'OMERO', lastname: 'TALETPA', email: 'lor.tlatelpa@gmail.com', phone: '925-418-9885', address: { street: '4574 FORD CT', city: 'BRENTWOOD', state: 'CA', zip: '94513' }, role: 'member', status: 'active', notes: 'Additional member: LORI TALETPA', join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'LORI', lastname: 'TALETPA', email: null, phone: null, address: { street: '4574 FORD CT', city: 'BRENTWOOD', state: 'CA', zip: '94513' }, role: 'member', status: 'active', notes: 'Additional member: OMERO TALETPA', join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'REBECCA', lastname: 'TSUMA', email: null, phone: null, address: { street: '20 DIANE CT', city: 'OAKLEY', state: 'CA', zip: '94561' }, role: 'member', status: 'active', notes: 'Additional member: ROSE TSUMA', join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'ROSE', lastname: 'TSUMA', email: null, phone: null, address: { street: '20 DIANE CT', city: 'OAKLEY', state: 'CA', zip: '94561' }, role: 'member', status: 'active', notes: 'Additional member: REBECCA TSUMA', join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'CLIVE', lastname: 'TSUMA', email: 'cktsuma@gmail.com', phone: '510-650-6462', address: { street: '20 DIANE CT', city: 'OAKLEY', state: 'CA', zip: '94561' }, role: 'member', status: 'active', notes: 'Additional member: DOREEN KATIBA', join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'DOREEN', lastname: 'KATIBA', email: null, phone: null, address: { street: '20 DIANE CT', city: 'OAKLEY', state: 'CA', zip: '94561' }, role: 'member', status: 'active', notes: 'Additional member: CLIVE TSUMA', join_date: new Date().toISOString(), organization_id: orgId },
      { firstname: 'CAROL', lastname: 'VIRAMONTEZ', email: 'viramontezcarol@gmail.com', phone: '925-813-1350', address: { street: '1038 BISMARCK TERRACE', city: 'BRENTWOOD', state: 'CA', zip: '94513-6918' }, role: 'member', status: 'active', notes: null, join_date: new Date().toISOString(), organization_id: orgId }
    ];
    
    // Insert members
    const { data: insertedMembers, error: membersError } = await supabase
      .from('members')
      .insert(members)
      .select();
    
    if (membersError) throw membersError;
    console.log(`✅ Successfully seeded ${insertedMembers.length} members`);
    
    // Verify the data
    const { data: verifyMembers, error: verifyError } = await supabase
      .from('members')
      .select('id, firstname, lastname, email, organization_id')
      .eq('organization_id', orgId);
    
    if (verifyError) throw verifyError;
    
    console.log('📊 Verification - Members created:');
    verifyMembers.forEach(member => {
      console.log(`  - ${member.firstname} ${member.lastname} (${member.email || 'no email'})`);
    });
    
    return {
      success: true,
      membersCreated: insertedMembers.length,
      totalMembers: verifyMembers.length
    };
    
  } catch (error) {
    console.error('❌ Failed to seed members:', error);
    throw error;
  }
}

// Run the seeding
seedMembers()
  .then((result) => {
    console.log('🎉 Members seeded successfully!');
    console.log('📈 Summary:', result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to seed members:', error);
    process.exit(1);
  }); 