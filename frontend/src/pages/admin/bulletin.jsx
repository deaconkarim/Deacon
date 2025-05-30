import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/authContext';

export function AdminBulletin() {
  const [bulletins, setBulletins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedBulletin, setSelectedBulletin] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const [newBulletin, setNewBulletin] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    service_order: [],
    sermon_scripture: {
      title: '',
      verses: []
    },
    upcoming_events: [],
    announcements: [],
    giving_attendance: [],
    monthly_praise: '',
    monthly_prayer: '',
    monthly_reading: null,
    weekly_schedule: []
  });

  useEffect(() => {
    fetchBulletins();
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

  const fetchBulletins = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('bulletins')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setBulletins(data);
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Failed to fetch bulletins', 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBulletin = async () => {
    try {
      const { data, error } = await supabase
        .from('bulletins')
        .insert([newBulletin])
        .select()
        .single();

      if (error) throw error;

      setBulletins([data, ...bulletins]);
      setNewBulletin({
        date: format(new Date(), 'yyyy-MM-dd'),
        service_order: [],
        sermon_scripture: {
          title: '',
          verses: []
        },
        upcoming_events: [],
        announcements: [],
        giving_attendance: [],
        monthly_praise: '',
        monthly_prayer: '',
        monthly_reading: null,
        weekly_schedule: []
      });

      toast({
        title: 'Success',
        description: 'Bulletin created successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleUpdateBulletin = async () => {
    try {
      const { error } = await supabase
        .from('bulletins')
        .update(selectedBulletin)
        .eq('id', selectedBulletin.id);

      if (error) throw error;

      setBulletins(bulletins.map(b => 
        b.id === selectedBulletin.id ? selectedBulletin : b
      ));
      setIsEditing(false);

      toast({
        title: 'Success',
        description: 'Bulletin updated successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleDeleteBulletin = async (id) => {
    if (!confirm('Are you sure you want to delete this bulletin?')) return;

    try {
      const { error } = await supabase
        .from('bulletins')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBulletins(bulletins.filter(b => b.id !== id));
      toast({
        title: 'Success',
        description: 'Bulletin deleted successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Loading...</h2>
          <p className="text-muted-foreground">Please wait while we fetch the bulletins.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Manage Bulletins</h1>
        <p className="text-muted-foreground">
          Create and manage weekly church bulletins.
        </p>
      </div>

      {/* Create New Bulletin */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Bulletin</CardTitle>
          <CardDescription>
            Fill in the details for the new bulletin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="date"
                  value={newBulletin.date}
                  onChange={(e) => setNewBulletin({...newBulletin, date: e.target.value})}
                />
              </div>
            </div>

            {/* Service Order */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Service Order</label>
              <div className="space-y-2">
                {newBulletin.service_order.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      placeholder="Title"
                      value={item.title}
                      onChange={(e) => {
                        const updated = [...newBulletin.service_order];
                        updated[index] = {...item, title: e.target.value};
                        setNewBulletin({...newBulletin, service_order: updated});
                      }}
                    />
                    <Input
                      placeholder="Subtitle"
                      value={item.subtitle || ''}
                      onChange={(e) => {
                        const updated = [...newBulletin.service_order];
                        updated[index] = {...item, subtitle: e.target.value};
                        setNewBulletin({...newBulletin, service_order: updated});
                      }}
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        const updated = newBulletin.service_order.filter((_, i) => i !== index);
                        setNewBulletin({...newBulletin, service_order: updated});
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => {
                    setNewBulletin({
                      ...newBulletin,
                      service_order: [...newBulletin.service_order, { title: '', subtitle: '' }]
                    });
                  }}
                >
                  Add Service Item
                </Button>
              </div>
            </div>

            {/* Sermon Scripture */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sermon Scripture</label>
              <Input
                placeholder="Sermon Title"
                value={newBulletin.sermon_scripture.title}
                onChange={(e) => setNewBulletin({
                  ...newBulletin,
                  sermon_scripture: {
                    ...newBulletin.sermon_scripture,
                    title: e.target.value
                  }
                })}
              />
              <div className="space-y-2">
                {newBulletin.sermon_scripture.verses.map((verse, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      placeholder="Reference"
                      value={verse.reference}
                      onChange={(e) => {
                        const updated = [...newBulletin.sermon_scripture.verses];
                        updated[index] = {...verse, reference: e.target.value};
                        setNewBulletin({
                          ...newBulletin,
                          sermon_scripture: {
                            ...newBulletin.sermon_scripture,
                            verses: updated
                          }
                        });
                      }}
                    />
                    <Textarea
                      placeholder="Verse Text"
                      value={verse.text}
                      onChange={(e) => {
                        const updated = [...newBulletin.sermon_scripture.verses];
                        updated[index] = {...verse, text: e.target.value};
                        setNewBulletin({
                          ...newBulletin,
                          sermon_scripture: {
                            ...newBulletin.sermon_scripture,
                            verses: updated
                          }
                        });
                      }}
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        const updated = newBulletin.sermon_scripture.verses.filter((_, i) => i !== index);
                        setNewBulletin({
                          ...newBulletin,
                          sermon_scripture: {
                            ...newBulletin.sermon_scripture,
                            verses: updated
                          }
                        });
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => {
                    setNewBulletin({
                      ...newBulletin,
                      sermon_scripture: {
                        ...newBulletin.sermon_scripture,
                        verses: [...newBulletin.sermon_scripture.verses, { reference: '', text: '' }]
                      }
                    });
                  }}
                >
                  Add Verse
                </Button>
              </div>
            </div>

            {/* Monthly Praise & Prayer */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Monthly Praise</label>
                <Textarea
                  value={newBulletin.monthly_praise}
                  onChange={(e) => setNewBulletin({...newBulletin, monthly_praise: e.target.value})}
                  placeholder="Enter monthly praise..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Monthly Prayer</label>
                <Textarea
                  value={newBulletin.monthly_prayer}
                  onChange={(e) => setNewBulletin({...newBulletin, monthly_prayer: e.target.value})}
                  placeholder="Enter monthly prayer..."
                />
              </div>
            </div>

            <Button onClick={handleCreateBulletin}>
              Create Bulletin
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* List of Bulletins */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bulletins</CardTitle>
          <CardDescription>
            View and manage existing bulletins.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {bulletins.map((bulletin) => (
              <div key={bulletin.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">
                    {format(new Date(bulletin.date), 'MMMM d, yyyy')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {bulletin.sermon_scripture.title}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedBulletin(bulletin);
                      setIsEditing(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteBulletin(bulletin.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 