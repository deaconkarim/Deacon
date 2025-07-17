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
  Check,
  RefreshCw,
  Edit,
  Trash2,
  BarChart3,
  Clock,
  Target,
  TrendingUp,
  Eye,
  EyeOff,
  Bell,
  AlertTriangle,
  CheckCircle,
  XCircle,
  CalendarDays,
  Repeat,
  Zap,
  Settings,
  Download,
  Upload,
  Copy,
  Share2,
  Star,
  StarOff
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { smsService } from '@/lib/smsService';
import { supabase } from '@/lib/supabaseClient';
import { getInitials } from '@/lib/utils/formatters';

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
  const [isEditTemplateOpen, setIsEditTemplateOpen] = useState(false);
  const [isRecipientSelectionOpen, setIsRecipientSelectionOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editingTemplateVariables, setEditingTemplateVariables] = useState('');
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
  const [newTemplateVariables, setNewTemplateVariables] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  
  // New Clearstream-style features
  const [activeTab, setActiveTab] = useState('conversations');
  const [smsStats, setSmsStats] = useState({
    totalSent: 0,
    totalDelivered: 0,
    totalFailed: 0,
    deliveryRate: 0,
    thisMonth: 0,
    lastMonth: 0
  });
  const [campaigns, setCampaigns] = useState([]);
  const [isCampaignOpen, setIsCampaignOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    message: '',
    scheduledDate: '',
    scheduledTime: '',
    recipients: [],
    type: 'immediate'
  });
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({
    deliveryRates: [],
    messageVolume: [],
    topRecipients: [],
    responseRates: []
  });
  const [isOptOutOpen, setIsOptOutOpen] = useState(false);
  const [optOutMembers, setOptOutMembers] = useState([]);
  const [isABTestOpen, setIsABTestOpen] = useState(false);
  const [abTestData, setAbTestData] = useState({
    name: '',
    variantA: '',
    variantB: '',
    testSize: 50,
    duration: 7
  });
  const [advancedFilters, setAdvancedFilters] = useState({
    dateRange: 'all',
    status: 'all',
    direction: 'all',
    hasResponse: false
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

      const { data: orgData, error: orgError } = await supabase
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .eq('approval_status', 'approved')
        .order('created_at', { ascending: true }) // Get the oldest association first
        .limit(1);

      if (orgError) throw orgError;
      if (!orgData || orgData.length === 0) throw new Error('User not associated with any organization');

      const organizationId = orgData[0].organization_id;

      // Try to load conversations, templates, members, and groups
      const [conversationsData, templatesData, membersData, groupsData, statsData] = await Promise.all([
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
          .select('id, firstname, lastname, phone, status, sms_opt_in')
          .eq('status', 'active')
          .eq('organization_id', organizationId)
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
          .eq('organization_id', organizationId)
          .order('name', { ascending: true })
          .then(({ data, error }) => {
            if (error) {
              console.warn('Failed to load groups:', error);
              return [];
            }
            return data || [];
          }),
        smsService.getSMSStats().catch(error => {
          console.warn('Failed to load SMS stats:', error);
          return {
            totalSent: 0,
            totalDelivered: 0,
            totalFailed: 0,
            deliveryRate: 0,
            thisMonth: 0,
            lastMonth: 0
          };
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
            .eq('organization_id', organizationId);

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
      setSmsStats(statsData || {
        totalSent: 0,
        totalDelivered: 0,
        totalFailed: 0,
        deliveryRate: 0,
        thisMonth: 0,
        lastMonth: 0
      });
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

    // Collect variable values if using a template
    let variables = {};
    if (newMessage.template_id) {
      const selectedTemplate = templates.find(t => t.id === newMessage.template_id);
      if (selectedTemplate) {
        const templateVariables = selectedTemplate.variables || [];
        const userEditableVariables = templateVariables.filter(v => v !== 'church_name');
        
        userEditableVariables.forEach(variable => {
          const input = document.getElementById(`var_${variable}`);
          if (input) {
            variables[variable] = input.value;
          }
        });
      }
    }

    try {
      if (recipients.length > 0) {
        // Check if this is a group message
        const isGroupMessage = selectedGroups.length > 0;
        
        if (isGroupMessage) {
          // Send group message - create one conversation for the group
          const groupId = selectedGroups[0]; // Use the first selected group
          
          // Send the first message to create the conversation, then reuse the conversation ID
          const firstMessage = await smsService.sendMessage({
            to_number: recipients[0].phone,
            body: newMessage.body,
            member_id: recipients[0].id,
            template_id: newMessage.template_id,
            variables: variables,
            group_id: groupId
          });
          
          // Send remaining messages using the same conversation
          if (recipients.length > 1) {
            const remainingMessagePromises = recipients.slice(1).map(recipient => 
              smsService.sendMessage({
                to_number: recipient.phone,
                body: newMessage.body,
                member_id: recipient.id,
                template_id: newMessage.template_id,
                variables: variables,
                conversation_id: firstMessage.conversation_id // Reuse the conversation ID
              })
            );

            await Promise.all(remainingMessagePromises);
          }
        } else {
          // Send to multiple individual recipients - create one conversation for all
          if (recipients.length > 1) {
            // Send the first message to create the conversation, then reuse the conversation ID
            const firstMessage = await smsService.sendMessage({
              to_number: recipients[0].phone,
              body: newMessage.body,
              member_id: recipients[0].id,
              template_id: newMessage.template_id,
              variables: variables,
              multiple_recipients: true // Flag to indicate this is a multi-recipient message
            });
            
            // Send remaining messages using the same conversation
            const remainingMessagePromises = recipients.slice(1).map(recipient => 
              smsService.sendMessage({
                to_number: recipient.phone,
                body: newMessage.body,
                member_id: recipient.id,
                template_id: newMessage.template_id,
                variables: variables,
                conversation_id: firstMessage.conversation_id // Reuse the conversation ID
              })
            );

            await Promise.all(remainingMessagePromises);
          } else {
            // Single recipient - normal individual conversation
            await smsService.sendMessage({
              to_number: recipients[0].phone,
              body: newMessage.body,
              member_id: recipients[0].id,
              template_id: newMessage.template_id,
              variables: variables
            });
          }
        }
        
        toast({
          title: 'Success',
          description: `Message sent to ${recipients.length} recipient${recipients.length > 1 ? 's' : ''}`
        });
      } else {
        // Send to single phone number
        await smsService.sendMessage({
          to_number: newMessage.to_number,
          body: newMessage.body,
          template_id: newMessage.template_id,
          variables: variables
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

  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      toast({
        title: 'Missing Message',
        description: 'Please enter a reply message.',
        variant: 'destructive'
      });
      return;
    }

    if (!selectedConversation) {
      toast({
        title: 'Error',
        description: 'No conversation selected.',
        variant: 'destructive'
      });
      return;
    }

    setIsSendingReply(true);
    try {
      // Find the phone number to reply to from the conversation
      const inboundMessage = selectedConversation.sms_messages?.find(m => m.direction === 'inbound');
      if (!inboundMessage) {
        throw new Error('No inbound message found to reply to');
      }

      await smsService.sendMessage({
        conversation_id: selectedConversation.id,
        to_number: inboundMessage.from_number,
        body: replyMessage,
        member_id: inboundMessage.member_id,
        template_id: null, // Replies don't use templates
        variables: {}
      });

      toast({
        title: 'Success',
        description: 'Reply sent successfully'
      });

      setReplyMessage('');
      
      // Refresh the conversation
      const updatedConversation = await smsService.getConversation(selectedConversation.id);
      setSelectedConversation(updatedConversation);
      
      // Refresh conversations list
      await loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to send reply: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setIsSendingReply(false);
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

    // Extract variables from template text and combine with manually entered variables
    const extractedVariables = (newTemplate.template_text.match(/\{([^}]+)\}/g) || [])
      .map(v => v.replace(/[{}]/g, ''));
    
    const manualVariables = newTemplateVariables
      .split(',')
      .map(v => v.trim())
      .filter(v => v.length > 0);
    
    const allVariables = [...new Set([...extractedVariables, ...manualVariables])];
    
    // Filter out system variables that shouldn't be stored as user variables
    const userVariables = allVariables.filter(v => v !== 'church_name');

    const templateData = {
      ...newTemplate,
      variables: userVariables
    };

    try {
      await smsService.createTemplate(templateData);
      setIsTemplateOpen(false);
      setNewTemplate({ name: '', description: '', template_text: '', variables: [] });
      setNewTemplateVariables('');
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

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    // Set variables as comma-separated string for editing
    const variablesString = Array.isArray(template.variables) 
      ? template.variables.join(', ')
      : '';
    setEditingTemplateVariables(variablesString);
    setIsEditTemplateOpen(true);
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate.name || !editingTemplate.template_text) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in template name and text.',
        variant: 'destructive'
      });
      return;
    }

    // Extract variables from template text and combine with manually entered variables
    const extractedVariables = (editingTemplate.template_text.match(/\{([^}]+)\}/g) || [])
      .map(v => v.replace(/[{}]/g, ''));
    
    const manualVariables = editingTemplateVariables
      .split(',')
      .map(v => v.trim())
      .filter(v => v.length > 0);
    
    const allVariables = [...new Set([...extractedVariables, ...manualVariables])];
    
    // Filter out system variables that shouldn't be stored as user variables
    const userVariables = allVariables.filter(v => v !== 'church_name');

    const templateData = {
      ...editingTemplate,
      variables: userVariables
    };

    try {
      await smsService.updateTemplate(editingTemplate.id, templateData);
      setIsEditTemplateOpen(false);
      setEditingTemplate(null);
      setEditingTemplateVariables('');
      toast({
        title: 'Success',
        description: 'Template updated successfully'
      });
      
      // Refresh templates
      await loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to update template: ${error.message}`,
        variant: 'destructive'
      });
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      await smsService.deleteTemplate(templateId);
      toast({
        title: 'Success',
        description: 'Template deleted successfully'
      });
      
      // Refresh templates
      await loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to delete template: ${error.message}`,
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

  const getRecipientTitle = () => {
    if (selectedGroups.length > 0 && selectedMembers.length === 0) {
      // Only groups selected
      const selectedGroupNames = groups
        .filter(group => selectedGroups.includes(group.id))
        .map(group => group.name);
      
      if (selectedGroupNames.length === 1) {
        return `Group: ${selectedGroupNames[0]} (${recipientCount} members)`;
      } else {
        return `${selectedGroupNames.length} Groups (${recipientCount} members)`;
      }
    } else if (selectedMembers.length > 0 && selectedGroups.length === 0) {
      // Only members selected
      return `${selectedMembers.length} member${selectedMembers.length > 1 ? 's' : ''} selected`;
    } else if (selectedMembers.length > 0 && selectedGroups.length > 0) {
      // Both members and groups selected
      return `${recipientCount} recipients selected`;
    } else {
      return 'Select Members/Groups';
    }
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

  const getUniqueMessageCount = (messages) => {
    if (!messages || messages.length === 0) return 0;
    
    const seenMessages = new Set();
    let uniqueCount = 0;
    
    messages.forEach((message) => {
      // For outbound messages, group by content only (ignore timestamp for grouping)
      // For inbound messages, keep them separate since they're from different people
      const messageKey = message.direction === 'outbound' 
        ? `${message.direction}-${message.body}`
        : `${message.direction}-${message.body}-${message.sent_at}-${message.member?.id || 'unknown'}`;
      
      if (!seenMessages.has(messageKey)) {
        seenMessages.add(messageKey);
        uniqueCount++;
      }
    });
    
    return uniqueCount;
  };

  const clearRecipientSelection = () => {
    setSelectedMembers([]);
    setSelectedGroups([]);
    setRecipientCount(0);
  };

  // Clearstream-style new functions
  const handleCreateCampaign = async () => {
    try {
      const campaignData = {
        ...newCampaign,
        organization_id: await getCurrentUserOrganizationId(),
        status: 'scheduled',
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('sms_campaigns')
        .insert(campaignData)
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Campaign created successfully'
      });
      
      setIsCampaignOpen(false);
      setNewCampaign({
        name: '',
        description: '',
        message: '',
        scheduledDate: '',
        scheduledTime: '',
        recipients: [],
        type: 'immediate'
      });
      
      // Reload campaigns
      loadCampaigns();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to create campaign: ${error.message}`,
        variant: 'destructive'
      });
    }
  };

  const loadCampaigns = async () => {
    try {
      const organizationId = await getCurrentUserOrganizationId();
      const { data, error } = await supabase
        .from('sms_campaigns')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    }
  };

  const handleOptOutToggle = async (memberId, currentOptIn) => {
    try {
      const { error } = await supabase
        .from('members')
        .update({ sms_opt_in: !currentOptIn })
        .eq('id', memberId);
      
      if (error) throw error;
      
      // Update local state
      setMembers(prev => prev.map(m => 
        m.id === memberId ? { ...m, sms_opt_in: !currentOptIn } : m
      ));
      
      toast({
        title: 'Success',
        description: `Member ${currentOptIn ? 'opted out' : 'opted in'} successfully`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to update opt-in status: ${error.message}`,
        variant: 'destructive'
      });
    }
  };

  const handleABTest = async () => {
    try {
      const testData = {
        ...abTestData,
        organization_id: await getCurrentUserOrganizationId(),
        status: 'active',
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('sms_ab_tests')
        .insert(testData)
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'A/B test created successfully'
      });
      
      setIsABTestOpen(false);
      setAbTestData({
        name: '',
        variantA: '',
        variantB: '',
        testSize: 50,
        duration: 7
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to create A/B test: ${error.message}`,
        variant: 'destructive'
      });
    }
  };

  const exportSMSData = async () => {
    try {
      const organizationId = await getCurrentUserOrganizationId();
      const { data, error } = await supabase
        .from('sms_messages')
        .select(`
          *,
          member:members(firstname, lastname, phone),
          conversation:sms_conversations(title, conversation_type)
        `)
        .eq('organization_id', organizationId)
        .order('sent_at', { ascending: false });
      
      if (error) throw error;
      
      // Convert to CSV
      const csvData = data.map(msg => ({
        Date: format(new Date(msg.sent_at), 'yyyy-MM-dd HH:mm:ss'),
        Direction: msg.direction,
        From: msg.from_number,
        To: msg.to_number,
        Message: msg.body,
        Status: msg.status,
        Member: msg.member ? `${msg.member.firstname} ${msg.member.lastname}` : 'N/A',
        Conversation: msg.conversation?.title || 'N/A'
      }));
      
      const csvContent = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
      ].join('\n');
      
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sms-data-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Success',
        description: 'SMS data exported successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to export data: ${error.message}`,
        variant: 'destructive'
      });
    }
  };

  const getCurrentUserOrganizationId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: orgData, error: orgError } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .eq('approval_status', 'approved')
      .order('created_at', { ascending: true })
      .limit(1);

    if (orgError) throw orgError;
    if (!orgData || orgData.length === 0) throw new Error('User not associated with any organization');

    return orgData[0].organization_id;
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

      <Tabs defaultValue="conversations" className="space-y-4" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="opt-out">Opt-Out</TabsTrigger>
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
                    ? "Start sending SMS messages to your church members and groups. Create conversations by sending your first message."
                    : "No conversations match your current filters."
                  }
                </p>
                {conversations.length === 0 && (
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Ready to get started?</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Select members or groups from your church directory</li>
                      <li>Write your message or use a template</li>
                      <li>Send and start conversations with your congregation</li>
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
                          {getUniqueMessageCount(conversation.sms_messages)} messages • 
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
                    <div className="flex justify-end pt-2 space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTemplate(template)}
                      >
                        <Edit className="mr-2 h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <Trash2 className="mr-2 h-3 w-3" />
                        Delete
                      </Button>
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

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">SMS Campaigns</h3>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setIsABTestOpen(true)}>
                <Target className="mr-2 h-4 w-4" />
                A/B Test
              </Button>
              <Button onClick={() => setIsCampaignOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Campaign
              </Button>
            </div>
          </div>

          {/* Campaign Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{campaigns.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{campaigns.filter(c => c.status === 'active').length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{campaigns.filter(c => c.status === 'scheduled').length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{campaigns.filter(c => c.status === 'completed').length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Campaigns List */}
          <div className="grid gap-4">
            {campaigns.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Campaigns Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first SMS campaign to reach your congregation effectively.
                  </p>
                </CardContent>
              </Card>
            ) : (
              campaigns.map((campaign) => (
                <Card key={campaign.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{campaign.name}</CardTitle>
                        <CardDescription>{campaign.description}</CardDescription>
                      </div>
                      <Badge variant={campaign.status === 'active' ? 'default' : campaign.status === 'scheduled' ? 'secondary' : 'outline'}>
                        {campaign.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Message:</div>
                      <div className="p-3 bg-muted rounded-md text-sm">
                        {campaign.message}
                      </div>
                      <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>Type: {campaign.type}</span>
                        <span>Created: {format(new Date(campaign.created_at), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">SMS Analytics</h3>
            <Button variant="outline" onClick={exportSMSData}>
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
          </div>

          {/* Analytics Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Messages Sent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{smsStats.totalSent}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{smsStats.deliveryRate}%</div>
                <p className="text-xs text-muted-foreground">Successfully delivered</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{smsStats.thisMonth}</div>
                <p className="text-xs text-muted-foreground">Messages sent</p>
              </CardContent>
            </Card>
          </div>

          {/* Message Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Message Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="font-semibold">{smsStats.totalDelivered}</div>
                    <div className="text-sm text-muted-foreground">Delivered</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <div>
                    <div className="font-semibold">{smsStats.totalSent - smsStats.totalDelivered - smsStats.totalFailed}</div>
                    <div className="text-sm text-muted-foreground">Pending</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <div className="font-semibold">{smsStats.totalFailed}</div>
                    <div className="text-sm text-muted-foreground">Failed</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Opt-Out Management Tab */}
        <TabsContent value="opt-out" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">SMS Opt-Out Management</h3>
            <Button variant="outline" onClick={() => setIsOptOutOpen(true)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Button>
          </div>

          {/* Opt-In Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Opted In</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{members.filter(m => m.sms_opt_in).length}</div>
                <p className="text-xs text-muted-foreground">Members receiving SMS</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Opted Out</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{members.filter(m => !m.sms_opt_in).length}</div>
                <p className="text-xs text-muted-foreground">Members not receiving SMS</p>
              </CardContent>
            </Card>
          </div>

          {/* Members List */}
          <Card>
            <CardHeader>
              <CardTitle>Member SMS Preferences</CardTitle>
              <CardDescription>
                Manage which members receive SMS messages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.image_url} />
                        <AvatarFallback className="text-sm">
                          {getInitials(member.firstname, member.lastname)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {member.firstname} {member.lastname}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {member.phone}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={member.sms_opt_in ? 'default' : 'secondary'}>
                        {member.sms_opt_in ? 'Opted In' : 'Opted Out'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOptOutToggle(member.id, member.sms_opt_in)}
                      >
                        {member.sms_opt_in ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Conversation Detail Dialog */}
      {selectedConversation && (
        <Dialog open={!!selectedConversation} onOpenChange={() => setSelectedConversation(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {(() => {
                    const inboundMessage = selectedConversation.sms_messages?.find(m => m.direction === 'inbound');
                    if (inboundMessage?.member) {
                      return (
                        <>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={inboundMessage.member.image_url} />
                            <AvatarFallback className="text-sm">
                              {getInitials(inboundMessage.member.firstname, inboundMessage.member.lastname)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold">
                              {inboundMessage.member.firstname} {inboundMessage.member.lastname}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {inboundMessage.from_number}
                            </div>
                          </div>
                        </>
                      );
                    } else if (inboundMessage) {
                      return (
                        <>
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-sm">
                              <Phone className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold">Unknown Contact</div>
                            <div className="text-sm text-muted-foreground">
                              {inboundMessage.from_number}
                            </div>
                          </div>
                        </>
                      );
                    }
                    return <span>{selectedConversation.title}</span>;
                  })()}
                </div>
              </DialogTitle>
              <DialogDescription>
                {getUniqueMessageCount(selectedConversation.sms_messages)} messages • Last updated {format(new Date(selectedConversation.updated_at), 'MMM d, yyyy HH:mm')}
              </DialogDescription>
            </DialogHeader>
            
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto space-y-4 p-4 border-t">
              {(() => {
                // Group messages by content and direction to avoid duplicates
                const groupedMessages = [];
                const seenMessages = new Set();
                
                selectedConversation.sms_messages
                  ?.sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at))
                  .forEach((message) => {
                    // For outbound messages, group by content only (ignore timestamp for grouping)
                    // For inbound messages, keep them separate since they're from different people
                    const messageKey = message.direction === 'outbound' 
                      ? `${message.direction}-${message.body}`
                      : `${message.direction}-${message.body}-${message.sent_at}-${message.member?.id || 'unknown'}`;
                    
                    if (!seenMessages.has(messageKey)) {
                      seenMessages.add(messageKey);
                      
                      if (message.direction === 'outbound') {
                        // Find all outbound messages with the same content
                        const similarMessages = selectedConversation.sms_messages.filter(m => 
                          m.direction === 'outbound' && 
                          m.body === message.body
                        );
                        
                        // Get unique recipients for this message
                        const recipients = similarMessages
                          .filter(m => m.member)
                          .map(m => m.member)
                          .filter((member, index, arr) => 
                            arr.findIndex(m => m.id === member.id) === index
                          );
                        
                        // Use the earliest timestamp for display
                        const earliestMessage = similarMessages.reduce((earliest, current) => 
                          new Date(current.sent_at) < new Date(earliest.sent_at) ? current : earliest
                        );
                        
                        groupedMessages.push({
                          ...earliestMessage,
                          recipients,
                          recipientCount: recipients.length
                        });
                      } else {
                        // For inbound messages, just add them as-is
                        groupedMessages.push(message);
                      }
                    }
                  });
                
                return groupedMessages.map((message) => (
                  <div key={`${message.direction}-${message.body}-${message.sent_at}-${message.member?.id || 'unknown'}`} className={`flex ${message.direction === 'inbound' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`flex max-w-[80%] ${message.direction === 'inbound' ? 'flex-row' : 'flex-row-reverse'}`}>
                      {/* Avatar */}
                      <div className={`flex-shrink-0 ${message.direction === 'inbound' ? 'mr-3' : 'ml-3'}`}>
                        {message.direction === 'inbound' ? (
                          message.member ? (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={message.member.image_url} />
                              <AvatarFallback className="text-sm">
                                {getInitials(message.member.firstname, message.member.lastname)}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-sm">
                                <Phone className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                          )
                        ) : (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-sm bg-primary text-primary-foreground">
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                      
                      {/* Message Bubble */}
                      <div className={`flex flex-col ${message.direction === 'inbound' ? 'items-start' : 'items-end'}`}>
                        <div className={`px-4 py-2 rounded-lg max-w-full ${
                          message.direction === 'inbound' 
                            ? 'bg-muted text-foreground' 
                            : 'bg-primary text-primary-foreground'
                        }`}>
                          <div className="text-sm whitespace-pre-wrap">{message.body}</div>
                        </div>
                        
                        {/* Message Info */}
                        <div className={`flex items-center space-x-2 mt-1 text-xs text-muted-foreground ${
                          message.direction === 'inbound' ? 'justify-start' : 'justify-end'
                        }`}>
                          <span>{format(new Date(message.sent_at), 'MMM d, HH:mm')}</span>
                          {message.direction === 'outbound' && (
                            <Badge variant="outline" className="text-xs">
                              {message.status}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Recipients Info (for outbound messages with multiple recipients) */}
                        {message.direction === 'outbound' && message.recipientCount > 1 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Sent to {message.recipientCount} recipient{message.recipientCount > 1 ? 's' : ''}
                          </div>
                        )}
                        
                        {/* Member Name (for inbound messages) */}
                        {message.direction === 'inbound' && message.member && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {message.member.firstname} {message.member.lastname}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
            
            {/* Reply Section */}
            {selectedConversation.sms_messages?.some(m => m.direction === 'inbound') && (
              <div className="flex-shrink-0 border-t p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <Send className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Send Reply</span>
                </div>
                <div className="space-y-2">
                  <Textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply..."
                    rows={3}
                    className="resize-none"
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-form-type="other"
                    name="sms-reply-text"
                    id="sms-reply-text"
                  />
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-muted-foreground">
                      Characters: {replyMessage.length} • Messages: {Math.ceil(replyMessage.length / 160)}
                    </div>
                    <Button 
                      onClick={handleSendReply}
                      disabled={!replyMessage.trim() || isSendingReply}
                      size="sm"
                    >
                      {isSendingReply ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Reply
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
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
                  {getRecipientTitle()}
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
              {getRecipientCount() > 0 && selectedGroups.length === 0 && (
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
              
              // Get variables from template, ensuring they're clean (no curly braces)
              let variables = selectedTemplate?.variables || [];
              if (variables.length === 0) {
                // Fallback: extract from template text
                variables = (selectedTemplate?.template_text?.match(/\{([^}]+)\}/g) || [])
                  .map(v => v.replace(/[{}]/g, ''));
              }
              
              // Clean any variables that might still have curly braces
              variables = variables.map(v => v.replace(/[{}]/g, ''));
              
              // Filter out system variables and duplicates
              const userEditableVariables = [...new Set(variables.filter(v => v !== 'church_name'))];
              
              return selectedTemplate && userEditableVariables.length > 0 ? (
                                    <div className="space-y-2">
                      <Label>Template Variables</Label>
                      <div className="space-y-2">
                        {userEditableVariables.map((variable) => (
                      <div key={variable} className="flex items-center space-x-2">
                        <Label htmlFor={`var_${variable}`} className="text-sm min-w-[100px]">
                          {variable.replace(/_/g, ' ')}:
                        </Label>
                        <Input
                          id={`var_${variable}`}
                          placeholder={`Enter ${variable.replace(/_/g, ' ')}`}
                          onChange={(e) => {
                            // Get all current variable values
                            const variableValues = {};
                            userEditableVariables.forEach(v => {
                              const input = document.getElementById(`var_${v}`);
                              if (input) {
                                variableValues[v] = input.value;
                              }
                            });
                            
                            // Replace all variables at once
                            let renderedText = selectedTemplate.template_text;
                            Object.entries(variableValues).forEach(([varName, value]) => {
                              renderedText = renderedText.replace(
                                new RegExp(`\\{${varName}\\}`, 'g'),
                                value
                              );
                            });
                            
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
                Use {'{variable_name}'} for dynamic content. {'{church_name}'} is automatically available.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="template_variables">Additional Variables (Optional)</Label>
              <Input
                id="template_variables"
                value={newTemplateVariables}
                onChange={(e) => setNewTemplateVariables(e.target.value)}
                placeholder="variable1, variable2, variable3"
              />
              <p className="text-xs text-muted-foreground">
                Enter additional variables separated by commas (variables from template text are automatically included)
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

      {/* Edit Template Dialog */}
      <Dialog open={isEditTemplateOpen} onOpenChange={setIsEditTemplateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit SMS Template</DialogTitle>
            <DialogDescription>
              Update the SMS template and its variables.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_template_name">Template Name *</Label>
              <Input
                id="edit_template_name"
                value={editingTemplate?.name || ''}
                onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})}
                placeholder="Event Reminder"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_template_description">Description</Label>
              <Input
                id="edit_template_description"
                value={editingTemplate?.description || ''}
                onChange={(e) => setEditingTemplate({...editingTemplate, description: e.target.value})}
                placeholder="Template for event reminders"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_template_text">Template Text *</Label>
              <Textarea
                id="edit_template_text"
                value={editingTemplate?.template_text || ''}
                onChange={(e) => setEditingTemplate({...editingTemplate, template_text: e.target.value})}
                placeholder="Reminder: {event_title} on {event_date} at {event_time}."
                rows={4}
                required
              />
              <p className="text-xs text-muted-foreground">
                Use {'{variable_name}'} for dynamic content. {'{church_name}'} is automatically available.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_template_variables">Additional Variables (Optional)</Label>
              <Input
                id="edit_template_variables"
                value={editingTemplateVariables}
                onChange={(e) => setEditingTemplateVariables(e.target.value)}
                placeholder="variable1, variable2, variable3"
              />
              <p className="text-xs text-muted-foreground">
                Enter additional variables separated by commas (variables from template text are automatically included)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditTemplateOpen(false);
              setEditingTemplate(null);
              setEditingTemplateVariables('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTemplate}>
              <Edit className="mr-2 h-4 w-4" />
              Update Template
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
                          {member.firstname || member.firstName || 'Unknown'} {member.lastname || member.lastName || 'Unknown'}
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

      {/* Campaign Dialog */}
      <Dialog open={isCampaignOpen} onOpenChange={setIsCampaignOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create SMS Campaign</DialogTitle>
            <DialogDescription>
              Create a scheduled SMS campaign to reach your congregation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="campaign_name">Campaign Name *</Label>
              <Input
                id="campaign_name"
                value={newCampaign.name}
                onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                placeholder="Sunday Service Reminder"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaign_description">Description</Label>
              <Input
                id="campaign_description"
                value={newCampaign.description}
                onChange={(e) => setNewCampaign({...newCampaign, description: e.target.value})}
                placeholder="Weekly reminder for Sunday service"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaign_message">Message *</Label>
              <Textarea
                id="campaign_message"
                value={newCampaign.message}
                onChange={(e) => setNewCampaign({...newCampaign, message: e.target.value})}
                placeholder="Join us this Sunday at 10 AM for worship!"
                rows={4}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="campaign_date">Scheduled Date</Label>
                <Input
                  id="campaign_date"
                  type="date"
                  value={newCampaign.scheduledDate}
                  onChange={(e) => setNewCampaign({...newCampaign, scheduledDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="campaign_time">Scheduled Time</Label>
                <Input
                  id="campaign_time"
                  type="time"
                  value={newCampaign.scheduledTime}
                  onChange={(e) => setNewCampaign({...newCampaign, scheduledTime: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaign_type">Campaign Type</Label>
              <select
                id="campaign_type"
                value={newCampaign.type}
                onChange={(e) => setNewCampaign({...newCampaign, type: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="immediate">Send Immediately</option>
                <option value="scheduled">Scheduled</option>
                <option value="recurring">Recurring</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCampaignOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCampaign}>
              <Target className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* A/B Test Dialog */}
      <Dialog open={isABTestOpen} onOpenChange={setIsABTestOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create A/B Test</DialogTitle>
            <DialogDescription>
              Test two different message variants to see which performs better.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ab_test_name">Test Name *</Label>
              <Input
                id="ab_test_name"
                value={abTestData.name}
                onChange={(e) => setAbTestData({...abTestData, name: e.target.value})}
                placeholder="Welcome Message Test"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ab_test_variant_a">Variant A *</Label>
                <Textarea
                  id="ab_test_variant_a"
                  value={abTestData.variantA}
                  onChange={(e) => setAbTestData({...abTestData, variantA: e.target.value})}
                  placeholder="Welcome to our church!"
                  rows={3}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ab_test_variant_b">Variant B *</Label>
                <Textarea
                  id="ab_test_variant_b"
                  value={abTestData.variantB}
                  onChange={(e) => setAbTestData({...abTestData, variantB: e.target.value})}
                  placeholder="We're glad you're here!"
                  rows={3}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ab_test_size">Test Size (%)</Label>
                <Input
                  id="ab_test_size"
                  type="number"
                  min="10"
                  max="100"
                  value={abTestData.testSize}
                  onChange={(e) => setAbTestData({...abTestData, testSize: parseInt(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ab_test_duration">Duration (days)</Label>
                <Input
                  id="ab_test_duration"
                  type="number"
                  min="1"
                  max="30"
                  value={abTestData.duration}
                  onChange={(e) => setAbTestData({...abTestData, duration: parseInt(e.target.value)})}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsABTestOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleABTest}>
              <Zap className="mr-2 h-4 w-4" />
              Start A/B Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog open={isAnalyticsOpen} onOpenChange={setIsAnalyticsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>SMS Analytics Details</DialogTitle>
            <DialogDescription>
              Detailed analytics and insights for your SMS campaigns.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Delivery Rate Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Delivery Rate Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Chart placeholder - Integration with charting library needed
                </div>
              </CardContent>
            </Card>

            {/* Top Recipients */}
            <Card>
              <CardHeader>
                <CardTitle>Top Recipients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analyticsData.topRecipients.slice(0, 5).map((recipient, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{index + 1}.</span>
                        <span>{recipient.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{recipient.count} messages</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAnalyticsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Opt-Out Details Dialog */}
      <Dialog open={isOptOutOpen} onOpenChange={setIsOptOutOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>SMS Opt-Out Details</DialogTitle>
            <DialogDescription>
              Detailed view of member SMS preferences and opt-out reasons.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Members</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{members.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Opt-In Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {members.length > 0 ? Math.round((members.filter(m => m.sms_opt_in).length / members.length) * 100) : 0}%
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Opt-Out Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span>Opted In</span>
                    <Badge variant="default">{members.filter(m => m.sms_opt_in).length}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span>Opted Out</span>
                    <Badge variant="secondary">{members.filter(m => !m.sms_opt_in).length}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOptOutOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 