-- Create public bucket for report PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', true);

-- Allow admins to upload files
CREATE POLICY "Admins can upload reports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'reports' AND
  public.has_role(auth.uid(), 'admin')
);

-- Allow anyone to read (public links)
CREATE POLICY "Public can read reports"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'reports');

-- Allow admins to delete reports
CREATE POLICY "Admins can delete reports"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'reports' AND
  public.has_role(auth.uid(), 'admin')
);