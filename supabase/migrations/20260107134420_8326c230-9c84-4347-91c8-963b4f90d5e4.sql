-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload logos (admins only via application logic)
CREATE POLICY "Authenticated users can upload company logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'company-logos' AND auth.role() = 'authenticated');

-- Allow public read access to logos
CREATE POLICY "Company logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-logos');

-- Allow authenticated users to update their company logos
CREATE POLICY "Authenticated users can update company logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'company-logos' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete company logos
CREATE POLICY "Authenticated users can delete company logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'company-logos' AND auth.role() = 'authenticated');