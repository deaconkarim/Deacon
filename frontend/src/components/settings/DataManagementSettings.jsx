import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Upload, Trash2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
};

const DataManagementSettings = () => {
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleExportData = () => {
    const dataToExport = {};
    const keysToExport = ['members', 'events', 'donations', 'groups', 'sermons', 'externalEvents', 'financialSummary', 'attendance', 'church_settings'];
    keysToExport.forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        dataToExport[key] = JSON.parse(item);
      }
    });

    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `church_app_data_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Data Exported",
      description: "All application data has been exported successfully."
    });
  };
  
  const handleImportData = (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        Object.keys(importedData).forEach(key => {
          localStorage.setItem(key, JSON.stringify(importedData[key]));
        });
        toast({
          title: "Data Imported",
          description: "Application data has been imported successfully. Please refresh the page to see changes."
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Failed to parse JSON file. Please ensure it's a valid export.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };
  
  const handleResetData = () => {
    setIsResetDialogOpen(false);
    const keysToReset = ['members', 'events', 'donations', 'groups', 'sermons', 'externalEvents', 'financialSummary', 'attendance', 'church_settings'];
    keysToReset.forEach(key => {
      localStorage.removeItem(key);
    });
    
    toast({
      title: "Data Reset",
      description: "All application data has been reset. Please refresh the page.",
      variant: "destructive"
    });
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 }}}}
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Data Export & Import</CardTitle>
            <CardDescription>Export or import your church data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-base font-medium mb-1">Export Data</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Export all your application data (including local and cached external data) as a JSON file.
              </p>
              <Button onClick={handleExportData} className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Export All Data
              </Button>
            </div>
            
            <div className="border-t pt-6">
              <h3 className="text-base font-medium mb-1">Import Data</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Import church data from a JSON file. This will overwrite existing data.
              </p>
              <input 
                type="file" 
                id="import-file" 
                accept=".json" 
                onChange={handleImportData} 
                className="hidden" 
              />
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => document.getElementById('import-file').click()}>
                <Upload className="mr-2 h-4 w-4" />
                Import Data from File
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>Critical actions that may result in data loss.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-base font-medium text-destructive mb-1">Reset Application Data</h3>
              <p className="text-sm text-muted-foreground mb-2">
                This will clear all locally stored application data (members, events, donations, etc.). This action cannot be undone.
              </p>
              <Button 
                variant="destructive" 
                className="w-full sm:w-auto"
                onClick={() => setIsResetDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Reset All Application Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Data Reset</DialogTitle>
            <DialogDescription>
              Are you absolutely sure you want to reset all application data stored in your browser? This action is irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleResetData}>
              Yes, Reset Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default DataManagementSettings;