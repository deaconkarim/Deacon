import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { 
  QrCode, 
  Download, 
  Share2, 
  Copy, 
  CheckCircle,
  DollarSign,
  Heart,
  Building,
  Users,
  Target,
  Gift
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

const QRCodeGenerator = () => {
  const [qrData, setQrData] = useState({
    format: 'url',
    fund: 'general',
    notes: '',
    campaign: ''
  });
  const [generatedQR, setGeneratedQR] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const fundOptions = [
    { value: 'general', label: 'General Fund', icon: Heart, color: 'bg-blue-100 text-blue-800' },
    { value: 'tithes', label: 'Tithes', icon: Gift, color: 'bg-green-100 text-green-800' },
    { value: 'building', label: 'Building Fund', icon: Building, color: 'bg-purple-100 text-purple-800' },
    { value: 'missions', label: 'Missions', icon: Target, color: 'bg-orange-100 text-orange-800' },
    { value: 'youth', label: 'Youth Ministry', icon: Users, color: 'bg-pink-100 text-pink-800' }
  ];

  const generateQRCode = () => {
    let qrContent = '';

    switch (qrData.format) {
      case 'url':
        const baseUrl = `${window.location.origin}/donate`;
        const params = new URLSearchParams();
        if (qrData.fund) params.append('fund', qrData.fund);
        if (qrData.notes) params.append('notes', qrData.notes);
        if (qrData.campaign) params.append('campaign', qrData.campaign);
        qrContent = `${baseUrl}?${params.toString()}`;
        break;

      case 'json':
        qrContent = JSON.stringify({
          type: 'donation',
          fund: qrData.fund,
          notes: qrData.notes,
          campaign: qrData.campaign,
          timestamp: new Date().toISOString()
        });
        break;

      case 'text':
        qrContent = `Donation to ${fundOptions.find(f => f.value === qrData.fund)?.label || qrData.fund} fund`;
        if (qrData.notes) qrContent += ` - ${qrData.notes}`;
        if (qrData.campaign) qrContent += ` (Campaign: ${qrData.campaign})`;
        break;

      default:
        qrContent = '';
    }

    setGeneratedQR(qrContent);
  };

  const downloadQRCode = () => {
    const svg = document.querySelector('#qr-code svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `donation-qr-${qrData.fund}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedQR);
      setIsCopied(true);
      toast({
        title: "Copied to Clipboard",
        description: "QR code data has been copied to your clipboard",
        duration: 2000,
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const shareQRCode = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Church Donation QR Code',
          text: `Scan this QR code to donate to ${fundOptions.find(f => f.value === qrData.fund)?.label}`,
          url: generatedQR
        });
      } catch (error) {
        console.log('Share cancelled or failed');
      }
    } else {
      copyToClipboard();
    }
  };

  const getFundIcon = (fundValue) => {
    const fund = fundOptions.find(f => f.value === fundValue);
    return fund ? fund.icon : Heart;
  };

  const getFundColor = (fundValue) => {
    const fund = fundOptions.find(f => f.value === fundValue);
    return fund ? fund.color : 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <QrCode className="h-5 w-5 text-blue-600" />
            <span>Generate Donation QR Code</span>
          </CardTitle>
          <CardDescription>
            Create QR codes for different donation campaigns and funds. Members can scan these codes to quickly access the donation page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* QR Code Format */}
          <div className="space-y-2">
            <Label htmlFor="format">QR Code Format</Label>
            <Select
              value={qrData.format}
              onValueChange={(value) => setQrData(prev => ({ ...prev, format: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="url">
                  <div className="flex items-center space-x-2">
                    <span>🌐</span>
                    <span>Direct URL</span>
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center space-x-2">
                    <span>📄</span>
                    <span>JSON Data</span>
                  </div>
                </SelectItem>
                <SelectItem value="text">
                  <div className="flex items-center space-x-2">
                    <span>📝</span>
                    <span>Plain Text</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Fund Selection */}
          <div className="space-y-2">
            <Label htmlFor="fund">Fund Designation</Label>
            <Select
              value={qrData.fund}
              onValueChange={(value) => setQrData(prev => ({ ...prev, fund: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fundOptions.map((fund) => (
                  <SelectItem key={fund.value} value={fund.value}>
                    <div className="flex items-center space-x-2">
                      <fund.icon className="h-4 w-4" />
                      <span>{fund.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Campaign Name */}
          <div className="space-y-2">
            <Label htmlFor="campaign">Campaign Name (Optional)</Label>
            <Input
              id="campaign"
              placeholder="e.g., Building Fund Drive, Missions Trip"
              value={qrData.campaign}
              onChange={(e) => setQrData(prev => ({ ...prev, campaign: e.target.value }))}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any special instructions or campaign details..."
              value={qrData.notes}
              onChange={(e) => setQrData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Generate Button */}
          <Button 
            onClick={generateQRCode}
            className="w-full"
            size="lg"
          >
            <QrCode className="h-4 w-4 mr-2" />
            Generate QR Code
          </Button>
        </CardContent>
      </Card>

      {/* Generated QR Code */}
      {generatedQR && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <QrCode className="h-5 w-5 text-green-600" />
                <span>Generated QR Code</span>
              </CardTitle>
              <CardDescription>
                {qrData.format === 'url' && 'Scan this QR code to go directly to the donation page'}
                {qrData.format === 'json' && 'Scan this QR code to get donation data in JSON format'}
                {qrData.format === 'text' && 'Scan this QR code to get donation information as text'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* QR Code Display */}
              <div id="qr-code" className="flex justify-center p-6 bg-white rounded-lg border">
                <QRCodeSVG
                  value={generatedQR}
                  size={200}
                  level="M"
                  includeMargin={true}
                />
              </div>

              {/* QR Code Info */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Badge className={getFundColor(qrData.fund)}>
                    <getFundIcon fundValue={qrData.fund} className="h-3 w-3 mr-1" />
                    {fundOptions.find(f => f.value === qrData.fund)?.label}
                  </Badge>
                  {qrData.campaign && (
                    <Badge variant="outline">
                      {qrData.campaign}
                    </Badge>
                  )}
                </div>

                {qrData.notes && (
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <strong>Notes:</strong> {qrData.notes}
                  </div>
                )}

                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded font-mono break-all">
                  {generatedQR}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={downloadQRCode}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PNG
                </Button>
                
                <Button 
                  onClick={shareQRCode}
                  variant="outline"
                  size="sm"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                
                <Button 
                  onClick={copyToClipboard}
                  variant="outline"
                  size="sm"
                >
                  {isCopied ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Data
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default QRCodeGenerator;