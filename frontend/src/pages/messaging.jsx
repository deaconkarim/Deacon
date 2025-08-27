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
  StarOff,
  Mail
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
import { emailService } from '@/lib/emailService';
import { supabase } from '@/lib/supabaseClient';
import { getInitials } from '@/lib/utils/formatters';
import { emailTemplates, templateVariables } from '@/lib/emailTemplates';
import RichTextEditor from '@/components/ui/rich-text-editor';
import TemplateVariables from '@/components/ui/template-variables';

// Function to extract plain text from HTML
const extractPlainText = (htmlContent) => {
  if (!htmlContent) return '';
  
  // Create a temporary div to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  // Get text content and clean it up
  let text = tempDiv.textContent || tempDiv.innerText || '';
  
  // Remove extra whitespace and newlines
  text = text.replace(/\s+/g, ' ').trim();
  
  // Remove template variables like {church_name}, {prayer_for}, etc.
  text = text.replace(/\{[^}]+\}/g, '').replace(/\{\{[^}]+\}\}/g, '');
  
  // Clean up extra spaces after removing variables
  text = text.replace(/\s+/g, ' ').trim();
  
  // Limit to first 150 characters for preview
  if (text.length > 150) {
    text = text.substring(0, 150) + '...';
  }
  
  return text;
};

// Function to clean up email body for display
const cleanEmailBody = (htmlContent) => {
  if (!htmlContent) return '';
  
  // Replace common template variables with placeholder text
  let cleaned = htmlContent
    .replace(/\{church_name\}/g, 'Your Church')
    .replace(/\{\{church_name\}\}/g, 'Your Church')
    .replace(/\{member_name\}/g, 'Member')
    .replace(/\{\{member_name\}\}/g, 'Member')
    .replace(/\{current_year\}/g, new Date().getFullYear().toString())
    .replace(/\{\{current_year\}\}/g, new Date().getFullYear().toString())
    .replace(/\{prayer_for\}/g, 'Church Member')
    .replace(/\{\{prayer_for\}\}/g, 'Church Member')
    .replace(/\{prayer_request\}/g, 'Prayer request details')
    .replace(/\{\{prayer_request\}\}/g, 'Prayer request details')
    .replace(/\{additional_details\}/g, 'Additional details')
    .replace(/\{\{additional_details\}\}/g, 'Additional details')
    .replace(/\{how_to_help\}/g, 'How you can help')
    .replace(/\{\{how_to_help\}\}/g, 'How you can help')
    .replace(/\{event_title\}/g, 'Event Title')
    .replace(/\{\{event_title\}\}/g, 'Event Title')
    .replace(/\{event_date\}/g, 'Event Date')
    .replace(/\{\{event_date\}\}/g, 'Event Date')
    .replace(/\{event_time\}/g, 'Event Time')
    .replace(/\{\{event_time\}\}/g, 'Event Time')
    .replace(/\{event_location\}/g, 'Event Location')
    .replace(/\{\{event_location\}\}/g, 'Event Location')
    .replace(/\{event_description\}/g, 'Event description')
    .replace(/\{\{event_description\}\}/g, 'Event description')
    .replace(/\{alert_title\}/g, 'Alert Title')
    .replace(/\{\{alert_title\}\}/g, 'Alert Title')
    .replace(/\{alert_message\}/g, 'Alert message')
    .replace(/\{\{alert_message\}\}/g, 'Alert message')
    .replace(/\{opportunity_title\}/g, 'Opportunity Title')
    .replace(/\{\{opportunity_title\}\}/g, 'Opportunity Title')
    .replace(/\{opportunity_description\}/g, 'Opportunity description')
    .replace(/\{\{opportunity_description\}\}/g, 'Opportunity description')
    .replace(/\{newsletter_title\}/g, 'Newsletter Title')
    .replace(/\{\{newsletter_title\}\}/g, 'Newsletter Title')
    .replace(/\{newsletter_date\}/g, 'Newsletter Date')
    .replace(/\{\{newsletter_date\}\}/g, 'Newsletter Date')
    .replace(/\{newsletter_content\}/g, 'Newsletter content')
    .replace(/\{\{newsletter_content\}\}/g, 'Newsletter content')
    .replace(/\{message_content\}/g, 'Message content')
    .replace(/\{\{message_content\}\}/g, 'Message content');
  
  return cleaned;
};

