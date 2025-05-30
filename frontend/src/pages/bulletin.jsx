import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/authContext';

export function Bulletin() {
  const [bulletin, setBulletin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchLatestBulletin();
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('members')
        .select('group_id')
        .eq('id', user.id)
        .eq('status', 'active')
        .single();

      if (error) throw error;
      setIsAdmin(data?.group_id === 'admin');
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const fetchLatestBulletin = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('bulletins')
        .select('*')
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      setBulletin(data);
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Failed to fetch bulletin', 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Loading...</h2>
          <p className="text-muted-foreground">Please wait while we fetch the bulletin.</p>
        </div>
      </div>
    );
  }

  if (!bulletin) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">No Bulletin Available</h2>
          <p className="text-muted-foreground">The latest bulletin has not been published yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Brentwood Lighthouse Baptist Church</h1>
        <p className="text-muted-foreground">
          Sunday Bulletin - {format(new Date(bulletin.date), 'MMMM d, yyyy')}
        </p>
      </div>

      <div className="grid gap-6">
        {/* Morning Service */}
        <Card>
          <CardHeader>
            <CardTitle>Morning Service</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bulletin.service_order.map((item, index) => (
                <div key={index} className="flex items-start space-x-2">
                  {item.icon && <span className="text-lg">{item.icon}</span>}
                  <div>
                    <p className="font-medium">{item.title}</p>
                    {item.subtitle && (
                      <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sermon Scripture */}
        <Card>
          <CardHeader>
            <CardTitle>Sermon Scripture</CardTitle>
            <CardDescription>{bulletin.sermon_scripture.title}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bulletin.sermon_scripture.verses.map((verse, index) => (
                <div key={index} className="space-y-2">
                  <p className="font-medium">{verse.reference}</p>
                  <p className="text-sm text-muted-foreground">{verse.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bulletin.upcoming_events.map((event, index) => (
                <div key={index} className="space-y-1">
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Announcements */}
        <Card>
          <CardHeader>
            <CardTitle>Announcements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bulletin.announcements.map((announcement, index) => (
                <div key={index} className="space-y-1">
                  <p className="font-medium">{announcement.title}</p>
                  <p className="text-sm text-muted-foreground">{announcement.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Giving & Attendance */}
        <Card>
          <CardHeader>
            <CardTitle>Giving & Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="font-medium">Date</div>
                <div className="font-medium">Offering</div>
                <div className="font-medium">Attendance</div>
                {bulletin.giving_attendance.map((record, index) => (
                  <React.Fragment key={index}>
                    <div>{format(new Date(record.date), 'M/d/yyyy')}</div>
                    <div>${record.offering.toLocaleString()}</div>
                    <div>{record.attendance}</div>
                  </React.Fragment>
                ))}
              </div>
              <div className="pt-4 border-t">
                <p className="font-medium">Monthly Total: ${bulletin.giving_attendance.reduce((sum, record) => sum + record.offering, 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Praise */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Praise</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="italic">{bulletin.monthly_praise}</p>
          </CardContent>
        </Card>

        {/* Monthly Prayer */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Prayer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{bulletin.monthly_prayer}</p>
          </CardContent>
        </Card>

        {/* Monthly Reading */}
        {bulletin.monthly_reading && (
          <Card>
            <CardHeader>
              <CardTitle>Monthly Reading</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h3 className="font-medium">{bulletin.monthly_reading.title}</h3>
                {bulletin.monthly_reading.cover && (
                  <img 
                    src={bulletin.monthly_reading.cover} 
                    alt={bulletin.monthly_reading.title}
                    className="w-32 h-auto rounded-lg"
                  />
                )}
                <p className="text-sm text-muted-foreground">
                  {bulletin.monthly_reading.description}
                </p>
                {bulletin.monthly_reading.link && (
                  <Button variant="link" asChild>
                    <a href={bulletin.monthly_reading.link} target="_blank" rel="noopener noreferrer">
                      Read the full article
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weekly Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bulletin.weekly_schedule.map((event, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="font-medium">{event.day}:</span>
                  <span>{event.time} – {event.description}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>Church Phone: (925) 634-1540</p>
              <p>Website: www.blb.church</p>
              <div className="pt-2 space-y-1">
                <p className="font-medium">Leadership:</p>
                <p>Pastor Anthony Grose: (925) 550-1617</p>
                <p>Lead Deacon Karim Maguid: (925) 813-9893</p>
                <p>Deacon Clive Tsuma: (510) 650-6462</p>
                <p>Deacon Randy Huey: (925) 518-8439</p>
                <p>Lead Trustee Roy Blanchard: (925) 234-1806</p>
                <p>Trustees: Roger Powell, Donnie Schulte, Clive Tsuma, Cesar Gomez</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Brentwood Lighthouse Baptist Church. All rights reserved.
      </div>
    </div>
  );
} 