import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, parseISO, isValid, startOfYear, endOfYear, startOfMonth, endOfMonth } from 'date-fns';
import { 
  Plus, 
  DollarSign,
  Download,
  Pencil,
  Trash2,
  Search,
  Filter,
  Users,
  TrendingUp,
  Calendar,
  Target,
  Receipt,
  BarChart3,
  PieChart,
  FileText,
  Eye,
  Archive,
  RefreshCw,
  CreditCard,
  Banknote,
  Gift,
  Heart,
  Building,
  Zap,
  User,
  UserX,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { 
  getDonations, 
  addDonation, 
  updateDonation, 
  deleteDonation,
  getCampaigns,
  addCampaign,
  updateCampaign,
  getPledges,
  addPledge,
  getCategories,
  getDonationAnalytics,
  generateDonationReport,
  getReceipts,
  generateReceipt,
  getBatches,
  createBatch,
  updateBatch,
  closeBatch,
  getBatchDetails
} from '@/lib/donationService';
import { getMembers, getAllEvents } from '@/lib/data';
import { getOrganizationName } from '@/lib/data';
import { userCacheService } from '@/lib/userCache';
import { supabase } from '@/lib/supabaseClient';

// Helper function to get current user's organization ID
const getCurrentUserOrganizationId = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('approval_status', 'approved')
      .limit(1);

    if (error) throw error;
    return data && data.length > 0 ? data[0].organization_id : null;
  } catch (error) {
    console.error('Error getting user organization:', error);
    return null;
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
};

