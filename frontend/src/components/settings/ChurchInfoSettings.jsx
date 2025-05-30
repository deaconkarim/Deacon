import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Building, Mail, Phone, Globe, MapPin, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient'; 

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
};

const ChurchInfoSettings = () => {
  const [churchSettings, setChurchSettings] = useState({
    name: 'Grace Community Church',
    email: 'info@gracecommunity.org',
    phone: '(555) 123-4567',
    website: 'www.gracecommunity.org',
    address: '123 Main Street, Anytown, USA 12345',
    pastor: 'Rev. John Smith'
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleChurchSettingsChange = (e) => {
    const { name, value } = e.target;
    setChurchSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveChurchSettings = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('church_settings')
      .upsert({ id: 1, ...churchSettings }, { onConflict: 'id' })
      .select();

    setIsLoading(false);
    if (error) {
      toast({
        title: "Error Saving Settings",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Settings Saved",
        description: "Church information has been updated successfully."
      });
      if (data && data.length > 0) {
        setChurchSettings(data[0]);
      }
    }
  };
  
  React.useEffect(() => {
    const fetchChurchSettings = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('church_settings')
        .select('*')
        .eq('id', 1)
        .single();
      setIsLoading(false);
      if (error && error.code !== 'PGRST116') { 
        console.error("Error fetching church settings:", error);
        toast({
          title: "Error Fetching Settings",
          description: "Could not load church settings. Using defaults.",
          variant: "destructive"
        });
      } else if (data) {
        setChurchSettings(data);
      }
    };
    fetchChurchSettings();
  }, [toast]);


  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <Card>
        <CardHeader>
          <CardTitle>Church Information</CardTitle>
          <CardDescription>Update your church's basic information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <motion.div variants={itemVariants} className="space-y-2">
            <Label htmlFor="church-name">Church Name</Label>
            <div className="flex items-center">
              <Building className="mr-2 h-4 w-4 text-muted-foreground" />
              <Input id="church-name" name="name" value={churchSettings.name} onChange={handleChurchSettingsChange} />
            </div>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="church-email">Email Address</Label>
              <div className="flex items-center">
                <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input id="church-email" name="email" type="email" value={churchSettings.email} onChange={handleChurchSettingsChange} />
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="church-phone">Phone Number</Label>
              <div className="flex items-center">
                <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input id="church-phone" name="phone" value={churchSettings.phone} onChange={handleChurchSettingsChange} />
              </div>
            </motion.div>
          </div>
          
          <motion.div variants={itemVariants} className="space-y-2">
            <Label htmlFor="church-website">Website</Label>
            <div className="flex items-center">
              <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
              <Input id="church-website" name="website" value={churchSettings.website} onChange={handleChurchSettingsChange} />
            </div>
          </motion.div>
          
          <motion.div variants={itemVariants} className="space-y-2">
            <Label htmlFor="church-address">Address</Label>
            <div className="flex items-center">
              <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
              <Input id="church-address" name="address" value={churchSettings.address} onChange={handleChurchSettingsChange} />
            </div>
          </motion.div>
          
          <motion.div variants={itemVariants} className="space-y-2">
            <Label htmlFor="church-pastor">Lead Pastor</Label>
            <div className="flex items-center">
              <User className="mr-2 h-4 w-4 text-muted-foreground" />
              <Input id="church-pastor" name="pastor" value={churchSettings.pastor} onChange={handleChurchSettingsChange} />
            </div>
          </motion.div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveChurchSettings} disabled={isLoading}>
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default ChurchInfoSettings;