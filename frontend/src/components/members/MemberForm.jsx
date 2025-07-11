import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, X, Plus, Trash2, User, Baby, Heart, Church, Phone, Mail, Tag, FileText, Shield, Calendar, MapPin, Crown, Users } from 'lucide-react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { familyService } from '@/lib/familyService';

function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

const MemberForm = ({ initialData, onSave, onCancel }) => {
  const [memberData, setMemberData] = useState({
    ...initialData,
    firstname: initialData.firstname || '',
    lastname: initialData.lastname || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
    status: initialData.status || 'active',
    image_url: initialData.image_url || '',
    member_type: initialData.member_type || 'adult',
    birth_date: initialData.birth_date || '',
    gender: initialData.gender || 'male',
    join_date: initialData.join_date || '',
    anniversary_date: initialData.anniversary_date || '',
    spouse_name: initialData.spouse_name || '',
    has_children: initialData.has_children || false,
    marital_status: initialData.marital_status || 'single',
    occupation: initialData.occupation || '',
    address: initialData.address || {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: ''
    },
    emergency_contact: initialData.emergency_contact || {
      name: '',
      phone: '',
      relationship: ''
    },
    notes: initialData.notes || '',
    last_attendance_date: initialData.last_attendance_date || '',
    attendance_frequency: initialData.attendance_frequency || 'regular',
    ministry_involvement: initialData.ministry_involvement || [],
    communication_preferences: initialData.communication_preferences || {
      sms: true,
      email: true,
      mail: false
    },
    tags: initialData.tags || []
  });
  
  const [isUploading, setIsUploading] = useState(false);
  const [crop, setCrop] = useState();
  const [imgSrc, setImgSrc] = useState('');
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [familyAddresses, setFamilyAddresses] = useState([]);
  const [isLoadingFamilyAddresses, setIsLoadingFamilyAddresses] = useState(false);
  const [guardians, setGuardians] = useState([]);
  const [guardianIds, setGuardianIds] = useState([]);
  const [guardianRelationships, setGuardianRelationships] = useState({});
  const imgRef = useRef(null);
  const { toast } = useToast();

  // Update memberData when initialData changes (for edit mode)
  useEffect(() => {
    const updatedMemberData = {
      ...initialData,
      firstname: initialData.firstname || '',
      lastname: initialData.lastname || '',
      email: initialData.email || '',
      phone: initialData.phone || '',
      status: initialData.status || 'active',
      image_url: initialData.image_url || '',
      member_type: initialData.member_type || 'adult',
      birth_date: initialData.birth_date || '',
      gender: initialData.gender || 'male',
      join_date: initialData.join_date || '',
      anniversary_date: initialData.anniversary_date || '',
      spouse_name: initialData.spouse_name || '',
      has_children: initialData.has_children || false,
      marital_status: initialData.marital_status || 'single',
      occupation: initialData.occupation || '',
      address: initialData.address || {
        street: '',
        city: '',
        state: '',
        zip: '',
        country: ''
      },
      emergency_contact: initialData.emergency_contact || {
        name: '',
        phone: '',
        relationship: ''
      },
      notes: initialData.notes || '',
      last_attendance_date: initialData.last_attendance_date || '',
      attendance_frequency: initialData.attendance_frequency || 'regular',
      ministry_involvement: initialData.ministry_involvement || [],
      communication_preferences: initialData.communication_preferences || {
        sms: true,
        email: true,
        mail: false
      },
      tags: initialData.tags || []
    };
    setMemberData(updatedMemberData);
  }, [initialData]);

  // Load family addresses when member type changes to child or when member has family_id
  useEffect(() => {
    const loadFamilyAddresses = async () => {
      if (memberData.member_type === 'child' || initialData.family_id) {
        setIsLoadingFamilyAddresses(true);
        try {
          const families = await familyService.getFamilies();
          const addresses = [];
          
          families.forEach(family => {
            if (family.members && family.members.length > 0) {
              family.members.forEach(member => {
                if (member.address && member.address.street) {
                  addresses.push({
                    familyName: family.family_name,
                    memberName: `${member.firstname} ${member.lastname}`,
                    address: member.address
                  });
                }
              });
            }
          });
          
          setFamilyAddresses(addresses);
        } catch (error) {
          console.error('Error loading family addresses:', error);
        } finally {
          setIsLoadingFamilyAddresses(false);
        }
      }
    };

    loadFamilyAddresses();
  }, [memberData.member_type, initialData.family_id]);

  // Load guardians when member is a child
  useEffect(() => {
    const loadGuardians = async () => {
      if (memberData.member_type === 'child') {
        try {
          // Load potential guardians (adult members)
          const { data: guardiansData, error: guardiansError } = await supabase
            .from('members')
            .select('*')
            .eq('member_type', 'adult')
            .order('firstname');

          if (guardiansError) throw guardiansError;
          setGuardians(guardiansData);

          // If editing an existing child, load their guardian relationships
          if (initialData.id) {
            const { data: relationshipsData, error: relationshipsError } = await supabase
              .from('child_guardians')
              .select('guardian_id, relationship')
              .eq('child_id', initialData.id);

            if (relationshipsError) {
              console.error('Error loading guardian relationships:', relationshipsError);
            } else if (relationshipsData && relationshipsData.length > 0) {
              const existingGuardianIds = relationshipsData.map(r => r.guardian_id);
              const existingRelationships = {};
              
              relationshipsData.forEach(r => {
                existingRelationships[r.guardian_id] = r.relationship;
              });

              setGuardianIds(existingGuardianIds);
              setGuardianRelationships(existingRelationships);
            }
          }
        } catch (error) {
          console.error('Error loading guardians:', error);
        }
      }
    };

    loadGuardians();
  }, [memberData.member_type, initialData.id]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setMemberData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddressChange = (field, value) => {
    setMemberData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  };

  const handleEmergencyContactChange = (field, value) => {
    setMemberData(prev => ({
      ...prev,
      emergency_contact: {
        ...prev.emergency_contact,
        [field]: value
      }
    }));
  };

  const handleCommunicationPreferenceChange = (preference, value) => {
    setMemberData(prev => ({
      ...prev,
      communication_preferences: {
        ...prev.communication_preferences,
        [preference]: value
      }
    }));
  };

  const handleGuardianChange = (e) => {
    const options = e.target.options;
    const selectedIds = [];
    const relationships = { ...guardianRelationships };
    
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        const guardianId = options[i].value;
        selectedIds.push(guardianId);
        // Initialize relationship if not already set
        if (!relationships[guardianId]) {
          relationships[guardianId] = '';
        }
      } else {
        // Remove relationship if guardian is deselected
        delete relationships[options[i].value];
      }
    }
    
    setGuardianIds(selectedIds);
    setGuardianRelationships(relationships);
  };

  const handleRelationshipChange = (guardianId, relationship) => {
    setGuardianRelationships(prev => ({
      ...prev,
      [guardianId]: relationship
    }));
  };

  const useFamilyAddress = (address) => {
    setMemberData(prev => ({
      ...prev,
      address: { ...address }
    }));
    toast({
      title: "Address Applied",
      description: `Using address from ${address.memberName} in ${address.familyName} family`
    });
  };

  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImgSrc(reader.result?.toString() || '');
        setShowCropDialog(true);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  };

  async function getCroppedImg(src, pixelCrop) {
    const image = new Image();
    image.src = src;

    return new Promise((resolve) => {
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set canvas size to the desired crop size
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        // Draw the cropped image
        ctx.drawImage(
          image,
          pixelCrop.x,
          pixelCrop.y,
          pixelCrop.width,
          pixelCrop.height,
          0,
          0,
          pixelCrop.width,
          pixelCrop.height
        );

        // Convert canvas to blob
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.95);
      };
    });
  }

  const handleCropComplete = async () => {
    if (!imgRef.current || !crop) return;

    try {
      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      const pixelCrop = {
        x: Math.round(crop.x * scaleX),
        y: Math.round(crop.y * scaleY),
        width: Math.round(crop.width * scaleX),
        height: Math.round(crop.height * scaleY)
      };

      const croppedImageBlob = await getCroppedImg(imgRef.current.src, pixelCrop);
      if (!croppedImageBlob) return;

      setIsUploading(true);
      
      // Create a unique file name
      const fileName = `${Math.random().toString(36).substring(2)}.jpg`;
      
      // Convert blob to File object
      const imageFile = new File([croppedImageBlob], fileName, { type: 'image/jpeg' });

      console.log('Attempting to upload to bucket: members');
      console.log('File name:', fileName);
      console.log('File type:', imageFile.type);
      console.log('File size:', imageFile.size);

      // Upload image to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('members')
        .upload(fileName, imageFile, {
          contentType: 'image/jpeg',
          upsert: true,
          cacheControl: '3600'
        });

      if (uploadError) {
        console.error('Detailed upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', uploadData);

      // Get public URL
      const { data: urlData, error: urlError } = await supabase.storage
        .from('members')
        .getPublicUrl(fileName);

      if (urlError) {
        console.error('Error getting public URL:', urlError);
        throw urlError;
      }

      console.log('Got public URL:', urlData);

      // Update member data with new image URL
      setMemberData(prev => ({
        ...prev,
        image_url: urlData.publicUrl
      }));

      toast({
        title: "Success",
        description: "Image uploaded successfully."
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setShowCropDialog(false);
      setImgSrc('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!memberData.firstname || !memberData.lastname) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    // Convert empty strings to null for optional fields
    const dataToSave = {
      ...memberData,
      email: memberData.email?.trim() || null,
      phone: memberData.phone?.trim() || null,
      birth_date: memberData.birth_date || null,
      anniversary_date: memberData.anniversary_date || null,
      last_attendance_date: memberData.last_attendance_date || null,
      join_date: memberData.join_date || null
    };

    // Remove guardian data from member data (we'll handle it separately)
    delete dataToSave.guardian_ids;
    delete dataToSave.guardian_relationships;

    try {
      // Save the member data first
      const savedMember = await onSave(dataToSave);

      // Handle guardian relationships for children
      if (isChild && savedMember) {
        const childId = savedMember.id || initialData.id;
        
        if (childId) {
          // Delete existing guardian relationships
          await supabase
            .from('child_guardians')
            .delete()
            .eq('child_id', childId);

          // Insert new guardian relationships
          if (guardianIds.length > 0) {
            const guardianRelationshipsToInsert = guardianIds.map(guardianId => ({
              child_id: childId,
              guardian_id: guardianId,
              relationship: guardianRelationships[guardianId] || 'Parent'
            }));

            const { error: guardianError } = await supabase
              .from('child_guardians')
              .insert(guardianRelationshipsToInsert);

            if (guardianError) {
              console.error('Error saving guardian relationships:', guardianError);
              toast({
                title: "Warning",
                description: "Member saved but guardian relationships could not be updated",
                variant: "destructive"
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error saving member:', error);
      toast({
        title: "Error",
        description: "Failed to save member",
        variant: "destructive"
      });
    }
  };

  // Check if member is a child
  const isChild = memberData.member_type === 'child';

  return (
    <>
      <form onSubmit={handleSubmit} className="h-full flex flex-col">
        {/* Profile Image Section */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800 shadow-lg mb-6">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center gap-2 text-blue-900 dark:text-blue-100 text-lg">
              {isChild ? <Baby className="h-5 w-5" /> : <User className="h-5 w-5" />}
              Profile Photo
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Avatar className="h-32 w-32 border-4 border-white dark:border-gray-800 shadow-xl">
              <AvatarImage src={memberData.image_url} />
              <AvatarFallback className="text-2xl font-semibold bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                {memberData.firstname?.charAt(0)}{memberData.lastname?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-center gap-2">
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={onSelectFile}
                className="hidden"
              />
              <Button 
                type="button" 
                variant="outline" 
                disabled={isUploading}
                onClick={() => document.getElementById('image').click()}
                className="bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-950 border-blue-300 dark:border-blue-700 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Upload className="mr-2 h-4 w-4" />
                {isUploading ? 'Uploading...' : 'Upload Photo'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Form Sections */}
        <Tabs defaultValue="basic" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 rounded-xl mb-6">
            <TabsTrigger value="basic" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <User className="h-4 w-4 mr-2" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="contact" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Phone className="h-4 w-4 mr-2" />
              Contact
            </TabsTrigger>
            <TabsTrigger value="family" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Heart className="h-4 w-4 mr-2" />
              Family
            </TabsTrigger>
            <TabsTrigger value="additional" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <FileText className="h-4 w-4 mr-2" />
              Additional
            </TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="flex-1 space-y-6 overflow-y-auto pr-2">
            <Card className="border-l-4 border-l-blue-500 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              {isChild ? <Baby className="h-5 w-5" /> : <User className="h-5 w-5" />}
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstname" className="text-sm font-medium">First Name *</Label>
                <Input
                  id="firstname"
                  name="firstname"
                  value={memberData.firstname}
                  onChange={handleFormChange}
                  required
                  className="border-gray-300 dark:border-gray-600 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastname" className="text-sm font-medium">Last Name *</Label>
                <Input
                  id="lastname"
                  name="lastname"
                  value={memberData.lastname}
                  onChange={handleFormChange}
                  required
                  className="border-gray-300 dark:border-gray-600 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="member_type" className="text-sm font-medium">Member Type</Label>
                <Select
                  value={memberData.member_type}
                  onValueChange={(value) => setMemberData(prev => ({ ...prev, member_type: value }))}
                >
                  <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-blue-500">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adult" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Adult
                    </SelectItem>
                    <SelectItem value="child" className="flex items-center gap-2">
                      <Baby className="h-4 w-4" />
                      Child
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender" className="text-sm font-medium">Gender</Label>
                <Select
                  value={memberData.gender}
                  onValueChange={(value) => setMemberData(prev => ({ ...prev, gender: value }))}
                >
                  <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-blue-500">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                <Select
                  value={memberData.status}
                  onValueChange={(value) => setMemberData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-blue-500">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="visitor">Visitor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Email and Phone - Only for Adults */}
            {!isChild && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={memberData.email}
                    onChange={handleFormChange}
                    className="border-gray-300 dark:border-gray-600 focus:border-blue-500"
                    placeholder="member@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={memberData.phone}
                    onChange={handleFormChange}
                    className="border-gray-300 dark:border-gray-600 focus:border-blue-500"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
            )}

            {/* Occupation - Only for Adults */}
            {!isChild && (
              <div className="space-y-2">
                <Label htmlFor="occupation" className="text-sm font-medium">Occupation</Label>
                <Input
                  id="occupation"
                  name="occupation"
                  value={memberData.occupation}
                  onChange={handleFormChange}
                  placeholder="e.g., Teacher, Engineer, Student"
                  className="border-gray-300 dark:border-gray-600 focus:border-blue-500"
                />
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          {/* Contact Information Tab */}
          <TabsContent value="contact" className="flex-1 space-y-6 overflow-y-auto pr-2">
            {/* Email and Phone - Only for Adults */}
            {!isChild && (
              <Card className="border-l-4 border-l-green-500 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
                    <Phone className="h-5 w-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={memberData.email}
                        onChange={handleFormChange}
                        className="border-gray-300 dark:border-gray-600 focus:border-green-500"
                        placeholder="member@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={memberData.phone}
                        onChange={handleFormChange}
                        className="border-gray-300 dark:border-gray-600 focus:border-green-500"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Address Information */}
            <Card className="border-l-4 border-l-indigo-500 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-900 dark:text-indigo-100">
              <MapPin className="h-5 w-5" />
              Address Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Family Address Suggestions for Children */}
            {isChild && familyAddresses.length > 0 && (
              <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4 text-indigo-600" />
                  <Label className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                    Family Address Suggestions
                  </Label>
                </div>
                <div className="space-y-2">
                  {familyAddresses.slice(0, 3).map((familyAddr, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                      <div className="text-sm">
                        <div className="font-medium">{familyAddr.memberName}</div>
                        <div className="text-gray-600 dark:text-gray-400">
                          {familyAddr.address.street}, {familyAddr.address.city}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => useFamilyAddress(familyAddr.address)}
                        className="text-indigo-600 border-indigo-300 hover:bg-indigo-50"
                      >
                        Use Address
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="address_street" className="text-sm font-medium">Street Address</Label>
              <Input
                id="address_street"
                value={memberData.address.street}
                onChange={(e) => handleAddressChange('street', e.target.value)}
                placeholder="123 Main Street"
                className="border-gray-300 dark:border-gray-600 focus:border-indigo-500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address_city" className="text-sm font-medium">City</Label>
                <Input
                  id="address_city"
                  value={memberData.address.city}
                  onChange={(e) => handleAddressChange('city', e.target.value)}
                  placeholder="City"
                  className="border-gray-300 dark:border-gray-600 focus:border-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_state" className="text-sm font-medium">State</Label>
                <Input
                  id="address_state"
                  value={memberData.address.state}
                  onChange={(e) => handleAddressChange('state', e.target.value)}
                  placeholder="State"
                  className="border-gray-300 dark:border-gray-600 focus:border-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_zip" className="text-sm font-medium">ZIP Code</Label>
                <Input
                  id="address_zip"
                  value={memberData.address.zip}
                  onChange={(e) => handleAddressChange('zip', e.target.value)}
                  placeholder="12345"
                  className="border-gray-300 dark:border-gray-600 focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address_country" className="text-sm font-medium">Country</Label>
              <Input
                id="address_country"
                value={memberData.address.country}
                onChange={(e) => handleAddressChange('country', e.target.value)}
                placeholder="Country"
                className="border-gray-300 dark:border-gray-600 focus:border-indigo-500"
              />
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          {/* Family Information Tab */}
          <TabsContent value="family" className="flex-1 space-y-6 overflow-y-auto pr-2">
            {/* Personal Information */}
            <Card className="border-l-4 border-l-green-500 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birth_date" className="text-sm font-medium">Birth Date</Label>
                <Input
                  id="birth_date"
                  name="birth_date"
                  type="date"
                  value={memberData.birth_date}
                  onChange={handleFormChange}
                  className="border-gray-300 dark:border-gray-600 focus:border-green-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="join_date" className="text-sm font-medium">Join Date</Label>
                <Input
                  id="join_date"
                  name="join_date"
                  type="date"
                  value={memberData.join_date}
                  onChange={handleFormChange}
                  className="border-gray-300 dark:border-gray-600 focus:border-green-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

            {/* Guardian Information - Only for Children */}
            {isChild && (
              <Card className="border-l-4 border-l-orange-500 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-900 dark:text-orange-100">
                    <Shield className="h-5 w-5" />
                    Guardian Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Guardians (Hold Ctrl/Cmd to select multiple)
                    </Label>
                    <select
                      multiple
                      value={guardianIds}
                      onChange={handleGuardianChange}
                      className="w-full p-2 border rounded border-gray-300 dark:border-gray-600 focus:border-orange-500"
                      size="5"
                    >
                      {guardians.map(guardian => (
                        <option key={guardian.id} value={guardian.id}>
                          {guardian.firstname} {guardian.lastname}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Guardian Relationships */}
                  {guardianIds.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Guardian Relationships</h3>
                      <div className="space-y-2">
                        {guardianIds.map(guardianId => {
                          const guardian = guardians.find(g => g.id === guardianId);
                          return (
                            <div key={guardianId} className="flex items-center gap-4">
                              <span className="text-sm text-gray-600 min-w-[150px]">
                                {guardian.firstname} {guardian.lastname}:
                              </span>
                              <select
                                value={guardianRelationships[guardianId] || ''}
                                onChange={(e) => handleRelationshipChange(guardianId, e.target.value)}
                                className="flex-1 p-2 border rounded border-gray-300 dark:border-gray-600 focus:border-orange-500"
                              >
                                <option value="">Select relationship</option>
                                <option value="Parent">Parent</option>
                                <option value="Grandparent">Grandparent</option>
                                <option value="Legal Guardian">Legal Guardian</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Family Information - Only for Adults */}
            {!isChild && (
              <Card className="border-l-4 border-l-pink-500 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-pink-900 dark:text-pink-100">
                    <Heart className="h-5 w-5" />
                    Family Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="marital_status" className="text-sm font-medium">Marital Status</Label>
                      <Select
                        value={memberData.marital_status}
                        onValueChange={(value) => setMemberData(prev => ({ ...prev, marital_status: value }))}
                      >
                        <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-pink-500">
                          <SelectValue placeholder="Select marital status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Single</SelectItem>
                          <SelectItem value="married">Married</SelectItem>
                          <SelectItem value="divorced">Divorced</SelectItem>
                          <SelectItem value="widowed">Widowed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="spouse_name" className="text-sm font-medium">Spouse Name</Label>
                      <Input
                        id="spouse_name"
                        name="spouse_name"
                        value={memberData.spouse_name}
                        onChange={handleFormChange}
                        placeholder="Spouse's full name"
                        className="border-gray-300 dark:border-gray-600 focus:border-pink-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="anniversary_date" className="text-sm font-medium">Wedding Anniversary</Label>
                      <Input
                        id="anniversary_date"
                        name="anniversary_date"
                        type="date"
                        value={memberData.anniversary_date}
                        onChange={handleFormChange}
                        className="border-gray-300 dark:border-gray-600 focus:border-pink-500"
                      />
                    </div>
                    <div className="flex items-center space-x-2 p-3 bg-pink-50 dark:bg-pink-950/20 rounded-lg border border-pink-200 dark:border-pink-800">
                      <Checkbox
                        id="has_children"
                        checked={memberData.has_children}
                        onCheckedChange={(checked) => setMemberData(prev => ({ ...prev, has_children: checked }))}
                        className="border-pink-300 data-[state=checked]:bg-pink-500"
                      />
                      <Label htmlFor="has_children" className="text-sm font-medium text-pink-900 dark:text-pink-100">Has Children</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Additional Information Tab */}
          <TabsContent value="additional" className="flex-1 space-y-6 overflow-y-auto pr-2">
            {/* Emergency Contact */}
            <Card className="border-l-4 border-l-red-500 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-900 dark:text-red-100">
                  <Shield className="h-5 w-5" />
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergency_name" className="text-sm font-medium">Emergency Contact Name</Label>
                    <Input
                      id="emergency_name"
                      value={memberData.emergency_contact.name}
                      onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
                      placeholder="Emergency contact name"
                      className="border-gray-300 dark:border-gray-600 focus:border-red-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergency_phone" className="text-sm font-medium">Emergency Contact Phone</Label>
                    <Input
                      id="emergency_phone"
                      value={memberData.emergency_contact.phone}
                      onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
                      placeholder="Emergency contact phone"
                      className="border-gray-300 dark:border-gray-600 focus:border-red-500"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="emergency_relationship" className="text-sm font-medium">Relationship</Label>
                  <Input
                    id="emergency_relationship"
                    value={memberData.emergency_contact.relationship}
                    onChange={(e) => handleEmergencyContactChange('relationship', e.target.value)}
                    placeholder="e.g., Spouse, Parent, Friend"
                    className="border-gray-300 dark:border-gray-600 focus:border-red-500"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Communication Preferences - Only for Adults */}
            {!isChild && (
              <Card className="border-l-4 border-l-purple-500 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-purple-100">
                    <Mail className="h-5 w-5" />
                    Communication Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <Checkbox
                      id="sms_preference"
                      checked={memberData.communication_preferences.sms}
                      onCheckedChange={(checked) => handleCommunicationPreferenceChange('sms', checked)}
                      className="border-purple-300 data-[state=checked]:bg-purple-500"
                    />
                    <Label htmlFor="sms_preference" className="text-sm font-medium text-purple-900 dark:text-purple-100">Receive SMS notifications</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <Checkbox
                      id="email_preference"
                      checked={memberData.communication_preferences.email}
                      onCheckedChange={(checked) => handleCommunicationPreferenceChange('email', checked)}
                      className="border-purple-300 data-[state=checked]:bg-purple-500"
                    />
                    <Label htmlFor="email_preference" className="text-sm font-medium text-purple-900 dark:text-purple-100">Receive email notifications</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <Checkbox
                      id="mail_preference"
                      checked={memberData.communication_preferences.mail}
                      onCheckedChange={(checked) => handleCommunicationPreferenceChange('mail', checked)}
                      className="border-purple-300 data-[state=checked]:bg-purple-500"
                    />
                    <Label htmlFor="mail_preference" className="text-sm font-medium text-purple-900 dark:text-purple-100">Receive mail notifications</Label>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            <Card className="border-l-4 border-l-gray-500 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <FileText className="h-5 w-5" />
                  Additional Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={memberData.notes}
                    onChange={handleFormChange}
                    placeholder="Any additional notes about this member..."
                    rows={4}
                    className="border-gray-300 dark:border-gray-600 focus:border-gray-500 resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Form Actions */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 shadow-lg mt-6">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                All changes will be saved when you click "Save Changes"
              </div>
              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel} 
                  className="px-6 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="px-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>

      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Crop Profile Photo</DialogTitle>
          </DialogHeader>
          <div className="relative max-h-[60vh] overflow-auto">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              aspect={1}
              className="max-w-full"
              minWidth={100}
              minHeight={100}
              keepRatio={true}
            >
              <img
                ref={imgRef}
                src={imgSrc}
                onLoad={onImageLoad}
                alt="Crop preview"
                className="max-w-full"
              />
            </ReactCrop>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowCropDialog(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleCropComplete} disabled={isUploading} className="bg-blue-600 hover:bg-blue-700">
              {isUploading ? 'Uploading...' : 'Apply Crop'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MemberForm; 