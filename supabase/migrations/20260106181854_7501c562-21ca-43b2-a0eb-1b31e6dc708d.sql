-- Allow super_admin to insert new companies
CREATE POLICY "Super admin can insert companies"
ON public.companies
FOR INSERT
WITH CHECK (is_super_admin(auth.uid()));