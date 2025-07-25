import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Upload, X } from 'lucide-react';
import CapacitorService from '@/lib/capacitorService';

export function MobilePhotoCapture({ onPhotoCaptured, onCancel, title = "Take Photo" }) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleTakePhoto = async () => {
    try {
      setIsCapturing(true);
      
      // Trigger haptic feedback
      await CapacitorService.triggerHaptic();
      
      const photoPath = await CapacitorService.takePhoto();
      
      if (photoPath) {
        setPreviewUrl(photoPath);
        onPhotoCaptured(photoPath);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      onPhotoCaptured(url);
    }
  };

  const handleCancel = () => {
    setPreviewUrl(null);
    onCancel?.();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {previewUrl ? (
          <div className="space-y-4">
            <div className="relative">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="w-full h-64 object-cover rounded-lg"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={handleCancel}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleTakePhoto} 
                disabled={isCapturing}
                className="flex-1"
              >
                <Camera className="h-4 w-4 mr-2" />
                Retake
              </Button>
              <Button 
                variant="outline" 
                onClick={handleCancel}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Camera className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">
                {CapacitorService.isNative() 
                  ? "Tap to take a photo using your device camera"
                  : "Upload a photo or use your camera"
                }
              </p>
            </div>
            
            <div className="flex gap-2">
              {CapacitorService.isNative() ? (
                <Button 
                  onClick={handleTakePhoto} 
                  disabled={isCapturing}
                  className="flex-1"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {isCapturing ? 'Taking Photo...' : 'Take Photo'}
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={handleTakePhoto} 
                    disabled={isCapturing}
                    className="flex-1"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Camera
                  </Button>
                  <label className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button variant="outline" className="w-full">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                  </label>
                </>
              )}
              
              {onCancel && (
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  className="flex-1"
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MobilePhotoCapture; 