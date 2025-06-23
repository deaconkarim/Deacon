import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  MessageSquare, 
  Send, 
  Phone, 
  User, 
  Calendar,
  FileText,
  Plus,
  Search,
  Filter,
  Users,
  Check
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { smsService } from '@/lib/smsService';
import { supabase } from '@/lib/supabaseClient';

export function SMS() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [members, setMembers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [recipientCount, setRecipientCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [isRecipientSelectionOpen, setIsRecipientSelectionOpen] = useState(false);
  const [newMessage, setNewMessage] = useState({
    to_number: '',
    body: '',
    template_id: ''
  });
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    template_text: '',
    variables: []
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    updateRecipientCount();
  }, [selectedMembers, selectedGroups]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Get the current user's organization ID for additional queries
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: orgData } = await supabase
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (!orgData?.organization_id) throw new Error('User not associated with any organization');

      // Try to load conversations, templates, members, and groups
      const [conversationsData, templatesData, membersData, groupsData] = await Promise.all([
        smsService.getConversations().catch(error => {
          console.warn('Failed to load conversations:', error);
          return [];
        }),
        smsService.getTemplates().catch(error => {
          console.warn('Failed to load templates:', error);
          return [];
        }),
        supabase
          .from('members')
          .select('id, firstname, lastname, phone, status')
          .eq('status', 'active')
          .eq('organization_id', orgData.organization_id)
          .not('phone', 'is', null)
          .order('firstname', { ascending: true })
          .then(({ data, error }) => {
            if (error) {
              console.warn('Failed to load members:', error);
              return [];
            }
            return data || [];
          }),
        supabase
          .from('groups')
          .select('id, name, description')
          .eq('organization_id', orgData.organization_id)
          .order('name', { ascending: true })
          .then(({ data, error }) => {
            if (error) {
              console.warn('Failed to load groups:', error);
              return [];
            }
            return data || [];
          })
      ]);
      
      // Enrich groups with member counts
      const enrichedGroups = await Promise.all(
        groupsData.map(async (group) => {
          // Get group members count
          const { count: memberCount } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id)
            .eq('organization_id', orgData.organization_id);

          return {
            ...group,
            memberCount: memberCount || 0
          };
        })
      );
      
      setConversations(conversationsData || []);
      setTemplates(templatesData || []);
      setMembers(membersData || []);
      setGroups(enrichedGroups || []);
    } catch (error) {
      console.error('Error loading SMS data:', error);
      toast({
        title: 'Warning',
        description: 'SMS functionality may not be fully configured. Please check your database setup and Twilio configuration.',
        variant: 'destructive'
      });
      // Set empty arrays to prevent further errors
      setConversations([]);
      setTemplates([]);
      setMembers([]);
      setGroups([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConversationClick = async (conversation) => {
    try {
      const fullConversation = await smsService.getConversation(conversation.id);
      setSelectedConversation(fullConversation);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load conversation details',
        variant: 'destructive'
      });
    }
  };

  const handleSendMessage = async () => {
    const recipients = await getSelectedRecipients();
    
    if (recipients.length === 0 && !newMessage.to_number) {
      toast({
        title: 'Missing Recipients',
        description: 'Please select recipients or enter a phone number.',
        variant: 'destructive'
      });
      return;
    }

    if (!newMessage.body) {
      toast({
        title: 'Missing Message',
        description: 'Please enter a message to send.',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (recipients.length > 0) {
        // Send to multiple recipients
        const messagePromises = recipients.map(recipient => 
          smsService.sendMessage({
            to_number: recipient.phone,
            body: newMessage.body,
            member_id: recipient.id
          })
        );

        await Promise.all(messagePromises);
        
        toast({
          title: 'Success',
          description: `Message sent to ${recipients.length} recipient${recipients.length > 1 ? 's' : ''}`
        });
      } else {
        // Send to single phone number
        await smsService.sendMessage({
          to_number: newMessage.to_number,
          body: newMessage.body
        });

        toast({
          title: 'Success',
          description: 'Message sent successfully'
        });
      }

      setIsNewMessageOpen(false);
      setNewMessage({ to_number: '', body: '', template_id: '' });
      clearRecipientSelection();
      
      // Refresh conversations
      await loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to send message: ${error.message}`,
        variant: 'destructive'
      });
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.name || !newTemplate.template_text) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in template name and text.',
        variant: 'destructive'
      });
      return;
    }

    try {
      await smsService.createTemplate(newTemplate);
      setIsTemplateOpen(false);
      setNewTemplate({ name: '', description: '', template_text: '', variables: [] });
      toast({
        title: 'Success',
        description: 'Template created successfully'
      });
      
      // Refresh templates
      await loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to create template: ${error.message}`,
        variant: 'destructive'
      });
    }
  };

  const getConversationTypeColor = (type) => {
    switch (type) {
      case 'prayer_request': return 'bg-blue-100 text-blue-800';
      case 'event_reminder': return 'bg-green-100 text-green-800';
      case 'emergency': return 'bg-red-100 text-red-800';
      case 'pastoral_care': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMessageStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'queued': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper functions for member/group selection
  const toggleMemberSelection = (memberId) => {
    setSelectedMembers(prev => {
      const newSelection = prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId];
      
      // Recalculate recipient count
      setTimeout(() => updateRecipientCount(), 0);
      return newSelection;
    });
  };

  const toggleGroupSelection = (groupId) => {
    setSelectedGroups(prev => {
      const newSelection = prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId];
      
      // Recalculate recipient count
      setTimeout(() => updateRecipientCount(), 0);
      return newSelection;
    });
  };

  const updateRecipientCount = async () => {
    const recipients = await getSelectedRecipients();
    setRecipientCount(recipients.length);
  };

  const getRecipientCount = () => {
    return recipientCount;
  };

  const getSelectedRecipients = async () => {
    const selectedMemberIds = new Set(selectedMembers);
    
    // Add members from selected groups
    if (selectedGroups.length > 0) {
      try {
        const { data: groupMembers, error } = await supabase
          .from('group_members')
          .select(`
            member_id,
            members!inner (
              id,
              firstname,
              lastname,
              phone,
              status
            )
          `)
          .in('group_id', selectedGroups)
          .eq('members.status', 'active')
          .not('members.phone', 'is', null);

        if (error) {
          console.error('Error fetching group members:', error);
        } else if (groupMembers) {
          groupMembers.forEach(gm => {
            selectedMemberIds.add(gm.members.id);
          });
        }
      } catch (error) {
        console.error('Error fetching group members:', error);
      }
    }

    return members.filter(member => selectedMemberIds.has(member.id));
  };

  const clearRecipientSelection = () => {
    setSelectedMembers([]);
    setSelectedGroups([]);
    setRecipientCount(0);
  };

  const filteredConversations = conversations.filter(conversation => {
    const matchesSearch = conversation.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || conversation.conversation_type === selectedType;
    return matchesSearch && matchesType;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Loading...</h2>
          <p className="text-muted-foreground">Please wait while we load SMS data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">SMS Management</h1>
        <p className="text-muted-foreground">
          Manage SMS conversations, messages, and templates.
        </p>
      </div>

      <Tabs defaultValue="conversations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="conversations" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Types</option>
                <option value="general">General</option>
                <option value="prayer_request">Prayer Request</option>
                <option value="event_reminder">Event Reminder</option>
                <option value="emergency">Emergency</option>
                <option value="pastoral_care">Pastoral Care</option>
              </select>
            </div>
            <Button onClick={() => setIsNewMessageOpen(true)}>
              <Send className="mr-2 h-4 w-4" />
              Send New Message
            </Button>
          </div>

          {filteredConversations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No SMS Conversations Yet</h3>
                <p className="text-muted-foreground mb-4">
                  {conversations.length === 0 
                    ? "SMS functionality needs to be configured. Please ensure your database tables are set up and Twilio is configured."
                    : "No conversations match your current filters."
                  }
                </p>
                {conversations.length === 0 && (
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>To get started:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Deploy the SMS Edge Functions to Supabase</li>
                      <li>Configure Twilio environment variables</li>
                      <li>Set up your Twilio webhook URL</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredConversations.map((conversation) => (
                <Card 
                  key={conversation.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleConversationClick(conversation)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{conversation.title}</CardTitle>
                        <CardDescription>
                          {conversation.sms_messages?.length || 0} messages • 
                          Last updated {format(new Date(conversation.updated_at), 'MMM d, yyyy')}
                        </CardDescription>
                      </div>
                      <Badge className={getConversationTypeColor(conversation.conversation_type)}>
                        {conversation.conversation_type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  {conversation.sms_messages && conversation.sms_messages.length > 0 && (
                    <CardContent>
                      <div className="text-sm text-muted-foreground">
                        Latest: {conversation.sms_messages[0].body.substring(0, 100)}...
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">SMS Templates</h3>
            <Button onClick={() => setIsTemplateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </div>

          <div className="grid gap-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Template:</div>
                    <div className="p-3 bg-muted rounded-md text-sm">
                      {template.template_text}
                    </div>
                    {template.variables && template.variables.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-sm font-medium">Variables:</span>
                        {template.variables.map((variable, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {variable}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-end pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setNewMessage({
                            to_number: '',
                            body: template.template_text,
                            template_id: template.id
                          });
                          setIsNewMessageOpen(true);
                        }}
                      >
                        <Send className="mr-2 h-3 w-3" />
                        Use Template
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Conversation Detail Dialog */}
      {selectedConversation && (
        <Dialog open={!!selectedConversation} onOpenChange={() => setSelectedConversation(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedConversation.title}</DialogTitle>
              <DialogDescription>
                Conversation details and message history
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedConversation.sms_messages?.map((message) => (
                <div key={message.id} className={`p-3 rounded-lg ${
                  message.direction === 'inbound' ? 'bg-blue-50' : 'bg-green-50'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {message.direction === 'inbound' ? 'From' : 'To'}: {message.direction === 'inbound' ? message.from_number : message.to_number}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getMessageStatusColor(message.status)}>
                        {message.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(message.sent_at), 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm">{message.body}</div>
                  {message.member && (
                    <div className="flex items-center space-x-1 mt-2">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {message.member.firstname} {message.member.lastname}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* New Message Dialog */}
      <Dialog open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send New Message</DialogTitle>
            <DialogDescription>
              Send a new SMS message to selected members, groups, or a specific phone number.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Recipient Selection */}
            <div className="space-y-2">
              <Label>Recipients</Label>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRecipientSelectionOpen(true)}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Select Members/Groups ({getRecipientCount()})
                </Button>
                {getRecipientCount() > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearRecipientSelection}
                  >
                    Clear
                  </Button>
                )}
              </div>
              {getRecipientCount() > 0 && (
                <div className="text-sm text-muted-foreground">
                  {getRecipientCount()} recipient{getRecipientCount() > 1 ? 's' : ''} selected
                </div>
              )}
            </div>

            {/* Phone Number (fallback) */}
            <div className="space-y-2">
              <Label htmlFor="to_number">Or Enter Phone Number</Label>
              <Input
                id="to_number"
                value={newMessage.to_number}
                onChange={(e) => setNewMessage({...newMessage, to_number: e.target.value})}
                placeholder="+1234567890 (optional if recipients selected)"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="template_select">Use Template (Optional)</Label>
              <select
                id="template_select"
                className="w-full p-2 border border-input rounded-md bg-background"
                value={newMessage.template_id}
                onChange={(e) => {
                  const templateId = e.target.value;
                  setNewMessage({...newMessage, template_id: templateId});
                  
                  if (templateId) {
                    const selectedTemplate = templates.find(t => t.id === templateId);
                    if (selectedTemplate) {
                      setNewMessage({
                        ...newMessage, 
                        template_id: templateId,
                        body: selectedTemplate.template_text
                      });
                    }
                  }
                }}
              >
                <option value="">Select a template...</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            {newMessage.template_id && (() => {
              const selectedTemplate = templates.find(t => t.id === newMessage.template_id);
              return selectedTemplate && selectedTemplate.variables && selectedTemplate.variables.length > 0 ? (
                <div className="space-y-2">
                  <Label>Template Variables</Label>
                  <div className="space-y-2">
                    {selectedTemplate.variables.map((variable) => (
                      <div key={variable} className="flex items-center space-x-2">
                        <Label htmlFor={`var_${variable}`} className="text-sm min-w-[100px]">
                          {variable.replace(/_/g, ' ')}:
                        </Label>
                        <Input
                          id={`var_${variable}`}
                          placeholder={`Enter ${variable.replace(/_/g, ' ')}`}
                          onChange={(e) => {
                            const renderedText = selectedTemplate.template_text.replace(
                              new RegExp(`\\{${variable}\\}`, 'g'),
                              e.target.value
                            );
                            setNewMessage({...newMessage, body: renderedText});
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

            <div className="space-y-2">
              <Label htmlFor="body">Message *</Label>
              <Textarea
                id="body"
                value={newMessage.body}
                onChange={(e) => setNewMessage({...newMessage, body: e.target.value})}
                placeholder="Enter your message or select a template above..."
                rows={4}
                required
              />
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Characters: {newMessage.body.length}</span>
                <span>Messages: {Math.ceil(newMessage.body.length / 160)}</span>
                {getRecipientCount() > 0 && (
                  <span>Total SMS: {Math.ceil(newMessage.body.length / 160) * getRecipientCount()}</span>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsNewMessageOpen(false);
              setNewMessage({ to_number: '', body: '', template_id: '' });
              clearRecipientSelection();
            }}>
              Cancel
            </Button>
            <Button onClick={handleSendMessage}>
              <Send className="mr-2 h-4 w-4" />
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Template Dialog */}
      <Dialog open={isTemplateOpen} onOpenChange={setIsTemplateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create SMS Template</DialogTitle>
            <DialogDescription>
              Create a new SMS template with variables.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template_name">Template Name *</Label>
              <Input
                id="template_name"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                placeholder="Event Reminder"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template_description">Description</Label>
              <Input
                id="template_description"
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
                placeholder="Template for event reminders"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template_text">Template Text *</Label>
              <Textarea
                id="template_text"
                value={newTemplate.template_text}
                onChange={(e) => setNewTemplate({...newTemplate, template_text: e.target.value})}
                placeholder="Reminder: {event_title} on {event_date} at {event_time}."
                rows={4}
                required
              />
              <p className="text-xs text-muted-foreground">
                Use {'{variable_name}'} for dynamic content
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTemplateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTemplate}>
              <FileText className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recipient Selection Dialog */}
      <Dialog open={isRecipientSelectionOpen} onOpenChange={setIsRecipientSelectionOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Recipients</DialogTitle>
            <DialogDescription>
              Choose individual members or groups to send your message to.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="members" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="members">
                Members ({members.length})
              </TabsTrigger>
              <TabsTrigger value="groups">
                Groups ({groups.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="members" className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="Search members..."
                  className="w-full"
                  onChange={(e) => {
                    // Add search functionality if needed
                  }}
                />
              </div>
              
              <div className="grid gap-2 max-h-96 overflow-y-auto">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted ${
                      selectedMembers.includes(member.id) ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => toggleMemberSelection(member.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                        selectedMembers.includes(member.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                      }`}>
                        {selectedMembers.includes(member.id) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">
                          {member.firstname} {member.lastname}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {member.phone}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="groups" className="space-y-4">
              <div className="grid gap-2 max-h-96 overflow-y-auto">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted ${
                      selectedGroups.includes(group.id) ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => toggleGroupSelection(group.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                        selectedGroups.includes(group.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                      }`}>
                        {selectedGroups.includes(group.id) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{group.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {group.description || `${group.memberCount} members`}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <div className="flex items-center justify-between w-full">
              <div className="text-sm text-muted-foreground">
                {getRecipientCount()} recipient{getRecipientCount() !== 1 ? 's' : ''} selected
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={clearRecipientSelection}>
                  Clear All
                </Button>
                <Button onClick={() => setIsRecipientSelectionOpen(false)}>
                  Done
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 