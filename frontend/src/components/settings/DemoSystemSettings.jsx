import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { toast } from '../ui/use-toast';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/authContext';

// Import the working getCurrentUserOrganizationId from data.js
import { getCurrentUserOrganizationId } from '../../lib/data.js';

const DemoSystemSettings = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMaintaining, setIsMaintaining] = useState(false);
  const [demoStats, setDemoStats] = useState(null);
  const [lastMaintenance, setLastMaintenance] = useState(null);
  const [autoSchedule, setAutoSchedule] = useState(false);
  const [organizationId, setOrganizationId] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const initializeComponent = async () => {
      const orgId = await getCurrentUserOrganizationId();
      console.log('🔍 [DemoSystem] Initializing with organization ID:', orgId);
      
      if (orgId) {
        setOrganizationId(orgId);
        loadDemoStats(orgId);
        checkLastMaintenance(orgId);
      } else {
        console.error('No organization ID found');
      }
    };
    
    initializeComponent();
  }, []);

  const loadDemoStats = async (orgId = organizationId) => {
    if (!orgId) {
      console.error('No organization ID provided for loadDemoStats');
      return;
    }
    

    
    try {
      const { data: members } = await supabase
        .from('members')
        .select('id, status, created_at')
        .eq('organization_id', orgId);

      const { data: events } = await supabase
        .from('events')
        .select('id, event_type, start_date')
        .eq('organization_id', orgId);

      const { data: attendance } = await supabase
        .from('event_attendance')
        .select('id, created_at')
        .eq('organization_id', orgId);

      const { data: donations } = await supabase
        .from('donations')
        .select('id, amount, date')
        .eq('organization_id', orgId);

      setDemoStats({
        members: members?.length || 0,
        visitors: members?.filter(m => m.status === 'visitor').length || 0,
        events: events?.length || 0,
        attendance: attendance?.length || 0,
        donations: donations?.length || 0,
        totalDonations: donations?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0
      });
    } catch (error) {
      console.error('Failed to load demo stats:', error);
    }
  };

  const checkLastMaintenance = async (orgId = organizationId) => {
    if (!orgId) {
      console.error('No organization ID provided for checkLastMaintenance');
      return;
    }
    
    try {
      // Check for recent demo-generated data
      const { data: recentEvents } = await supabase
        .from('events')
        .select('created_at')
        .eq('organization_id', orgId)
        .ilike('description', '%demo data%')
        .order('created_at', { ascending: false })
        .limit(1);

      if (recentEvents && recentEvents.length > 0) {
        setLastMaintenance(new Date(recentEvents[0].created_at));
      }
    } catch (error) {
      console.error('Failed to check last maintenance:', error);
    }
  };

  const generateInitialDemoData = async () => {
    if (!organizationId) {
      toast({
        title: 'Error',
        description: 'Organization ID not found',
        variant: 'destructive',
      });
      return;
    }

    console.log('🔍 [DemoSystem] Generating demo data for organization:', organizationId);
    
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-demo-data', {
        body: {
          organizationId: organizationId,
          memberCount: 100,
          weeksToGenerate: 26 // 6 months
        }
      });

      if (error) throw error;

      console.log('✅ [DemoSystem] Demo data generated successfully:', data);

      toast({
        title: 'Success!',
        description: `Generated ${data.stats.members} members, ${data.stats.events} events, ${data.stats.attendance} attendance records, and ${data.stats.donations} donations.`,
      });

      await loadDemoStats();
      await checkLastMaintenance();
    } catch (error) {
      console.error('Demo generation failed:', error);
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate demo data',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const runWeeklyMaintenance = async () => {
    if (!organizationId) {
      toast({
        title: 'Error',
        description: 'Organization ID not found',
        variant: 'destructive',
      });
      return;
    }

    setIsMaintaining(true);
    try {
      const { data, error } = await supabase.functions.invoke('weekly-demo-maintenance', {
        body: {
          organizationId: organizationId
        }
      });

      if (error) throw error;

      toast({
        title: 'Maintenance Complete!',
        description: `Added ${data.results.newEvents} events, ${data.results.attendanceAdded} attendance records, ${data.results.donationsAdded} donations, and ${data.results.newVisitors} new visitors.`,
      });

      await loadDemoStats();
      await checkLastMaintenance();
    } catch (error) {
      console.error('Weekly maintenance failed:', error);
      toast({
        title: 'Maintenance Failed',
        description: error.message || 'Failed to run weekly maintenance',
        variant: 'destructive',
      });
    } finally {
      setIsMaintaining(false);
    }
  };

  const resetDemoData = async () => {
    if (!confirm('Are you sure you want to reset all demo data? This will delete all members, events, attendance, donations, tasks, SMS data, and other related data.')) {
      return;
    }

    try {
      // Delete data in the correct order to avoid foreign key constraints
      // Start with dependent tables first, then core tables
      
      // 1. Delete SMS messages (depends on conversations and members)
      await supabase.from('sms_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 2. Delete SMS conversations (no organization_id column, delete all)
      await supabase.from('sms_conversations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 3. Delete SMS templates (no organization_id column, delete all demo templates)
      await supabase.from('sms_templates').delete().like('name', 'Demo%');
      
      // 4. Delete child check-in logs (no organization_id column, delete all)
      await supabase.from('child_checkin_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 5. Delete child guardians (no organization_id column, delete all)
      await supabase.from('child_guardians').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 6. Delete task comments (depends on tasks)
      await supabase.from('task_comments').delete().eq('organization_id', organizationId);
      
      // 7. Delete tasks (depends on members)
      await supabase.from('tasks').delete().eq('organization_id', organizationId);
      
      // 8. Delete group members (depends on groups and members)
      await supabase.from('group_members').delete().eq('organization_id', organizationId);
      
      // 9. Delete groups (depends on members)
      await supabase.from('groups').delete().eq('organization_id', organizationId);
      
      // 10. Delete event attendance (depends on events and members)
      await supabase.from('event_attendance').delete().eq('organization_id', organizationId);
      
      // 11. Delete donations (depends on members and batches)
      await supabase.from('donations').delete().eq('organization_id', organizationId);
      
      // 12. Delete donation batches (depends on organization)
      await supabase.from('donation_batches').delete().eq('organization_id', organizationId);
      
      // 13. Delete events (depends on organization)
      await supabase.from('events').delete().eq('organization_id', organizationId);
      
      // 14. Clear family_id references in members before deleting families
      await supabase.from('members').update({ family_id: null }).eq('organization_id', organizationId);
      
      // 15. Clear primary_contact_id references in families before deleting families
      await supabase.from('families').update({ primary_contact_id: null }).neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 16. Delete families (no organization_id column, delete all)
      await supabase.from('families').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 17. Finally delete members (core table)
      await supabase.from('members').delete().eq('organization_id', organizationId);

      toast({
        title: 'Demo Data Reset',
        description: 'All demo data has been cleared.',
      });

      setDemoStats({
        members: 0,
        visitors: 0,
        events: 0,
        attendance: 0,
        donations: 0,
        totalDonations: 0
      });
      setLastMaintenance(null);
    } catch (error) {
      console.error('Reset failed:', error);
      toast({
        title: 'Reset Failed',
        description: error.message || 'Failed to reset demo data',
        variant: 'destructive',
      });
    }
  };

  const toggleAutoSchedule = () => {
    setAutoSchedule(!autoSchedule);
    toast({
      title: autoSchedule ? 'Auto-Schedule Disabled' : 'Auto-Schedule Enabled',
      description: autoSchedule 
        ? 'Weekly maintenance will no longer run automatically' 
        : 'Weekly maintenance will run automatically every Sunday at 6 AM',
    });
  };

  const formatDate = (date) => {
    return date ? new Date(date).toLocaleDateString() + ' at ' + new Date(date).toLocaleTimeString() : 'Never';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🤖 Automated Demo System</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            Generate and maintain realistic demo data automatically. Perfect for presentations, 
            testing, and showcasing your church management features.
          </div>
          
          {/* Demo Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{demoStats?.members || 0}</div>
              <div className="text-sm text-blue-800">Members</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{demoStats?.visitors || 0}</div>
              <div className="text-sm text-green-800">Visitors</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{demoStats?.events || 0}</div>
              <div className="text-sm text-purple-800">Events</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{demoStats?.attendance || 0}</div>
              <div className="text-sm text-yellow-800">Attendance</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{demoStats?.donations || 0}</div>
              <div className="text-sm text-red-800">Donations</div>
            </div>
            <div className="bg-indigo-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600">${demoStats?.totalDonations || 0}</div>
              <div className="text-sm text-indigo-800">Total Raised</div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Status:</span>
              <Badge variant={demoStats?.members > 0 ? 'default' : 'secondary'}>
                {demoStats?.members > 0 ? 'Active' : 'Not Set Up'}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Auto-Schedule:</span>
              <Badge variant={autoSchedule ? 'default' : 'secondary'}>
                {autoSchedule ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            Last Maintenance: {formatDate(lastMaintenance)}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={generateInitialDemoData}
              disabled={isGenerating}
              className="flex-1 min-w-[200px]"
            >
              {isGenerating ? 'Generating...' : '🎯 Generate Initial Demo Data'}
            </Button>
            
            <Button 
              onClick={runWeeklyMaintenance}
              disabled={isMaintaining}
              variant="outline"
              className="flex-1 min-w-[200px]"
            >
              {isMaintaining ? 'Running...' : '🔄 Run Weekly Maintenance'}
            </Button>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={toggleAutoSchedule}
              variant={autoSchedule ? 'destructive' : 'default'}
              className="flex-1 min-w-[200px]"
            >
              {autoSchedule ? '⏸️ Disable Auto-Schedule' : '⏰ Enable Auto-Schedule'}
            </Button>
            
            <Button 
              onClick={resetDemoData}
              variant="destructive"
              className="flex-1 min-w-[200px]"
            >
              🗑️ Reset Demo Data
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📊 Demo Data Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✅</span>
              <span className="text-sm">Realistic member profiles with varied attendance patterns</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✅</span>
              <span className="text-sm">Recurring events (Sunday services, Bible studies, fellowship)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✅</span>
              <span className="text-sm">Seasonal attendance variations (lower summer, higher winter)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✅</span>
              <span className="text-sm">Weekly donation patterns with realistic amounts</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✅</span>
              <span className="text-sm">Automatic new visitor additions</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✅</span>
              <span className="text-sm">Data cleanup to prevent database bloat</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✅</span>
              <span className="text-sm">Self-maintaining - generates new data weekly</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>⚙️ How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <strong>Initial Setup:</strong> Generate 6 months of historical data including members, 
              events, attendance, and donations with realistic patterns.
            </div>
            <div>
              <strong>Weekly Maintenance:</strong> Every week, the system automatically:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Creates upcoming events for the next month</li>
                <li>Adds realistic attendance to recent events</li>
                <li>Generates weekly donation records</li>
                <li>Adds 1-3 new visitors</li>
                <li>Cleans up old data (older than 1 year)</li>
              </ul>
            </div>
            <div>
              <strong>Realistic Patterns:</strong> The system uses algorithms to create believable 
              church data with seasonal variations, member behavior patterns, and appropriate 
              donation amounts.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DemoSystemSettings; 