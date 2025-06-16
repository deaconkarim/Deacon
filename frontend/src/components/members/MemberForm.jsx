import React, { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, X } from 'lucide-react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

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
    gender: initialData.gender || 'male'
  });
  const [isUploading, setIsUploading] = useState(false);
  const [crop, setCrop] = useState();
  const [imgSrc, setImgSrc] = useState('');
  const [showCropDialog, setShowCropDialog] = useState(false);
  const imgRef = useRef(null);
  const { toast } = useToast();

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setMemberData(prev => ({
      ...prev,
      [name]: value
    }));
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!memberData.firstname || !memberData.lastname) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    // Convert empty strings to null for email and phone
    const dataToSave = {
      ...memberData,
      email: memberData.email?.trim() || null,
      phone: memberData.phone?.trim() || null
    };

    onSave(dataToSave);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="grid gap-4 py-4">
        <div className="flex flex-col items-center gap-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={memberData.image_url} />
            <AvatarFallback>
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
            >
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? 'Uploading...' : 'Upload Image'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstname">First Name *</Label>
            <Input
              id="firstname"
              name="firstname"
              value={memberData.firstname}
              onChange={handleFormChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastname">Last Name *</Label>
            <Input
              id="lastname"
              name="lastname"
              value={memberData.lastname}
              onChange={handleFormChange}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select
            value={memberData.gender}
            onValueChange={(value) => setMemberData(prev => ({ ...prev, gender: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={memberData.email}
              onChange={handleFormChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={memberData.phone}
              onChange={handleFormChange}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={memberData.status}
            onValueChange={(value) => setMemberData(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="visitor">Visitor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </div>
      </form>

      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Crop Image</DialogTitle>
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
            <Button type="button" onClick={handleCropComplete} disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Apply Crop'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MemberForm; 