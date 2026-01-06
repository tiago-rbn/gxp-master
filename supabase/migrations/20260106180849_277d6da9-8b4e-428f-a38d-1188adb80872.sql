-- Create helper function to check if user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'super_admin'
  )
$$;

-- Update profiles RLS to allow super_admin to view all profiles
DROP POLICY IF EXISTS "Users can view profiles in their company" ON public.profiles;
CREATE POLICY "Users can view profiles in their company or super_admin"
ON public.profiles
FOR SELECT
USING (
  company_id = get_user_company_id(auth.uid())
  OR is_super_admin(auth.uid())
);

-- Allow super_admin to update any profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update own profile or super_admin"
ON public.profiles
FOR UPDATE
USING (
  id = auth.uid()
  OR is_super_admin(auth.uid())
);

-- Update user_roles RLS to allow super_admin to view all roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles or super_admin all"
ON public.user_roles
FOR SELECT
USING (
  user_id = auth.uid()
  OR is_super_admin(auth.uid())
);

-- Allow super_admin to insert roles
CREATE POLICY "Super admin can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (is_super_admin(auth.uid()));

-- Allow super_admin to update roles
CREATE POLICY "Super admin can update roles"
ON public.user_roles
FOR UPDATE
USING (is_super_admin(auth.uid()));

-- Allow super_admin to delete roles
CREATE POLICY "Super admin can delete roles"
ON public.user_roles
FOR DELETE
USING (is_super_admin(auth.uid()));

-- Update companies RLS to allow super_admin to view all companies
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
CREATE POLICY "Users can view own company or super_admin all"
ON public.companies
FOR SELECT
USING (
  id = get_user_company_id(auth.uid())
  OR is_super_admin(auth.uid())
);

-- Allow super_admin to update any company
CREATE POLICY "Super admin can update companies"
ON public.companies
FOR UPDATE
USING (is_super_admin(auth.uid()));

-- Update invitations RLS to allow super_admin to manage all
DROP POLICY IF EXISTS "Users can view invitations in their company" ON public.invitations;
CREATE POLICY "Users can view invitations or super_admin all"
ON public.invitations
FOR SELECT
USING (
  company_id = get_user_company_id(auth.uid())
  OR is_super_admin(auth.uid())
);

DROP POLICY IF EXISTS "Users can insert invitations in their company" ON public.invitations;
CREATE POLICY "Users can insert invitations or super_admin"
ON public.invitations
FOR INSERT
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
  OR is_super_admin(auth.uid())
);

DROP POLICY IF EXISTS "Users can update invitations in their company" ON public.invitations;
CREATE POLICY "Users can update invitations or super_admin"
ON public.invitations
FOR UPDATE
USING (
  company_id = get_user_company_id(auth.uid())
  OR is_super_admin(auth.uid())
);

DROP POLICY IF EXISTS "Users can delete invitations in their company" ON public.invitations;
CREATE POLICY "Users can delete invitations or super_admin"
ON public.invitations
FOR DELETE
USING (
  company_id = get_user_company_id(auth.uid())
  OR is_super_admin(auth.uid())
);