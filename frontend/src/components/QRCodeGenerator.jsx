import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';
import { 
  QrCode, 
  X, 
  Download,
  Copy,
  Share2,
  Settings,
  DollarSign,
  Hash,
  Link
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

const QRCodeGenerator = ({ onClose }) => {
  const [qrData, setQrData] = useState({
    amount: '',
    fund_designation: 'general',
    campaign_id: '',
    notes: '',
    type: 'json' // 'json', 'url', 'text'
  });
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState('');
  const { toast } = useToast();

  const fundOptions = [
    { value: 'general', label: 'General Fund' },
    { value: 'tithes', label: 'Tithes' },
    { value: 'building', label: 'Building Fund' },
    { value: 'missions', label: 'Missions' },
    { value: 'youth', label: 'Youth Ministry' },
    { value: 'worship', label: 'Worship Ministry' },
    { value: 'outreach', label: 'Outreach' }
  ];

  const generateQRCode = async (data) => {
    setIsGenerating(true);
    try {
      let qrContent = '';
      
      switch (qrData.type) {
        case 'json':
          qrContent = JSON.stringify(data);
          break;
        case 'url':
          const baseUrl = window.location.origin;
          const params = new URLSearchParams({
            amount: data.amount,
            fund: data.fund_designation,
            ...(data.campaign_id && { campaign: data.campaign_id }),
            ...(data.notes && { notes: data.notes })
          });
          qrContent = `${baseUrl}/donate?${params.toString()}`;
          break;
        case 'text':
          qrContent = `Donation: $${data.amount} for ${data.fund_designation} fund`;
          if (data.notes) {
            qrContent += ` - ${data.notes}`;
          }
          break;
        default:
          qrContent = JSON.stringify(data);
      }

      setGeneratedData(qrContent);
      
      const qrCodeDataUrl = await QRCode.toDataURL(qrContent, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setQrCodeUrl(qrCodeDataUrl);
      
      toast({
        title: "QR Code Generated",
        description: "Your donation QR code is ready to use",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate QR code. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = () => {
    if (!qrData.amount || parseFloat(qrData.amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid donation amount",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    const data = {
      amount: parseFloat(qrData.amount),
      fund_designation: qrData.fund_designation,
      campaign_id: qrData.campaign_id || null,
      notes: qrData.notes || ''
    };

    generateQRCode(data);
  };

  const handleDownload = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.download = `donation-qr-${qrData.amount}-${qrData.fund_designation}.png`;
    link.href = qrCodeUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "QR Code Downloaded",
      description: "QR code has been saved to your device",
      duration: 2000,
    });
  };

  const handleCopyData = async () => {
    try {
      await navigator.clipboard.writeText(generatedData);
      toast({
        title: "Data Copied",
        description: "QR code data has been copied to clipboard",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy data to clipboard",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share && qrCodeUrl) {
      try {
        await navigator.share({
          title: 'Donation QR Code',
          text: `Scan this QR code to donate $${qrData.amount} to ${qrData.fund_designation} fund`,
          url: qrCodeUrl
        });
      } catch (error) {
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback to copy
      handleCopyData();
    }
  };

  const resetForm = () => {
    setQrData({
      amount: '',
      fund_designation: 'general',
      campaign_id: '',
      notes: '',
      type: 'json'
    });
    setQrCodeUrl('');
    setGeneratedData('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <QrCode className="h-5 w-5 text-blue-600" />
              <CardTitle>Generate Donation QR Code</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Create QR codes for easy donation collection
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Form Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Donation Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={qrData.amount}
                    onChange={(e) => setQrData({ ...qrData, amount: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fund">Fund Designation</Label>
                <Select
                  value={qrData.fund_designation}
                  onValueChange={(value) => setQrData({ ...qrData, fund_designation: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select fund" />
                  </SelectTrigger>
                  <SelectContent>
                    {fundOptions.map((fund) => (
                      <SelectItem key={fund.value} value={fund.value}>
                        {fund.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="campaign">Campaign ID (Optional)</Label>
                <Input
                  id="campaign"
                  placeholder="Campaign identifier"
                  value={qrData.campaign_id}
                  onChange={(e) => setQrData({ ...qrData, campaign_id: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes for the donation"
                  value={qrData.notes}
                  onChange={(e) => setQrData({ ...qrData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">QR Code Format</Label>
                <Select
                  value={qrData.type}
                  onValueChange={(value) => setQrData({ ...qrData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON Data</SelectItem>
                    <SelectItem value="url">Donation URL</SelectItem>
                    <SelectItem value="text">Plain Text</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={!qrData.amount || parseFloat(qrData.amount) <= 0 || isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <QrCode className="h-4 w-4 mr-2" />
                    Generate QR Code
                  </>
                )}
              </Button>
            </div>

            {/* QR Code Display Section */}
            <div className="space-y-4">
              {qrCodeUrl ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <div className="text-center">
                    <img 
                      src={qrCodeUrl} 
                      alt="Donation QR Code" 
                      className="mx-auto border rounded-lg shadow-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Amount:</span>
                      <Badge variant="secondary">${qrData.amount}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Fund:</span>
                      <Badge variant="outline">{qrData.fund_designation}</Badge>
                    </div>
                    {qrData.campaign_id && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Campaign:</span>
                        <span className="text-sm">{qrData.campaign_id}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Button onClick={handleDownload} variant="outline" className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button onClick={handleCopyData} variant="outline" className="flex-1">
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Data
                    </Button>
                    <Button onClick={handleShare} variant="outline" className="flex-1">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>

                  {generatedData && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Generated Data:</Label>
                      <div className="bg-gray-50 p-2 rounded text-xs font-mono break-all">
                        {generatedData}
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="text-center space-y-4 py-8">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <QrCode className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">
                    Fill in the donation details and click "Generate QR Code" to create a QR code
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-2 pt-4 border-t">
            <Button onClick={resetForm} variant="outline" className="flex-1">
              Reset Form
            </Button>
            <Button onClick={onClose} className="flex-1">
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default QRCodeGenerator;