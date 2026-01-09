-- Add DELETE policy for companies table (super admin only)
CREATE POLICY "Super admin can delete companies" 
ON public.companies 
FOR DELETE 
USING (is_super_admin(auth.uid()));