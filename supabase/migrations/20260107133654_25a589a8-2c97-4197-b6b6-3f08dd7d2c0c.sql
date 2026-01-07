-- Create user_companies table for many-to-many relationship
CREATE TABLE public.user_companies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);

-- Enable RLS
ALTER TABLE public.user_companies ENABLE ROW LEVEL SECURITY;

-- Policies for user_companies
CREATE POLICY "Users can view their own company associations"
ON public.user_companies
FOR SELECT
USING (user_id = auth.uid() OR is_super_admin(auth.uid()));

CREATE POLICY "Super admin can insert company associations"
ON public.user_companies
FOR INSERT
WITH CHECK (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Super admin can update company associations"
ON public.user_companies
FOR UPDATE
USING (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Super admin can delete company associations"
ON public.user_companies
FOR DELETE
USING (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- Migrate existing profiles to user_companies
INSERT INTO public.user_companies (user_id, company_id, is_primary)
SELECT id, company_id, true
FROM public.profiles
WHERE company_id IS NOT NULL
ON CONFLICT (user_id, company_id) DO NOTHING;

-- Create function to get user's current/active company
CREATE OR REPLACE FUNCTION public.get_user_active_company_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id
  FROM public.user_companies
  WHERE user_id = _user_id AND is_primary = true
  LIMIT 1
$$;

-- Create function to get all companies for a user
CREATE OR REPLACE FUNCTION public.get_user_companies(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id
  FROM public.user_companies
  WHERE user_id = _user_id
$$;

-- Create function to switch user's active company
CREATE OR REPLACE FUNCTION public.switch_user_company(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user belongs to this company
  IF NOT EXISTS (
    SELECT 1 FROM public.user_companies 
    WHERE user_id = _user_id AND company_id = _company_id
  ) THEN
    RETURN false;
  END IF;
  
  -- Set all companies as non-primary
  UPDATE public.user_companies 
  SET is_primary = false 
  WHERE user_id = _user_id;
  
  -- Set the selected company as primary
  UPDATE public.user_companies 
  SET is_primary = true 
  WHERE user_id = _user_id AND company_id = _company_id;
  
  -- Also update the profiles table for backward compatibility
  UPDATE public.profiles 
  SET company_id = _company_id 
  WHERE id = _user_id;
  
  RETURN true;
END;
$$;

-- Update get_user_company_id to use the new system
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT company_id FROM public.user_companies WHERE user_id = _user_id AND is_primary = true LIMIT 1),
    (SELECT company_id FROM public.profiles WHERE id = _user_id)
  )
$$;

-- Function to add user to a company
CREATE OR REPLACE FUNCTION public.add_user_to_company(_user_id uuid, _company_id uuid, _set_primary boolean DEFAULT false)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert the association
  INSERT INTO public.user_companies (user_id, company_id, is_primary)
  VALUES (_user_id, _company_id, _set_primary)
  ON CONFLICT (user_id, company_id) DO UPDATE SET is_primary = _set_primary;
  
  -- If setting as primary, unset others
  IF _set_primary THEN
    UPDATE public.user_companies 
    SET is_primary = false 
    WHERE user_id = _user_id AND company_id != _company_id;
    
    -- Update profiles for backward compatibility
    UPDATE public.profiles 
    SET company_id = _company_id 
    WHERE id = _user_id;
  END IF;
  
  RETURN true;
END;
$$;

-- Function to remove user from a company
CREATE OR REPLACE FUNCTION public.remove_user_from_company(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  remaining_count integer;
  other_company uuid;
BEGIN
  -- Delete the association
  DELETE FROM public.user_companies 
  WHERE user_id = _user_id AND company_id = _company_id;
  
  -- Count remaining companies
  SELECT COUNT(*) INTO remaining_count 
  FROM public.user_companies 
  WHERE user_id = _user_id;
  
  -- If no companies left, do nothing special
  IF remaining_count = 0 THEN
    UPDATE public.profiles SET company_id = NULL WHERE id = _user_id;
    RETURN true;
  END IF;
  
  -- If the removed company was primary, set another as primary
  IF NOT EXISTS (
    SELECT 1 FROM public.user_companies 
    WHERE user_id = _user_id AND is_primary = true
  ) THEN
    SELECT company_id INTO other_company 
    FROM public.user_companies 
    WHERE user_id = _user_id 
    LIMIT 1;
    
    UPDATE public.user_companies 
    SET is_primary = true 
    WHERE user_id = _user_id AND company_id = other_company;
    
    UPDATE public.profiles 
    SET company_id = other_company 
    WHERE id = _user_id;
  END IF;
  
  RETURN true;
END;
$$;