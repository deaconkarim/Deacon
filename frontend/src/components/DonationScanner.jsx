import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  QrCode, 
  Type, 
  X, 
  Camera,
  Smartphone,
  DollarSign,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import QRCodeScanner from './QRCodeScanner';
import TextDonationInput from './TextDonationInput';
import QRCodeGenerator from './QRCodeGenerator';

const DonationScanner = ({ onDonationSubmit, onClose }) => {
  const [activeMode, setActiveMode] = useState(null); // 'scan', 'text', 'generate'
  const [scannedDonation, setScannedDonation] = useState(null);
  const { toast } = useToast();

  const handleScanSuccess = (donationData) => {
    setScannedDonation(donationData);
    setActiveMode(null);
    
    toast({
      title: "Donation Data Captured",
      description: `Amount: $${donationData.amount} - ${donationData.fund_designation} fund`,
      duration: 3000,
    });
  };

  const handleTextSubmit = (donationData) => {
    setScannedDonation(donationData);
    setActiveMode(null);
    
    toast({
      title: "Donation Data Captured",
      description: `Amount: $${donationData.amount} - ${donationData.fund_designation} fund`,
      duration: 3000,
    });
  };

  const handleUseDonation = () => {
    if (scannedDonation && onDonationSubmit) {
      onDonationSubmit(scannedDonation);
      setScannedDonation(null);
    }
  };

  const handleDiscardDonation = () => {
    setScannedDonation(null);
  };

  const handleBackToMain = () => {
    setActiveMode(null);
    setScannedDonation(null);
  };

  const scanningModes = [
    {
      id: 'scan',
      title: 'Scan QR Code',
      description: 'Use camera to scan donation QR codes',
      icon: QrCode,
      color: 'bg-blue-500',
      action: () => setActiveMode('scan')
    },
    {
      id: 'text',
      title: 'Enter Text',
      description: 'Paste or type donation information',
      icon: Type,
      color: 'bg-green-500',
      action: () => setActiveMode('text')
    },
    {
      id: 'generate',
      title: 'Generate QR Code',
      description: 'Create QR codes for donations',
      icon: Camera,
      color: 'bg-purple-500',
      action: () => setActiveMode('generate')
    }
  ];

  if (activeMode === 'scan') {
    return (
      <QRCodeScanner
        onScanSuccess={handleScanSuccess}
        onScanError={(error) => {
          toast({
            title: "Scan Error",
            description: error.message || "Failed to scan QR code",
            variant: "destructive",
            duration: 3000,
          });
        }}
        onClose={handleBackToMain}
      />
    );
  }

  if (activeMode === 'text') {
    return (
      <TextDonationInput
        onDonationSubmit={handleTextSubmit}
        onClose={handleBackToMain}
      />
    );
  }

  if (activeMode === 'generate') {
    return (
      <QRCodeGenerator
        onClose={handleBackToMain}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Smartphone className="h-5 w-5 text-blue-600" />
              <CardTitle>Donation Scanner</CardTitle>
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
            Choose how you'd like to capture donation data
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {scannedDonation ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">Donation Data Ready</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Amount:</span>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-green-600">
                        ${scannedDonation.amount}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Fund:</span>
                    <Badge variant="secondary">{scannedDonation.fund_designation}</Badge>
                  </div>
                  
                  {scannedDonation.campaign_id && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Campaign:</span>
                      <span className="text-sm font-medium">{scannedDonation.campaign_id}</span>
                    </div>
                  )}
                  
                  {scannedDonation.notes && (
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600">Notes:</span>
                      <span className="text-sm text-gray-700 max-w-[150px] text-right">
                        {scannedDonation.notes}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleUseDonation} className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Use This Data
                </Button>
                <Button onClick={handleDiscardDonation} variant="outline">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {scanningModes.map((mode) => (
                <motion.div
                  key={mode.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={mode.action}
                    variant="outline"
                    className="w-full h-auto p-4 justify-start"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg ${mode.color} flex items-center justify-center`}>
                        <mode.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{mode.title}</div>
                        <div className="text-xs text-gray-500">{mode.description}</div>
                      </div>
                    </div>
                  </Button>
                </motion.div>
              ))}
            </div>
          )}

          <div className="text-xs text-gray-500 space-y-1 pt-4 border-t">
            <p className="font-medium">Supported Formats:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>QR codes with JSON donation data</li>
              <li>QR codes with donation URLs</li>
              <li>Text with amounts and fund info</li>
              <li>Email/text containing donation details</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DonationScanner;