-- Create policies for the members storage bucket with public access
CREATE POLICY "Enable public access for all operations"
ON storage.objects FOR ALL
USING (bucket_id = 'members')
WITH CHECK (bucket_id = 'members'); 