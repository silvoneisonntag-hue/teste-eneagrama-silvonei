CREATE POLICY "Admins can update reports"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'reports' AND has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'reports' AND has_role(auth.uid(), 'admin'::app_role));