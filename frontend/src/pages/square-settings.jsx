import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Settings, 
  Link, 
  Copy, 
  ExternalLink,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Info,
  Globe,
  QrCode,
  Share2,
  Download,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  getSquareSettings, 
  updateSquareSettings,
  getDonationUrls,
  createDonationUrl,
  updateDonationUrl,
  deleteDonationUrl,
  getSquareDonationAnalytics,
  generateDonationUrl
} from '@/lib/squareService';
import { getCampaigns } from '@/lib/donationService';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
};

export function SquareSettings() {
  // State management
  const [squareSettings, setSquareSettings] = useState(null);
  const [donationUrls, setDonationUrls] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  
  // Dialog states
  const [isUrlDialogOpen, setIsUrlDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  
  // Form states
  const [editingUrl, setEditingUrl] = useState(null);
  const [deletingUrl, setDeletingUrl] = useState(null);
  const [viewingUrl, setViewingUrl] = useState(null);
  
  // Form data
  const [settingsForm, setSettingsForm] = useState({
    application_id: '',
    location_id: '',
    access_token: '',
    environment: 'sandbox',
    is_active: false,
    webhook_url: '',
    webhook_secret: ''
  });
  
  const [urlForm, setUrlForm] = useState({
    name: '',
    description: '',
    campaign_id: '',
    suggested_amounts: [],
    custom_message: '',
    is_active: true
  });
  
  // UI states
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [settings, urls, campaignsData] = await Promise.all([
        getSquareSettings(),
        getDonationUrls(),
        getCampaigns()
      ]);
      
      setSquareSettings(settings);
      setDonationUrls(urls);
      setCampaigns(campaignsData);
      
      if (settings) {
        setSettingsForm({
          application_id: settings.application_id || '',
          location_id: settings.location_id || '',
          access_token: settings.access_token || '',
          environment: settings.environment || 'sandbox',
          is_active: settings.is_active || false,
          webhook_url: settings.webhook_url || '',
          webhook_secret: settings.webhook_secret || ''
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load Square settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      setIsLoadingAnalytics(true);
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      const endDate = new Date();
      
      const analyticsData = await getSquareDonationAnalytics(
        startDate.toISOString(),
        endDate.toISOString()
      );
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics",
        variant: "destructive"
      });
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await updateSquareSettings(settingsForm);
      
      toast({
        title: "Success",
        description: "Square settings updated successfully",
      });
      
      await loadData();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save Square settings",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateUrl = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await createDonationUrl(urlForm);
      
      toast({
        title: "Success",
        description: "Donation URL created successfully",
      });
      
      setIsUrlDialogOpen(false);
      resetUrlForm();
      await loadData();
    } catch (error) {
      console.error('Error creating URL:', error);
      toast({
        title: "Error",
        description: "Failed to create donation URL",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateUrl = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await updateDonationUrl(editingUrl.id, urlForm);
      
      toast({
        title: "Success",
        description: "Donation URL updated successfully",
      });
      
      setIsUrlDialogOpen(false);
      setEditingUrl(null);
      resetUrlForm();
      await loadData();
    } catch (error) {
      console.error('Error updating URL:', error);
      toast({
        title: "Error",
        description: "Failed to update donation URL",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUrl = async () => {
    try {
      await deleteDonationUrl(deletingUrl.id);
      
      toast({
        title: "Success",
        description: "Donation URL deleted successfully",
      });
      
      setIsDeleteDialogOpen(false);
      setDeletingUrl(null);
      await loadData();
    } catch (error) {
      console.error('Error deleting URL:', error);
      toast({
        title: "Error",
        description: "Failed to delete donation URL",
        variant: "destructive"
      });
    }
  };

  const resetUrlForm = () => {
    setUrlForm({
      name: '',
      description: '',
      campaign_id: '',
      suggested_amounts: [],
      custom_message: '',
      is_active: true
    });
  };

  const handleEditUrl = (url) => {
    setEditingUrl(url);
    setUrlForm({
      name: url.name,
      description: url.description || '',
      campaign_id: url.campaign_id || '',
      suggested_amounts: url.suggested_amounts || [],
      custom_message: url.custom_message || '',
      is_active: url.is_active
    });
    setIsUrlDialogOpen(true);
  };

  const handleViewUrl = (url) => {
    setViewingUrl(url);
    setIsViewDialogOpen(true);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "URL copied to clipboard",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge variant="secondary">
        <AlertCircle className="w-3 h-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="container mx-auto px-4 py-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Square Integration Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Configure your Square payment integration and manage donation URLs
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Square Settings */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Square Configuration
              </CardTitle>
              <CardDescription>
                Configure your Square application settings for payment processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="application_id">Application ID</Label>
                    <Input
                      id="application_id"
                      value={settingsForm.application_id}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, application_id: e.target.value }))}
                      placeholder="sq0idp-..."
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="location_id">Location ID</Label>
                    <Input
                      id="location_id"
                      value={settingsForm.location_id}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, location_id: e.target.value }))}
                      placeholder="LQ..."
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="access_token">Access Token</Label>
                  <div className="relative">
                    <Input
                      id="access_token"
                      type={showAccessToken ? "text" : "password"}
                      value={settingsForm.access_token}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, access_token: e.target.value }))}
                      placeholder="EAAA..."
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowAccessToken(!showAccessToken)}
                    >
                      {showAccessToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="environment">Environment</Label>
                    <Select
                      value={settingsForm.environment}
                      onValueChange={(value) => setSettingsForm(prev => ({ ...prev, environment: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sandbox">Sandbox</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={settingsForm.is_active}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="is_active">Enable Square Integration</Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="webhook_url">Webhook URL (Optional)</Label>
                  <Input
                    id="webhook_url"
                    value={settingsForm.webhook_url}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, webhook_url: e.target.value }))}
                    placeholder="https://your-domain.com/webhook"
                  />
                </div>

                <div>
                  <Label htmlFor="webhook_secret">Webhook Secret (Optional)</Label>
                  <div className="relative">
                    <Input
                      id="webhook_secret"
                      type={showWebhookSecret ? "text" : "password"}
                      value={settingsForm.webhook_secret}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, webhook_secret: e.target.value }))}
                      placeholder="Secret key for webhook verification"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                    >
                      {showWebhookSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <Button type="submit" disabled={isSaving} className="w-full">
                  {isSaving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Settings className="w-4 h-4 mr-2" />}
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Donation URLs */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Link className="w-5 h-5 mr-2" />
                    Donation URLs
                  </CardTitle>
                  <CardDescription>
                    Create and manage public donation pages
                  </CardDescription>
                </div>
                <Button onClick={() => setIsUrlDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create URL
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {donationUrls.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Link className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No donation URLs created yet</p>
                    <p className="text-sm">Create your first donation URL to get started</p>
                  </div>
                ) : (
                  donationUrls.map((url) => (
                    <div key={url.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{url.name}</h3>
                          {getStatusBadge(url.is_active)}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewUrl(url)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUrl(url)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeletingUrl(url);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      {url.description && (
                        <p className="text-sm text-gray-600 mb-2">{url.description}</p>
                      )}
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>Slug: {url.slug}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(generateDonationUrl(window.location.origin, url.slug))}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Analytics Section */}
      <motion.div variants={itemVariants} className="mt-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Square Donation Analytics</CardTitle>
                <CardDescription>
                  Overview of online donations processed through Square
                </CardDescription>
              </div>
              <Button onClick={loadAnalytics} disabled={isLoadingAnalytics}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingAnalytics ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {analytics ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(analytics.totalAmount)}
                  </div>
                  <div className="text-sm text-gray-500">Total Amount</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {analytics.totalDonations}
                  </div>
                  <div className="text-sm text-gray-500">Total Donations</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {analytics.uniqueDonors}
                  </div>
                  <div className="text-sm text-gray-500">Unique Donors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(analytics.averageDonation)}
                  </div>
                  <div className="text-sm text-gray-500">Average Donation</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Info className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No analytics data available</p>
                <p className="text-sm">Click refresh to load recent donation data</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Create/Edit URL Dialog */}
      <Dialog open={isUrlDialogOpen} onOpenChange={setIsUrlDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingUrl ? 'Edit Donation URL' : 'Create Donation URL'}
            </DialogTitle>
            <DialogDescription>
              Configure a public donation page for your organization
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editingUrl ? handleUpdateUrl : handleCreateUrl}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="url_name">Name</Label>
                <Input
                  id="url_name"
                  value={urlForm.name}
                  onChange={(e) => setUrlForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="General Donations"
                  required
                />
              </div>
              <div>
                <Label htmlFor="url_description">Description</Label>
                <Textarea
                  id="url_description"
                  value={urlForm.description}
                  onChange={(e) => setUrlForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description for this donation page"
                />
              </div>
              <div>
                <Label htmlFor="url_campaign">Campaign (Optional)</Label>
                <Select
                  value={urlForm.campaign_id}
                  onValueChange={(value) => setUrlForm(prev => ({ ...prev, campaign_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Campaign</SelectItem>
                    {campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="url_message">Custom Message</Label>
                <Textarea
                  id="url_message"
                  value={urlForm.custom_message}
                  onChange={(e) => setUrlForm(prev => ({ ...prev, custom_message: e.target.value }))}
                  placeholder="Optional message to display on the donation page"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="url_active"
                  checked={urlForm.is_active}
                  onChange={(e) => setUrlForm(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="url_active">Active</Label>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => {
                setIsUrlDialogOpen(false);
                setEditingUrl(null);
                resetUrlForm();
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                {isSaving ? 'Saving...' : (editingUrl ? 'Update' : 'Create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Donation URL</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingUrl?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDeleteDialogOpen(false);
              setDeletingUrl(null);
            }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUrl}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View URL Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Donation URL Details</DialogTitle>
            <DialogDescription>
              View and share your donation URL
            </DialogDescription>
          </DialogHeader>
          {viewingUrl && (
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <p className="text-sm font-medium">{viewingUrl.name}</p>
              </div>
              {viewingUrl.description && (
                <div>
                  <Label>Description</Label>
                  <p className="text-sm text-gray-600">{viewingUrl.description}</p>
                </div>
              )}
              <div>
                <Label>URL</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    value={generateDonationUrl(window.location.origin, viewingUrl.slug)}
                    readOnly
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(generateDonationUrl(window.location.origin, viewingUrl.slug))}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => window.open(generateDonationUrl(window.location.origin, viewingUrl.slug), '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open URL
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const url = generateDonationUrl(window.location.origin, viewingUrl.slug);
                    if (navigator.share) {
                      navigator.share({
                        title: viewingUrl.name,
                        url: url
                      });
                    } else {
                      copyToClipboard(url);
                    }
                  }}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}