export function Donations() {
  // State management
  const [activeTab, setActiveTab] = useState('donations');
  const [donations, setDonations] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [pledges, setPledges] = useState([]);
  const [batches, setBatches] = useState([]);
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [orgSlug, setOrgSlug] = useState('');
  const [organizationId, setOrganizationId] = useState(null);
  const [stripeStatus, setStripeStatus] = useState({ connected: false, loading: false, error: null });
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  
  // Dialog states
  const [isDonationDialogOpen, setIsDonationDialogOpen] = useState(false);
  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);
  const [isPledgeDialogOpen, setIsPledgeDialogOpen] = useState(false);
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);
  const [isBatchDetailsDialogOpen, setIsBatchDetailsDialogOpen] = useState(false);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Selected items
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedPledge, setSelectedPledge] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedBatchForDetails, setSelectedBatchForDetails] = useState(null);
  const [batchDetails, setBatchDetails] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    startDate: format(startOfYear(new Date(new Date().getFullYear() - 1, 0, 1)), 'yyyy-MM-dd'),
    endDate: format(endOfYear(new Date(new Date().getFullYear() + 1, 11, 31)), 'yyyy-MM-dd'),
    donorId: '',
    campaignId: '',
    fundDesignation: 'all',
    paymentMethod: 'all',
    isRecurring: 'all',
    recurringInterval: 'all',
    recurringStatus: 'all',
    search: '',
    minAmount: '',
    maxAmount: ''
  });
  
  // Form states
  const [donationForm, setDonationForm] = useState({
    donor_id: null,
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    fund_designation: 'tithe',
    payment_method: 'cash',
    check_number: '',
    campaign_id: null,
    batch_id: null,
    is_anonymous: false,
    is_tax_deductible: true,
    notes: ''
  });
  
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    description: '',
    goal_amount: '',
    start_date: '',
    end_date: '',
    campaign_type: 'fundraising',
    visibility: 'public'
  });
  
  const [pledgeForm, setPledgeForm] = useState({
    donor_id: '',
    campaign_id: '',
    pledge_amount: '',
    pledge_date: format(new Date(), 'yyyy-MM-dd'),
    due_date: '',
    frequency: 'one_time',
    notes: ''
  });
  
  const [batchForm, setBatchForm] = useState({
    name: '',
    description: '',
    status: 'open',
    selectedEvent: ''
  });

  // Donor search state for the donation dialog
  const [donorSearch, setDonorSearch] = useState('');
  const [isDonorDropdownOpen, setIsDonorDropdownOpen] = useState(false);
  
  // Navigation
  const navigate = useNavigate();

  // Intelligence section visibility
  const [showIntelligence, setShowIntelligence] = useState(false);

  const { toast } = useToast();

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get organization ID first
        const orgId = await getCurrentUserOrganizationId();
        setOrganizationId(orgId);
        
        await loadAllData();
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    async function fetchOrgSlug() {
      const org = await userCacheService.getCurrentUserOrganization();
      setOrgSlug(org?.organization_slug || '');
    }
    fetchOrgSlug();
  }, []);

  // Fetch Stripe Connect status
  useEffect(() => {
    if (!organizationId) return;
    const fetchStripeStatus = async () => {
      setStripeStatus(s => ({ ...s, loading: true }));
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('stripe_account_id, name')
          .eq('id', organizationId)
          .single();
        
        if (error) {
          setStripeStatus({ connected: false, loading: false, error: error.message });
        } else {
          setStripeStatus({ 
            connected: !!data?.stripe_account_id, 
            loading: false, 
            error: null,
            organizationName: data?.name
          });
        }
      } catch (error) {
        setStripeStatus({ connected: false, loading: false, error: error.message });
      }
    };
    fetchStripeStatus();
  }, [organizationId]);

  // Load analytics when filters change
  useEffect(() => {
    if (filters.startDate && filters.endDate) {
      loadAnalytics();
    }
  }, [filters.startDate, filters.endDate]);

  // Close donor dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDonorDropdownOpen && !event.target.closest('.donor-dropdown-container')) {
        setIsDonorDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDonorDropdownOpen]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [donationsData, campaignsData, pledgesData, batchesData, membersData, eventsData, categoriesData, receiptsData] = await Promise.all([
        getDonations(filters),
        getCampaigns(),
        getPledges(),
        getBatches(),
        getMembers(),
        getAllEvents(),
        getCategories(),
        getReceipts()
      ]);
      
      setDonations(donationsData);
      setCampaigns(campaignsData);
      setPledges(pledgesData);
      setBatches(batchesData);
      setMembers(membersData);
      setEvents(eventsData);
      setCategories(categoriesData);
      setReceipts(receiptsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load donation data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnalytics = async () => {
    setIsLoadingAnalytics(true);
    try {
      const analyticsData = await getDonationAnalytics(filters.startDate, filters.endDate);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const applyFilters = async () => {
    setIsLoading(true);
    try {
      const filteredDonations = await getDonations(filters);
      setDonations(filteredDonations);
    } catch (error) {
      console.error('Error applying filters:', error);
      toast({
        title: "Error",
        description: "Failed to apply filters",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Donation operations
  const handleAddDonation = async (e) => {
    e.preventDefault();
    try {
      const newDonation = await addDonation({
        ...donationForm,
        amount: parseFloat(donationForm.amount)
      });
      
      setDonations([newDonation, ...donations]);
      setIsDonationDialogOpen(false);
      resetDonationForm();
      toast({
        title: "Success",
        description: "Donation added successfully",
      });
    } catch (error) {
      console.error('Error adding donation:', error);
      toast({
        title: "Error",
        description: "Failed to add donation",
        variant: "destructive",
      });
    }
  };

  const handleUpdateDonation = async (e) => {
    e.preventDefault();
    try {
      const updatedDonation = await updateDonation(selectedDonation.id, {
        ...donationForm,
        amount: parseFloat(donationForm.amount)
      });
      
      setDonations(donations.map(d => d.id === selectedDonation.id ? updatedDonation : d));
      setIsDonationDialogOpen(false);
      setSelectedDonation(null);
      resetDonationForm();
      toast({
        title: "Success",
        description: "Donation updated successfully",
      });
    } catch (error) {
      console.error('Error updating donation:', error);
      toast({
        title: "Error",
        description: "Failed to update donation",
        variant: "destructive",
      });
    }
  };

  // Campaign operations
  const handleAddCampaign = async (e) => {
    e.preventDefault();
    try {
      const newCampaign = await addCampaign({
        ...campaignForm,
        goal_amount: campaignForm.goal_amount ? parseFloat(campaignForm.goal_amount) : null
      });
      
      setCampaigns([newCampaign, ...campaigns]);
      setIsCampaignDialogOpen(false);
      resetCampaignForm();
      toast({
        title: "Success",
        description: "Campaign created successfully",
      });
    } catch (error) {
      console.error('Error adding campaign:', error);
      toast({
        title: "Error",
        description: "Failed to create campaign",
        variant: "destructive",
      });
    }
  };

  // Pledge operations
  const handleAddPledge = async (e) => {
    e.preventDefault();
    try {
      const newPledge = await addPledge({
        ...pledgeForm,
        pledge_amount: parseFloat(pledgeForm.pledge_amount)
      });
      
      setPledges([newPledge, ...pledges]);
      setIsPledgeDialogOpen(false);
      resetPledgeForm();
      toast({
        title: "Success",
        description: "Pledge created successfully",
      });
    } catch (error) {
      console.error('Error adding pledge:', error);
      toast({
        title: "Error",
        description: "Failed to create pledge",
        variant: "destructive",
      });
    }
  };

  // Batch operations
  const handleAddBatch = async (e) => {
    e.preventDefault();
    try {
      // Remove selectedEvent field before sending to API (it's only for UI purposes)
      const { selectedEvent, ...batchData } = batchForm;
      const newBatch = await createBatch(batchData);
      setBatches([newBatch, ...batches]);
      setIsBatchDialogOpen(false);
      resetBatchForm();
      toast({
        title: "Success",
        description: "Batch created successfully",
      });
    } catch (error) {
      console.error('Error creating batch:', error);
      toast({
        title: "Error",
        description: "Failed to create batch",
        variant: "destructive",
      });
    }
  };

  const handleUpdateBatch = async (e) => {
    e.preventDefault();
    try {
      // Remove selectedEvent field before sending to API (it's only for UI purposes)
      const { selectedEvent, ...batchData } = batchForm;
      const updatedBatch = await updateBatch(selectedBatch.id, batchData);
      setBatches(batches.map(b => b.id === selectedBatch.id ? updatedBatch : b));
      setIsBatchDialogOpen(false);
      setSelectedBatch(null);
      resetBatchForm();
      toast({
        title: "Success",
        description: "Batch updated successfully",
      });
    } catch (error) {
      console.error('Error updating batch:', error);
      toast({
        title: "Error",
        description: "Failed to update batch",
        variant: "destructive",
      });
    }
  };

  const handleCloseBatch = async (batchId) => {
    try {
      const closedBatch = await closeBatch(batchId);
      setBatches(batches.map(b => b.id === batchId ? closedBatch : b));
      toast({
        title: "Success",
        description: "Batch closed successfully",
      });
    } catch (error) {
      console.error('Error closing batch:', error);
      toast({
        title: "Error",
        description: "Failed to close batch",
        variant: "destructive",
      });
    }
  };

  // Delete operations
  const handleDelete = async () => {
    try {
      if (itemToDelete.type === 'donation') {
        await deleteDonation(itemToDelete.id);
        setDonations(donations.filter(d => d.id !== itemToDelete.id));
      }
      // Add more delete operations for campaigns, pledges, etc.
      
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
      toast({
        title: "Success",
        description: `${itemToDelete.type} deleted successfully`,
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: `Failed to delete ${itemToDelete.type}`,
        variant: "destructive",
      });
    }
  };

  // Form reset functions
  const resetDonationForm = () => {
    // Find the currently open batch (most recent one if multiple)
    const openBatches = batches.filter(batch => batch.status === 'open');
    const defaultBatchId = openBatches.length > 0 ? openBatches[0].id : null;
    
    setDonationForm({
      donor_id: null,
      amount: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      fund_designation: 'tithe',
      payment_method: 'cash',
      check_number: '',
      campaign_id: null,
      batch_id: defaultBatchId,
      is_anonymous: false,
      is_tax_deductible: true,
      notes: ''
    });
    setDonorSearch('');
    setIsDonorDropdownOpen(false);
  };

  const resetCampaignForm = () => {
    setCampaignForm({
      name: '',
      description: '',
      goal_amount: '',
      start_date: '',
      end_date: '',
      campaign_type: 'fundraising',
      visibility: 'public'
    });
  };

  const resetPledgeForm = () => {
    setPledgeForm({
      donor_id: '',
      campaign_id: '',
      pledge_amount: '',
      pledge_date: format(new Date(), 'yyyy-MM-dd'),
      due_date: '',
      frequency: 'one_time',
      notes: ''
    });
  };

  const resetBatchForm = () => {
    setBatchForm({
      name: '',
      description: '',
      status: 'open',
      selectedEvent: ''
    });
  };

  // Edit handlers
  const handleEditDonation = (donation) => {
    setSelectedDonation(donation);
    setDonationForm({
      donor_id: donation.donor_id || null,
      amount: donation.amount.toString(),
      date: donation.date,
      fund_designation: donation.fund_designation || 'general',
      payment_method: donation.payment_method || 'cash',
      check_number: donation.check_number || '',
      campaign_id: donation.campaign_id || null,
      batch_id: donation.batch_id || null,
      is_anonymous: donation.is_anonymous || false,
      is_tax_deductible: donation.is_tax_deductible || true,
      notes: donation.notes || ''
    });
    
    // Set donor search to the selected donor's name
    if (donation.donor_id && donation.donor) {
      setDonorSearch(`${donation.donor.firstname} ${donation.donor.lastname}`);
    } else {
      setDonorSearch('Anonymous');
    }
    setIsDonorDropdownOpen(false);
    setIsDonationDialogOpen(true);
  };

  const handleEditBatch = (batch) => {
    setSelectedBatch(batch);
    setBatchForm({
      name: batch.name || '',
      description: batch.description || '',
      status: batch.status || 'open',
      selectedEvent: '' // Don't try to match existing batches to events
    });
    setIsBatchDialogOpen(true);
  };

  const handleViewBatchDetails = async (batch) => {
    try {
      setSelectedBatchForDetails(batch);
      setIsBatchDetailsDialogOpen(true);
      
      // Fetch detailed batch information
      const details = await getBatchDetails(batch.id);
      setBatchDetails(details);
    } catch (error) {
      console.error('Error fetching batch details:', error);
      toast({
        title: "Error",
        description: "Failed to load batch details",
        variant: "destructive",
      });
    }
  };

  // Utility functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'credit_card':
      case 'debit_card':
      case 'Deacon - Credit Card':
        return <CreditCard className="h-4 w-4" />;
      case 'ach':
      case 'Deacon - ACH Transfer':
        return <Banknote className="h-4 w-4" />;
      case 'cash':
        return <Banknote className="h-4 w-4" />;
      case 'check':
        return <FileText className="h-4 w-4" />;
      case 'online':
        return <Zap className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getFundDesignationIcon = (designation) => {
    switch (designation) {
      case 'building_fund':
        return <Building className="h-4 w-4" />;
      case 'missions':
        return <Heart className="h-4 w-4" />;
      case 'tithe':
        return <Gift className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  // Filter and format Sunday worship events for batch selection (last 1 past, next 1 upcoming)
  const getSundayWorshipEvents = () => {
    const now = new Date();
    
    // Filter all Sunday worship events
    const sundayWorshipEvents = events.filter(event => {
      const eventType = (event.event_type || '').toLowerCase();
      const title = (event.title || '').toLowerCase();
      return eventType.includes('sunday') || eventType.includes('worship') || 
             title.includes('sunday') || title.includes('worship');
    });
    
    // Separate past and future events
    const pastEvents = sundayWorshipEvents
      .filter(event => new Date(event.start_date) < now)
      .sort((a, b) => new Date(b.start_date) - new Date(a.start_date)); // Most recent first
    
    const futureEvents = sundayWorshipEvents
      .filter(event => new Date(event.start_date) >= now)
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date)); // Earliest first
    
    // Take only the last 1 past event and next 1 future event
    const selectedEvents = [];
    
    if (pastEvents.length > 0) {
      selectedEvents.push(pastEvents[0]); // Most recent past event
    }
    
    if (futureEvents.length > 0) {
      selectedEvents.push(futureEvents[0]); // Next upcoming event
    }
    
    // Sort final list: past events first, then future events
    return selectedEvents.sort((a, b) => {
      const dateA = new Date(a.start_date);
      const dateB = new Date(b.start_date);
      
      if (dateA < now && dateB < now) {
        return dateB - dateA; // Past events: most recent first
      } else if (dateA >= now && dateB >= now) {
        return dateA - dateB; // Future events: earliest first
      } else if (dateA < now && dateB >= now) {
        return -1; // Past events come before future events
      } else {
        return 1; // Future events come after past events
      }
    });
  };

  // Generate batch name from selected event
  const generateBatchNameFromEvent = (eventId) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return '';
    
    try {
      const eventDate = parseISO(event.start_date);
      const formattedDate = format(eventDate, 'MMM d, yyyy');
      return `${event.title} - ${formattedDate}`;
    } catch (error) {
      console.error('Error parsing event date for batch name:', event.start_date, error);
      return `${event.title} - ${event.start_date}`;
    }
  };

  // Handle event selection for batch
  const handleEventSelection = (eventId) => {
    setBatchForm(prev => ({
      ...prev,
      selectedEvent: eventId,
      name: eventId ? generateBatchNameFromEvent(eventId) : prev.name
    }));
  };

  // Filter members based on donor search
  const getFilteredMembers = () => {
    if (!donorSearch.trim()) return members;
    
    const searchTerm = donorSearch.toLowerCase();
    return members.filter(member => {
      const fullName = `${member.firstname} ${member.lastname}`.toLowerCase();
      const email = (member.email || '').toLowerCase();
      return fullName.includes(searchTerm) || email.includes(searchTerm);
    });
  };

  // Handle donor selection
  const handleDonorSelect = (member) => {
    if (member) {
      setDonationForm({...donationForm, donor_id: member.id});
      setDonorSearch(`${member.firstname} ${member.lastname}`);
    } else {
      setDonationForm({...donationForm, donor_id: null});
      setDonorSearch('Anonymous');
    }
    setIsDonorDropdownOpen(false);
  };

  // Get selected donor display name
  const getSelectedDonorName = () => {
    if (!donationForm.donor_id) return 'Anonymous';
    const selectedMember = members.find(m => m.id === donationForm.donor_id);
    return selectedMember ? `${selectedMember.firstname} ${selectedMember.lastname}` : '';
  };

  // Summary calculations
  const donationSummary = useMemo(() => {
    const totalAmount = donations.reduce((sum, d) => sum + parseFloat(d.amount), 0);
    const averageAmount = donations.length > 0 ? totalAmount / donations.length : 0;
    const uniqueDonors = new Set(donations.filter(d => d.donor_id).map(d => d.donor_id)).size;
    
    return {
      totalAmount,
      averageAmount,
      donationCount: donations.length,
      uniqueDonors
    };
  }, [donations]);

  const campaignSummary = useMemo(() => {
    const activeCampaigns = campaigns.filter(c => c.is_active);
    const totalGoal = activeCampaigns.reduce((sum, c) => sum + (parseFloat(c.goal_amount) || 0), 0);
    const totalRaised = activeCampaigns.reduce((sum, c) => sum + (parseFloat(c.current_amount) || 0), 0);
    
    return {
      activeCampaigns: activeCampaigns.length,
      totalCampaigns: campaigns.length,
      totalGoal,
      totalRaised,
      progressPercentage: totalGoal > 0 ? (totalRaised / totalGoal) * 100 : 0
    };
  }, [campaigns]);

  const filteredDonations = useMemo(() => {
    return donations.filter(d => {
      // Existing filters...
      if (filters.isRecurring !== 'all') {
        if (filters.isRecurring === 'true' && !d.is_recurring) return false;
        if (filters.isRecurring === 'false' && d.is_recurring) return false;
      }
      if (filters.recurringInterval !== 'all') {
        if (!d.is_recurring || d.recurring_interval !== filters.recurringInterval) return false;
      }
      if (filters.recurringStatus !== 'all') {
        if (!d.is_recurring) return false;
        // Assume d.subscription_status is available, or infer from metadata if needed
        if (filters.recurringStatus === 'active' && d.subscription_status !== 'active') return false;
        if (filters.recurringStatus === 'pending_cancellation' && d.subscription_status !== 'pending_cancellation' && !d.cancel_at_period_end) return false;
        if (filters.recurringStatus === 'canceled' && d.subscription_status !== 'canceled') return false;
      }
      // ...other filters...
      return true;
    });
  }, [donations, filters]);

  const recurringStats = useMemo(() => {
    const recurring = donations.filter(d => d.is_recurring === true || d.is_recurring === 'true' || d.is_recurring === 1 || d.is_recurring === '1');
    const oneTime = donations.filter(d => !d.is_recurring || d.is_recurring === false || d.is_recurring === 'false' || d.is_recurring === 0 || d.is_recurring === '0');
    const byInterval = {};
    const byStatus = { active: 0, pending_cancellation: 0, canceled: 0 };
    recurring.forEach(d => {
      const interval = d.recurring_interval || 'unknown';
      byInterval[interval] = (byInterval[interval] || 0) + parseFloat(d.amount);
      // Status: use d.subscription_status or infer from metadata/cancel_at_period_end
      if (d.subscription_status === 'canceled') byStatus.canceled++;
      else if (d.cancel_at_period_end) byStatus.pending_cancellation++;
      else byStatus.active++;
    });
    return {
      recurringCount: recurring.length,
      recurringTotal: recurring.reduce((sum, d) => sum + parseFloat(d.amount), 0),
      oneTimeCount: oneTime.length,
      oneTimeTotal: oneTime.reduce((sum, d) => sum + parseFloat(d.amount), 0),
      byInterval,
      byStatus
    };
  }, [donations]);

  const paymentMethodStats = useMemo(() => {
    const stats = {};
    donations.forEach(d => {
      const method = d.payment_method || 'unknown';
      stats[method] = (stats[method] || 0) + parseFloat(d.amount);
    });
    return stats;
  }, [donations]);

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {/* Unique Donation URL for this church */}
      {orgSlug && (
        <div className="mb-6 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <span className="font-semibold text-blue-700">Your Donation Page URL:</span>
          <span className="bg-white px-2 py-1 rounded text-blue-700 border border-blue-200 text-sm">
            {window.location.origin + '/donate/' + orgSlug}
          </span>
          <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(window.location.origin + '/donate/' + orgSlug)}>Copy</Button>
          <Button size="sm" variant="outline" onClick={() => window.open('/donate/' + orgSlug, '_blank')}>Open</Button>
        </div>
      )}

      {/* Mobile Header */}
      <div className="block md:hidden">
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative px-4 py-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">Donations</h1>
                <p className="text-blue-100 text-sm">Financial Management</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {formatCurrency(donationSummary.totalAmount)}
                </div>
                <div className="text-xs text-blue-100">Total Raised</div>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-lg font-bold">{donationSummary.donationCount}</div>
                <div className="text-xs text-blue-100">Donations</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{donationSummary.uniqueDonors}</div>
                <div className="text-xs text-blue-100">Donors</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{formatCurrency(donationSummary.averageAmount)}</div>
                <div className="text-xs text-blue-100">Average</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <motion.div className="hidden md:block mb-4 sm:mb-8 relative" variants={itemVariants}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 blur-3xl rounded-3xl"></div>
        <div className="relative backdrop-blur-sm bg-white/90 dark:bg-slate-900/95 border border-white/30 dark:border-slate-700/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent mb-2">
                Donation Management
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base lg:text-lg font-medium">
                Comprehensive donation tracking, campaign management, and financial analytics
              </p>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-slate-600 dark:text-slate-300">Live Data</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-slate-600 dark:text-slate-300">Financial Analytics</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowIntelligence(!showIntelligence)}
                  className="flex items-center space-x-2 bg-white/80 dark:bg-slate-800/80 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                >
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    {showIntelligence ? 'Hide' : 'Show'} AI Intelligence
                  </span>
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mobile Quick Actions */}
      <div className="block md:hidden px-4 py-3 bg-white dark:bg-slate-900 border-b">
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => setIsDonationDialogOpen(true)}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Donation
          </Button>
          <Button
            onClick={() => setShowIntelligence(!showIntelligence)}
            variant="outline"
            size="sm"
            className="px-3"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <motion.div 
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >


      {/* Summary Cards */}
      <motion.div variants={itemVariants} className="grid gap-4 grid-cols-1 lg:grid-cols-4 mb-6">
        {/* Total Donations */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-900 dark:text-white">Donations</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">Total Amount</p>
                </div>
              </div>
              <div>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {isLoading ? '---' : formatCurrency(donationSummary.totalAmount)}
                </div>
                <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {donationSummary.donationCount} total
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Average Donation */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-900 dark:text-white">Average</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">Per Donation</p>
                </div>
              </div>
              <div>
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                  {isLoading ? '---' : formatCurrency(donationSummary.averageAmount)}
                </div>
                <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Average
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Active Donors */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-900 dark:text-white">Donors</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">Active Givers</p>
                </div>
              </div>
              <div>
                <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mb-1">
                  {isLoading ? '---' : donationSummary.uniqueDonors}
                </div>
                <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                  <Users className="h-3 w-3 mr-1" />
                  Unique
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Campaign Progress */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-900 dark:text-white">Campaigns</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">Progress Rate</p>
                </div>
              </div>
              <div>
                <div className="text-xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                  {isLoading ? '---' : `${campaignSummary.progressPercentage.toFixed(1)}%`}
                </div>
                <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                  <Target className="h-3 w-3 mr-1" />
                  Progress
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
{/* Donation Intelligence */}
{showIntelligence && (
        <motion.div variants={itemVariants} className="mb-6 sm:mb-12">
          <div className="group relative">
            <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-3 sm:p-6 lg:p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Donation Intelligence</h3>
                  <p className="text-slate-600 dark:text-slate-400">AI-powered insights and giving recommendations</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">AI Intelligence</span>
              </div>
            </div>
            
            {/* Intelligence Grid */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {/* Giving Pattern Analysis */}
              <motion.div className="group/card relative" variants={itemVariants}>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Giving Pattern</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-green-600">
                      {(() => {
                        const monthlyAverage = donationSummary.totalAmount / Math.max(1, Math.ceil((new Date() - new Date(filters.startDate)) / (1000 * 60 * 60 * 24 * 30)));
                        const lastMonthTotal = donations.filter(d => {
                          const donationDate = new Date(d.date);
                          const lastMonth = new Date();
                          lastMonth.setMonth(lastMonth.getMonth() - 1);
                          return donationDate.getMonth() === lastMonth.getMonth() && donationDate.getFullYear() === lastMonth.getFullYear();
                        }).reduce((sum, d) => sum + parseFloat(d.amount), 0);
                        
                        if (lastMonthTotal > monthlyAverage * 1.1) return 'Strong';
                        if (lastMonthTotal > monthlyAverage * 0.9) return 'Steady';
                        return 'Declining';
                      })()}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {(() => {
                        const currentMonthDonations = donations.filter(d => {
                          const now = new Date();
                          const currentYear = now.getFullYear();
                          const currentMonth = now.getMonth();
                          const startOfMonth = new Date(currentYear, currentMonth, 1);
                          const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
                          const startOfMonthStr = startOfMonth.toISOString().split('T')[0];
                          const endOfMonthStr = endOfMonth.toISOString().split('T')[0];
                          return d.date >= startOfMonthStr && d.date <= endOfMonthStr;
                        });
                        return `${currentMonthDonations.length} donations this month`;
                      })()}
                    </p>
                    <div className="text-xs text-slate-500 dark:text-slate-500">
                      {(() => {
                        const monthlyAverage = donationSummary.totalAmount / Math.max(1, Math.ceil((new Date() - new Date(filters.startDate)) / (1000 * 60 * 60 * 24 * 30)));
                        const lastMonthTotal = donations.filter(d => {
                          const now = new Date();
                          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
                          const lastMonthStr = lastMonth.toISOString().split('T')[0];
                          const lastMonthEndStr = lastMonthEnd.toISOString().split('T')[0];
                          return d.date >= lastMonthStr && d.date <= lastMonthEndStr;
                        }).reduce((sum, d) => sum + parseFloat(d.amount), 0);
                        
                        if (lastMonthTotal > monthlyAverage * 1.1) return 'Keep up this positive momentum';
                        if (lastMonthTotal > monthlyAverage * 0.9) return 'Maintain current outreach efforts';
                        return 'Consider stewardship campaigns';
                      })()}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Payment Method Efficiency */}
              <motion.div className="group/card relative" variants={itemVariants}>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Payment Insights</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-blue-600">
                      {(() => {
                        const methodStats = donations.reduce((acc, d) => {
                          acc[d.payment_method] = (acc[d.payment_method] || 0) + parseFloat(d.amount);
                          return acc;
                        }, {});
                        const topMethod = Object.entries(methodStats).sort((a, b) => b[1] - a[1])[0];
                        return topMethod ? topMethod[0].replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Cash';
                      })()}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Most popular payment method
                    </p>
                    <div className="text-xs text-slate-500 dark:text-slate-500">
                      {(() => {
                        const onlineTotal = donations.filter(d => d.payment_method === 'online').reduce((sum, d) => sum + parseFloat(d.amount), 0);
                        const totalAmount = donations.reduce((sum, d) => sum + parseFloat(d.amount), 0);
                        const onlinePercentage = totalAmount > 0 ? (onlineTotal / totalAmount * 100).toFixed(1) : 0;
                        return `${onlinePercentage}% of donations are online`;
                      })()}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Donor Engagement Score */}
              <motion.div className="group/card relative" variants={itemVariants}>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Donor Engagement</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-purple-600">
                      {(() => {
                        const repeatDonors = donations.reduce((acc, d) => {
                          if (d.donor_id) {
                            acc[d.donor_id] = (acc[d.donor_id] || 0) + 1;
                          }
                          return acc;
                        }, {});
                        const repeatCount = Object.values(repeatDonors).filter(count => count > 1).length;
                        const engagementRate = donationSummary.uniqueDonors > 0 ? (repeatCount / donationSummary.uniqueDonors * 100).toFixed(0) : 0;
                        return `${engagementRate}%`;
                      })()}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Repeat donor rate
                    </p>
                    <div className="text-xs text-slate-500 dark:text-slate-500">
                      {(() => {
                        const repeatDonors = donations.reduce((acc, d) => {
                          if (d.donor_id) {
                            acc[d.donor_id] = (acc[d.donor_id] || 0) + 1;
                          }
                          return acc;
                        }, {});
                        const repeatCount = Object.values(repeatDonors).filter(count => count > 1).length;
                        const engagementRate = donationSummary.uniqueDonors > 0 ? (repeatCount / donationSummary.uniqueDonors * 100) : 0;
                        
                        if (engagementRate > 70) return 'Excellent donor retention';
                        if (engagementRate > 50) return 'Good donor loyalty';
                        return 'Focus on donor retention strategies';
                      })()}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Fund Allocation Efficiency */}
              <motion.div className="group/card relative" variants={itemVariants}>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 to-amber-600/20 rounded-xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                      <PieChart className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Fund Distribution</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-amber-600">
                      {(() => {
                        const fundStats = donations.reduce((acc, d) => {
                          acc[d.fund_designation] = (acc[d.fund_designation] || 0) + parseFloat(d.amount);
                          return acc;
                        }, {});
                        const topFund = Object.entries(fundStats).sort((a, b) => b[1] - a[1])[0];
                        return topFund ? topFund[0].replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'General';
                      })()}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Top receiving fund
                    </p>
                    <div className="text-xs text-slate-500 dark:text-slate-500">
                      {(() => {
                        const fundStats = donations.reduce((acc, d) => {
                          acc[d.fund_designation] = (acc[d.fund_designation] || 0) + parseFloat(d.amount);
                          return acc;
                        }, {});
                        const fundCount = Object.keys(fundStats).length;
                        return `Donations spread across ${fundCount} fund${fundCount !== 1 ? 's' : ''}`;
                      })()}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Batch Processing Efficiency */}
              <motion.div className="group/card relative" variants={itemVariants}>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 rounded-xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                      <Archive className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Batch Efficiency</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-emerald-600">
                      {(() => {
                        const openBatches = batches.filter(b => b.status === 'open').length;
                        const totalBatches = batches.length;
                        if (totalBatches === 0) return 'N/A';
                        if (openBatches === 0) return 'Organized';
                        if (openBatches === 1) return 'Active';
                        return 'Multiple';
                      })()}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {(() => {
                        const openBatches = batches.filter(b => b.status === 'open').length;
                        if (openBatches === 0) return 'All batches processed';
                        if (openBatches === 1) return '1 batch in progress';
                        return `${openBatches} batches in progress`;
                      })()}
                    </p>
                    <div className="text-xs text-slate-500 dark:text-slate-500">
                      {(() => {
                        const openBatches = batches.filter(b => b.status === 'open').length;
                        if (openBatches === 0) return 'Great batch management';
                        if (openBatches === 1) return 'Good processing workflow';
                        return 'Consider closing completed batches';
                      })()}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Anonymous Giving Insights */}
              <motion.div className="group/card relative" variants={itemVariants}>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-indigo-600/20 rounded-xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <UserX className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Anonymous Giving</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-indigo-600">
                      {(() => {
                        const anonymousDonations = donations.filter(d => d.is_anonymous || !d.donor_id);
                        const anonymousTotal = anonymousDonations.reduce((sum, d) => sum + parseFloat(d.amount), 0);
                        const totalAmount = donations.reduce((sum, d) => sum + parseFloat(d.amount), 0);
                        return totalAmount > 0 ? `${(anonymousTotal / totalAmount * 100).toFixed(1)}%` : '0%';
                      })()}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Anonymous contribution rate
                    </p>
                    <div className="text-xs text-slate-500 dark:text-slate-500">
                      {(() => {
                        const anonymousDonations = donations.filter(d => d.is_anonymous || !d.donor_id);
                        const anonymousRate = anonymousDonations.length / Math.max(donations.length, 1) * 100;
                        if (anonymousRate > 25) return 'High privacy preference';
                        if (anonymousRate > 10) return 'Moderate anonymous giving';
                        return 'Most donors prefer recognition';
                      })()}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
      )}
      {/* Compact Donation Analysis */}
      <motion.div variants={itemVariants} className="mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Donation Analysis</h3>
                  <p className="text-slate-600 dark:text-slate-400">Last 90 days giving metrics and insights</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500 dark:text-slate-400">Analysis Period</div>
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Last 90 Days</div>
              </div>
            </div>
            
            {(() => {
              // Filter donations to last 90 days
              const ninetyDaysAgo = new Date();
              ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
              const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split('T')[0];
              
              const recentDonations = donations.filter(d => d.date >= ninetyDaysAgoStr);
              
              return (
                <>
                  {/* Compact Analysis Grid */}
                  <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
                    {/* Amount Statistics */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-xl p-3 border border-blue-200 dark:border-blue-800">
                      <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Highest</div>
                      <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                        {formatCurrency(Math.max(...recentDonations.map(d => parseFloat(d.amount) || 0), 0))}
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 rounded-xl p-3 border border-emerald-200 dark:border-emerald-800">
                      <div className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-1">Lowest</div>
                      <div className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
                        {(() => {
                          const positiveAmounts = recentDonations.map(d => parseFloat(d.amount) || 0).filter(a => a > 0);
                          return positiveAmounts.length > 0 ? formatCurrency(Math.min(...positiveAmounts)) : formatCurrency(0);
                        })()}
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 rounded-xl p-3 border border-amber-200 dark:border-amber-800">
                      <div className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">Median</div>
                      <div className="text-lg font-bold text-amber-900 dark:text-amber-100">
                        {formatCurrency((() => {
                          const amounts = recentDonations.map(d => parseFloat(d.amount) || 0).sort((a, b) => a - b);
                          const middle = Math.floor(amounts.length / 2);
                          return amounts.length % 2 === 0 ? (amounts[middle - 1] + amounts[middle]) / 2 : amounts[middle];
                        })())}
                      </div>
                    </div>
                    
                    {/* Donor Statistics */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-xl p-3 border border-purple-200 dark:border-purple-800">
                      <div className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">Recurring</div>
                      <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                        {(() => {
                          const donorCounts = {};
                          recentDonations.forEach(d => {
                            if (!d.is_anonymous && d.donor_id) {
                              donorCounts[d.donor_id] = (donorCounts[d.donor_id] || 0) + 1;
                            }
                          });
                          return Object.values(donorCounts).filter(count => count > 1).length;
                        })()}
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900 rounded-xl p-3 border border-teal-200 dark:border-teal-800">
                      <div className="text-xs font-medium text-teal-700 dark:text-teal-300 mb-1">First-time</div>
                      <div className="text-lg font-bold text-teal-900 dark:text-teal-100">
                        {(() => {
                          const donorCounts = {};
                          recentDonations.forEach(d => {
                            if (!d.is_anonymous && d.donor_id) {
                              donorCounts[d.donor_id] = (donorCounts[d.donor_id] || 0) + 1;
                            }
                          });
                          return Object.values(donorCounts).filter(count => count === 1).length;
                        })()}
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 rounded-xl p-3 border border-gray-200 dark:border-gray-800">
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Anonymous</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {recentDonations.filter(d => d.is_anonymous || !d.donor_id).length}
                      </div>
                    </div>
                    
                    {/* Payment Method Analysis */}
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 rounded-xl p-3 border border-indigo-200 dark:border-indigo-800">
                      <div className="text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-1">Cash</div>
                      <div className="text-lg font-bold text-indigo-900 dark:text-indigo-100">
                        {recentDonations.filter(d => d.payment_method === 'cash').length}
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-xl p-3 border border-green-200 dark:border-green-800">
                      <div className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">Check</div>
                      <div className="text-lg font-bold text-green-900 dark:text-green-100">
                        {recentDonations.filter(d => d.payment_method === 'check').length}
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 rounded-xl p-3 border border-pink-200 dark:border-pink-800">
                      <div className="text-xs font-medium text-pink-700 dark:text-pink-300 mb-1">Card</div>
                      <div className="text-lg font-bold text-pink-900 dark:text-pink-100">
                        {recentDonations.filter(d => d.payment_method === 'credit_card').length}
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950 dark:to-cyan-900 rounded-xl p-3 border border-cyan-200 dark:border-cyan-800">
                      <div className="text-xs font-medium text-cyan-700 dark:text-cyan-300 mb-1">Online</div>
                      <div className="text-lg font-bold text-cyan-900 dark:text-cyan-100">
                        {recentDonations.filter(d => d.payment_method === 'online').length}
                      </div>
                    </div>
                    
                    {/* Fund Distribution */}
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 rounded-xl p-3 border border-orange-200 dark:border-orange-800">
                      <div className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-1">General</div>
                      <div className="text-lg font-bold text-orange-900 dark:text-orange-100">
                        {formatCurrency(recentDonations.filter(d => d.fund_designation === 'general').reduce((sum, d) => sum + parseFloat(d.amount), 0))}
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-950 dark:to-violet-900 rounded-xl p-3 border border-violet-200 dark:border-violet-800">
                      <div className="text-xs font-medium text-violet-700 dark:text-violet-300 mb-1">Tithes</div>
                      <div className="text-lg font-bold text-violet-900 dark:text-violet-100">
                        {formatCurrency(recentDonations.filter(d => d.fund_designation === 'tithe').reduce((sum, d) => sum + parseFloat(d.amount), 0))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Monthly Breakdown */}
                  <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Monthly Breakdown (Last 90 Days)</h4>
                    <div className="grid gap-2 grid-cols-3 md:grid-cols-6 lg:grid-cols-12">
                      {(() => {
                        const monthlyData = {};
                        recentDonations.forEach(d => {
                          const month = format(parseISO(d.date), 'MMM');
                          monthlyData[month] = (monthlyData[month] || 0) + parseFloat(d.amount);
                        });
                        
                        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        return months.map(month => (
                          <div key={month} className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <div className="text-xs font-medium text-slate-600 dark:text-slate-400">{month}</div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white">
                              {formatCurrency(monthlyData[month] || 0)}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Top Donors */}
                  <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Top Donors (Last 90 Days)</h4>
                      <Button variant="outline" size="sm" className="text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        View All Donors
                      </Button>
                    </div>
                    
                    {(() => {
                      // Calculate donor statistics once
                      const donorStats = {};
                      recentDonations.forEach(donation => {
                        if (donation.donor_id && donation.donor) {
                          const donorKey = donation.donor_id;
                          if (!donorStats[donorKey]) {
                            donorStats[donorKey] = {
                              id: donation.donor_id,
                              name: `${donation.donor.firstname} ${donation.donor.lastname}`,
                              profile_image: donation.donor.image_url || null,
                              totalAmount: 0,
                              donationCount: 0,
                              lastDonation: donation.date
                            };
                          }
                          donorStats[donorKey].totalAmount += parseFloat(donation.amount) || 0;
                          donorStats[donorKey].donationCount += 1;
                          if (donation.date > donorStats[donorKey].lastDonation) {
                            donorStats[donorKey].lastDonation = donation.date;
                          }
                        }
                      });

                      const topDonors = Object.values(donorStats)
                        .sort((a, b) => b.totalAmount - a.totalAmount)
                        .slice(0, 10);

                      const totalFromTopDonors = topDonors.reduce((sum, donor) => sum + donor.totalAmount, 0);
                      const totalDonations = recentDonations.reduce((sum, d) => sum + parseFloat(d.amount), 0);
                      const topDonorsPercentage = totalDonations > 0 ? Math.round((totalFromTopDonors / totalDonations) * 100) : 0;

                      return (
                        <>
                          {/* Top Donors Summary */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                              <div className="flex items-center space-x-2">
                                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Active Donors</div>
                              </div>
                              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                                {Object.keys(donorStats).length}
                              </div>
                              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                In last 90 days
                              </div>
                            </div>
                            
                            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg p-4 border border-green-200 dark:border-green-800">
                              <div className="flex items-center space-x-2">
                                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                                <div className="text-sm font-medium text-green-700 dark:text-green-300">Top 10 Total</div>
                              </div>
                              <div className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                                {formatCurrency(totalFromTopDonors)}
                              </div>
                              <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                                {topDonorsPercentage}% of total
                              </div>
                            </div>
                            
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                              <div className="flex items-center space-x-2">
                                <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                <div className="text-sm font-medium text-purple-700 dark:text-purple-300">Avg Gift</div>
                              </div>
                              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                                {formatCurrency(Object.keys(donorStats).length > 0 ? Math.round(totalFromTopDonors / Object.keys(donorStats).length) : 0)}
                              </div>
                              <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                                Per donor
                              </div>
                            </div>
                          </div>

                          {/* Top Donors List */}
                          {topDonors.length === 0 ? (
                            <div className="text-center py-8">
                              <Users className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                              <p className="text-slate-600 dark:text-slate-400 mb-2">No donor data available</p>
                              <p className="text-sm text-slate-500 dark:text-slate-300">
                                Donor information will appear here once donations are recorded
                              </p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {topDonors.map((donor, index) => (
                                <div 
                                  key={donor.id} 
                                  className="group cursor-pointer p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200"
                                  onClick={() => navigate(`/members/${donor.id}`)}
                                  title={`View ${donor.name}'s profile`}
                                >
                                  <div className="flex items-center space-x-4">
                                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full text-white font-bold text-sm">
                                      {index + 1}
                                    </div>
                                    <div className="flex items-center space-x-3 flex-1">
                                      <Avatar className="w-12 h-12 border-2 border-slate-200 dark:border-slate-600">
                                        <AvatarImage 
                                          src={donor.profile_image} 
                                          alt={donor.name}
                                        />
                                        <AvatarFallback className="bg-gradient-to-br from-slate-400 to-slate-500 text-white font-semibold">
                                          {donor.name ? donor.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??'}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                          {donor.name}
                                        </div>
                                        <div className="text-sm text-slate-600 dark:text-slate-400">
                                          {donor.donationCount} donation{donor.donationCount !== 1 ? 's' : ''} • 
                                          Last: {format(parseISO(donor.lastDonation), 'MMM d, yyyy')}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                        {formatCurrency(donor.totalAmount)}
                                      </div>
                                      <div className="text-sm text-slate-500 dark:text-slate-400">
                                        Avg: {formatCurrency(Math.round(donor.totalAmount / donor.donationCount))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>
      </motion.div>

      

      {/* Filters */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                  <Filter className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Filters</h3>
                  <p className="text-slate-600 dark:text-slate-400">Filter and search donations</p>
                </div>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-6">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fund-designation">Fund</Label>
                <Select value={filters.fundDesignation} onValueChange={(value) => setFilters({...filters, fundDesignation: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="All funds" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Funds</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="tithe">Tithes</SelectItem>
                    <SelectItem value="building_fund">Building Fund</SelectItem>
                    <SelectItem value="missions">Missions</SelectItem>
                    <SelectItem value="youth_ministry">Youth Ministry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-method">Payment Method</Label>
                <Select value={filters.paymentMethod} onValueChange={value => setFilters({...filters, paymentMethod: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="All methods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="debit_card">Debit Card</SelectItem>
                    <SelectItem value="ach">ACH Transfer</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="Deacon - Credit Card">Deacon - Credit Card</SelectItem>
                    <SelectItem value="Deacon - ACH Transfer">Deacon - ACH Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search notes, check #..."
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex items-end">
                <Button onClick={applyFilters} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Apply Filters
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="is-recurring">Recurring</Label>
                <Select value={filters.isRecurring} onValueChange={value => setFilters({...filters, isRecurring: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="true">Recurring</SelectItem>
                    <SelectItem value="false">One-time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="recurring-interval">Interval</Label>
                <Select value={filters.recurringInterval} onValueChange={value => setFilters({...filters, recurringInterval: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="week">Weekly</SelectItem>
                    <SelectItem value="month">Monthly</SelectItem>
                    <SelectItem value="quarter">Quarterly</SelectItem>
                    <SelectItem value="year">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="recurring-status">Recurring Status</Label>
                <Select value={filters.recurringStatus} onValueChange={value => setFilters({...filters, recurringStatus: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending_cancellation">Pending Cancellation</SelectItem>
                    <SelectItem value="canceled">Canceled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Mobile Tab Navigation */}
          <div className="block md:hidden">
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setActiveTab('donations')}
                  className={`flex flex-col items-center space-y-1 px-3 py-3 rounded-xl text-xs font-medium transition-all duration-200 ${
                    activeTab === 'donations' 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <DollarSign className="h-5 w-5" />
                  <span>Donations</span>
                </button>
                <button
                  onClick={() => setActiveTab('batches')}
                  className={`flex flex-col items-center space-y-1 px-3 py-3 rounded-xl text-xs font-medium transition-all duration-200 ${
                    activeTab === 'batches' 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Archive className="h-5 w-5" />
                  <span>Batches</span>
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`flex flex-col items-center space-y-1 px-3 py-3 rounded-xl text-xs font-medium transition-all duration-200 ${
                    activeTab === 'analytics' 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <BarChart3 className="h-5 w-5" />
                  <span>Analytics</span>
                </button>
              </div>
              
              {/* Secondary options */}
              <div className="flex justify-center space-x-2 mt-3">
                <button
                  onClick={() => setActiveTab('campaigns')}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                    activeTab === 'campaigns' 
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                      : 'text-slate-500 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Target className="h-3 w-3" />
                  <span>Campaigns</span>
                </button>
                <button
                  onClick={() => setActiveTab('pledges')}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                    activeTab === 'pledges' 
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                      : 'text-slate-500 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <CheckCircle className="h-3 w-3" />
                  <span>Pledges</span>
                </button>
                <button
                  onClick={() => setActiveTab('receipts')}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                    activeTab === 'receipts' 
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                      : 'text-slate-500 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Receipt className="h-3 w-3" />
                  <span>Receipts</span>
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Tab Navigation */}
          <TabsList className="hidden md:grid w-full grid-cols-6">
            <TabsTrigger value="donations" className="flex items-center justify-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span>Donations</span>
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center justify-center space-x-2">
              <Target className="h-4 w-4" />
              <span>Campaigns</span>
            </TabsTrigger>
            <TabsTrigger value="pledges" className="flex items-center justify-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>Pledges</span>
            </TabsTrigger>
            <TabsTrigger value="batches" className="flex items-center justify-center space-x-2">
              <Archive className="h-4 w-4" />
              <span>Batches</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center justify-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="receipts" className="flex items-center justify-center space-x-2">
              <Receipt className="h-4 w-4" />
              <span>Receipts</span>
            </TabsTrigger>
          </TabsList>

          {/* Donations Tab */}
          <TabsContent value="donations" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">Donations</h2>
                <p className="text-muted-foreground text-sm sm:text-base">Track and manage all donations</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <Button onClick={applyFilters} variant="outline" className="w-full sm:w-auto sm:hidden">
                  <Filter className="h-4 w-4 mr-2" />
                  Apply Filters
                </Button>
                <Button onClick={() => setIsDonationDialogOpen(true)} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Donation
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                {/* Mobile Card Layout */}
                <div className="block md:hidden">
                  {isLoading ? (
                    <div className="space-y-4 p-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
                          <div className="flex justify-between items-start mb-3">
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="h-6 w-20" />
                          </div>
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredDonations.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <h3 className="text-lg font-semibold mb-2">No Donations Found</h3>
                      <p className="text-sm mb-4">No donations match your current filters</p>
                      <Button onClick={() => setIsDonationDialogOpen(true)} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Donation
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 p-4">
                      {filteredDonations.map((donation) => (
                        <div key={donation.id} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition-shadow">
                          {/* Header with date and amount */}
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                  {format(parseISO(donation.date), 'MMM d, yyyy')}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  {format(parseISO(donation.date), 'EEEE')}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(donation.amount)}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {donation.is_tax_deductible ? 'Tax Deductible' : 'Non-deductible'}
                              </div>
                            </div>
                          </div>
                          
                          {/* Donor info */}
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                              {donation.is_anonymous ? (
                                <UserX className="h-4 w-4 text-slate-500" />
                              ) : (
                                <User className="h-4 w-4 text-slate-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              {donation.is_anonymous ? (
                                <div className="flex items-center space-x-2">
                                  <Badge variant="secondary" className="text-xs">Anonymous</Badge>
                                </div>
                              ) : donation.donor ? (
                                <div>
                                  <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
                                    {donation.donor.firstname} {donation.donor.lastname}
                                  </div>
                                  {donation.donor.email && (
                                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                      {donation.donor.email}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-slate-500 dark:text-slate-400">No donor linked</span>
                              )}
                            </div>
                          </div>
                          
                          {/* Payment method and fund */}
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-7 h-7 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                                {getPaymentMethodIcon(donation.payment_method)}
                              </div>
                              <div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">Payment</div>
                                <div className="text-sm font-medium text-slate-900 dark:text-slate-100 capitalize">
                                  {donation.payment_method?.replace('_', ' ')}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-7 h-7 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                                {getFundDesignationIcon(donation.fund_designation)}
                              </div>
                              <div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">Fund</div>
                                <div className="text-sm font-medium text-slate-900 dark:text-slate-100 capitalize">
                                  {donation.fund_designation?.replace('_', ' ')}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Campaign and batch info */}
                          {(donation.campaign || donation.batch) && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {donation.campaign && (
                                <Badge variant="outline" className="text-xs">
                                  <Target className="h-3 w-3 mr-1" />
                                  {donation.campaign.name}
                                </Badge>
                              )}
                              {donation.batch && (
                                <Badge variant="secondary" className="text-xs">
                                  <Archive className="h-3 w-3 mr-1" />
                                  {donation.batch.name}
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          {/* Check number */}
                          {donation.check_number && (
                            <div className="mb-3">
                              <div className="text-xs text-slate-500 dark:text-slate-400">Check Number</div>
                              <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                #{donation.check_number}
                              </div>
                            </div>
                          )}
                          
                          {/* Notes */}
                          {donation.notes && (
                            <div className="mb-3 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Notes</div>
                              <div className="text-sm text-slate-700 dark:text-slate-300">
                                {donation.notes}
                              </div>
                            </div>
                          )}
                          
                          {/* Actions */}
                          <div className="flex space-x-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditDonation(donation)}
                              className="flex-1"
                            >
                              <Pencil className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setItemToDelete({ type: 'donation', id: donation.id });
                                setIsDeleteDialogOpen(true);
                              }}
                              className="flex-1"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Desktop Table Layout */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="border-b bg-muted/50">
                      <tr className="text-left">
                        <th className="p-3 sm:p-4 font-medium text-xs sm:text-sm">Date</th>
                        <th className="p-3 sm:p-4 font-medium text-xs sm:text-sm">Donor</th>
                        <th className="p-3 sm:p-4 font-medium text-xs sm:text-sm">Amount</th>
                        <th className="p-3 sm:p-4 font-medium text-xs sm:text-sm">Recurring</th>
                        <th className="p-3 sm:p-4 font-medium text-xs sm:text-sm">Method</th>
                        <th className="p-3 sm:p-4 font-medium text-xs sm:text-sm">Fund</th>
                        <th className="p-3 sm:p-4 font-medium text-xs sm:text-sm hidden lg:table-cell">Campaign</th>
                        <th className="p-3 sm:p-4 font-medium text-xs sm:text-sm hidden lg:table-cell">Batch</th>
                        <th className="p-3 sm:p-4 font-medium text-xs sm:text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i} className="border-b">
                            <td className="p-3 sm:p-4"><Skeleton className="h-4 w-16 sm:w-20" /></td>
                            <td className="p-3 sm:p-4"><Skeleton className="h-4 w-24 sm:w-32" /></td>
                            <td className="p-3 sm:p-4"><Skeleton className="h-4 w-12 sm:w-16" /></td>
                            <td className="p-3 sm:p-4"><Skeleton className="h-4 w-16 sm:w-20" /></td>
                            <td className="p-3 sm:p-4"><Skeleton className="h-4 w-16 sm:w-20" /></td>
                            <td className="p-3 sm:p-4"><Skeleton className="h-4 w-20 sm:w-24" /></td>
                            <td className="p-3 sm:p-4 hidden lg:table-cell"><Skeleton className="h-4 w-24 sm:w-28" /></td>
                            <td className="p-3 sm:p-4 hidden lg:table-cell"><Skeleton className="h-4 w-20 sm:w-24" /></td>
                            <td className="p-3 sm:p-4"><Skeleton className="h-4 w-16 sm:w-20" /></td>
                          </tr>
                        ))
                      ) : filteredDonations.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="p-6 sm:p-8 text-center text-muted-foreground text-sm sm:text-base">
                            No donations found for the selected filters
                          </td>
                        </tr>
                      ) : (
                        filteredDonations.map((donation) => (
                          <tr key={donation.id} className="border-b hover:bg-muted/50 transition-colors">
                            <td className="p-3 sm:p-4">
                              <div className="text-xs sm:text-sm font-medium">
                                {format(parseISO(donation.date), 'MMM d, yyyy')}
                              </div>
                            </td>
                            <td className="p-3 sm:p-4">
                              <div className="flex items-center space-x-2">
                                {donation.is_anonymous ? (
                                  <Badge variant="secondary" className="text-xs">Anonymous</Badge>
                                ) : donation.donor ? (
                                  <div className="min-w-0 flex-1">
                                    <div className="font-medium text-xs sm:text-sm truncate">
                                      <a
                                        href={`/members/${donation.donor.id}`}
                                        className="text-blue-600 hover:underline font-medium"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title={`View ${donation.donor.firstname} ${donation.donor.lastname}'s profile`}
                                      >
                                        {donation.donor.firstname} {donation.donor.lastname}
                                      </a>
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate hidden sm:block">
                                      {donation.donor.email}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-xs sm:text-sm">No donor</span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 sm:p-4">
                              <div className="font-semibold text-emerald-600 text-sm sm:text-base">
                                {formatCurrency(donation.amount)}
                              </div>
                            </td>
                            <td className="p-3 sm:p-4">
                              {(donation.is_recurring === true || donation.is_recurring === 'true' || donation.is_recurring === 1 || donation.is_recurring === '1') ? (
                                <Badge variant="default" className="bg-purple-600 text-white border-purple-700" title={`Recurring ${donation.recurring_interval}ly donation`}>
                                  {donation.recurring_interval === 'week' ? 'Weekly' :
                                   donation.recurring_interval === 'month' ? 'Monthly' :
                                   donation.recurring_interval === 'quarter' ? 'Quarterly' :
                                   donation.recurring_interval === 'year' ? 'Yearly' :
                                   'Recurring'}
                                </Badge>
                              ) : null}
                            </td>
                            <td className="p-3 sm:p-4">
                              <div className="flex items-center space-x-2">
                                {getPaymentMethodIcon(donation.payment_method)}
                                <span className="capitalize text-xs sm:text-sm">
                                  {donation.payment_method?.replace('_', ' ')}
                                </span>
                              </div>
                            </td>
                            <td className="p-3 sm:p-4">
                              <div className="flex items-center space-x-2">
                                {getFundDesignationIcon(donation.fund_designation)}
                                <span className="capitalize text-xs sm:text-sm">
                                  {donation.fund_designation?.replace('_', ' ')}
                                </span>
                              </div>
                            </td>
                            <td className="p-3 sm:p-4 hidden lg:table-cell">
                              {donation.campaign ? (
                                <Badge variant="outline" className="text-xs">{donation.campaign.name}</Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">None</span>
                              )}
                            </td>
                            <td className="p-3 sm:p-4 hidden lg:table-cell">
                              {donation.batch ? (
                                <Badge variant="secondary" className="flex items-center space-x-1 max-w-[150px] text-xs" title={donation.batch.name}>
                                  <Archive className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{donation.batch.name}</span>
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">None</span>
                              )}
                            </td>
                            <td className="p-3 sm:p-4">
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditDonation(donation)}
                                  className="text-xs h-8 px-2 sm:px-3"
                                >
                                  <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setItemToDelete({ type: 'donation', id: donation.id });
                                    setIsDeleteDialogOpen(true);
                                  }}
                                  className="text-xs h-8 px-2 sm:px-3"
                                >
                                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other tabs content will be added here... */}
          <TabsContent value="campaigns" className="space-y-6">
            <div className="text-center py-12">
              <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Campaigns Coming Soon</h3>
              <p className="text-muted-foreground">Campaign management features are being developed</p>
            </div>
          </TabsContent>

          <TabsContent value="pledges" className="space-y-6">
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Pledges Coming Soon</h3>
              <p className="text-muted-foreground">Pledge management features are being developed</p>
            </div>
          </TabsContent>

          <TabsContent value="batches" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">Donation Batches</h2>
                <p className="text-muted-foreground text-sm sm:text-base">Organize donations into batches for processing</p>
              </div>
              <Button onClick={() => setIsBatchDialogOpen(true)} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Create Batch
              </Button>
            </div>

            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-4 w-32 mb-4" />
                      <Skeleton className="h-6 w-20 mb-2" />
                      <Skeleton className="h-4 w-24 mb-4" />
                      <div className="flex space-x-2">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-16" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : batches.length > 0 ? (
                batches.map((batch) => (
                  <motion.div key={batch.id} variants={itemVariants}>
                    <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300">
                      <div className={`absolute top-0 left-0 right-0 h-1 ${
                        batch.status === 'open' ? 'bg-green-500' :
                        batch.status === 'processing' ? 'bg-yellow-500' :
                        'bg-gray-500'
                      }`}></div>
                      <CardContent className="p-6">
                        <div className="mb-4">
                          <div className="flex justify-end mb-2">
                            <Badge variant={
                              batch.status === 'open' ? 'default' :
                              batch.status === 'processing' ? 'secondary' :
                              'outline'
                            }>
                              {batch.status}
                            </Badge>
                          </div>
                          <h3 className="text-lg font-semibold leading-tight" title={batch.name}>
                            {batch.name}
                          </h3>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-muted-foreground">Total Amount</span>
                            <span className="font-semibold">{formatCurrency(batch.total_amount || 0)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-muted-foreground">Donations</span>
                            <span className="font-semibold">{batch.donation_count || 0}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-muted-foreground">Created</span>
                            <span className="font-semibold">
                              {batch.created_at ? format(parseISO(batch.created_at), 'MMM d, yyyy') : 'N/A'}
                            </span>
                          </div>
                        </div>
                        
                        {batch.description && (
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                            {batch.description}
                          </p>
                        )}
                        
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditBatch(batch)}
                            className="text-xs h-8 w-full sm:w-auto"
                          >
                            <Pencil className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          {batch.status === 'open' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCloseBatch(batch.id)}
                              className="text-xs h-8 w-full sm:w-auto"
                            >
                              <Archive className="h-3 w-3 mr-1" />
                              Close
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewBatchDetails(batch)}
                            className="text-xs h-8 w-full sm:w-auto"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-8 sm:py-12">
                  <Archive className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold mb-2">No Batches Found</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4">Create your first donation batch to get started</p>
                  <Button onClick={() => setIsBatchDialogOpen(true)} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Batch
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Analytics Coming Soon</h3>
              <p className="text-muted-foreground">Advanced analytics features are being developed</p>
            </div>
          </TabsContent>

          <TabsContent value="receipts" className="space-y-6">
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Receipts Coming Soon</h3>
              <p className="text-muted-foreground">Receipt management features are being developed</p>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Add/Edit Donation Dialog */}
      <Dialog open={isDonationDialogOpen} onOpenChange={setIsDonationDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {selectedDonation ? 'Edit Donation' : 'Add New Donation'}
            </DialogTitle>
            <DialogDescription>
              {selectedDonation ? 'Update donation details' : 'Record a new donation'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={selectedDonation ? handleUpdateDonation : handleAddDonation}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                  <Label htmlFor="donor">Donor</Label>
                  <div className="relative donor-dropdown-container">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="donor"
                        value={donorSearch}
                        onChange={(e) => {
                          setDonorSearch(e.target.value);
                          setIsDonorDropdownOpen(true);
                        }}
                        onFocus={() => setIsDonorDropdownOpen(true)}
                        placeholder="Search for donor or type 'Anonymous'"
                        className="pl-10"
                      />
                    </div>
                    
                    {isDonorDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        <div 
                          className="px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer border-b"
                          onClick={() => handleDonorSelect(null)}
                        >
                          <div className="flex items-center space-x-2">
                            <UserX className="h-4 w-4 text-muted-foreground" />
                            <span>Anonymous (No donor)</span>
                          </div>
                        </div>
                        
                        {getFilteredMembers().length > 0 ? (
                          getFilteredMembers().map((member) => (
                            <div
                              key={member.id}
                              className="px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                              onClick={() => handleDonorSelect(member)}
                            >
                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <div className="font-medium">
                                    {member.firstname} {member.lastname}
                                  </div>
                                  {member.email && (
                                    <div className="text-sm text-muted-foreground">
                                      {member.email}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : donorSearch.trim() !== '' ? (
                          <div className="px-3 py-2 text-muted-foreground">
                            No members found matching "{donorSearch}"
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ($) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={donationForm.amount}
                    onChange={(e) => setDonationForm({...donationForm, amount: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={donationForm.date}
                    onChange={(e) => setDonationForm({...donationForm, date: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fund-designation">Fund Designation</Label>
                  <Select 
                    value={donationForm.fund_designation} 
                    onValueChange={(value) => setDonationForm({...donationForm, fund_designation: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tithe">Tithes & Offerings</SelectItem>
                      <SelectItem value="general">General Fund</SelectItem>
                      <SelectItem value="building_fund">Building Fund</SelectItem>
                      <SelectItem value="missions">Missions</SelectItem>
                      <SelectItem value="youth_ministry">Youth Ministry</SelectItem>
                      <SelectItem value="outreach">Outreach</SelectItem>
                      <SelectItem value="benevolence">Benevolence</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payment-method">Payment Method</Label>
                  <Select 
                    value={donationForm.payment_method} 
                    onValueChange={(value) => setDonationForm({...donationForm, payment_method: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="debit_card">Debit Card</SelectItem>
                      <SelectItem value="online">Online Payment</SelectItem>
                      <SelectItem value="Deacon - Credit Card">Deacon - Credit Card</SelectItem>
                      <SelectItem value="Deacon - ACH Transfer">Deacon - ACH Transfer</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="check-number">Check Number</Label>
                  <Input
                    id="check-number"
                    value={donationForm.check_number}
                    onChange={(e) => setDonationForm({...donationForm, check_number: e.target.value})}
                    placeholder="If payment by check"
                  />
                </div>
              </div>
              

              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="campaign">Campaign (Optional)</Label>
                  <Select 
                    value={donationForm.campaign_id || 'none'} 
                    onValueChange={(value) => setDonationForm({...donationForm, campaign_id: value === 'none' ? null : value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No campaign" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Campaign</SelectItem>
                      {campaigns.filter(c => c.is_active).map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batch">Batch (Optional)</Label>
                  <Select 
                    value={donationForm.batch_id || 'none'} 
                    onValueChange={(value) => setDonationForm({...donationForm, batch_id: value === 'none' ? null : value})}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="No batch" />
                    </SelectTrigger>
                    <SelectContent className="max-w-[400px]">
                      <SelectItem value="none">No Batch</SelectItem>
                      {batches.filter(b => b.status === 'open').map((batch) => (
                        <SelectItem key={batch.id} value={batch.id} className="max-w-[380px]">
                          <div className="flex flex-col py-1">
                            <div className="text-sm font-medium truncate max-w-[360px]" title={batch.name}>
                              {batch.name}
                            </div>
                            {batch.batch_number && (
                              <div className="text-xs text-muted-foreground">
                                #{batch.batch_number}
                              </div>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={donationForm.notes}
                  onChange={(e) => setDonationForm({...donationForm, notes: e.target.value})}
                  placeholder="Additional notes about this donation"
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={donationForm.is_anonymous}
                    onChange={(e) => setDonationForm({...donationForm, is_anonymous: e.target.checked})}
                    className="rounded"
                  />
                  <Label htmlFor="anonymous">Anonymous donation</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="tax-deductible"
                    checked={donationForm.is_tax_deductible}
                    onChange={(e) => setDonationForm({...donationForm, is_tax_deductible: e.target.checked})}
                    className="rounded"
                  />
                  <Label htmlFor="tax-deductible">Tax deductible</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsDonationDialogOpen(false);
                  setSelectedDonation(null);
                  resetDonationForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {selectedDonation ? 'Update Donation' : 'Add Donation'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Batch Dialog */}
      <Dialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedBatch ? 'Edit Batch' : 'Create New Batch'}
            </DialogTitle>
            <DialogDescription>
              {selectedBatch ? 'Update batch details' : 'Create a new donation batch for organizing multiple donations'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={selectedBatch ? handleUpdateBatch : handleAddBatch}>
            <div className="grid gap-4 py-4">
                              <div className="space-y-2">
                <Label htmlFor="sunday-event">Select Sunday Service (Optional)</Label>
                <Select 
                  value={batchForm.selectedEvent || 'none'} 
                  onValueChange={(value) => handleEventSelection(value === 'none' ? '' : value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a Sunday service" />
                  </SelectTrigger>
                  <SelectContent className="max-w-[450px]">
                    <SelectItem value="none">None - Enter custom name</SelectItem>
                    {getSundayWorshipEvents().length > 0 ? (
                      getSundayWorshipEvents().map((event) => {
                        try {
                          const eventDate = parseISO(event.start_date);
                          const now = new Date();
                          const isPastEvent = eventDate < now;
                          
                          return (
                            <SelectItem key={event.id} value={event.id} className="max-w-[430px]">
                              <div className="flex flex-col py-1 w-full">
                                <div className="flex items-center justify-between w-full">
                                  <div className="text-sm font-medium truncate max-w-[280px]" title={event.title}>
                                    {event.title}
                                  </div>
                                  <div className={`text-xs px-2 py-1 rounded ${isPastEvent ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {isPastEvent ? 'Past' : 'Upcoming'}
                                  </div>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {format(eventDate, 'MMM d, yyyy')} • {format(eventDate, 'h:mm a')}
                                </div>
                              </div>
                            </SelectItem>
                          );
                        } catch (error) {
                          console.error('Error parsing event date:', event.start_date, error);
                          return (
                            <SelectItem key={event.id} value={event.id}>
                              <div className="text-sm">{event.title} - {event.start_date}</div>
                            </SelectItem>
                          );
                        }
                      })
                    ) : (
                      <SelectItem value="no-events" disabled>
                        No Sunday worship events found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="batch-name">Batch Name *</Label>
                <Input
                  id="batch-name"
                  value={batchForm.name}
                  onChange={(e) => setBatchForm({...batchForm, name: e.target.value})}
                  placeholder={batchForm.selectedEvent ? "Auto-generated from selected event" : "e.g., Sunday Service - Jan 15, 2024"}
                  required
                />
                {batchForm.selectedEvent && (
                  <p className="text-xs text-muted-foreground">
                    Name auto-generated from selected Sunday service. You can edit it if needed.
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="batch-description">Description</Label>
                <Textarea
                  id="batch-description"
                  value={batchForm.description}
                  onChange={(e) => setBatchForm({...batchForm, description: e.target.value})}
                  placeholder="Optional description for this batch"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="batch-status">Status</Label>
                <Select 
                  value={batchForm.status} 
                  onValueChange={(value) => setBatchForm({...batchForm, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsBatchDialogOpen(false);
                  setSelectedBatch(null);
                  resetBatchForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {selectedBatch ? 'Update Batch' : 'Create Batch'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Batch Details Dialog */}
      <Dialog open={isBatchDetailsDialogOpen} onOpenChange={setIsBatchDetailsDialogOpen}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-[800px] max-h-[90vh] overflow-y-auto p-0">
          {/* Mobile Header */}
          <div className="block md:hidden">
            <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold truncate">Batch Details</h2>
                  <p className="text-sm text-blue-100 truncate">
                    {selectedBatchForDetails?.name}
                  </p>
                </div>
                <Badge 
                  variant={selectedBatchForDetails?.status === 'open' ? 'default' : 'secondary'}
                  className="bg-white/20 text-white border-white/30"
                >
                  {selectedBatchForDetails?.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:block">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle className="text-xl">
                Batch Details: {selectedBatchForDetails?.name}
              </DialogTitle>
              <DialogDescription>
                Complete information about this donation batch
              </DialogDescription>
            </DialogHeader>
          </div>
          
          {selectedBatchForDetails && (
            <div className="p-4 md:p-6 space-y-6">
              {/* Mobile Batch Information Cards */}
              <div className="block md:hidden space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <Archive className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Batch #</div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {selectedBatchForDetails.batch_number || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Created</div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {format(parseISO(selectedBatchForDetails.batch_date), 'MMM d')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {selectedBatchForDetails.description && (
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">Description</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {selectedBatchForDetails.description}
                    </div>
                  </div>
                )}
              </div>

              {/* Desktop Batch Information */}
              <div className="hidden md:block">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Batch Number</Label>
                    <div className="text-sm text-muted-foreground">{selectedBatchForDetails.batch_number}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Status</Label>
                    <Badge variant={
                      selectedBatchForDetails.status === 'open' ? 'default' :
                      selectedBatchForDetails.status === 'processing' ? 'secondary' :
                      'outline'
                    }>
                      {selectedBatchForDetails.status}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Created Date</Label>
                    <div className="text-sm text-muted-foreground">
                      {format(parseISO(selectedBatchForDetails.batch_date), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Closed Date</Label>
                    <div className="text-sm text-muted-foreground">
                      {selectedBatchForDetails.closed_at ? format(parseISO(selectedBatchForDetails.closed_at), 'MMM d, yyyy') : 'Not closed'}
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm font-medium">Description</Label>
                    <div className="text-sm text-muted-foreground">
                      {selectedBatchForDetails.description || 'No description provided'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Statistics */}
              {batchDetails && batchDetails.statistics && (
                <div className="block md:hidden">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-blue-100">Total Donations</div>
                          <div className="text-2xl font-bold">{batchDetails.statistics.donation_count}</div>
                        </div>
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                          <DollarSign className="h-6 w-6" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-green-100">Total Amount</div>
                          <div className="text-2xl font-bold">{formatCurrency(batchDetails.statistics.total_amount)}</div>
                        </div>
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                          <TrendingUp className="h-6 w-6" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-purple-100">Average Amount</div>
                          <div className="text-2xl font-bold">{formatCurrency(batchDetails.statistics.average_donation)}</div>
                        </div>
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                          <BarChart3 className="h-6 w-6" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Desktop Statistics */}
              {batchDetails && batchDetails.statistics && (
                <div className="hidden md:block">
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Statistics</h4>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{batchDetails.statistics.donation_count}</div>
                        <div className="text-sm text-muted-foreground">Donations</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(batchDetails.statistics.total_amount)}</div>
                        <div className="text-sm text-muted-foreground">Total Amount</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{formatCurrency(batchDetails.statistics.average_donation)}</div>
                        <div className="text-sm text-muted-foreground">Average Amount</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Donations in this batch */}
              <div>
                <h4 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">Donations in this Batch</h4>
                {batchDetails && batchDetails.donations ? (
                  <div>
                    {/* Mobile Donation Cards */}
                    <div className="block md:hidden space-y-3">
                      {batchDetails.donations.map((donation) => (
                        <div key={donation.id} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
                          {/* Header with date and amount */}
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                  {format(parseISO(donation.date), 'MMM d, yyyy')}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  {format(parseISO(donation.date), 'EEEE')}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(donation.amount)}
                              </div>
                            </div>
                          </div>
                          
                          {/* Donor info */}
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                              {donation.is_anonymous ? (
                                <UserX className="h-4 w-4 text-slate-500" />
                              ) : (
                                <User className="h-4 w-4 text-slate-500" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                {donation.is_anonymous ? 'Anonymous' : 
                                 donation.donor ? (
                                   <a
                                     href={`/members/${donation.donor.id}`}
                                     className="text-blue-600 hover:underline font-medium"
                                     target="_blank"
                                     rel="noopener noreferrer"
                                     title={`View ${donation.donor.firstname} ${donation.donor.lastname}'s profile`}
                                   >
                                     {donation.donor.firstname} {donation.donor.lastname}
                                   </a>
                                 ) : 'N/A'}
                              </div>
                            </div>
                          </div>
                          
                          {/* Payment method and fund */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-7 h-7 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                                {getPaymentMethodIcon(donation.payment_method)}
                              </div>
                              <div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">Payment</div>
                                <div className="text-sm font-medium text-slate-900 dark:text-slate-100 capitalize">
                                  {donation.payment_method?.replace('_', ' ')}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-7 h-7 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                                {getFundDesignationIcon(donation.fund_designation)}
                              </div>
                              <div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">Fund</div>
                                <div className="text-sm font-medium text-slate-900 dark:text-slate-100 capitalize">
                                  {donation.fund_designation?.replace('_', ' ')}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block">
                      <div className="border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-900">
                              <tr>
                                <th className="px-4 py-2 text-left text-sm font-medium">Date</th>
                                <th className="px-4 py-2 text-left text-sm font-medium">Donor</th>
                                <th className="px-4 py-2 text-left text-sm font-medium">Amount</th>
                                <th className="px-4 py-2 text-left text-sm font-medium">Method</th>
                                <th className="px-4 py-2 text-left text-sm font-medium">Fund</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                              {batchDetails.donations.map((donation) => (
                                <tr key={donation.id} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                                  <td className="px-4 py-2 text-sm">
                                    {format(parseISO(donation.date), 'MMM d, yyyy')}
                                  </td>
                                  <td className="px-4 py-2 text-sm">
                                    {donation.is_anonymous ? 'Anonymous' : 
                                     donation.donor ? (
                                       <a
                                         href={`/members/${donation.donor.id}`}
                                         className="text-blue-600 hover:underline font-medium"
                                         target="_blank"
                                         rel="noopener noreferrer"
                                         title={`View ${donation.donor.firstname} ${donation.donor.lastname}'s profile`}
                                       >
                                         {donation.donor.firstname} {donation.donor.lastname}
                                       </a>
                                     ) : 'N/A'}
                                  </td>
                                  <td className="px-4 py-2 text-sm font-medium">
                                    {formatCurrency(donation.amount)}
                                  </td>
                                  <td className="px-4 py-2 text-sm">
                                    <div className="flex items-center space-x-2">
                                      {getPaymentMethodIcon(donation.payment_method)}
                                      <span className="capitalize">{donation.payment_method}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-2 text-sm">
                                    <div className="flex items-center space-x-2">
                                      {getFundDesignationIcon(donation.fund_designation)}
                                      <span className="capitalize">{donation.fund_designation.replace('_', ' ')}</span>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <RefreshCw className="h-6 w-6 animate-spin" />
                    </div>
                    <div className="text-sm">Loading donations...</div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Mobile Footer */}
          <div className="block md:hidden sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsBatchDetailsDialogOpen(false);
                setSelectedBatchForDetails(null);
                setBatchDetails(null);
              }}
              className="w-full"
            >
              Close
            </Button>
          </div>

          {/* Desktop Footer */}
          <div className="hidden md:block">
            <DialogFooter className="p-6 pt-0">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsBatchDetailsDialogOpen(false);
                  setSelectedBatchForDetails(null);
                  setBatchDetails(null);
                }}
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {itemToDelete?.type}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <motion.div className="mb-8" variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Stripe Integration Settings</CardTitle>
            <CardDescription>
              Set up your church's Stripe account to accept online donations securely.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Connection Status */}
            <div className="flex items-center gap-3">
              <span className="font-medium">Status:</span>
              {stripeStatus.loading ? (
                <span className="text-blue-600">Checking...</span>
              ) : stripeStatus.connected ? (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-emerald-100 text-emerald-700">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-700">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Not Connected
                </span>
              )}
            </div>
            
            {/* Environment */}
            <div className="flex items-center gap-3">
              <span className="font-medium">Environment:</span>
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700">Live</span>
            </div>
            
            {/* Enable/Disable Integration */}
            <div className="flex items-center gap-3">
              <span className="font-medium">Enable Stripe Donations:</span>
              <input 
                type="checkbox" 
                checked={stripeStatus.connected} 
                readOnly 
                className="form-checkbox h-5 w-5 text-blue-600" 
              />
            </div>
            
            {/* Donation URLs */}
            <div>
              <h4 className="font-semibold mb-2">Donation URLs</h4>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="bg-gray-100 px-2 py-1 rounded text-sm">
                    {window.location.origin}/donate/{orgSlug}
                  </span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/donate/${orgSlug}`)}
                  >
                    Copy
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => window.open(`/donate/${orgSlug}`, '_blank')}
                  >
                    Open
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Connection Details */}
            {stripeStatus.connected && (
              <div>
                <h4 className="font-semibold mb-2">Connection Details</h4>
                <div className="text-sm text-muted-foreground">
                  <p>✅ Connected to Stripe Connect</p>
                  <p>🏛️ Organization: {stripeStatus.organizationName}</p>
                  <p>💳 Ready to accept online donations</p>
                </div>
              </div>
            )}
            
            {!stripeStatus.connected && !stripeStatus.loading && (
              <div>
                <h4 className="font-semibold mb-2">Setup Required</h4>
                <div className="text-sm text-muted-foreground mb-3">
                  <p>To accept online donations, you need to connect your Stripe account.</p>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => window.location.href = '/settings?tab=church'}
                >
                  Connect Stripe Account
                </Button>
              </div>
            )}
            
            {/* Error State */}
            {stripeStatus.error && (
              <div className="text-red-600 text-sm">
                Error: {stripeStatus.error}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Donation Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-slate-500 mb-1">Recurring Donations</div>
              <div className="text-lg font-bold text-purple-700">{recurringStats.recurringCount}</div>
              <div className="text-xs text-slate-500">Total: {formatCurrency(recurringStats.recurringTotal)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">One-time Donations</div>
              <div className="text-lg font-bold text-blue-700">{recurringStats.oneTimeCount}</div>
              <div className="text-xs text-slate-500">Total: {formatCurrency(recurringStats.oneTimeTotal)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Recurring by Interval</div>
              <div className="text-xs">
                {Object.entries(recurringStats.byInterval).map(([interval, total]) => (
                  <div key={interval} className="capitalize">{interval}: {formatCurrency(total)}</div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Recurring Status</div>
              <div className="text-xs">
                <div>Active: {recurringStats.byStatus.active}</div>
                <div>Pending Cancellation: {recurringStats.byStatus.pending_cancellation}</div>
                <div>Canceled: {recurringStats.byStatus.canceled}</div>
              </div>
            </div>
            <div className="col-span-2 md:col-span-4">
              <div className="text-xs text-slate-500 mb-1">Totals by Payment Method</div>
              <div className="flex flex-wrap gap-4">
                {Object.entries(paymentMethodStats).map(([method, total]) => (
                  <div key={method} className="flex items-center gap-2">
                    {getPaymentMethodIcon(method)}
                    <span className="capitalize">{method}:</span>
                    <span className="font-bold">{formatCurrency(total)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </motion.div>
    </div>
  );
}

