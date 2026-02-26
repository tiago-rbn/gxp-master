
-- Fix 1: accept_invitation - add email validation
CREATE OR REPLACE FUNCTION public.accept_invitation(_token text, _user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _invitation RECORD;
  _user_email TEXT;
BEGIN
  -- Get user email
  SELECT email INTO _user_email
  FROM auth.users
  WHERE id = _user_id;

  IF _user_email IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Get invitation
  SELECT * INTO _invitation
  FROM public.invitations
  WHERE token = _token
    AND status = 'pending'
    AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Verify email matches
  IF lower(_user_email) != lower(_invitation.email) THEN
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
  
  -- Add to user_companies
  INSERT INTO public.user_companies (user_id, company_id, is_primary)
  VALUES (_user_id, _invitation.company_id, true)
  ON CONFLICT (user_id, company_id) DO UPDATE SET is_primary = true;
  
  -- Mark invitation as accepted
  UPDATE public.invitations
  SET status = 'accepted', accepted_at = now()
  WHERE id = _invitation.id;
  
  RETURN TRUE;
END;
$function$;

-- Fix 2: audit_logs - replace permissive INSERT policy with restricted one
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
  AND (user_id IS NULL OR user_id = auth.uid())
);

-- Fix 3: Storage - replace permissive policies with company-scoped ones
DROP POLICY IF EXISTS "Users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update documents" ON storage.objects;

CREATE POLICY "Users can upload documents to their company"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] IN (
    SELECT company_id::text FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can view their company documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] IN (
    SELECT company_id::text FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can delete their company documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] IN (
    SELECT company_id::text FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update their company documents"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] IN (
    SELECT company_id::text FROM public.profiles WHERE id = auth.uid()
  )
);
