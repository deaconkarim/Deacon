import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { userCacheService } from '../lib/userCache';
import { Search, QrCode, BarChart3, CheckCircle, XCircle, Users, Clock, AlertTriangle } from 'lucide-react';

export default function QuickCheckin({ selectedEvent, onCheckinComplete }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [guardians, setGuardians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recentCheckins, setRecentCheckins] = useState([]);
  const [scanMode, setScanMode] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const searchInputRef = useRef(null);
  const barcodeInputRef = useRef(null);

  // Get current user's organization ID
  const getCurrentUserOrganizationId = async () => {
    return await userCacheService.getCurrentUserOrganizationId();
  };

  // Fetch guardians for the selected child
  const fetchGuardians = async (childId) => {
    try {
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) return;

      const { data, error } = await supabase
        .from('child_guardians')
        .select(`
          *,
          guardian:guardian_id(*)
        `)
        .eq('child_id', childId)
        .eq('organization_id', organizationId);

      if (error) throw error;
      setGuardians(data);
    } catch (err) {
      console.error('Error fetching guardians:', err);
    }
  };

  // Search for children
  const searchChildren = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) return;

      const { data, error } = await supabase
        .from('members')
        .select('*, child_allergies(*), child_emergency_contacts(*)')
        .eq('member_type', 'child')
        .eq('organization_id', organizationId)
        .or(`firstname.ilike.%${query}%,lastname.ilike.%${query}%,id.eq.${query}`)
        .limit(10);

      if (error) throw error;

      // Process children data
      const processedChildren = data.map(child => ({
        ...child,
        has_allergies: child.child_allergies && child.child_allergies.length > 0,
        emergency_contacts: child.child_emergency_contacts || []
      }));

      setSearchResults(processedChildren);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle search input changes
  useEffect(() => {
    const timer = setTimeout(() => {
      searchChildren(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle barcode input
  const handleBarcodeInput = async (barcode) => {
    if (!barcode.trim()) return;

    try {
      setLoading(true);
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) return;

      // Search by ID first (assuming barcode contains child ID)
      const { data, error } = await supabase
        .from('members')
        .select('*, child_allergies(*), child_emergency_contacts(*)')
        .eq('member_type', 'child')
        .eq('organization_id', organizationId)
        .eq('id', barcode)
        .single();

      if (error) {
        // If not found by ID, try searching by name
        const { data: nameResults, error: nameError } = await supabase
          .from('members')
          .select('*, child_allergies(*), child_emergency_contacts(*)')
          .eq('member_type', 'child')
          .eq('organization_id', organizationId)
          .ilike('firstname', `%${barcode}%`)
          .limit(1)
          .single();

        if (nameError) {
          setError('Child not found');
          return;
        }
        data = nameResults;
      }

      if (data) {
        const processedChild = {
          ...data,
          has_allergies: data.child_allergies && data.child_allergies.length > 0,
          emergency_contacts: data.child_emergency_contacts || []
        };
        setSelectedChild(processedChild);
        await fetchGuardians(processedChild.id);
        setBarcodeInput('');
      }
    } catch (err) {
      setError('Child not found');
    } finally {
      setLoading(false);
    }
  };

  // Handle check-in
  const handleCheckin = async (childId, guardianId) => {
    if (!selectedEvent || !childId || !guardianId) return;

    try {
      setLoading(true);
      const organizationId = await getCurrentUserOrganizationId();
      if (!organizationId) return;

      // Create check-in log
      const { error: checkinError } = await supabase
        .from('child_checkin_logs')
        .insert([{
          child_id: childId,
          event_id: selectedEvent.id,
          checked_in_by: guardianId,
          organization_id: organizationId,
          check_in_time: new Date().toISOString(),
        }]);

      if (checkinError) throw checkinError;

      // Create event attendance record
      const { error: attendanceError } = await supabase
        .from('event_attendance')
        .insert([{
          event_id: selectedEvent.id,
          member_id: childId,
          organization_id: organizationId,
          status: 'checked-in'
        }]);

      if (attendanceError) throw attendanceError;

      // Add to recent check-ins
      const child = searchResults.find(c => c.id === childId) || selectedChild;
      const guardian = guardians.find(g => g.guardian_id === guardianId);
      
      setRecentCheckins(prev => [{
        id: Date.now(),
        child,
        guardian,
        timestamp: new Date(),
        event: selectedEvent
      }, ...prev.slice(0, 9)]);

      // Reset form
      setSelectedChild(null);
      setSearchResults([]);
      setSearchTerm('');
      setGuardians([]);

      // Notify parent component
      if (onCheckinComplete) {
        onCheckinComplete();
      }

      // Show success message
      setError(null);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Focus search input when pressing '/' key
      if (e.key === '/' && !scanMode) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      // Focus barcode input when pressing 'b' key
      if (e.key === 'b' && scanMode) {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      }

      // Escape to clear selection
      if (e.key === 'Escape') {
        setSelectedChild(null);
        setSearchResults([]);
        setSearchTerm('');
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [scanMode]);

  // Auto-focus search input
  useEffect(() => {
    if (!scanMode && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [scanMode]);

  return (
    <div className="bg-card p-6 rounded-lg border">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Quick Check-in</h2>
          <p className="text-muted-foreground">Fast check-in for individual children</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setScanMode(!scanMode)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              scanMode 
                ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/90'
            }`}
          >
            <QrCode className="h-4 w-4" />
            {scanMode ? 'Text Mode' : 'Scan Mode'}
          </button>
        </div>
      </div>

      {/* Mode Toggle */}
      {scanMode ? (
        <div className="mb-6">
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Barcode/QR Code Scanner
          </label>
          <div className="flex gap-2">
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="Scan barcode or enter child ID/name..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleBarcodeInput(barcodeInput)}
              className="flex-1 p-3 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
            <button
              onClick={() => handleBarcodeInput(barcodeInput)}
              disabled={!barcodeInput.trim() || loading}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press 'B' to focus scanner • Enter to search
          </p>
        </div>
      ) : (
        <div className="mb-6">
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Search Children
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Type child name or press '/' to search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press '/' to focus search • Escape to clear
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && !selectedChild && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-foreground mb-3">Search Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {searchResults.map(child => (
              <div
                key={child.id}
                className="border border-border p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                onClick={() => {
                  setSelectedChild(child);
                  fetchGuardians(child.id);
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-foreground">
                    {child.firstname} {child.lastname}
                  </h4>
                  {child.has_allergies && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                      Allergies
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {child.grade ? `Grade ${child.grade}` : ''} {child.birth_date ? `• ${new Date().getFullYear() - new Date(child.birth_date).getFullYear()} years` : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Child Check-in Form */}
      {selectedChild && (
        <div className="mb-6 p-4 border border-border rounded-lg bg-muted/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-foreground">
                {selectedChild.firstname} {selectedChild.lastname}
              </h3>
              <p className="text-sm text-muted-foreground">
                {selectedChild.grade ? `Grade ${selectedChild.grade}` : ''} {selectedChild.birth_date ? `• ${new Date().getFullYear() - new Date(selectedChild.birth_date).getFullYear()} years` : ''}
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedChild(null);
                setGuardians([]);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>

          {selectedChild.has_allergies && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">This child has allergies</span>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Check in with guardian:
            </label>
            <select
              className="w-full p-3 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              onChange={(e) => handleCheckin(selectedChild.id, e.target.value)}
            >
              <option value="">Select guardian</option>
              {guardians.map(guardian => (
                <option key={guardian.id} value={guardian.guardian_id}>
                  {guardian.guardian?.firstname || ''} {guardian.guardian?.lastname || ''}
                  {guardian.is_primary ? ' (Primary)' : ''}
                </option>
              ))}
            </select>
          </div>

          {guardians.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No guardians found for this child. Please add guardians in the child's profile.
            </p>
          )}
        </div>
      )}

      {/* Recent Check-ins */}
      {recentCheckins.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-foreground mb-3">Recent Check-ins</h3>
          <div className="space-y-2">
            {recentCheckins.map(checkin => (
              <div key={checkin.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-foreground">
                      {checkin.child.firstname} {checkin.child.lastname}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Checked in by {checkin.guardian?.guardian?.firstname || ''} {checkin.guardian?.guardian?.lastname || ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    {checkin.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {checkin.event.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-muted-foreground">Processing...</span>
        </div>
      )}
    </div>
  );
}