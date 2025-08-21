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
  CheckCircle2,
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
import { messagingService } from '@/lib/messagingService';
import { supabase } from '@/lib/supabaseClient';
import { getInitials } from '@/lib/utils/formatters';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

// Add CSS for line clamping
const lineClampStyles = `
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

export function Messaging() {
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
  const [messageType, setMessageType] = useState('sms'); // 'sms' or 'email'
  const [activeMessageType, setActiveMessageType] = useState('all'); // Filter for conversations
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [isEditTemplateOpen, setIsEditTemplateOpen] = useState(false);
  const [isRecipientSelectionOpen, setIsRecipientSelectionOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editingTemplateVariables, setEditingTemplateVariables] = useState('');
  const [newMessage, setNewMessage] = useState({
    messageType: 'sms',
    to_number: '',
    to_email: '',
    subject: '',
    body: '',
    template_id: ''
  });
  const [newTemplate, setNewTemplate] = useState({
    messageType: 'sms',
    name: '',
    description: '',
    subject: '',
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
    selectedGroups: [],
    selectedMembers: [],
    targetType: 'all', // 'all', 'groups', 'members'
    type: 'immediate'
  });
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
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

  const loadAnalyticsData = async (organizationId) => {
    setIsAnalyticsLoading(true);
    try {
      // Get SMS messages for analytics
      const { data: messages, error: messagesError } = await supabase
        .from('sms_messages')
        .select(`
          *,
          member:members(firstname, lastname),
          conversation:sms_conversations(conversation_type)
        `)
        .eq('organization_id', organizationId)
        .order('sent_at', { ascending: true });

      if (messagesError) throw messagesError;

      if (!messages || messages.length === 0) {
        setAnalyticsData({
          deliveryRates: [],
          messageVolume: [],
          topRecipients: [],
          responseRates: []
        });
        return;
      }

      // Process delivery rates by month
      const deliveryRatesByMonth = {};
      const messageVolumeByMonth = {};
      const recipientCounts = {};
      const conversationTypeCounts = {};

      messages.forEach(message => {
        const date = new Date(message.sent_at);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
        const year = date.getFullYear();
        const monthYear = `${monthKey} ${year}`;

        // Delivery rates
        if (!deliveryRatesByMonth[monthYear]) {
          deliveryRatesByMonth[monthYear] = { total: 0, delivered: 0 };
        }
        deliveryRatesByMonth[monthYear].total++;
        if (message.status === 'delivered') {
          deliveryRatesByMonth[monthYear].delivered++;
        }

        // Message volume
        if (!messageVolumeByMonth[monthYear]) {
          messageVolumeByMonth[monthYear] = { sent: 0, delivered: 0 };
        }
        messageVolumeByMonth[monthYear].sent++;
        if (message.status === 'delivered') {
          messageVolumeByMonth[monthYear].delivered++;
        }

        // Top recipients (for outbound messages)
        if (message.direction === 'outbound' && message.member) {
          const memberName = `${message.member.firstname} ${message.member.lastname}`;
          recipientCounts[memberName] = (recipientCounts[memberName] || 0) + 1;
        }

        // Conversation types
        if (message.conversation?.conversation_type) {
          const type = message.conversation.conversation_type.replace('_', ' ');
          conversationTypeCounts[type] = (conversationTypeCounts[type] || 0) + 1;
        }
      });

      // Convert to chart data format with proper validation
      const deliveryRates = Object.entries(deliveryRatesByMonth)
        .map(([month, data]) => {
          const rate = data.total > 0 ? Math.round((data.delivered / data.total) * 100 * 10) / 10 : 0;
          return {
            month,
            rate: isNaN(rate) ? 0 : rate
          };
        })
        .filter(item => item.rate >= 0 && item.rate <= 100) // Ensure valid percentage
        .slice(-6); // Last 6 months

      const messageVolume = Object.entries(messageVolumeByMonth)
        .map(([month, data]) => ({
          month,
          sent: isNaN(data.sent) ? 0 : data.sent,
          delivered: isNaN(data.delivered) ? 0 : data.delivered
        }))
        .filter(item => item.sent >= 0 && item.delivered >= 0) // Ensure valid counts
        .slice(-6); // Last 6 months

      const topRecipients = Object.entries(recipientCounts)
        .map(([name, count]) => ({ 
          name: name || 'Unknown', 
          count: isNaN(count) ? 0 : count 
        }))
        .filter(item => item.count > 0) // Only include recipients with messages
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate response rates (simplified - based on conversation types)
      const totalMessages = messages.length;
      const responseRates = Object.entries(conversationTypeCounts)
        .map(([type, count]) => {
          const rate = totalMessages > 0 ? Math.round((count / totalMessages) * 100) : 0;
          return {
            type: type || 'Unknown',
            rate: isNaN(rate) ? 0 : rate
          };
        })
        .filter(item => item.rate > 0) // Only include types with messages
        .sort((a, b) => b.rate - a.rate);

      // Final validation before setting state
      const validatedAnalyticsData = {
        deliveryRates: Array.isArray(deliveryRates) ? deliveryRates : [],
        messageVolume: Array.isArray(messageVolume) ? messageVolume : [],
        topRecipients: Array.isArray(topRecipients) ? topRecipients : [],
        responseRates: Array.isArray(responseRates) ? responseRates : []
      };

      setAnalyticsData(validatedAnalyticsData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      setAnalyticsData({
        deliveryRates: [],
        messageVolume: [],
        topRecipients: [],
        responseRates: []
      });
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

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
        messagingService.getConversations(activeMessageType).catch(error => {
          console.warn('Failed to load conversations:', error);
          return [];
        }),
        messagingService.getTemplates('all').catch(error => {
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
        messagingService.getMessagingStats().catch(error => {
          console.warn('Failed to load messaging stats:', error);
          return {
            sms: { totalSent: 0, totalDelivered: 0, deliveryRate: 0, thisMonth: 0 },
            email: { totalSent: 0, totalConversations: 0 },
            combined: { totalMessages: 0, totalConversations: 0 }
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
      setSmsStats(statsData?.sms || {
        totalSent: 0,
        totalDelivered: 0,
        totalFailed: 0,
        deliveryRate: 0,
        thisMonth: 0,
        lastMonth: 0
      });

      // Load analytics data
      await loadAnalyticsData(organizationId);
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
      const fullConversation = await messagingService.getConversation(conversation.id, conversation.messageType);
      // Add messageType to the conversation for later use
      fullConversation.messageType = conversation.messageType;
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
    
    // Validate recipients
    const hasDirectRecipient = newMessage.messageType === 'sms' ? newMessage.to_number : newMessage.to_email;
    if (recipients.length === 0 && !hasDirectRecipient) {
      toast({
        title: 'Missing Recipients',
        description: `Please select recipients or enter a ${newMessage.messageType === 'sms' ? 'phone number' : 'email address'}.`,
        variant: 'destructive'
      });
      return;
    }

    // Validate message content
    if (!newMessage.body) {
      toast({
        title: 'Missing Message',
        description: 'Please enter a message to send.',
        variant: 'destructive'
      });
      return;
    }

    // Validate email subject
    if (newMessage.messageType === 'email' && !newMessage.subject) {
      toast({
        title: 'Missing Subject',
        description: 'Please enter an email subject.',
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
      // Prepare message data based on type
      const messageData = {
        messageType: newMessage.messageType,
        body: newMessage.body,
        template_id: newMessage.template_id,
        variables: variables,
        conversation_type: 'general'
      };

      // Add type-specific fields
      if (newMessage.messageType === 'sms') {
        if (recipients.length > 0) {
          // For SMS, handle group messaging and multiple recipients
          const isGroupMessage = selectedGroups.length > 0;
          
          if (isGroupMessage) {
            const groupId = selectedGroups[0];
            const firstMessage = await smsService.sendMessage({
              ...messageData,
              to_number: recipients[0].phone,
              member_id: recipients[0].id,
              group_id: groupId
            });
            
            if (recipients.length > 1) {
              const remainingMessagePromises = recipients.slice(1).map(recipient => 
                smsService.sendMessage({
                  ...messageData,
                  to_number: recipient.phone,
                  member_id: recipient.id,
                  conversation_id: firstMessage.conversation_id
                })
              );
              await Promise.all(remainingMessagePromises);
            }
          } else if (recipients.length > 1) {
            const firstMessage = await smsService.sendMessage({
              ...messageData,
              to_number: recipients[0].phone,
              member_id: recipients[0].id,
              multiple_recipients: true
            });
            
            const remainingMessagePromises = recipients.slice(1).map(recipient => 
              smsService.sendMessage({
                ...messageData,
                to_number: recipient.phone,
                member_id: recipient.id,
                conversation_id: firstMessage.conversation_id
              })
            );
            await Promise.all(remainingMessagePromises);
          } else {
            await smsService.sendMessage({
              ...messageData,
              to_number: recipients[0].phone,
              member_id: recipients[0].id
            });
          }
        } else {
          await smsService.sendMessage({
            ...messageData,
            to_number: newMessage.to_number
          });
        }
      } else if (newMessage.messageType === 'email') {
        messageData.subject = newMessage.subject;
        
        if (recipients.length > 0) {
          // For email, use bulk sending
          await messagingService.sendMessage({
            ...messageData,
            recipients: recipients.map(r => ({
              ...r,
              email: r.email || `${r.firstname}.${r.lastname}@example.com` // Fallback email
            })),
            selectedGroups: selectedGroups
          });
        } else {
          await messagingService.sendMessage({
            ...messageData,
            to_email: newMessage.to_email,
            recipients: [{ email: newMessage.to_email }]
          });
        }
      }

      toast({
        title: 'Success',
        description: `${newMessage.messageType.toUpperCase()} sent to ${recipients.length || 1} recipient${(recipients.length || 1) > 1 ? 's' : ''}`
      });

      setIsNewMessageOpen(false);
      setNewMessage({ 
        messageType: 'sms',
        to_number: '',
        to_email: '',
        subject: '',
        body: '',
        template_id: ''
      });
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

    // Validate email subject
    if (newTemplate.messageType === 'email' && !newTemplate.subject) {
      toast({
        title: 'Missing Subject',
        description: 'Please fill in the email subject.',
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
      await messagingService.createTemplate(templateData);
      setIsTemplateOpen(false);
      setNewTemplate({ 
        messageType: 'sms',
        name: '', 
        description: '', 
        subject: '',
        template_text: '', 
        variables: [] 
      });
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

  const handleDeleteTemplate = async (template) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      await messagingService.deleteTemplate(template.id, template.messageType);
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

  const getConversationParticipants = (messages) => {
    if (!messages || messages.length === 0) return 0;
    
    const participants = new Set();
    
    messages.forEach((message) => {
      if (message.direction === 'inbound' && message.member) {
        participants.add(message.member.id);
      } else if (message.direction === 'outbound') {
        // Count unique recipients for outbound messages
        if (message.member) {
          participants.add(message.member.id);
        }
      }
    });
    
    return participants.size;
  };

  const getConversationStatus = (conversation) => {
    if (!conversation.mostRecentMessage) return 'unknown';
    
    const lastMessageTime = new Date(conversation.mostRecentMessage.sent_at);
    const now = new Date();
    const hoursSinceLastMessage = (now - lastMessageTime) / (1000 * 60 * 60);
    
    if (hoursSinceLastMessage < 1) return 'very-recent';
    if (hoursSinceLastMessage < 24) return 'recent';
    if (hoursSinceLastMessage < 168) return 'week-old'; // 7 days
    return 'old';
  };

  const getConversationStatusColor = (status) => {
    switch (status) {
      case 'very-recent': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'recent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'week-old': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'old': return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getConversationStatusText = (status) => {
    switch (status) {
      case 'very-recent': return 'Very Recent';
      case 'recent': return 'Recent';
      case 'week-old': return 'This Week';
      case 'old': return 'Older';
      default: return 'Unknown';
    }
  };

  const getConversationSummary = (messages) => {
    if (!messages || messages.length === 0) return '';
    
    // Get the last few messages to show conversation flow
    const recentMessages = messages
      .sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at))
      .slice(-3); // Last 3 messages
    
    if (recentMessages.length === 1) {
      return 'Single message';
    }
    
    const directionChanges = recentMessages.reduce((changes, message, index) => {
      if (index > 0 && message.direction !== recentMessages[index - 1].direction) {
        changes++;
      }
      return changes;
    }, 0);
    
    if (directionChanges === 0) {
      return 'One-way conversation';
    } else if (directionChanges === 1) {
      return 'Simple exchange';
    } else {
      return 'Active conversation';
    }
  };

  const clearRecipientSelection = () => {
    setSelectedMembers([]);
    setSelectedGroups([]);
    setRecipientCount(0);
  };

  // Clearstream-style new functions
  const handleCreateCampaign = async () => {
    try {
      // Prepare recipients based on target type
      let recipients = [];
      
      if (newCampaign.targetType === 'all') {
        // Get all opted-in members
        recipients = members.filter(m => m.sms_opt_in).map(m => ({
          id: m.id,
          name: `${m.firstname} ${m.lastname}`,
          phone: m.phone,
          type: 'member'
        }));
      } else if (newCampaign.targetType === 'groups') {
        // Get members from selected groups
        for (const groupId of newCampaign.selectedGroups) {
          const { data: groupMembers } = await supabase
            .from('group_members')
            .select(`
              member:members(id, firstname, lastname, phone, sms_opt_in)
            `)
            .eq('group_id', groupId);
          
          if (groupMembers) {
            const validMembers = groupMembers
              .map(gm => gm.member)
              .filter(m => m && m.sms_opt_in)
              .map(m => ({
                id: m.id,
                name: `${m.firstname} ${m.lastname}`,
                phone: m.phone,
                type: 'member'
              }));
            recipients.push(...validMembers);
          }
        }
      } else if (newCampaign.targetType === 'members') {
        // Get selected individual members
        recipients = newCampaign.selectedMembers
          .map(memberId => members.find(m => m.id === memberId))
          .filter(m => m && m.sms_opt_in)
          .map(m => ({
            id: m.id,
            name: `${m.firstname} ${m.lastname}`,
            phone: m.phone,
            type: 'member'
          }));
      }

      const campaignData = {
        name: newCampaign.name,
        description: newCampaign.description,
        message: newCampaign.message,
        scheduledDate: newCampaign.scheduledDate || null,
        scheduledTime: newCampaign.scheduledTime || null,
        recipients: recipients,
        targetType: newCampaign.targetType,
        selectedGroups: newCampaign.selectedGroups,
        selectedMembers: newCampaign.selectedMembers,
        organization_id: await getCurrentUserOrganizationId(),
        status: 'draft',
        type: newCampaign.type
      };
      
      const { data, error } = await supabase
        .from('sms_campaigns')
        .insert(campaignData)
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: `Campaign created successfully with ${recipients.length} recipients`
      });
      
      setIsCampaignOpen(false);
      setNewCampaign({
        name: '',
        description: '',
        message: '',
        scheduledDate: '',
        scheduledTime: '',
        recipients: [],
        selectedGroups: [],
        selectedMembers: [],
        targetType: 'all',
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

  const handleAnalyticsOpen = async () => {
    try {
      const organizationId = await getCurrentUserOrganizationId();
      await loadAnalyticsData(organizationId);
      setIsAnalyticsOpen(true);
    } catch (error) {
      console.error('Error opening analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive'
      });
    }
  };

  // Campaign recipient selection helpers
  const toggleCampaignGroupSelection = (groupId) => {
    setNewCampaign(prev => ({
      ...prev,
      selectedGroups: prev.selectedGroups.includes(groupId)
        ? prev.selectedGroups.filter(id => id !== groupId)
        : [...prev.selectedGroups, groupId]
    }));
  };

  const toggleCampaignMemberSelection = (memberId) => {
    setNewCampaign(prev => ({
      ...prev,
      selectedMembers: prev.selectedMembers.includes(memberId)
        ? prev.selectedMembers.filter(id => id !== memberId)
        : [...prev.selectedMembers, memberId]
    }));
  };

  const getCampaignRecipientCount = () => {
    if (newCampaign.targetType === 'all') {
      return members.filter(m => m.sms_opt_in).length;
    } else if (newCampaign.targetType === 'groups') {
      return newCampaign.selectedGroups.length;
    } else if (newCampaign.targetType === 'members') {
      return newCampaign.selectedMembers.length;
    }
    return 0;
  };

  const getCampaignRecipientTitle = () => {
    const count = getCampaignRecipientCount();
    if (newCampaign.targetType === 'all') {
      return `All Church (${count})`;
    } else if (newCampaign.targetType === 'groups') {
      return `${count} Group${count !== 1 ? 's' : ''}`;
    } else if (newCampaign.targetType === 'members') {
      return `${count} Member${count !== 1 ? 's' : ''}`;
    }
    return 'Select Recipients';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Add CSS for line clamping */}
      <style>{lineClampStyles}</style>
      
      {/* Compact header */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-700/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Messaging
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Manage SMS and email conversations, templates, and campaigns</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={activeMessageType}
              onChange={(e) => {
                setActiveMessageType(e.target.value);
                // Reload conversations when filter changes
                loadData();
              }}
              className="h-9 px-3 bg-white/80 dark:bg-slate-700/80 border-slate-200 dark:border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">All Messages</option>
              <option value="sms">SMS Only</option>
              <option value="email">Email Only</option>
            </select>
            <Button 
              variant="outline"
              onClick={handleAnalyticsOpen}
              size="sm"
              className="h-9 px-4 bg-white/80 dark:bg-slate-700/80 border-slate-200 dark:border-slate-600"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Button>
            <Button 
              variant="outline"
              onClick={exportSMSData}
              size="sm"
              className="h-9 px-4 bg-white/80 dark:bg-slate-700/80 border-slate-200 dark:border-slate-600"
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button 
              onClick={() => setIsNewMessageOpen(true)}
              size="sm"
              className="h-9 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              <Send className="mr-2 h-4 w-4" />
              Send Message
            </Button>
          </div>
        </div>
      </div>

      {/* Content area with compact spacing */}
      <div className="px-6 py-4">

      <Tabs defaultValue="conversations" className="space-y-4" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-lg p-1 shadow-sm">
          <TabsTrigger value="conversations" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md transition-all duration-200 text-sm">Conversations</TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md transition-all duration-200 text-sm">Templates</TabsTrigger>
          <TabsTrigger value="campaigns" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md transition-all duration-200 text-sm">Campaigns</TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md transition-all duration-200 text-sm">Analytics</TabsTrigger>
          <TabsTrigger value="opt-out" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md transition-all duration-200 text-sm">Opt-Out</TabsTrigger>
        </TabsList>

        <TabsContent value="conversations" className="space-y-4">
          {/* Compact search and filters */}
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm px-4 py-3 border border-slate-200/50 dark:border-slate-700/50 rounded-lg">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search conversations..."
                  className="pl-10 h-9 bg-white/80 dark:bg-slate-700/80 border-slate-200 dark:border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="h-9 px-3 bg-white/80 dark:bg-slate-700/80 border-slate-200 dark:border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">All Types</option>
                <option value="general">General</option>
                <option value="prayer_request">Prayer Request</option>
                <option value="event_reminder">Event Reminder</option>
                <option value="emergency">Emergency</option>
                <option value="pastoral_care">Pastoral Care</option>
              </select>
            </div>
          </div>

          {filteredConversations.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">No SMS Conversations Yet</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {conversations.length === 0 
                  ? "Start sending SMS messages to create conversations."
                  : "No conversations match your current filters."
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredConversations.map((conversation) => (
                <Card 
                  key={conversation.id} 
                  className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/50 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                  onClick={() => handleConversationClick(conversation)}
                >
                  <div className="p-4">
                    {/* Conversation Header */}
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{messagingService.getMessageTypeIcon(conversation.messageType)}</span>
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {conversation.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${conversation.messageType === 'sms' ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                            {conversation.messageType.toUpperCase()}
                          </span>
                          <span>{getUniqueMessageCount(conversation.sms_messages || conversation.email_messages)} messages</span>
                          <span>•</span>
                          <span>{getConversationParticipants(conversation.sms_messages || conversation.email_messages)} participants</span>
                          <span>•</span>
                          <span>{conversation.mostRecentMessage ? format(new Date(conversation.mostRecentMessage.sent_at), 'MMM d') : format(new Date(conversation.updated_at), 'MMM d')}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 ml-3">
                        <Badge className={`${getConversationTypeColor(conversation.conversation_type)} text-xs px-2 py-1`}>
                          {conversation.conversation_type.replace('_', ' ')}
                        </Badge>
                        {conversation.mostRecentMessage && (
                          <Badge variant="outline" className="text-xs px-2 py-1">
                            {conversation.mostRecentMessage.direction === 'inbound' ? 'In' : 'Out'}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Most Recent Message Preview */}
                    {conversation.mostRecentMessage && (
                      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-md p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              conversation.mostRecentMessage.direction === 'inbound' 
                                ? 'bg-blue-500' 
                                : 'bg-green-500'
                            }`} />
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                              {conversation.mostRecentMessage.senderInfo.name}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {conversation.mostRecentMessage.senderInfo.phone}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {format(new Date(conversation.mostRecentMessage.sent_at), 'HH:mm')}
                          </span>
                        </div>
                        
                        <div className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                          {conversation.mostRecentMessage.body}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">SMS Templates</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Create and manage message templates</p>
            </div>
            <Button 
              onClick={() => setIsTemplateOpen(true)}
              size="sm"
              className="h-9 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </div>

          <div className="grid gap-3">
            {templates.map((template) => (
              <Card key={template.id} className="bg-white/80 dark:bg-slate-800/80 backdrop-sm border-slate-200/50 dark:border-slate-600/50 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{messagingService.getMessageTypeIcon(template.messageType)}</span>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{template.name}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${template.messageType === 'sms' ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                          {template.messageType.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{template.description}</p>
                    </div>
                    <div className="flex gap-2 ml-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTemplate(template)}
                        className="h-7 px-3 text-xs"
                      >
                        <Edit className="mr-1 h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template)}
                        className="h-7 px-3 text-xs text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Delete
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const messageData = {
                            messageType: template.messageType,
                            to_number: '',
                            to_email: '',
                            subject: template.template_subject || '',
                            body: template.template_text,
                            template_id: template.id
                          };
                          setNewMessage(messageData);
                          setIsNewMessageOpen(true);
                        }}
                        className="h-7 px-3 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Send className="mr-1 h-3 w-3" />
                        Use
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {template.messageType === 'email' && template.template_subject && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                        <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Subject:</div>
                        <div className="text-sm text-blue-700 dark:text-blue-300 line-clamp-1">
                          {template.template_subject}
                        </div>
                      </div>
                    )}
                    <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                      <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {template.messageType === 'email' ? 'Body:' : 'Template:'}
                      </div>
                      <div className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                        {template.template_text}
                      </div>
                    </div>
                    
                    {template.variables && template.variables.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {template.variables.map((variable, index) => (
                          <Badge key={index} variant="outline" className="text-xs px-2 py-1">
                            {variable}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">SMS Campaigns</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Create and manage SMS campaigns</p>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setIsABTestOpen(true)}
                size="sm"
                className="h-9 px-4"
              >
                <Target className="mr-2 h-4 w-4" />
                A/B Test
              </Button>
              <Button 
                onClick={() => setIsCampaignOpen(true)}
                size="sm"
                className="h-9 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Campaign
              </Button>
            </div>
          </div>

          {/* Campaign Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-blue-900 dark:text-blue-100">Total</div>
                  <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-lg font-bold text-blue-900 dark:text-blue-100 mt-1">{campaigns.length}</div>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-green-900 dark:text-green-100">Active</div>
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-lg font-bold text-green-900 dark:text-green-100 mt-1">{campaigns.filter(c => c.status === 'active').length}</div>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950 border-yellow-200 dark:border-yellow-800">
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-yellow-900 dark:text-yellow-100">Scheduled</div>
                  <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="text-lg font-bold text-yellow-900 dark:text-yellow-100 mt-1">{campaigns.filter(c => c.status === 'scheduled').length}</div>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950 border-purple-200 dark:border-purple-800">
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-purple-900 dark:text-purple-100">Completed</div>
                  <CheckCircle2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-lg font-bold text-purple-900 dark:text-purple-100 mt-1">{campaigns.filter(c => c.status === 'completed').length}</div>
              </div>
            </Card>
          </div>

          {/* Campaigns List */}
          <div className="grid gap-3">
            {campaigns.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Target className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">No Campaigns Yet</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Create your first SMS campaign to reach your congregation effectively.
                </p>
              </div>
            ) : (
              campaigns.map((campaign) => (
                <Card key={campaign.id} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/50 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{campaign.name}</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{campaign.description}</p>
                      </div>
                      <Badge className={`${
                        campaign.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        campaign.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                      } text-xs px-2 py-1`}>
                        {campaign.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                        <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Message:</div>
                        <div className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                          {campaign.message}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-400">
                        <span><strong>Type:</strong> {campaign.type}</span>
                        <span><strong>Created:</strong> {format(new Date(campaign.created_at), 'MMM d')}</span>
                        <span><strong>Target:</strong> {campaign.targetType === 'all' ? 'All Church' : 
                          campaign.targetType === 'groups' ? `${campaign.selectedGroups?.length || 0} Groups` :
                          `${campaign.selectedMembers?.length || 0} Members`}</span>
                        {campaign.recipients && campaign.recipients.length > 0 && (
                          <span><strong>Recipients:</strong> {campaign.recipients.length} people</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">SMS Analytics</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Track performance and delivery rates</p>
            </div>
            <Button 
              variant="outline" 
              onClick={exportSMSData}
              size="sm"
              className="h-9 px-4"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
          </div>

          {/* Analytics Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-blue-900 dark:text-blue-100">Total Sent</div>
                  <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-lg font-bold text-blue-900 dark:text-blue-100 mt-1">{smsStats.totalSent}</div>
                <p className="text-xs text-blue-700 dark:text-blue-300">All time</p>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-green-900 dark:text-green-100">Delivery Rate</div>
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-lg font-bold text-green-900 dark:text-green-100 mt-1">{smsStats.deliveryRate}%</div>
                <p className="text-xs text-green-700 dark:text-green-300">Successfully delivered</p>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950 border-purple-200 dark:border-purple-800">
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-purple-900 dark:text-purple-100">This Month</div>
                  <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-lg font-bold text-purple-900 dark:text-purple-100 mt-1">{smsStats.thisMonth}</div>
                <p className="text-xs text-purple-700 dark:text-purple-300">Messages sent</p>
              </div>
            </Card>
          </div>

          {/* Message Status Breakdown */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/50">
            <div className="p-4">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Message Status Breakdown</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <div>
                    <div className="font-bold text-green-900 dark:text-green-100">{smsStats.totalDelivered}</div>
                    <div className="text-xs text-green-700 dark:text-green-300">Delivered</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                  <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  <div>
                    <div className="font-bold text-yellow-900 dark:text-yellow-100">{smsStats.totalSent - smsStats.totalDelivered - smsStats.totalFailed}</div>
                    <div className="text-xs text-yellow-700 dark:text-yellow-300">Pending</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <div>
                    <div className="font-bold text-red-900 dark:text-red-100">{smsStats.totalFailed}</div>
                    <div className="text-xs text-red-700 dark:text-red-300">Failed</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Opt-Out Management Tab */}
        <TabsContent value="opt-out" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">SMS Opt-Out Management</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Manage member SMS preferences</p>
            </div>
            <Button variant="outline" onClick={() => setIsOptOutOpen(true)} size="sm" className="h-9 px-4">
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Button>
          </div>

          {/* Opt-In Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-green-900 dark:text-green-100">Opted In</div>
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-lg font-bold text-green-900 dark:text-green-100 mt-1">{members.filter(m => m.sms_opt_in).length}</div>
                <p className="text-xs text-green-700 dark:text-green-300">Members receiving SMS</p>
              </div>
            </Card>
            <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-red-900 dark:text-red-100">Opted Out</div>
                  <EyeOff className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <div className="text-lg font-bold text-red-900 dark:text-red-100 mt-1">{members.filter(m => !m.sms_opt_in).length}</div>
                <p className="text-xs text-red-700 dark:text-red-300">Members not receiving SMS</p>
              </div>
            </Card>
          </div>

          {/* Members List */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/50">
            <div className="p-4">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Member SMS Preferences</h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={member.image_url} />
                        <AvatarFallback className="text-xs">
                          {getInitials(member.firstname, member.lastname)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">
                          {member.firstname} {member.lastname}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {member.phone}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={member.sms_opt_in ? 'default' : 'secondary'} className="text-xs">
                        {member.sms_opt_in ? 'Opted In' : 'Opted Out'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOptOutToggle(member.id, member.sms_opt_in)}
                        className="h-7 px-2"
                      >
                        {member.sms_opt_in ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
                          {message.message_type === 'event_reminder' && (
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                              <Bell className="h-3 w-3 mr-1" />
                              Event Reminder
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
            {/* Message Type Selection */}
            <div className="space-y-2">
              <Label>Message Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={newMessage.messageType === 'sms' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewMessage({...newMessage, messageType: 'sms', subject: ''})}
                >
                  💬 SMS
                </Button>
                <Button
                  type="button"
                  variant={newMessage.messageType === 'email' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewMessage({...newMessage, messageType: 'email'})}
                >
                  📧 Email
                </Button>
              </div>
            </div>

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

            {/* Phone Number or Email (fallback) */}
            {newMessage.messageType === 'sms' ? (
              <div className="space-y-2">
                <Label htmlFor="to_number">Or Enter Phone Number</Label>
                <Input
                  id="to_number"
                  value={newMessage.to_number}
                  onChange={(e) => setNewMessage({...newMessage, to_number: e.target.value})}
                  placeholder="+1234567890 (optional if recipients selected)"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="to_email">Or Enter Email Address</Label>
                <Input
                  id="to_email"
                  type="email"
                  value={newMessage.to_email}
                  onChange={(e) => setNewMessage({...newMessage, to_email: e.target.value})}
                  placeholder="email@example.com (optional if recipients selected)"
                />
              </div>
            )}

            {/* Subject (Email only) */}
            {newMessage.messageType === 'email' && (
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
                  placeholder="Enter email subject..."
                  required
                />
              </div>
            )}
            
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
                      const updates = {
                        ...newMessage, 
                        template_id: templateId,
                        body: selectedTemplate.template_text
                      };
                      
                      // Add subject for email templates
                      if (selectedTemplate.messageType === 'email' && selectedTemplate.template_subject) {
                        updates.subject = selectedTemplate.template_subject;
                      }
                      
                      setNewMessage(updates);
                    }
                  }
                }}
              >
                <option value="">Select a template...</option>
                {templates
                  .filter(template => template.messageType === newMessage.messageType)
                  .map((template) => (
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
              setNewMessage({ 
                messageType: 'sms',
                to_number: '',
                to_email: '',
                subject: '',
                body: '',
                template_id: ''
              });
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
            {/* Template Type Selection */}
            <div className="space-y-2">
              <Label>Template Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={newTemplate.messageType === 'sms' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewTemplate({...newTemplate, messageType: 'sms', subject: ''})}
                >
                  💬 SMS
                </Button>
                <Button
                  type="button"
                  variant={newTemplate.messageType === 'email' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewTemplate({...newTemplate, messageType: 'email'})}
                >
                  📧 Email
                </Button>
              </div>
            </div>

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
            
            {/* Subject (Email templates only) */}
            {newTemplate.messageType === 'email' && (
              <div className="space-y-2">
                <Label htmlFor="template_subject">Subject *</Label>
                <Input
                  id="template_subject"
                  value={newTemplate.subject}
                  onChange={(e) => setNewTemplate({...newTemplate, subject: e.target.value})}
                  placeholder="Email subject with {variables}"
                  required
                />
              </div>
            )}
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

            {/* Recipient Selection */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Target Recipients</Label>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant={newCampaign.targetType === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewCampaign({...newCampaign, targetType: 'all'})}
                  >
                    All Church
                  </Button>
                  <Button
                    type="button"
                    variant={newCampaign.targetType === 'groups' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewCampaign({...newCampaign, targetType: 'groups'})}
                  >
                    Specific Groups
                  </Button>
                  <Button
                    type="button"
                    variant={newCampaign.targetType === 'members' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewCampaign({...newCampaign, targetType: 'members'})}
                  >
                    Specific Members
                  </Button>
                </div>
              </div>

              {/* Group Selection */}
              {newCampaign.targetType === 'groups' && (
                <div className="space-y-2">
                  <Label>Select Groups</Label>
                  <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                    {groups.map((group) => (
                      <div
                        key={group.id}
                        className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-muted ${
                          newCampaign.selectedGroups.includes(group.id) ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                        onClick={() => toggleCampaignGroupSelection(group.id)}
                      >
                        <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                          newCampaign.selectedGroups.includes(group.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                        }`}>
                          {newCampaign.selectedGroups.includes(group.id) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{group.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Member Selection */}
              {newCampaign.targetType === 'members' && (
                <div className="space-y-2">
                  <Label>Select Members</Label>
                  <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                    {members.filter(m => m.sms_opt_in).map((member) => (
                      <div
                        key={member.id}
                        className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-muted ${
                          newCampaign.selectedMembers.includes(member.id) ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                        onClick={() => toggleCampaignMemberSelection(member.id)}
                      >
                        <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                          newCampaign.selectedMembers.includes(member.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                        }`}>
                          {newCampaign.selectedMembers.includes(member.id) && (
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
                    ))}
                  </div>
                </div>
              )}

              {/* Recipient Summary */}
              <div className="text-sm text-muted-foreground">
                {getCampaignRecipientTitle()}
              </div>
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
            {isAnalyticsLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-center space-y-4">
                  <RefreshCw className="h-12 w-12 animate-spin text-slate-400 mx-auto" />
                  <p className="text-sm text-slate-600 dark:text-slate-400">Loading analytics data...</p>
                </div>
              </div>
            ) : analyticsData.deliveryRates.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">No Analytics Data Yet</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Start sending SMS messages to see analytics and insights.
                </p>
              </div>
            ) : (
              <>
                {/* Delivery Rate Chart */}
                <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/50 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-slate-900 dark:text-slate-100">Delivery Rate Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                                         <div className="h-64">
                       {analyticsData.deliveryRates.length > 0 ? (
                         <ResponsiveContainer width="100%" height="100%">
                           <LineChart data={analyticsData.deliveryRates}>
                             <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                             <XAxis 
                               dataKey="month" 
                               stroke="#64748b"
                               fontSize={12}
                             />
                             <YAxis 
                               stroke="#64748b"
                               fontSize={12}
                               domain={[0, 100]}
                               tickFormatter={(value) => `${value}%`}
                             />
                             <Tooltip 
                               contentStyle={{
                                 backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                 border: '1px solid #e2e8f0',
                                 borderRadius: '8px',
                                 boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                               }}
                               formatter={(value) => [`${value}%`, 'Delivery Rate']}
                             />
                             <Line 
                               type="monotone" 
                               dataKey="rate" 
                               stroke="#3b82f6" 
                               strokeWidth={3}
                               dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                               activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                             />
                           </LineChart>
                         </ResponsiveContainer>
                       ) : (
                         <div className="h-full flex items-center justify-center text-slate-500">
                           <p>No delivery rate data available</p>
                         </div>
                       )}
                     </div>
                  </CardContent>
                </Card>

            {/* Message Volume Chart */}
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-100">Message Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {analyticsData.messageVolume.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.messageVolume}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="month" 
                          stroke="#64748b"
                          fontSize={12}
                        />
                        <YAxis 
                          stroke="#64748b"
                          fontSize={12}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Bar dataKey="sent" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="delivered" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500">
                      <p>No message volume data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Response Rates Chart */}
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-100">Response Rates by Message Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {analyticsData.responseRates.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.responseRates} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                          type="number"
                          stroke="#64748b"
                          fontSize={12}
                          domain={[0, 100]}
                          tickFormatter={(value) => `${value}%`}
                        />
                        <YAxis 
                          type="category"
                          dataKey="type" 
                          stroke="#64748b"
                          fontSize={12}
                          width={120}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                          formatter={(value) => [`${value}%`, 'Response Rate']}
                        />
                        <Bar dataKey="rate" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500">
                      <p>No response rate data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Recipients */}
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-100">Top Recipients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.topRecipients.map((recipient, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {index + 1}
                        </div>
                        <span className="font-medium text-slate-900 dark:text-slate-100">{recipient.name}</span>
                      </div>
                      <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">{recipient.count} messages</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
              </>
            )}
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
    </div>
  );
} 