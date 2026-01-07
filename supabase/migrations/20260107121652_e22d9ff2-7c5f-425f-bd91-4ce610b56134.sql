-- Add new fields to systems table
ALTER TABLE public.systems
ADD COLUMN IF NOT EXISTS bpx_relevant boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS system_owner_id uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS process_owner_id uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS installation_location text DEFAULT 'on_premise';

-- Create permissions table for storing customizable permission matrix
CREATE TABLE IF NOT EXISTS public.permissions_matrix (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  module text NOT NULL,
  admin_access boolean DEFAULT true,
  validator_access boolean DEFAULT true,
  responsible_access boolean DEFAULT true,
  reader_access boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(company_id, module)
);

-- Enable RLS
ALTER TABLE public.permissions_matrix ENABLE ROW LEVEL SECURITY;

-- Policies for permissions_matrix - only admin and super_admin can manage
CREATE POLICY "Users can view permissions in their company"
ON public.permissions_matrix FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can insert permissions"
ON public.permissions_matrix FOR INSERT
WITH CHECK (
  company_id = get_user_company_id(auth.uid()) 
  AND (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Admins can update permissions"
ON public.permissions_matrix FOR UPDATE
USING (
  company_id = get_user_company_id(auth.uid())
  AND (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Admins can delete permissions"
ON public.permissions_matrix FOR DELETE
USING (
  company_id = get_user_company_id(auth.uid())
  AND (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'))
);