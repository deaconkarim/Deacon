import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { motion } from 'framer-motion';
import { 
  QrCode, 
  Camera, 
  X, 
  CheckCircle, 
  AlertCircle,
  RotateCcw,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

const QRCodeScanner = ({ onScanSuccess, onScanError, onClose }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanner, setScanner] = useState(null);
  const [lastScannedData, setLastScannedData] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const scannerRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, [scanner]);

  const startScanner = () => {
    if (scanner) {
      scanner.clear();
    }

    const newScanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
      },
      false
    );

    newScanner.render(
      (decodedText, decodedResult) => {
        handleScanSuccess(decodedText, decodedResult);
      },
      (errorMessage) => {
        // Handle scan error silently
        console.log('Scan error:', errorMessage);
      }
    );

    setScanner(newScanner);
    setIsScanning(true);
  };

  const stopScanner = () => {
    if (scanner) {
      scanner.clear();
      setScanner(null);
    }
    setIsScanning(false);
  };

  const handleScanSuccess = (decodedText, decodedResult) => {
    try {
      // Try to parse the scanned data
      let donationData;
      
      // Check if it's a JSON string
      if (decodedText.startsWith('{') || decodedText.startsWith('[')) {
        donationData = JSON.parse(decodedText);
      } else {
        // Check if it's a donation URL
        if (decodedText.includes('donation') || decodedText.includes('give')) {
          // Extract donation parameters from URL
          const url = new URL(decodedText);
          donationData = {
            amount: url.searchParams.get('amount'),
            fund_designation: url.searchParams.get('fund') || 'general',
            campaign_id: url.searchParams.get('campaign'),
            notes: url.searchParams.get('notes') || 'QR Code Donation'
          };
        } else {
          // Treat as plain text (could be amount)
          donationData = {
            amount: parseFloat(decodedText) || 0,
            fund_designation: 'general',
            notes: 'QR Code Donation'
          };
        }
      }

      // Validate the donation data
      if (!donationData.amount || donationData.amount <= 0) {
        throw new Error('Invalid donation amount');
      }

      setLastScannedData(donationData);
      setScanHistory(prev => [...prev, { 
        data: donationData, 
        timestamp: new Date().toISOString(),
        raw: decodedText 
      }]);

      toast({
        title: "QR Code Scanned Successfully",
        description: `Amount: $${donationData.amount}`,
        duration: 3000,
      });

      // Call the success callback
      if (onScanSuccess) {
        onScanSuccess(donationData);
      }

      // Stop scanning after successful scan
      stopScanner();

    } catch (error) {
      console.error('Error parsing QR code data:', error);
      
      toast({
        title: "Invalid QR Code",
        description: "The scanned QR code doesn't contain valid donation data.",
        variant: "destructive",
        duration: 3000,
      });

      if (onScanError) {
        onScanError(error);
      }
    }
  };

  const handleRetry = () => {
    setLastScannedData(null);
    startScanner();
  };

  const handleUseLastScanned = () => {
    if (lastScannedData && onScanSuccess) {
      onScanSuccess(lastScannedData);
    }
  };

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
              <QrCode className="h-5 w-5 text-blue-600" />
              <CardTitle>Scan QR Code</CardTitle>
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
            Point your camera at a donation QR code to scan
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {!isScanning && !lastScannedData && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Camera className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600">
                Click start to begin scanning
              </p>
              <Button onClick={startScanner} className="w-full">
                <Camera className="h-4 w-4 mr-2" />
                Start Scanner
              </Button>
            </div>
          )}

          {isScanning && (
            <div className="space-y-4">
              <div className="relative">
                <div id="qr-reader" className="w-full"></div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-64 border-2 border-blue-500 rounded-lg">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-500"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-500"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-500"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-500"></div>
                  </div>
                </div>
              </div>
              <Button 
                onClick={stopScanner} 
                variant="outline" 
                className="w-full"
              >
                Stop Scanner
              </Button>
            </div>
          )}

          {lastScannedData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">Scan Successful!</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium">${lastScannedData.amount}</span>
                  </div>
                  {lastScannedData.fund_designation && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fund:</span>
                      <Badge variant="secondary">{lastScannedData.fund_designation}</Badge>
                    </div>
                  )}
                  {lastScannedData.notes && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Notes:</span>
                      <span className="text-sm">{lastScannedData.notes}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={handleUseLastScanned} className="flex-1">
                  Use This Data
                </Button>
                <Button onClick={handleRetry} variant="outline">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {scanHistory.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Recent Scans</h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {scanHistory.slice(-3).reverse().map((scan, index) => (
                  <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                    <div className="flex justify-between">
                      <span>${scan.data.amount}</span>
                      <span className="text-gray-500">
                        {new Date(scan.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default QRCodeScanner;