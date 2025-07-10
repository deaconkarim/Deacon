import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DemoConfig {
  organizationId: string
  memberCount: number
  weeksToGenerate: number
  startDate: Date
}

class DemoDataGenerator {
  private supabase: any
  private config: DemoConfig

  constructor(supabaseUrl: string, supabaseKey: string, config: DemoConfig) {
    this.supabase = createClient(supabaseUrl, supabaseKey)
    this.config = config
  }

  // Generate realistic member names and demographics
  private generateMembers() {
    const adultFirstNames = [
      'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
      'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
      'Thomas', 'Sarah', 'Christopher', 'Karen', 'Charles', 'Nancy', 'Daniel', 'Lisa',
      'Matthew', 'Betty', 'Anthony', 'Helen', 'Mark', 'Sandra', 'Donald', 'Donna',
      'Steven', 'Carol', 'Paul', 'Ruth', 'Andrew', 'Sharon', 'Joshua', 'Michelle',
      'Kenneth', 'Laura', 'Kevin', 'Sarah', 'Brian', 'Kimberly', 'George', 'Deborah',
      'Timothy', 'Dorothy', 'Ronald', 'Lisa', 'Jason', 'Nancy', 'Edward', 'Karen'
    ]
    
    const childFirstNames = [
      'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Isabella', 'Lucas',
      'Sophia', 'Mason', 'Mia', 'Oliver', 'Charlotte', 'Elijah', 'Amelia', 'Logan',
      'Harper', 'Alexander', 'Evelyn', 'Jacob', 'Abigail', 'Michael', 'Emily', 'Daniel',
      'Elizabeth', 'Henry', 'Sofia', 'Jackson', 'Madison', 'Sebastian', 'Avery', 'Aiden',
      'Ella', 'Matthew', 'Scarlett', 'Samuel', 'Grace', 'David', 'Chloe', 'Joseph',
      'Victoria', 'Carter', 'Riley', 'Owen', 'Aria', 'Wyatt', 'Lily', 'John',
      'Aubrey', 'Jack', 'Zoey', 'Luke', 'Penelope', 'Jayden', 'Layla', 'Dylan'
    ]
    
    const lastNames = [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
      'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
      'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
      'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
      'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores'
    ]

    const memberTypes = ['active', 'visitor', 'active', 'active', 'visitor'] // 80% active, 20% visitors
    const attendanceFrequencies = ['regular', 'occasional', 'rare', 'regular', 'regular'] // 60% regular, 20% occasional, 20% rare

    const members = []
    const adultCount = Math.floor(this.config.memberCount * 0.7) // 70% adults, 30% children
    const childCount = this.config.memberCount - adultCount

    // Generate adult members
    for (let i = 0; i < adultCount; i++) {
      const firstName = adultFirstNames[Math.floor(Math.random() * adultFirstNames.length)]
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
      
      const gender = Math.random() > 0.5 ? 'male' : 'female'
      const imageUrl = this.generateMemberImage(firstName, lastName, gender)
      
      members.push({
        id: crypto.randomUUID(),
        firstname: firstName,
        lastname: lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${i + 1}@example.com`,
        phone: `(555) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        status: memberTypes[Math.floor(Math.random() * memberTypes.length)],
        organization_id: this.config.organizationId,
        join_date: this.getRandomPastDate(365),
        member_type: 'adult',
        gender: gender,
        image_url: imageUrl,
        attendance_frequency: attendanceFrequencies[Math.floor(Math.random() * attendanceFrequencies.length)],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }

    // Generate child members
    for (let i = 0; i < childCount; i++) {
      const firstName = childFirstNames[Math.floor(Math.random() * childFirstNames.length)]
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
      
      const gender = Math.random() > 0.5 ? 'male' : 'female'
      const imageUrl = this.generateMemberImage(firstName, lastName, gender)
      
      // Generate realistic birth date for children (ages 0-17)
      const age = Math.floor(Math.random() * 18)
      const birthDate = new Date()
      birthDate.setFullYear(birthDate.getFullYear() - age)
      birthDate.setMonth(Math.floor(Math.random() * 12))
      birthDate.setDate(Math.floor(Math.random() * 28) + 1)
      
      members.push({
        id: crypto.randomUUID(),
        firstname: firstName,
        lastname: lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.child${i + 1}@example.com`,
        phone: null, // Children typically don't have phones
        status: 'active', // Most children are active
        organization_id: this.config.organizationId,
        join_date: this.getRandomPastDate(365),
        member_type: 'child',
        gender: gender,
        birth_date: birthDate.toISOString().split('T')[0],
        image_url: imageUrl,
        attendance_frequency: attendanceFrequencies[Math.floor(Math.random() * attendanceFrequencies.length)],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }
    
    return members
  }

  // Generate recurring events (Sunday services, Bible studies, etc.)
  private generateEvents() {
    const events = []
    const startDate = new Date(this.config.startDate)
    
    // Generate events for the specified number of weeks
    for (let week = 0; week < this.config.weeksToGenerate; week++) {
      const currentWeek = new Date(startDate)
      currentWeek.setDate(currentWeek.getDate() + (week * 7))
      
      // Sunday Service (every Sunday at 10:00 AM)
      const sundayService = this.createEvent(
        'Sunday Service',
        'Sunday Service',
        this.getSundayOfWeek(currentWeek),
        10, 0, // 10:00 AM
        90 // 90 minutes duration
      )
      events.push(sundayService)
      
      // Wednesday Bible Study (every Wednesday at 7:00 PM)
      const wednesdayStudy = this.createEvent(
        'Wednesday Bible Study',
        'Bible Study',
        this.getWednesdayOfWeek(currentWeek),
        19, 0, // 7:00 PM
        60 // 60 minutes duration
      )
      events.push(wednesdayStudy)
      
      // Monthly fellowship events (first Saturday of month)
      if (this.isFirstWeekOfMonth(currentWeek)) {
        const fellowshipEvent = this.createEvent(
          'Monthly Fellowship Dinner',
          'Fellowship Activity',
          this.getFirstSaturdayOfMonth(currentWeek),
          18, 0, // 6:00 PM
          120 // 2 hours
        )
        events.push(fellowshipEvent)
      }
    }
    
    return events
  }

  private createEvent(title: string, eventType: string, date: Date, hour: number, minute: number, durationMinutes: number) {
    const startDate = new Date(date)
    startDate.setHours(hour, minute, 0, 0)
    
    const endDate = new Date(startDate)
    endDate.setMinutes(endDate.getMinutes() + durationMinutes)
    
    const eventId = `${title.toLowerCase().replace(/\s+/g, '-')}-${startDate.getTime()}`
    
    return {
      id: eventId,
      title,
      event_type: eventType,
      description: `${title} - Automated demo data`,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      location: 'Main Sanctuary',
      organization_id: this.config.organizationId,
      is_recurring: true,
      allow_rsvp: true,
      attendance_type: 'check-in',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  // Generate realistic attendance patterns
  private generateAttendance(members: any[], events: any[]) {
    const attendance = []
    const now = new Date()
    
    // Only generate attendance for past events
    const pastEvents = events.filter(event => new Date(event.start_date) < now)
    
    pastEvents.forEach(event => {
      const expectedAttendance = this.getExpectedAttendance(event.event_type, event.start_date)
      const attendingMembers = this.selectAttendingMembers(members, expectedAttendance, event.event_type)
      
      attendingMembers.forEach(member => {
        attendance.push({
          id: crypto.randomUUID(),
          event_id: event.id,
          member_id: member.id,
          status: Math.random() > 0.1 ? 'checked-in' : 'attending', // 90% checked-in, 10% attending
          organization_id: this.config.organizationId,
          created_at: new Date(event.start_date).toISOString()
        })
      })
    })
    
    return attendance
  }

  // Generate realistic donation patterns
  private generateDonations(members: any[], batches: any[]) {
    const donations = []
    const startDate = new Date(this.config.startDate)
    const now = new Date()
    
    // Generate weekly donations
    for (let week = 0; week < this.config.weeksToGenerate; week++) {
      const currentWeek = new Date(startDate)
      currentWeek.setDate(currentWeek.getDate() + (week * 7))
      
      if (currentWeek >= now) break // Only past donations
      
      const sundayDate = this.getSundayOfWeek(currentWeek)
      const donatingMembers = this.selectDonatingMembers(members)
      
      // Find the corresponding batch for this week
      const batch = batches.find(b => b.batch_date === sundayDate.toISOString().split('T')[0])
      
      donatingMembers.forEach(member => {
        const amount = this.generateDonationAmount(member.attendance_frequency)
        
        donations.push({
          id: crypto.randomUUID(),
          donor_id: member.id,
          amount: amount,
          date: sundayDate.toISOString().split('T')[0],
          fund_designation: 'general',
          payment_method: Math.random() > 0.3 ? 'check' : 'cash', // 70% check, 30% cash
          organization_id: this.config.organizationId,
          batch_id: batch?.id || null,
          created_at: sundayDate.toISOString(),
          updated_at: sundayDate.toISOString()
        })
      })
    }
    
    return donations
  }

  // Helper methods
  private generateMemberImage(firstName: string, lastName: string, gender: string): string {
    // Use AI-generated realistic photos and reliable fallbacks
    const imageServices = [
      // AI-generated realistic photos (This Person Does Not Exist alternative)
      () => `https://picsum.photos/200/200?random=${Math.random()}&blur=1`,
      
      // UI Avatars (initials-based) - most reliable
      () => `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random&color=fff&size=200&rounded=true&format=png`,
      
      // Robohash (fun robot/avatar style) - reliable
      () => `https://robohash.org/${firstName}${lastName}?set=set1&size=200x200`,
      
      // Dicebear (modern avatar styles) - reliable
      () => `https://api.dicebear.com/7.x/personas/svg?seed=${firstName}${lastName}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`,
      
      // Gravatar (fallback)
      () => `https://www.gravatar.com/avatar/${firstName}${lastName}?d=identicon&s=200`,
      
      // Simple initials with colors
      () => `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=${['264653','2a9d8f','e9c46a','f4a261','e76f51'][Math.floor(Math.random() * 5)]}&color=fff&size=200&rounded=true`
    ]
    
    // Use different services based on member type to add variety
    const serviceIndex = Math.floor(Math.random() * imageServices.length)
    return imageServices[serviceIndex]()
  }

  private getRandomPastDate(maxDaysAgo: number): string {
    const date = new Date()
    date.setDate(date.getDate() - Math.floor(Math.random() * maxDaysAgo))
    return date.toISOString().split('T')[0]
  }

  private getSundayOfWeek(date: Date): Date {
    const sunday = new Date(date)
    sunday.setDate(date.getDate() - date.getDay())
    return sunday
  }

  private getWednesdayOfWeek(date: Date): Date {
    const wednesday = new Date(date)
    wednesday.setDate(date.getDate() - date.getDay() + 3)
    return wednesday
  }

  private isFirstWeekOfMonth(date: Date): boolean {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
    const firstWeek = new Date(firstDay)
    firstWeek.setDate(firstDay.getDate() + (7 - firstDay.getDay()))
    return date <= firstWeek
  }

  private getFirstSaturdayOfMonth(date: Date): Date {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
    const firstSaturday = new Date(firstDay)
    firstSaturday.setDate(firstDay.getDate() + (6 - firstDay.getDay()) % 7 + (firstDay.getDay() === 0 ? -1 : 0))
    return firstSaturday
  }

  private getExpectedAttendance(eventType: string, eventDate: string): number {
    const baseAttendance = {
      'Sunday Service': 70,
      'Bible Study': 24,
      'Fellowship Activity': 50
    }
    
    const date = new Date(eventDate)
    const month = date.getMonth()
    
    // Seasonal variations (lower in summer, higher in fall/winter)
    const seasonalMultiplier = [1.0, 1.0, 1.0, 0.9, 0.8, 0.7, 0.7, 0.8, 0.9, 1.1, 1.1, 1.0][month]
    
    // Random variation ±20%
    const randomMultiplier = 0.8 + (Math.random() * 0.4)
    
    return Math.round((baseAttendance[eventType] || 20) * seasonalMultiplier * randomMultiplier)
  }

  private selectAttendingMembers(members: any[], expectedCount: number, eventType: string): any[] {
    const attendingMembers = []
    const shuffledMembers = [...members].sort(() => Math.random() - 0.5)
    
    for (const member of shuffledMembers) {
      if (attendingMembers.length >= expectedCount) break
      
      const attendanceProbability = this.getAttendanceProbability(member, eventType)
      if (Math.random() < attendanceProbability) {
        attendingMembers.push(member)
      }
    }
    
    return attendingMembers
  }

  private getAttendanceProbability(member: any, eventType: string): number {
    const baseProbabilities = {
      'Sunday Service': { regular: 0.9, occasional: 0.4, rare: 0.2, inactive: 0.1 },
      'Bible Study': { regular: 0.6, occasional: 0.2, rare: 0.1, inactive: 0.05 },
      'Fellowship Activity': { regular: 0.7, occasional: 0.5, rare: 0.3, inactive: 0.1 }
    }
    
    const memberStatus = member.status === 'visitor' ? 'rare' : member.attendance_frequency
    return baseProbabilities[eventType]?.[memberStatus] || 0.3
  }

  private selectDonatingMembers(members: any[]): any[] {
    return members.filter(member => {
      if (member.status === 'visitor') return Math.random() < 0.1 // 10% of visitors donate
      return Math.random() < 0.7 // 70% of active members donate regularly
    })
  }

  private generateDonationAmount(attendanceFrequency: string): number {
    const baseAmounts = {
      regular: 75,
      occasional: 45,
      rare: 25,
      inactive: 15
    }
    
    const baseAmount = baseAmounts[attendanceFrequency] || 50
    const variation = 0.5 + (Math.random() * 1.0) // 50% to 150% variation
    
    return Math.round(baseAmount * variation)
  }

  // Generate donation batches
  private generateBatches() {
    const batches = []
    const startDate = new Date(this.config.startDate)
    const now = new Date()
    
    // Generate weekly batches for the past 6 months
    for (let week = 0; week < this.config.weeksToGenerate; week++) {
      const currentWeek = new Date(startDate)
      currentWeek.setDate(currentWeek.getDate() + (week * 7))
      
      if (currentWeek >= now) break // Only past batches
      
      const sundayDate = this.getSundayOfWeek(currentWeek)
      
      batches.push({
        id: crypto.randomUUID(),
        organization_id: this.config.organizationId,
        batch_number: `BATCH-${sundayDate.toISOString().split('T')[0]}`,
        name: `Sunday Service - ${sundayDate.toLocaleDateString()}`,
        batch_date: sundayDate.toISOString().split('T')[0],
        description: `Weekly collection from ${sundayDate.toLocaleDateString()}`,
        total_amount: 0, // Will be calculated from actual donations
        donation_count: 0, // Will be calculated from actual donations
        status: 'closed',
        created_at: sundayDate.toISOString(),
        updated_at: sundayDate.toISOString()
      })
    }
    
    return batches
  }

  // Generate groups
  private generateGroups(members: any[]) {
    const groupTypes = [
      { name: 'Deacons', description: 'Church leadership and service team' },
      { name: 'Youth Group', description: 'Teenagers and young adults ministry' },
      { name: 'Children Ministry', description: 'Sunday school and children programs' },
      { name: 'Prayer Team', description: 'Intercessory prayer ministry' },
      { name: 'Worship Team', description: 'Music and worship ministry' },
      { name: 'Greeters', description: 'Welcome and hospitality team' },
      { name: 'Ushers', description: 'Service assistance and crowd management' },
      { name: 'Bible Study Group', description: 'Adult Bible study and discipleship' },
      { name: 'Missions Team', description: 'Outreach and missionary support' },
      { name: 'Fellowship Committee', description: 'Social events and community building' }
    ]
    
    // Get active adult members who can be leaders
    const potentialLeaders = members.filter(m => 
      m.status === 'active' && 
      m.member_type === 'adult' && 
      m.attendance_frequency !== 'inactive'
    )
    
    return groupTypes.map((group, index) => {
      // Assign a leader for each group
      const leader = potentialLeaders[index % potentialLeaders.length] || potentialLeaders[0]
      
      return {
        id: crypto.randomUUID(),
        organization_id: this.config.organizationId,
        name: group.name,
        description: group.description,
        leader_id: leader?.id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    })
  }

  // Generate group members
  private generateGroupMembers(members: any[], groups: any[]) {
    const groupMembers = []
    const activeMembers = members.filter(m => m.status === 'active')
    
    groups.forEach(group => {
      // Determine how many members should be in each group based on group type
      const memberCounts = {
        'Deacons': 5,
        'Youth Group': 15,
        'Children Ministry': 8,
        'Prayer Team': 12,
        'Worship Team': 6,
        'Greeters': 10,
        'Ushers': 8,
        'Bible Study Group': 20,
        'Missions Team': 7,
        'Fellowship Committee': 9
      }
      
      const targetCount = memberCounts[group.name] || 10
      const shuffledMembers = [...activeMembers].sort(() => Math.random() - 0.5)
      const selectedMembers = shuffledMembers.slice(0, Math.min(targetCount, activeMembers.length))
      
      selectedMembers.forEach(member => {
        groupMembers.push({
          id: crypto.randomUUID(),
          group_id: group.id,
          member_id: member.id,
          organization_id: this.config.organizationId,
          joined_at: new Date().toISOString()
        })
      })
    })
    
    return groupMembers
  }

  // Generate families
  private generateFamilies(members: any[]) {
    const families = []
    const familyAssignments = [] // Track which members belong to which families
    const adultMembers = members.filter(m => m.member_type === 'adult')
    const childMembers = members.filter(m => m.member_type === 'child')
    
    // Create families for about 60% of adult members
    const familyCount = Math.floor(adultMembers.length * 0.6)
    
    for (let i = 0; i < familyCount; i++) {
      const primaryMember = adultMembers[i]
      const familyName = `${primaryMember.lastname} Family`
      const familyId = crypto.randomUUID()
      
      families.push({
        id: familyId,
        family_name: familyName,
        primary_contact_id: primaryMember.id,
        address: {
          street: `${Math.floor(Math.random() * 9999) + 1000} ${['Main', 'Oak', 'Pine', 'Elm', 'Maple'][Math.floor(Math.random() * 5)]} St`,
          city: 'Anytown',
          state: 'CA',
          zip: '90210'
        },
        phone: primaryMember.phone,
        email: primaryMember.email,
        emergency_contact_name: `${['John', 'Jane', 'Mike', 'Sarah'][Math.floor(Math.random() * 4)]} ${primaryMember.lastname}`,
        emergency_contact_phone: `(555) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        emergency_contact_relationship: ['Spouse', 'Parent', 'Sibling'][Math.floor(Math.random() * 3)],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      
      // Start with the primary member
      const familyMemberIds = [primaryMember.id]
      
      // Add spouse (another adult) - 80% of families have a spouse
      if (Math.random() < 0.8 && i + 1 < adultMembers.length) {
        const spouse = adultMembers[i + 1]
        familyMemberIds.push(spouse.id)
      }
      
      // Add children to families - 70% of families have children
      if (Math.random() < 0.7) {
        const childCount = Math.floor(Math.random() * 3) + 1 // 1-3 children
        const availableChildren = childMembers.filter(child => 
          !familyAssignments.some(assignment => assignment.memberIds.includes(child.id))
        )
        
        const childrenToAdd = availableChildren.slice(0, childCount)
        childrenToAdd.forEach(child => {
          familyMemberIds.push(child.id)
        })
      }
      
      // Ensure minimum of 2 members (if no spouse/children, add another adult)
      if (familyMemberIds.length < 2) {
        const availableAdults = adultMembers.filter(adult => 
          !familyAssignments.some(assignment => assignment.memberIds.includes(adult.id)) &&
          !familyMemberIds.includes(adult.id)
        )
        
        if (availableAdults.length > 0) {
          const additionalAdult = availableAdults[0]
          familyMemberIds.push(additionalAdult.id)
        }
      }
      
      // Track family assignments
      familyAssignments.push({
        familyId: familyId,
        memberIds: familyMemberIds
      })
    }
    
    return { families, familyAssignments }
  }

  // Generate tasks
  private generateTasks(members: any[]) {
    const tasks = []
    const taskTypes = [
      { title: 'Prepare Sunday sermon', priority: 'high', status: 'pending' },
      { title: 'Set up sound system', priority: 'medium', status: 'completed' },
      { title: 'Order communion supplies', priority: 'medium', status: 'pending' },
      { title: 'Update church website', priority: 'low', status: 'in_progress' },
      { title: 'Contact new visitors', priority: 'high', status: 'pending' },
      { title: 'Plan youth retreat', priority: 'medium', status: 'pending' },
      { title: 'Review budget', priority: 'high', status: 'completed' },
      { title: 'Organize food drive', priority: 'medium', status: 'pending' },
      { title: 'Update member directory', priority: 'low', status: 'in_progress' },
      { title: 'Prepare monthly newsletter', priority: 'medium', status: 'pending' }
    ]
    
    const deaconMembers = members.filter(m => m.status === 'active').slice(0, 5)
    
    taskTypes.forEach((taskType, index) => {
      const assignee = deaconMembers[Math.floor(Math.random() * deaconMembers.length)]
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 30) + 7) // Due in 1-4 weeks
      
      tasks.push({
        id: crypto.randomUUID(),
        organization_id: this.config.organizationId,
        title: taskType.title,
        description: `Task description for ${taskType.title}`,
        due_date: dueDate.toISOString(),
        status: taskType.status,
        priority: taskType.priority,
        requestor_id: deaconMembers[0]?.id,
        assignee_id: assignee?.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    })
    
    return tasks
  }

  // Generate children check-ins with realistic check-in/out patterns
  private generateChildrenCheckIns(members: any[], events: any[], guardians: any[]) {
    const checkIns = []
    const childMembers = members.filter(m => m.member_type === 'child')
    
    // Focus on Sunday services and children's events
    const childrenEvents = events.filter(e => 
      e.event_type === 'Sunday Service' || 
      e.event_type === 'Children Ministry' ||
      e.event_type === 'Youth Group'
    )
    
    childrenEvents.forEach(event => {
      const eventDate = new Date(event.start_date)
      if (eventDate < new Date()) { // Only past events
        // 70% of children attend events
        const attendingChildren = childMembers.filter(() => Math.random() < 0.7)
        
        attendingChildren.forEach(child => {
          // Find registered guardians for this child
          const childGuardians = guardians.filter(g => g.child_id === child.id)
          
          if (childGuardians.length > 0) {
            // Select a random guardian for this check-in
            const guardian = childGuardians[Math.floor(Math.random() * childGuardians.length)]
            
            if (guardian) {
              // Generate realistic check-in time (15 minutes before to 30 minutes after event start)
              const checkInOffset = (Math.random() - 0.3) * 45 * 60000 // -15 to +30 minutes
              const checkInTime = new Date(eventDate.getTime() + checkInOffset)
              
              // Generate check-out time (1-3 hours after check-in)
              const checkOutOffset = (60 + Math.random() * 120) * 60000 // 1-3 hours
              const checkOutTime = new Date(checkInTime.getTime() + checkOutOffset)
              
              // Create check-in record
              checkIns.push({
                id: crypto.randomUUID(),
                child_id: child.id,
                event_id: event.id,
                checked_in_by: guardian.guardian_id,
                organization_id: this.config.organizationId,
                check_in_time: checkInTime.toISOString(),
                check_out_time: checkOutTime.toISOString(),
                notes: this.generateChildNotes(),
                created_at: checkInTime.toISOString(),
                updated_at: checkOutTime.toISOString()
              })
            }
          }
        })
      }
    })
    
    return checkIns
  }

  // Generate guardian relationships for children
  private generateGuardians(members: any[]) {
    const childMembers = members.filter(m => m.member_type === 'child')
    const adultMembers = members.filter(m => m.member_type === 'adult')
    const guardians = []
    
    childMembers.forEach(child => {
      // Each child should have 1-2 guardians (parents)
      const guardianCount = Math.random() < 0.7 ? 1 : 2
      const selectedGuardians = []
      
      for (let i = 0; i < guardianCount; i++) {
        const guardian = adultMembers[Math.floor(Math.random() * adultMembers.length)]
        if (guardian && !selectedGuardians.includes(guardian.id)) {
          selectedGuardians.push(guardian.id)
          guardians.push({
            id: crypto.randomUUID(),
            child_id: child.id,
            guardian_id: guardian.id,
            relationship: i === 0 ? 'Parent' : 'Parent',
            is_primary: i === 0, // First guardian is primary
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        }
      }
    })
    
    return guardians
  }

  // Generate realistic notes for children check-ins
  private generateChildNotes() {
    const notes = [
      null, // 60% chance of no notes
      null,
      null,
      'Allergy alert: peanuts',
      'Allergy alert: dairy',
      'Allergy alert: gluten',
      'Special needs: requires assistance',
      'Parent pickup required',
      'Medication: inhaler',
      'Dietary restriction: vegetarian',
      'Behavioral note: needs redirection',
      'Medical note: asthma',
      'Parent contact: emergency only',
      'Sibling pickup: older brother',
      'Allergy alert: tree nuts'
    ]
    
    return notes[Math.floor(Math.random() * notes.length)]
  }

  // Main generation method
  async generateDemoData() {
    try {
      console.log('🚀 Starting demo data generation...')
      
      // Generate core data
      const members = this.generateMembers()
      const events = this.generateEvents()
      const attendance = this.generateAttendance(members, events)
      const batches = this.generateBatches()
      const donations = this.generateDonations(members, batches)
      const groups = this.generateGroups(members)
      const groupMembers = this.generateGroupMembers(members, groups)
      const { families, familyAssignments } = this.generateFamilies(members)
      const tasks = this.generateTasks(members)
      const guardians = this.generateGuardians(members)
      const childrenCheckIns = this.generateChildrenCheckIns(members, events, guardians)
      
      console.log(`📊 Generated:`)
      console.log(`  - ${members.length} members`)
      console.log(`  - ${events.length} events`)
      console.log(`  - ${attendance.length} attendance records`)
      console.log(`  - ${donations.length} donations`)
      console.log(`  - ${batches.length} donation batches`)
      console.log(`  - ${groups.length} groups`)
      console.log(`  - ${groupMembers.length} group members`)
      console.log(`  - ${families.length} families`)
      console.log(`  - ${tasks.length} tasks`)
      console.log(`  - ${guardians.length} guardian relationships`)
      console.log(`  - ${childrenCheckIns.length} children check-ins`)
      
      // Insert members first (without family_id to avoid foreign key constraint)
      const { error: membersError } = await this.supabase
        .from('members')
        .upsert(members, { onConflict: 'id' })
      
      if (membersError) throw new Error(`Members insert failed: ${membersError.message}`)
      
      // Insert families (now members exist for primary_contact_id references)
      const { error: familiesError } = await this.supabase
        .from('families')
        .upsert(families, { onConflict: 'id' })
      
      if (familiesError) throw new Error(`Families insert failed: ${familiesError.message}`)
      
      // Update members with family_id (this will trigger family relationship creation)
      for (const assignment of familyAssignments) {
        for (const memberId of assignment.memberIds) {
          const { error: updateError } = await this.supabase
            .from('members')
            .update({ family_id: assignment.familyId })
            .eq('id', memberId)
          
          if (updateError) throw new Error(`Member family update failed: ${updateError.message}`)
        }
      }
      
      const { error: eventsError } = await this.supabase
        .from('events')
        .upsert(events, { onConflict: 'id' })
      
      if (eventsError) throw new Error(`Events insert failed: ${eventsError.message}`)
      
      const { error: attendanceError } = await this.supabase
        .from('event_attendance')
        .upsert(attendance, { onConflict: 'id' })
      
      if (attendanceError) throw new Error(`Attendance insert failed: ${attendanceError.message}`)
      
      // Insert batches first (so donations can reference them)
      const { error: batchesError } = await this.supabase
        .from('donation_batches')
        .upsert(batches, { onConflict: 'id' })
      
      if (batchesError) throw new Error(`Batches insert failed: ${batchesError.message}`)
      
      // Insert donations (now batches exist for batch_id references)
      const { error: donationsError } = await this.supabase
        .from('donations')
        .upsert(donations, { onConflict: 'id' })
      
      if (donationsError) throw new Error(`Donations insert failed: ${donationsError.message}`)
      
      // Calculate and update batch totals from actual donations
      for (const batch of batches) {
        const batchDonations = donations.filter(d => d.batch_id === batch.id)
        const totalAmount = batchDonations.reduce((sum, d) => sum + d.amount, 0)
        const donationCount = batchDonations.length
        
        const { error: updateError } = await this.supabase
          .from('donation_batches')
          .update({ 
            total_amount: totalAmount,
            donation_count: donationCount
          })
          .eq('id', batch.id)
        
        if (updateError) throw new Error(`Batch update failed: ${updateError.message}`)
      }
      
      const { error: groupsError } = await this.supabase
        .from('groups')
        .upsert(groups, { onConflict: 'id' })
      
      if (groupsError) throw new Error(`Groups insert failed: ${groupsError.message}`)
      
      // Insert group members (after groups exist for foreign key references)
      const { error: groupMembersError } = await this.supabase
        .from('group_members')
        .upsert(groupMembers, { onConflict: 'id' })
      
      if (groupMembersError) throw new Error(`Group members insert failed: ${groupMembersError.message}`)
      
      const { error: tasksError } = await this.supabase
        .from('tasks')
        .upsert(tasks, { onConflict: 'id' })
      
      if (tasksError) throw new Error(`Tasks insert failed: ${tasksError.message}`)
      
      // Insert guardians before check-ins (required for check-in validation)
      const { error: guardiansError } = await this.supabase
        .from('child_guardians')
        .upsert(guardians, { onConflict: 'id' })
      
      if (guardiansError) throw new Error(`Guardians insert failed: ${guardiansError.message}`)
      
      const { error: checkInsError } = await this.supabase
        .from('child_checkin_logs')
        .upsert(childrenCheckIns, { onConflict: 'id' })
      
      if (checkInsError) throw new Error(`Children check-ins insert failed: ${checkInsError.message}`)
      
      console.log('✅ Demo data generation completed successfully!')
      
      return {
        success: true,
        stats: {
          members: members.length,
          events: events.length,
          attendance: attendance.length,
          donations: donations.length,
          batches: batches.length,
          groups: groups.length,
          groupMembers: groupMembers.length,
          families: families.length,
          tasks: tasks.length,
          guardians: guardians.length,
          childrenCheckIns: childrenCheckIns.length
        }
      }
    } catch (error) {
      console.error('❌ Demo data generation failed:', error)
      throw error
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { organizationId, memberCount = 50, weeksToGenerate = 26 } = await req.json()
    
    if (!organizationId) {
      throw new Error('organizationId is required')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const config: DemoConfig = {
      organizationId,
      memberCount,
      weeksToGenerate,
      startDate: new Date(Date.now() - (weeksToGenerate * 7 * 24 * 60 * 60 * 1000)) // Start from weeks ago
    }
    
    const generator = new DemoDataGenerator(supabaseUrl, supabaseKey, config)
    const result = await generator.generateDemoData()
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
}) 