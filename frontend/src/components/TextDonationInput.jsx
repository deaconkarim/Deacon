import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Type, 
  X, 
  CheckCircle, 
  AlertCircle,
  Copy,
  Clipboard,
  DollarSign,
  Hash
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

const TextDonationInput = ({ onDonationSubmit, onClose }) => {
  const [inputText, setInputText] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const parseDonationText = (text) => {
    try {
      // Try to parse as JSON first
      if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
        return JSON.parse(text);
      }

      // Try to parse URL parameters
      if (text.includes('=') && (text.includes('amount') || text.includes('fund'))) {
        const urlParams = new URLSearchParams(text);
        return {
          amount: parseFloat(urlParams.get('amount')) || 0,
          fund_designation: urlParams.get('fund') || 'general',
          campaign_id: urlParams.get('campaign') || null,
          notes: urlParams.get('notes') || 'Text Input Donation'
        };
      }

      // Try to parse common formats
      const lines = text.split('\n').filter(line => line.trim());
      
      let amount = 0;
      let fund = 'general';
      let notes = '';
      let campaign = null;

      for (const line of lines) {
        const trimmed = line.trim().toLowerCase();
        
        // Look for amount patterns
        if (trimmed.includes('$') || trimmed.includes('amount')) {
          const amountMatch = trimmed.match(/\$?(\d+(?:\.\d{2})?)/);
          if (amountMatch) {
            amount = parseFloat(amountMatch[1]);
          }
        }
        
        // Look for fund designation
        if (trimmed.includes('fund') || trimmed.includes('designation')) {
          const fundMatch = trimmed.match(/(?:fund|designation)[:\s]+(\w+)/);
          if (fundMatch) {
            fund = fundMatch[1];
          }
        }
        
        // Look for notes
        if (trimmed.includes('note') || trimmed.includes('comment')) {
          const noteMatch = trimmed.match(/(?:note|comment)[:\s]+(.+)/);
          if (noteMatch) {
            notes = noteMatch[1];
          }
        }
        
        // Look for campaign
        if (trimmed.includes('campaign')) {
          const campaignMatch = trimmed.match(/campaign[:\s]+(.+)/);
          if (campaignMatch) {
            campaign = campaignMatch[1];
          }
        }
      }

      // If no amount found, try to parse the first number as amount
      if (amount === 0) {
        const numberMatch = text.match(/\$?(\d+(?:\.\d{2})?)/);
        if (numberMatch) {
          amount = parseFloat(numberMatch[1]);
        }
      }

      return {
        amount,
        fund_designation: fund,
        campaign_id: campaign,
        notes: notes || 'Text Input Donation'
      };
    } catch (error) {
      console.error('Error parsing donation text:', error);
      return null;
    }
  };

  const handleTextChange = (text) => {
    setInputText(text);
    
    if (text.trim()) {
      const parsed = parseDonationText(text);
      setParsedData(parsed);
    } else {
      setParsedData(null);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
      handleTextChange(text);
      
      toast({
        title: "Text Pasted",
        description: "Donation data has been pasted from clipboard",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "Paste Failed",
        description: "Unable to paste from clipboard. Please paste manually.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleSubmit = () => {
    if (!parsedData || !parsedData.amount || parsedData.amount <= 0) {
      toast({
        title: "Invalid Donation Data",
        description: "Please enter a valid donation amount",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate processing
    setTimeout(() => {
      if (onDonationSubmit) {
        onDonationSubmit(parsedData);
      }
      setIsProcessing(false);
    }, 500);
  };

  const handleClear = () => {
    setInputText('');
    setParsedData(null);
  };

  const getFundDesignationColor = (fund) => {
    const colors = {
      general: 'bg-blue-100 text-blue-800',
      tithes: 'bg-green-100 text-green-800',
      building: 'bg-purple-100 text-purple-800',
      missions: 'bg-orange-100 text-orange-800',
      youth: 'bg-pink-100 text-pink-800',
      default: 'bg-gray-100 text-gray-800'
    };
    return colors[fund] || colors.default;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <Card className="w-full max-w-lg mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Type className="h-5 w-5 text-blue-600" />
              <CardTitle>Enter Donation Data</CardTitle>
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
            Paste or type donation information from text, email, or other sources
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="donation-text">Donation Data</Label>
            <div className="relative">
              <Textarea
                id="donation-text"
                placeholder="Paste donation data here...&#10;Examples:&#10;$50.00 for general fund&#10;{&quot;amount&quot;: 100, &quot;fund&quot;: &quot;missions&quot;}&#10;amount=75&fund=tithes&notes=Sunday offering"
                value={inputText}
                onChange={(e) => handleTextChange(e.target.value)}
                className="min-h-[120px] resize-none"
              />
              <div className="absolute top-2 right-2 flex space-x-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handlePaste}
                  className="h-6 w-6 p-0"
                  title="Paste from clipboard"
                >
                  <Clipboard className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleClear}
                  className="h-6 w-6 p-0"
                  title="Clear text"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {parsedData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                {parsedData.amount > 0 ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm font-medium">
                  {parsedData.amount > 0 ? 'Data Parsed Successfully' : 'Invalid Amount'}
                </span>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Amount:</span>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className={`font-medium ${parsedData.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {parsedData.amount > 0 ? parsedData.amount.toFixed(2) : 'Invalid'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Fund:</span>
                  <Badge className={getFundDesignationColor(parsedData.fund_designation)}>
                    {parsedData.fund_designation}
                  </Badge>
                </div>

                {parsedData.campaign_id && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Campaign:</span>
                    <span className="text-sm font-medium">{parsedData.campaign_id}</span>
                  </div>
                )}

                {parsedData.notes && (
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-gray-600">Notes:</span>
                    <span className="text-sm text-gray-700 max-w-[200px] text-right">
                      {parsedData.notes}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {inputText && !parsedData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-lg p-3"
            >
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-800">
                  Unable to parse donation data. Please check the format.
                </span>
              </div>
            </motion.div>
          )}

          <div className="flex space-x-2 pt-2">
            <Button 
              onClick={handleSubmit} 
              disabled={!parsedData || !parsedData.amount || parsedData.amount <= 0 || isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Use This Data
                </>
              )}
            </Button>
            <Button onClick={onClose} variant="outline">
              Cancel
            </Button>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p className="font-medium">Supported Formats:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>JSON: <code>{'{"amount": 50, "fund": "general"}'}</code></li>
              <li>URL Parameters: amount=50&amp;fund=missions</li>
              <li>Plain Text: $50.00 for general fund</li>
              <li>Email/Text: Any text containing amounts and fund info</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TextDonationInput;