// Function to convert HTML to clean plain text with preserved line breaks
const htmlToPlainText = (html) => {
  if (!html) return '';
  
  // Create a temporary div to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Convert common HTML elements to line breaks
  let text = html
    .replace(/<br\s*\/?>/gi, '\n') // Convert <br> tags to line breaks
    .replace(/<\/p>/gi, '\n\n') // Convert </p> tags to double line breaks
    .replace(/<\/div>/gi, '\n') // Convert </div> tags to line breaks
    .replace(/<\/h[1-6]>/gi, '\n\n') // Convert heading closes to double line breaks
    .replace(/<[^>]*>/g, '') // Remove all remaining HTML tags
    .replace(/&nbsp;/g, ' ') // Convert &nbsp; to regular spaces
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Normalize multiple line breaks to max 2
    .trim();
  
  return text;
};

// Function to replace template variables in HTML content
const replaceTemplateVariables = (htmlContent, variables, autoVariables = {}) => {
  let result = htmlContent;
  
  // Replace all variables
  const allVariables = { ...autoVariables, ...variables };
  
  console.log('replaceTemplateVariables called with:', {
    htmlContentLength: htmlContent?.length,
    variables,
    autoVariables,
    allVariables
  });
  
  Object.keys(allVariables).forEach(variable => {
    const value = allVariables[variable];
    if (value) {
      // Replace both {{variable}} and {variable} patterns
      const patterns = [
        new RegExp(`{{${variable}}}`, 'g'),
        new RegExp(`{${variable}}`, 'g')
      ];
      
      patterns.forEach(pattern => {
        const before = result;
        result = result.replace(pattern, value);
        if (before !== result) {
          console.log(`Replaced ${variable} with ${value}`);
        }
      });
    }
  });
  
  console.log('Final result preview:', result.substring(0, 200));
  return result;
};
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { emailTemplates as localEmailTemplates } from '../lib/emailTemplates';

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
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [isEditTemplateOpen, setIsEditTemplateOpen] = useState(false);
  const [isRecipientSelectionOpen, setIsRecipientSelectionOpen] = useState(false);
  const [recipientSelectionType, setRecipientSelectionType] = useState('sms'); // 'sms' or 'email'
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

  // Email-related state
  const [emailConversations, setEmailConversations] = useState([]);
  const [selectedEmailConversation, setSelectedEmailConversation] = useState(null);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [isNewEmailOpen, setIsNewEmailOpen] = useState(false);
  const [isEmailTemplateOpen, setIsEmailTemplateOpen] = useState(false);
  const [isEditEmailTemplateOpen, setIsEditEmailTemplateOpen] = useState(false);
  const [editingEmailTemplate, setEditingEmailTemplate] = useState(null);
  const [newEmail, setNewEmail] = useState({
    to: '',
    subject: '',
    body: '',
    template_id: '',
    template_type: 'default'
  });
  const [emailTemplateVariables, setEmailTemplateVariables] = useState({});
  const [newEmailTemplate, setNewEmailTemplate] = useState({
    name: '',
    description: '',
    subject: '',
    body: '',
    variables: []
  });
  const [newEmailTemplateVariables, setNewEmailTemplateVariables] = useState('');
  const [emailReplyMessage, setEmailReplyMessage] = useState({
    subject: '',
    body: ''
  });
  const [isSendingEmailReply, setIsSendingEmailReply] = useState(false);
  const [emailStats, setEmailStats] = useState({
    totalSent: 0,
    totalDelivered: 0,
    totalFailed: 0,
    deliveryRate: 0,
    thisMonth: 0,
    lastMonth: 0
  });
  const [emailCampaigns, setEmailCampaigns] = useState([]);
  const [isEmailCampaignOpen, setIsEmailCampaignOpen] = useState(false);
  const [newEmailCampaign, setNewEmailCampaign] = useState({
    name: '',
    description: '',
    subject: '',
    body: '',
    scheduledDate: '',
    scheduledTime: '',
    recipients: [],
    selectedGroups: [],
    selectedMembers: [],
    targetType: 'all',
    type: 'immediate'
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
      const [conversationsData, templatesData, membersData, groupsData, statsData, emailConversationsData, emailTemplatesData, emailStatsData] = await Promise.all([
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
          .select('id, firstname, lastname, phone, email, status, sms_opt_in')
          .eq('organization_id', organizationId)
          .or('phone.not.is.null,email.not.is.null')
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
        }),
        emailService.getEmailMessages().catch(error => {
          console.warn('Failed to load email messages:', error);
          return [];
        }),
        emailService.getTemplates().catch(error => {
          console.warn('Failed to load email templates:', error);
          return [];
        }),
        emailService.getEmailStats().catch(error => {
          console.warn('Failed to load email stats:', error);
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
          const { count: memberCount, error } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id)
            .eq('organization_id', organizationId);

          console.log(`Group ${group.name} (${group.id}):`, { memberCount, error });

          // Also get actual group members to verify
          const { data: groupMembers, error: membersError } = await supabase
            .from('group_members')
            .select(`
              member_id,
              members (
                id,
                firstname,
                lastname,
                email
              )
            `)
            .eq('group_id', group.id)
            .eq('organization_id', organizationId);

          console.log(`Group ${group.name} members:`, groupMembers);

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
      setEmailConversations(emailConversationsData || []);
      console.log('Using local email templates:', localEmailTemplates);
      setEmailTemplates(localEmailTemplates || []);
      setEmailStats(emailStatsData || {
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

  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isEmailDetailOpen, setIsEmailDetailOpen] = useState(false);
  const [showRawHtml, setShowRawHtml] = useState(false);

  const handleEmailMessageClick = async (email) => {
    setSelectedEmail(email);
    setIsEmailDetailOpen(true);
  };

  const handleSendEmail = async () => {
    const recipients = await getSelectedRecipients();
    
    if (recipients.length === 0 && !newEmail.to) {
      toast({
        title: 'Missing Recipients',
        description: 'Please select recipients or enter an email address.',
        variant: 'destructive'
      });
      return;
    }

    if (!newEmail.subject || !newEmail.body) {
      toast({
        title: 'Missing Content',
        description: 'Please enter both subject and body for the email.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Prepare template variables - combine auto-populated with user input
      const template_variables = {
        message_content: newEmail.body,
        current_year: new Date().getFullYear().toString(),
        // Add user-provided template variables
        ...emailTemplateVariables,
        // Add more variables based on template type
        ...(newEmail.template_type === 'eventReminder' && {
          event_title: newEmail.subject || 'Upcoming Event',
          event_date: new Date().toLocaleDateString(),
          event_time: 'TBD',
          event_location: 'Church Campus'
        }),
        ...(newEmail.template_type === 'prayerRequest' && {
          prayer_title: newEmail.subject || 'Prayer Request',
          prayer_content: newEmail.body,
          requested_by: 'Church Member',
          request_date: new Date().toLocaleDateString()
        }),
        ...(newEmail.template_type === 'newsletter' && {
          newsletter_title: newEmail.subject,
          newsletter_date: new Date().toLocaleDateString(),
          newsletter_content: newEmail.body
        })
      };

      if (recipients.length > 0) {
        // Send to multiple recipients
        console.log('Sending bulk email with data:', {
          recipients: recipients.map(r => ({ email: r.email, name: r.firstname })),
          subject: newEmail.subject,
          body: newEmail.body,
          template_id: newEmail.template_id
        });
        
        // Send bulk email using the bulk email service
        await emailService.sendBulkEmails({
          recipients: recipients.map(recipient => ({
            email: recipient.email,
            member_id: recipient.id,
            member_name: recipient.firstname
          })),
          subject: newEmail.subject,
          body: newEmail.body,
          conversation_type: 'general',
          selectedGroups: selectedGroups,
          template_variables
        });
        
        toast({
          title: 'Success',
          description: `Beautiful email sent to ${recipients.length} recipient(s)`,
        });
        
        setIsNewEmailOpen(false);
        setNewEmail({ to: '', subject: '', body: '', template_id: '', template_type: 'default' });
        loadData(); // Refresh data
      } else if (newEmail.to) {
        // Send to single email address
        console.log('Sending email with data:', {
          to: newEmail.to,
          subject: newEmail.subject,
          body: newEmail.body,
          template_id: newEmail.template_id
        });
        
        await emailService.sendEmail({
          to: newEmail.to,
          subject: newEmail.subject,
          body: newEmail.body,
          conversation_type: 'general',
          template_type: newEmail.template_id ? null : (newEmail.template_type || 'default'),
          template_variables
        });
        
        toast({
          title: 'Success',
          description: 'Beautiful email sent successfully',
        });
        
        setIsNewEmailOpen(false);
        setNewEmail({ to: '', subject: '', body: '', template_id: '', template_type: 'default' });
        loadData(); // Refresh data
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: 'Error',
        description: 'Failed to send email. Please try again.',
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

  const handleCreateEmailTemplate = async () => {
    if (!newEmailTemplate.name || !newEmailTemplate.subject || !newEmailTemplate.body) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in template name, subject, and body.',
        variant: 'destructive'
      });
      return;
    }

    try {
      await emailService.createTemplate(newEmailTemplate);
      setIsEmailTemplateOpen(false);
      setNewEmailTemplate({ name: '', description: '', subject: '', body: '', variables: [] });
      toast({
        title: 'Success',
        description: 'Email template created successfully'
      });
      
      // Refresh templates
      await loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to create email template: ${error.message}`,
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

  // Email template handlers
  const handleEditEmailTemplate = (template) => {
    setEditingEmailTemplate(template);
    setIsEditEmailTemplateOpen(true);
  };

  const handleUpdateEmailTemplate = async () => {
    if (!editingEmailTemplate.name || !editingEmailTemplate.subject || !editingEmailTemplate.body) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in template name, subject, and body.',
        variant: 'destructive'
      });
      return;
    }

    try {
      await emailService.updateTemplate(editingEmailTemplate.id, editingEmailTemplate);
      setIsEditEmailTemplateOpen(false);
      setEditingEmailTemplate(null);
      toast({
        title: 'Success',
        description: 'Email template updated successfully'
      });
      
      // Refresh templates
      await loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to update email template: ${error.message}`,
        variant: 'destructive'
      });
    }
  };

  const handleDeleteEmailTemplate = async (templateId) => {
    if (!confirm('Are you sure you want to delete this email template?')) {
      return;
    }

    try {
      await emailService.deleteTemplate(templateId);
      toast({
        title: 'Success',
        description: 'Email template deleted successfully'
      });
      
      // Refresh templates
      await loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to delete email template: ${error.message}`,
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
              email,
              status
            )
          `)
          .in('group_id', selectedGroups);

        if (error) {
          console.error('Error fetching group members:', error);
        } else if (groupMembers) {
          // Filter members to only include those with phone or email
          groupMembers.forEach(gm => {
            if (gm.members && (gm.members.phone || gm.members.email)) {
              selectedMemberIds.add(gm.members.id);
            }
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

  const filteredEmailConversations = emailConversations.filter(conversation => {
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
              Messaging Center
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Manage SMS and email conversations, templates, and campaigns</p>
          </div>
          <div className="flex items-center gap-2">
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
              onClick={() => setIsNewEmailOpen(true)}
              size="sm"
              className="h-9 px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
            >
              <Send className="mr-2 h-4 w-4" />
              Send Email
            </Button>
            <Button 
              onClick={() => setIsNewMessageOpen(true)}
              size="sm"
              className="h-9 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              <Send className="mr-2 h-4 w-4" />
              Send SMS
            </Button>
          </div>
        </div>
      </div>

      {/* Content area with compact spacing */}
      <div className="px-6 py-4">

      <Tabs defaultValue="conversations" className="space-y-4" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-lg p-1 shadow-sm">
          <TabsTrigger value="conversations" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md transition-all duration-200 text-sm">SMS Conversations</TabsTrigger>
          <TabsTrigger value="email-conversations" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md transition-all duration-200 text-sm">Email Messages</TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md transition-all duration-200 text-sm">SMS Templates</TabsTrigger>
          <TabsTrigger value="email-templates" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md transition-all duration-200 text-sm">Email Templates</TabsTrigger>
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
                  placeholder="Search SMS conversations..."
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
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {conversation.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                          <span>{getUniqueMessageCount(conversation.sms_messages)} messages</span>
                          <span>•</span>
                          <span>{getConversationParticipants(conversation.sms_messages)} participants</span>
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

        <TabsContent value="email-conversations" className="space-y-4">
          {/* Compact search and filters for email messages */}
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm px-4 py-3 border border-slate-200/50 dark:border-slate-700/50 rounded-lg">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search email messages..."
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

          {emailConversations.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">No Email Messages Yet</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {emailConversations.length === 0 
                  ? "Start sending emails to see your message history."
                  : "No messages match your current filters."
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {emailConversations.map((email) => (
                <Card 
                  key={email.id} 
                  className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/50 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                  onClick={() => handleEmailMessageClick(email)}
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{email.subject}</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          {email.direction} • {email.status} • {email.to_email}
                        </p>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {email.sent_at ? format(new Date(email.sent_at), 'MMM d, h:mm a') : 'Recently'}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-slate-700 dark:text-slate-300">Message:</div>
                      <div className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                        {extractPlainText(email.body)}
                      </div>
                    </div>
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
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{template.name}</h4>
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
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="h-7 px-3 text-xs text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
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
                        className="h-7 px-3 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Send className="mr-1 h-3 w-3" />
                        Use
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                      <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Template:</div>
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

        <TabsContent value="email-templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Email Templates</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Create and manage email templates</p>
            </div>
            <Button 
              onClick={() => setIsEmailTemplateOpen(true)}
              size="sm"
              className="h-9 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Email Template
            </Button>
          </div>

          <div className="grid gap-3">
            {emailTemplates.map((template) => (
              <Card key={template.id} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/50 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{template.name}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{template.description}</p>
                    </div>
                    <div className="flex gap-2 ml-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditEmailTemplate(template)}
                        className="h-7 px-3 text-xs"
                      >
                        <Edit className="mr-1 h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteEmailTemplate(template.id)}
                        className="h-7 px-3 text-xs text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Delete
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          setNewEmail({
                            to: '',
                            subject: template.subject,
                            body: template.template_text || '',
                            template_id: template.id,
                            template_type: 'default'
                          });
                          
                          // Initialize template variables with default values
                          if (template.variables) {
                            const initialVars = {};
                            template.variables.forEach(variable => {
                              // Set some helpful default values
                              const defaults = {
                                'prayer_for': 'Church Member',
                                'prayer_request': 'Please pray for our church family',
                                'additional_details': 'We appreciate your prayers and support.',
                                'how_to_help': 'Please keep us in your prayers and reach out if you can help.',
                                'event_title': 'Upcoming Event',
                                'event_date': new Date().toLocaleDateString(),
                                'event_time': '7:00 PM',
                                'event_location': 'Church Campus',
                                'event_description': 'Join us for this special event!',
                                'alert_title': 'Important Announcement',
                                'alert_message': 'Please read this important message.',
                                'opportunity_title': 'Volunteer Opportunity',
                                'opportunity_description': 'We need volunteers for this important ministry.',
                                'newsletter_title': 'Weekly Update',
                                'newsletter_date': new Date().toLocaleDateString(),
                                'newsletter_content': 'Here are the latest updates from our church.',
                                'message_content': 'This is an important message for our church family.'
                              };
                              initialVars[variable] = defaults[variable] || '';
                            });
                            setEmailTemplateVariables(initialVars);
                            
                            // Get organization info for church name
                            const { data: { user } } = await supabase.auth.getUser();
                            let churchName = 'Your Church';
                            
                            if (user) {
                              const { data: orgData } = await supabase
                                .from('organization_users')
                                .select('organizations(name)')
                                .eq('user_id', user.id)
                                .eq('status', 'active')
                                .eq('approval_status', 'approved')
                                .single();
                              
                              if (orgData?.organizations?.name) {
                                churchName = orgData.organizations.name;
                              }
                            }
                            
                            // Apply initial variable replacement
                            if (template.template_text) {
                              const updatedBody = replaceTemplateVariables(
                                template.template_text,
                                initialVars,
                                {
                                  church_name: churchName,
                                  current_year: new Date().getFullYear().toString()
                                }
                              );
                              setNewEmail({
                                to: '',
                                subject: template.subject,
                                body: updatedBody,
                                template_id: template.id,
                                template_type: 'default'
                              });
                            }
                          }
                          
                          setIsNewEmailOpen(true);
                        }}
                        className="h-7 px-3 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Send className="mr-1 h-3 w-3" />
                        Use
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                      <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Subject:</div>
                      <div className="text-sm text-slate-700 dark:text-slate-300 line-clamp-1">
                        {template.subject}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                      <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Body:</div>
                      <div className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                        {template.body}
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
            {/* Recipient Selection */}
            <div className="space-y-2">
              <Label>Recipients</Label>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRecipientSelectionType('sms');
                    setIsRecipientSelectionOpen(true);
                  }}
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

      {/* New Email Dialog */}
      <Dialog open={isNewEmailOpen} onOpenChange={setIsNewEmailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send New Email</DialogTitle>
            <DialogDescription>
              Send a new email to selected members, groups, or a specific email address.
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
                  onClick={() => {
                    setRecipientSelectionType('email');
                    setIsRecipientSelectionOpen(true);
                  }}
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

            {/* Email Address (fallback) */}
            <div className="space-y-2">
              <Label htmlFor="to_email">Or Enter Email Address</Label>
              <Input
                id="to_email"
                type="email"
                value={newEmail.to}
                onChange={(e) => setNewEmail({...newEmail, to: e.target.value})}
                placeholder="recipient@example.com (optional if recipients selected)"
              />
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="email_subject">Subject *</Label>
              <Input
                id="email_subject"
                value={newEmail.subject}
                onChange={(e) => setNewEmail({...newEmail, subject: e.target.value})}
                placeholder="Enter email subject"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email_template_select">Email Template</Label>
              <select
                id="email_template_select"
                className="w-full p-2 border border-input rounded-md bg-background"
                value={newEmail.template_id}
                onChange={async (e) => {
                  const templateId = e.target.value;
                  
                  if (templateId) {
                    const selectedTemplate = emailTemplates.find(t => t.id === templateId);
                    if (selectedTemplate) {
                      // Initialize template variables with some default values
                      if (selectedTemplate.variables) {
                        const initialVars = {};
                        selectedTemplate.variables.forEach(variable => {
                          // Set some helpful default values
                          const defaults = {
                            'prayer_for': 'Church Member',
                            'prayer_request': 'Please pray for our church family',
                            'additional_details': 'We appreciate your prayers and support.',
                            'how_to_help': 'Please keep us in your prayers and reach out if you can help.',
                            'event_title': 'Upcoming Event',
                            'event_date': new Date().toLocaleDateString(),
                            'event_time': '7:00 PM',
                            'event_location': 'Church Campus',
                            'event_description': 'Join us for this special event!',
                            'alert_title': 'Important Announcement',
                            'alert_message': 'Please read this important message.',
                            'opportunity_title': 'Volunteer Opportunity',
                            'opportunity_description': 'We need volunteers for this important ministry.',
                            'newsletter_title': 'Weekly Update',
                            'newsletter_date': new Date().toLocaleDateString(),
                            'newsletter_content': 'Here are the latest updates from our church.',
                            'message_content': 'This is an important message for our church family.'
                          };
                          initialVars[variable] = defaults[variable] || '';
                        });
                        setEmailTemplateVariables(initialVars);
                        
                        // Get organization info for church name
                        const { data: { user } } = await supabase.auth.getUser();
                        let churchName = 'Your Church';
                        
                        if (user) {
                          const { data: orgData } = await supabase
                            .from('organization_users')
                            .select('organizations(name)')
                            .eq('user_id', user.id)
                            .eq('status', 'active')
                            .eq('approval_status', 'approved')
                            .single();
                          
                          if (orgData?.organizations?.name) {
                            churchName = orgData.organizations.name;
                          }
                        }
                        
                        // Apply initial variable replacement
                        if (selectedTemplate.template_text) {
                          const updatedBody = replaceTemplateVariables(
                            selectedTemplate.template_text,
                            { ...initialVars, church_name: churchName },
                            {
                              current_year: new Date().getFullYear().toString()
                            }
                          );
                          
                          // Also replace variables in the subject line
                          const updatedSubject = replaceTemplateVariables(
                            selectedTemplate.subject || '',
                            { ...initialVars, church_name: churchName },
                            {
                              current_year: new Date().getFullYear().toString()
                            }
                          );
                          
                          setNewEmail({
                            ...newEmail,
                            template_id: templateId,
                            subject: updatedSubject,
                            body: updatedBody
                          });
                        }
                      }
                    }
                  } else {
                    // Clear template selection
                    setNewEmail({
                      ...newEmail, 
                      template_id: '',
                      subject: '',
                      body: ''
                    });
                  }
                }}
              >
                <option value="">Start with blank email...</option>
                {emailTemplates && emailTemplates.length > 0 ? (
                  emailTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No templates available</option>
                )}
              </select>
              <p className="text-xs text-muted-foreground">
                Choose a template to auto-populate your email with pre-written content
              </p>
            </div>

            {/* Template Variables */}
            {newEmail.template_id && (
              <TemplateVariables
                template={emailTemplates.find(t => t.id === newEmail.template_id)}
                variables={emailTemplateVariables}
                onVariablesChange={async (newVariables) => {
                  setEmailTemplateVariables(newVariables);
                  
                  // Get the original template content
                  const selectedTemplate = emailTemplates.find(t => t.id === newEmail.template_id);
                  if (selectedTemplate && selectedTemplate.template_text) {
                    // Get organization info for church name
                    const { data: { user } } = await supabase.auth.getUser();
                    let churchName = 'Your Church';
                    
                    if (user) {
                      const { data: orgData } = await supabase
                        .from('organization_users')
                        .select('organizations(name)')
                        .eq('user_id', user.id)
                        .eq('status', 'active')
                        .eq('approval_status', 'approved')
                        .single();
                      
                      if (orgData?.organizations?.name) {
                        churchName = orgData.organizations.name;
                      }
                    }
                    
                    // Replace variables in real-time
                    console.log('Replacing variables with:', { church_name: churchName, ...newVariables });
                    const updatedBody = replaceTemplateVariables(
                      selectedTemplate.template_text,
                      { ...newVariables, church_name: churchName },
                      {
                        current_year: new Date().getFullYear().toString()
                      }
                    );
                    
                    // Also replace variables in the subject line
                    const updatedSubject = replaceTemplateVariables(
                      selectedTemplate.subject || '',
                      { ...newVariables, church_name: churchName },
                      {
                        current_year: new Date().getFullYear().toString()
                      }
                    );
                    
                    console.log('Updated body preview:', updatedBody.substring(0, 300));
                    console.log('Updated subject:', updatedSubject);
                    
                    // Update the body and subject with replaced variables
                    setNewEmail({
                      ...newEmail,
                      subject: updatedSubject,
                      body: updatedBody
                    });
                  }
                }}
                className="mb-4"
              />
            )}

            {/* Email Body */}
            <div className="space-y-2">
              <Label htmlFor="email_body">Message Body *</Label>
              <RichTextEditor
                value={newEmail.body || ''}
                onChange={(html) => setNewEmail({...newEmail, body: html})}
                placeholder="Enter your email message"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsNewEmailOpen(false);
              setNewEmail({ to: '', subject: '', body: '', template_id: '' });
              setEmailTemplateVariables({});
              clearRecipientSelection();
            }}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail}>
              <Send className="mr-2 h-4 w-4" />
              Send Email
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

      {/* New Email Template Dialog */}
      <Dialog open={isEmailTemplateOpen} onOpenChange={setIsEmailTemplateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Email Template</DialogTitle>
            <DialogDescription>
              Create a new email template with variables.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email_template_name">Template Name *</Label>
              <Input
                id="email_template_name"
                value={newEmailTemplate.name}
                onChange={(e) => setNewEmailTemplate({...newEmailTemplate, name: e.target.value})}
                placeholder="Event Reminder"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email_template_description">Description</Label>
              <Input
                id="email_template_description"
                value={newEmailTemplate.description}
                onChange={(e) => setNewEmailTemplate({...newEmailTemplate, description: e.target.value})}
                placeholder="Template for event reminders"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email_template_subject">Subject *</Label>
              <Input
                id="email_template_subject"
                value={newEmailTemplate.subject}
                onChange={(e) => setNewEmailTemplate({...newEmailTemplate, subject: e.target.value})}
                placeholder="Reminder: {event_title} on {event_date}"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email_template_body">Body *</Label>
              <Textarea
                id="email_template_body"
                value={newEmailTemplate.body}
                onChange={(e) => setNewEmailTemplate({...newEmailTemplate, body: e.target.value})}
                placeholder="Hello {member_name}, this is a reminder about {event_title} on {event_date} at {event_time}."
                rows={6}
                required
              />
              <p className="text-xs text-muted-foreground">
                Use {'{variable_name}'} for dynamic content. {'{church_name}'} is automatically available.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email_template_variables">Additional Variables (Optional)</Label>
              <Input
                id="email_template_variables"
                value={newEmailTemplateVariables}
                onChange={(e) => setNewEmailTemplateVariables(e.target.value)}
                placeholder="variable1, variable2, variable3"
              />
              <p className="text-xs text-muted-foreground">
                Enter additional variables separated by commas (variables from template text are automatically included)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmailTemplateOpen(false)}>
              Cancel
              </Button>
            <Button onClick={handleCreateEmailTemplate}>
              <FileText className="mr-2 h-4 w-4" />
              Create Email Template
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

      {/* Edit Email Template Dialog */}
      <Dialog open={isEditEmailTemplateOpen} onOpenChange={setIsEditEmailTemplateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Email Template</DialogTitle>
            <DialogDescription>
              Update the email template and its variables.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_email_template_name">Template Name *</Label>
              <Input
                id="edit_email_template_name"
                value={editingEmailTemplate?.name || ''}
                onChange={(e) => setEditingEmailTemplate({...editingEmailTemplate, name: e.target.value})}
                placeholder="Event Reminder"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_email_template_description">Description</Label>
              <Input
                id="edit_email_template_description"
                value={editingEmailTemplate?.description || ''}
                onChange={(e) => setEditingEmailTemplate({...editingEmailTemplate, description: e.target.value})}
                placeholder="Template for event reminders"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_email_template_subject">Subject *</Label>
              <Input
                id="edit_email_template_subject"
                value={editingEmailTemplate?.subject || ''}
                onChange={(e) => setEditingEmailTemplate({...editingEmailTemplate, subject: e.target.value})}
                placeholder="Reminder: {event_title} on {event_date}"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_email_template_body">Body *</Label>
              <Textarea
                id="edit_email_template_body"
                value={editingEmailTemplate?.body || ''}
                onChange={(e) => setEditingEmailTemplate({...editingEmailTemplate, body: e.target.value})}
                placeholder="Hello {member_name}, this is a reminder about {event_title} on {event_date} at {event_time}."
                rows={6}
                required
              />
              <p className="text-xs text-muted-foreground">
                Use {'{variable_name}'} for dynamic content. {'{church_name}'} is automatically available.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditEmailTemplateOpen(false);
              setEditingEmailTemplate(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateEmailTemplate}>
              <Edit className="mr-2 h-4 w-4" />
              Update Email Template
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
              Choose individual members or groups to send your {recipientSelectionType === 'email' ? 'email' : 'SMS message'} to.
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
                {members
                  .filter(member => recipientSelectionType === 'email' ? member.email : member.phone)
                  .map((member) => (
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
                          {recipientSelectionType === 'email' ? member.email : member.phone}
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

      {/* Email Detail Dialog */}
      <Dialog open={isEmailDetailOpen} onOpenChange={setIsEmailDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Details
            </DialogTitle>
            <DialogDescription>
              View the complete email content and details
            </DialogDescription>
          </DialogHeader>
          
          {selectedEmail && (
            <div className="space-y-6">
              {/* Email Header */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">From:</span>
                    <span className="ml-2 text-slate-600 dark:text-slate-400">{selectedEmail.from_email}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">To:</span>
                    <span className="ml-2 text-slate-600 dark:text-slate-400">{selectedEmail.to_email}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Subject:</span>
                    <span className="ml-2 text-slate-600 dark:text-slate-400">{selectedEmail.subject}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Sent:</span>
                    <span className="ml-2 text-slate-600 dark:text-slate-400">
                      {selectedEmail.sent_at ? format(new Date(selectedEmail.sent_at), 'MMM d, yyyy h:mm a') : 'Recently'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Status:</span>
                    <Badge 
                      variant={selectedEmail.status === 'sent' ? 'default' : 'secondary'}
                      className="ml-2"
                    >
                      {selectedEmail.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Direction:</span>
                    <Badge 
                      variant={selectedEmail.direction === 'outbound' ? 'default' : 'secondary'}
                      className="ml-2"
                    >
                      {selectedEmail.direction}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Email Content */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Email Content</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRawHtml(!showRawHtml)}
                    className="text-xs"
                  >
                    {showRawHtml ? 'Show Rendered' : 'Show Raw HTML'}
                  </Button>
                </div>
                
                {showRawHtml ? (
                  <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-lg p-4">
                    <pre className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap overflow-x-auto">
                      {selectedEmail.body}
                    </pre>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <div 
                      className="max-w-none"
                      dangerouslySetInnerHTML={{ __html: cleanEmailBody(selectedEmail.body) }}
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        fontSize: '14px',
                        lineHeight: '1.6'
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmailDetailOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
} 