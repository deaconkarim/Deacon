import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, startOfWeek, parseISO, isValid } from 'date-fns';
import { 
  Plus, 
  DollarSign,
  Download,
  Pencil,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { getDonations, addDonation, updateDonation, deleteDonation } from '@/lib/data';

export function Donations() {
  const [donations, setDonations] = useState([]);
  const [isAddDonationOpen, setIsAddDonationOpen] = useState(false);
  const [isEditDonationOpen, setIsEditDonationOpen] = useState(false);
  const [isDeleteDonationOpen, setIsDeleteDonationOpen] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [newDonation, setNewDonation] = useState({
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'weekly',
    notes: '',
    attendance: ''
  });
  const { toast } = useToast();
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      const data = await getDonations();
      setDonations(data || []);
    } catch (error) {
      console.error('Error fetching donations:', error);
      if (error.message === 'Failed to fetch') {
        toast({ 
          title: 'Offline Mode', 
          description: 'You are currently offline. Some features may be limited.', 
          variant: 'warning' 
        });
      } else {
        toast({ 
          title: 'Error', 
          description: 'Failed to fetch donations', 
          variant: 'destructive' 
        });
      }
    }
  };

  const getSundayDate = (dateString) => {
    const date = parseISO(dateString);
    if (!isValid(date)) {
      console.error('Invalid date:', dateString);
      return null;
    }
    const sunday = startOfWeek(date, { weekStartsOn: 0 }); // 0 = Sunday
    return {
      sunday: format(sunday, 'yyyy-MM-dd'),
      displayDate: format(sunday, 'MMM d, yyyy')
    };
  };

  const handleAddDonation = async (e) => {
    e.preventDefault();
    
    try {
      const donationData = {
        ...newDonation,
        attendance: newDonation.attendance ? parseInt(newDonation.attendance) : null
      };

      console.log('Adding donation with data:', donationData);
      const addedDonation = await addDonation(donationData);
      setDonations([addedDonation, ...donations]);
      setNewDonation({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        type: 'weekly',
        notes: '',
        attendance: ''
      });
      setIsAddDonationOpen(false);
      toast({
        title: "Success",
        description: "Donation added successfully.",
      });
    } catch (error) {
      console.error('Error adding donation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add donation.",
        variant: "destructive"
      });
    }
  };

  const handleEditDonation = (donation) => {
    setSelectedDonation(donation);
    setIsEditDonationOpen(true);
  };

  const handleDeleteDonation = (donation) => {
    setSelectedDonation(donation);
    setIsDeleteDonationOpen(true);
  };

  const handleUpdateDonation = async (e) => {
    e.preventDefault();
    try {
      if (!selectedDonation.date) {
        setError('Please select a date');
        return;
      }

      // Ensure attendance is a number
      const attendance = selectedDonation.attendance ? 
        (typeof selectedDonation.attendance === 'number' ? 
          selectedDonation.attendance : 
          parseInt(selectedDonation.attendance, 10)) : 
        null;

      console.log('Selected donation attendance:', selectedDonation.attendance);
      console.log('Processed attendance:', attendance);

      const updates = {
        amount: parseFloat(selectedDonation.amount),
        date: new Date(selectedDonation.date).toISOString(),
        type: selectedDonation.type,
        notes: selectedDonation.notes,
        attendance
      };

      console.log('Submitting update with data:', { id: selectedDonation.id, updates });

      const updatedDonation = await updateDonation(selectedDonation.id, updates);
      console.log('Update donation completed:', updatedDonation);

      if (!updatedDonation) {
        throw new Error('No data returned from update');
      }

      setDonations(prev => prev.map(d => 
        d.id === selectedDonation.id ? updatedDonation : d
      ));
      setIsEditDonationOpen(false);
      setSelectedDonation(null);
      setError('');
      toast({ title: 'Success', description: 'Donation updated successfully.' });
    } catch (error) {
      console.error('Error updating donation:', error);
      setError(error.message || 'Failed to update donation');
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to update donation', 
        variant: 'destructive' 
      });
    }
  };

  const handleConfirmDelete = async () => {
    try {
      const { error } = await deleteDonation(selectedDonation.id);

      if (error) throw error;

      setDonations(prev => prev.filter(d => d.id !== selectedDonation.id));
      setIsDeleteDonationOpen(false);
      setSelectedDonation(null);
      toast({ title: 'Success', description: 'Donation deleted successfully.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete donation.', variant: 'destructive' });
    }
  };

  const calculateTotalDonations = () => {
    return donations.reduce((total, donation) => total + parseFloat(donation.amount), 0);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Donations</h1>
        <p className="text-muted-foreground">
          Track and manage church donations.
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setIsAddDonationOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Donation
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Donations</CardTitle>
          <CardDescription>Complete donation history by Sunday</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {donations.map((donation) => {
              const dateInfo = getSundayDate(donation.date);
              if (!dateInfo) return null; // Skip invalid dates
              
              return (
                <div key={donation.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        {dateInfo.displayDate}
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        ${parseFloat(donation.amount).toFixed(2)}
                      </div>
                      {donation.attendance && (
                        <div className="text-sm text-muted-foreground">
                          Attendance: {donation.attendance} people
                        </div>
                      )}
                      {donation.notes && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {donation.notes}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditDonation(donation)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteDonation(donation)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
        <CardFooter className="border-t p-4 flex justify-between">
          <div className="text-sm text-muted-foreground">
            Total: ${calculateTotalDonations().toLocaleString()}
          </div>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </CardFooter>
      </Card>

      {/* Add Donation Dialog */}
      <Dialog open={isAddDonationOpen} onOpenChange={setIsAddDonationOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Donation</DialogTitle>
            <DialogDescription>
              Record a new donation. The donation will be recorded for the Sunday of the selected week.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($) *</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={newDonation.amount}
                  onChange={(e) => setNewDonation({...newDonation, amount: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={newDonation.date}
                  onChange={(e) => setNewDonation({...newDonation, date: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={newDonation.type}
                  onChange={(e) => setNewDonation({...newDonation, type: e.target.value})}
                >
                  <option value="weekly">Weekly</option>
                  <option value="special">Special</option>
                  <option value="building_fund">Building Fund</option>
                  <option value="missions">Missions</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="attendance">Attendance</Label>
                <Input
                  id="attendance"
                  type="number"
                  min="0"
                  value={newDonation.attendance}
                  onChange={(e) => setNewDonation({...newDonation, attendance: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={newDonation.notes}
                onChange={(e) => setNewDonation({...newDonation, notes: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDonationOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddDonation}>
              Add Donation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Donation Dialog */}
      <Dialog open={isEditDonationOpen} onOpenChange={setIsEditDonationOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Donation</DialogTitle>
            <DialogDescription>
              Update the donation details. The donation will be recorded for the Sunday of the selected week.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-amount">Amount ($) *</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={selectedDonation?.amount || ''}
                  onChange={(e) => setSelectedDonation({
                    ...selectedDonation,
                    amount: e.target.value
                  })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date *</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={selectedDonation?.date || ''}
                  onChange={(e) => setSelectedDonation({
                    ...selectedDonation,
                    date: e.target.value
                  })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-type">Type</Label>
                <select
                  id="edit-type"
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={selectedDonation?.type || 'weekly'}
                  onChange={(e) => setSelectedDonation({
                    ...selectedDonation,
                    type: e.target.value
                  })}
                >
                  <option value="weekly">Weekly</option>
                  <option value="special">Special</option>
                  <option value="building_fund">Building Fund</option>
                  <option value="missions">Missions</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-attendance">Attendance</Label>
                <Input
                  id="edit-attendance"
                  type="number"
                  min="0"
                  value={selectedDonation?.attendance || ''}
                  onChange={(e) => setSelectedDonation({
                    ...selectedDonation,
                    attendance: e.target.value
                  })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Input
                id="edit-notes"
                value={selectedDonation?.notes || ''}
                onChange={(e) => setSelectedDonation({
                  ...selectedDonation,
                  notes: e.target.value
                })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDonationOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateDonation}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDonationOpen} onOpenChange={setIsDeleteDonationOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Donation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this donation? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDonationOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
