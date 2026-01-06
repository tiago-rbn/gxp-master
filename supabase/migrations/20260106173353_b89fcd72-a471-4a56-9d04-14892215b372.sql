-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON public.invitations;

-- Create a function to check invitation by token (security definer)
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(_token TEXT)
RETURNS TABLE (
  id UUID,
  company_id UUID,
  email TEXT,
  role TEXT,
  status TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  company_name TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    i.id,
    i.company_id,
    i.email,
    i.role,
    i.status,
    i.expires_at,
    c.name as company_name
  FROM public.invitations i
  JOIN public.companies c ON c.id = i.company_id
  WHERE i.token = _token
    AND i.status = 'pending'
    AND i.expires_at > now()
$$;

-- Create a function to accept invitation (security definer)
CREATE OR REPLACE FUNCTION public.accept_invitation(_token TEXT, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _invitation RECORD;
BEGIN
  -- Get invitation
  SELECT * INTO _invitation
  FROM public.invitations
  WHERE token = _token
    AND status = 'pending'
    AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Update user's company_id
  UPDATE public.profiles
  SET company_id = _invitation.company_id
  WHERE id = _user_id;
  
  -- Add user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _invitation.role::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Mark invitation as accepted
  UPDATE public.invitations
  SET status = 'accepted', accepted_at = now()
  WHERE id = _invitation.id;
  
  RETURN TRUE;
END;
$$;