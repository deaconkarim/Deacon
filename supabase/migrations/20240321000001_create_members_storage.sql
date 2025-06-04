-- Create storage bucket for member images
INSERT INTO storage.buckets (id, name, public)
VALUES ('members', 'members', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload member images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'members' AND
  auth.role() = 'authenticated'
);

-- Allow public access to view files
CREATE POLICY "Allow public access to member images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'members');

-- Allow authenticated users to update their own files
CREATE POLICY "Allow authenticated users to update member images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'members' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated users to delete member images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'members' AND
  auth.role() = 'authenticated'
); 