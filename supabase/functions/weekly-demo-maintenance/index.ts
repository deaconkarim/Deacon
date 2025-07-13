import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

class WeeklyDemoMaintenance {
  private supabase: any
  private organizationId: string

  constructor(supabaseUrl: string, supabaseKey: string, organizationId: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey)
    this.organizationId = organizationId
  }

  async performWeeklyMaintenance() {
    try {
      console.log('🔄 Starting weekly demo maintenance...')
      
      const results = await Promise.all([
        this.generateUpcomingEvents(),
        this.addAttendanceToRecentEvents(),
        this.generateWeeklyDonations(),
        this.addNewVisitors(),
        this.cleanupOldData()
      ])
      
      console.log('✅ Weekly maintenance completed successfully!')
      
      return {
        success: true,
        results: {
          newEvents: results[0],
          attendanceAdded: results[1],
          donationsAdded: results[2],
          newVisitors: results[3],
          dataCleanup: results[4]
        }
      }
    } catch (error) {
      console.error('❌ Weekly maintenance failed:', error)
      throw error
    }
  }

  private async generateUpcomingEvents() {
    console.log('📅 Generating upcoming events...')
    
    const today = new Date()
    const nextMonth = new Date(today)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    
    const events = []
    
    // Generate events for the next 4 weeks
    for (let week = 0; week < 4; week++) {
      const currentWeek = new Date(today)
      currentWeek.setDate(currentWeek.getDate() + (week * 7))
      
      // Sunday Service
      const sundayService = {
        id: `sunday-service-${this.getSundayOfWeek(currentWeek).getTime()}`,
        title: 'Sunday Morning Worship',
        event_type: 'Sunday Service',
        description: 'Weekly Sunday morning worship service',
        start_date: this.getSundayOfWeek(currentWeek).toISOString(),
        end_date: new Date(this.getSundayOfWeek(currentWeek).getTime() + 90 * 60 * 1000).toISOString(),
        location: 'Main Sanctuary',
        organization_id: this.organizationId,
        is_recurring: true,
        allow_rsvp: true,
        attendance_type: 'check-in',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      events.push(sundayService)
      
      // Wednesday Bible Study
      const wednesdayStudy = {
        id: `wednesday-bible-study-${this.getWednesdayOfWeek(currentWeek).getTime()}`,
        title: 'Wednesday Bible Study',
        event_type: 'Bible Study',
        description: 'Weekly Bible study and prayer',
        start_date: this.getWednesdayOfWeek(currentWeek).toISOString(),
        end_date: new Date(this.getWednesdayOfWeek(currentWeek).getTime() + 60 * 60 * 1000).toISOString(),
        location: 'Fellowship Hall',
        organization_id: this.organizationId,
        is_recurring: true,
        allow_rsvp: true,
        attendance_type: 'check-in',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      events.push(wednesdayStudy)
    }
    
    // Add monthly fellowship event if it's the first week of the month
    if (this.isFirstWeekOfMonth(today)) {
      const fellowshipEvent = {
        id: `fellowship-dinner-${this.getFirstSaturdayOfMonth(today).getTime()}`,
        title: 'Monthly Fellowship Dinner',
        event_type: 'Fellowship Activity',
        description: 'Monthly community fellowship dinner',
        start_date: this.getFirstSaturdayOfMonth(today).toISOString(),
        end_date: new Date(this.getFirstSaturdayOfMonth(today).getTime() + 120 * 60 * 1000).toISOString(),
        location: 'Fellowship Hall',
        organization_id: this.organizationId,
        is_recurring: true,
        allow_rsvp: true,
        attendance_type: 'check-in',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      events.push(fellowshipEvent)
    }
    
    // Insert events (use upsert to avoid conflicts)
    const { error } = await this.supabase
      .from('events')
      .upsert(events, { onConflict: 'id' })
    
    if (error) throw new Error(`Events insert failed: ${error.message}`)
    
    console.log(`✅ Generated ${events.length} upcoming events`)
    return events.length
  }

  private async addAttendanceToRecentEvents() {
    console.log('👥 Adding attendance to recent events...')
    
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    
    const today = new Date()
    
    // Get events from the past week that need attendance
    const { data: recentEvents, error: eventsError } = await this.supabase
      .from('events')
      .select('*')
      .eq('organization_id', this.organizationId)
      .gte('start_date', oneWeekAgo.toISOString())
      .lt('start_date', today.toISOString())
    
    if (eventsError) throw new Error(`Failed to fetch recent events: ${eventsError.message}`)
    
    if (!recentEvents || recentEvents.length === 0) {
      console.log('No recent events found')
      return 0
    }
    
    // Get all members
    const { data: members, error: membersError } = await this.supabase
      .from('members')
      .select('*')
      .eq('organization_id', this.organizationId)
    
    if (membersError) throw new Error(`Failed to fetch members: ${membersError.message}`)
    
    const attendanceRecords = []
    
    for (const event of recentEvents) {
      // Check if attendance already exists
      const { data: existingAttendance } = await this.supabase
        .from('event_attendance')
        .select('id')
        .eq('event_id', event.id)
        .limit(1)
      
      if (existingAttendance && existingAttendance.length > 0) {
        continue // Skip if attendance already exists
      }
      
      const expectedAttendance = this.getExpectedAttendance(event.event_type, event.start_date)
      const attendingMembers = this.selectAttendingMembers(members, expectedAttendance, event.event_type)
      
      attendingMembers.forEach(member => {
        attendanceRecords.push({
          id: crypto.randomUUID(),
          event_id: event.id,
          member_id: member.id,
          status: Math.random() > 0.1 ? 'checked-in' : 'attending',
          organization_id: this.organizationId,
          created_at: new Date(event.start_date).toISOString()
        })
      })
    }
    
    if (attendanceRecords.length > 0) {
      const { error: attendanceError } = await this.supabase
        .from('event_attendance')
        .insert(attendanceRecords)
      
      if (attendanceError) throw new Error(`Attendance insert failed: ${attendanceError.message}`)
    }
    
    console.log(`✅ Added ${attendanceRecords.length} attendance records`)
    return attendanceRecords.length
  }

  private async generateWeeklyDonations() {
    console.log('💰 Generating weekly donations...')
    
    const lastSunday = new Date()
    lastSunday.setDate(lastSunday.getDate() - lastSunday.getDay())
    
    // Check if donations already exist for last Sunday
    const { data: existingDonations } = await this.supabase
      .from('donations')
      .select('id')
      .eq('organization_id', this.organizationId)
      .eq('date', lastSunday.toISOString().split('T')[0])
      .limit(1)
    
    if (existingDonations && existingDonations.length > 0) {
      console.log('Donations already exist for last Sunday')
      return 0
    }
    
    // Get all members
    const { data: members, error: membersError } = await this.supabase
      .from('members')
      .select('*')
      .eq('organization_id', this.organizationId)
    
    if (membersError) throw new Error(`Failed to fetch members: ${membersError.message}`)
    
    const donatingMembers = members.filter(member => {
      if (member.status === 'visitor') return Math.random() < 0.1
      return Math.random() < 0.7
    })
    
    const donations = donatingMembers.map(member => ({
      id: crypto.randomUUID(),
      donor_id: member.id,
      amount: this.generateDonationAmount(member.attendance_frequency || 'regular'),
      date: lastSunday.toISOString().split('T')[0],
      fund_designation: 'general',
      payment_method: Math.random() > 0.3 ? 'check' : 'cash',
      organization_id: this.organizationId,
      created_at: lastSunday.toISOString(),
      updated_at: lastSunday.toISOString()
    }))
    
    if (donations.length > 0) {
      const { error: donationsError } = await this.supabase
        .from('donations')
        .insert(donations)
      
      if (donationsError) throw new Error(`Donations insert failed: ${donationsError.message}`)
    }
    
    console.log(`✅ Generated ${donations.length} donation records`)
    return donations.length
  }

  private async addNewVisitors() {
    console.log('👋 Adding new visitors...')
    
    // Add 1-3 new visitors each week
    const newVisitorCount = Math.floor(Math.random() * 3) + 1
    
    const firstNames = ['Alex', 'Sam', 'Jordan', 'Casey', 'Riley', 'Morgan', 'Avery', 'Quinn']
    const lastNames = ['Anderson', 'Brown', 'Davis', 'Johnson', 'Miller', 'Wilson', 'Taylor', 'Moore']
    
    const newVisitors = []
    for (let i = 0; i < newVisitorCount; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
      
      const gender = Math.random() > 0.5 ? 'male' : 'female'
      const imageUrl = this.generateMemberImage(firstName, lastName, gender)
      
      newVisitors.push({
        id: crypto.randomUUID(),
        firstname: firstName,
        lastname: lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${Date.now()}@example.com`,
        phone: `(555) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        status: 'visitor',
        organization_id: this.organizationId,
        join_date: new Date().toISOString().split('T')[0],
        member_type: 'adult',
        gender: gender,
        image_url: imageUrl,
        attendance_frequency: 'rare',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }
    
    const { error } = await this.supabase
      .from('members')
      .insert(newVisitors)
    
    if (error) throw new Error(`New visitors insert failed: ${error.message}`)
    
    console.log(`✅ Added ${newVisitors.length} new visitors`)
    return newVisitors.length
  }

  private async cleanupOldData() {
    console.log('🧹 Cleaning up old data...')
    
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    
    // Delete old events (older than 1 year)
    const { error: eventsError } = await this.supabase
      .from('events')
      .delete()
      .eq('organization_id', this.organizationId)
      .lt('start_date', oneYearAgo.toISOString())
    
    if (eventsError) console.warn('Failed to cleanup old events:', eventsError.message)
    
    // Delete old donations (older than 1 year)
    const { error: donationsError } = await this.supabase
      .from('donations')
      .delete()
      .eq('organization_id', this.organizationId)
      .lt('date', oneYearAgo.toISOString().split('T')[0])
    
    if (donationsError) console.warn('Failed to cleanup old donations:', donationsError.message)
    
    console.log('✅ Data cleanup completed')
    return true
  }

  // Helper methods
  private generateMemberImage(firstName: string, lastName: string, gender: string): string {
    // Use various placeholder image services for realistic profile photos
    const imageServices = [
      // This Person Does Not Exist (AI-generated faces)
      () => `https://thispersondoesnotexist.com/image?${Date.now()}${Math.random()}`,
      
      // UI Avatars (initials-based)
      () => `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random&color=fff&size=200&rounded=true&format=png`,
      
      // Robohash (fun robot/avatar style)
      () => `https://robohash.org/${firstName}${lastName}?set=set1&size=200x200`,
      
      // Dicebear (modern avatar styles)
      () => `https://api.dicebear.com/7.x/personas/svg?seed=${firstName}${lastName}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`,
      
      // Boring Avatars (geometric patterns)
      () => `https://source.boringavatars.com/beam/200/${firstName}${lastName}?colors=264653,2a9d8f,e9c46a,f4a261,e76f51`
    ]
    
    // Use different services based on member type to add variety
    const serviceIndex = Math.floor(Math.random() * imageServices.length)
    return imageServices[serviceIndex]()
  }

  private getSundayOfWeek(date: Date): Date {
    const sunday = new Date(date)
    sunday.setDate(date.getDate() - date.getDay())
    sunday.setHours(10, 0, 0, 0) // 10:00 AM
    return sunday
  }

  private getWednesdayOfWeek(date: Date): Date {
    const wednesday = new Date(date)
    wednesday.setDate(date.getDate() - date.getDay() + 3)
    wednesday.setHours(19, 0, 0, 0) // 7:00 PM
    return wednesday
  }

  private isFirstWeekOfMonth(date: Date): boolean {
    return date.getDate() <= 7
  }

  private getFirstSaturdayOfMonth(date: Date): Date {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
    const firstSaturday = new Date(firstDay)
    firstSaturday.setDate(firstDay.getDate() + (6 - firstDay.getDay()) % 7)
    firstSaturday.setHours(18, 0, 0, 0) // 6:00 PM
    return firstSaturday
  }

  private getExpectedAttendance(eventType: string, eventDate: string): number {
    const baseAttendance = {
      'Sunday Service': 45, // Reduced from 70 to be more realistic
      'Bible Study': 15,    // Reduced from 24 to be more realistic
      'Fellowship Activity': 30 // Reduced from 50 to be more realistic
    }
    
    const date = new Date(eventDate)
    const month = date.getMonth()
    
    // Seasonal variations
    const seasonalMultiplier = [1.0, 1.0, 1.0, 0.9, 0.8, 0.7, 0.7, 0.8, 0.9, 1.1, 1.1, 1.0][month]
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
      'Sunday Service': { regular: 0.9, occasional: 0.4, seasonal: 0.2 },
      'Bible Study': { regular: 0.6, occasional: 0.2, seasonal: 0.1 },
      'Fellowship Activity': { regular: 0.7, occasional: 0.5, seasonal: 0.3 }
    }
    
    const memberStatus = member.status === 'visitor' ? 'seasonal' : (member.attendance_frequency || 'regular')
    return baseProbabilities[eventType]?.[memberStatus] || 0.3
  }

  private generateDonationAmount(attendancePattern: string): number {
    const baseAmounts = {
      regular: 75,
      occasional: 45,
      seasonal: 25
    }
    
    const baseAmount = baseAmounts[attendancePattern] || 50
    const variation = 0.5 + (Math.random() * 1.0)
    
    return Math.round(baseAmount * variation)
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { organizationId } = await req.json()
    
    if (!organizationId) {
      throw new Error('organizationId is required')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const maintenance = new WeeklyDemoMaintenance(supabaseUrl, supabaseKey, organizationId)
    const result = await maintenance.performWeeklyMaintenance()
    
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