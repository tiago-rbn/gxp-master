
-- Add code and version columns to risk_assessments
ALTER TABLE public.risk_assessments 
  ADD COLUMN IF NOT EXISTS code text,
  ADD COLUMN IF NOT EXISTS version text NOT NULL DEFAULT '1.0';

-- Create risk assessment versions table for edit history
CREATE TABLE IF NOT EXISTS public.risk_assessment_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  risk_assessment_id uuid NOT NULL REFERENCES public.risk_assessments(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id),
  version text NOT NULL,
  title text NOT NULL,
  description text,
  assessment_type text NOT NULL,
  system_id uuid,
  probability integer,
  severity integer,
  detectability integer,
  risk_level text,
  residual_risk text,
  controls text,
  status text,
  tags text[] DEFAULT '{}'::text[],
  change_summary text,
  changed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.risk_assessment_versions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'risk_assessment_versions' AND policyname = 'Users can view risk versions in their company') THEN
    CREATE POLICY "Users can view risk versions in their company"
      ON public.risk_assessment_versions FOR SELECT
      USING (company_id = get_user_company_id(auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'risk_assessment_versions' AND policyname = 'Users can insert risk versions in their company') THEN
    CREATE POLICY "Users can insert risk versions in their company"
      ON public.risk_assessment_versions FOR INSERT
      WITH CHECK (company_id = get_user_company_id(auth.uid()));
  END IF;
END $$;

-- Function to generate risk assessment code
CREATE OR REPLACE FUNCTION public.generate_risk_code(
  _system_id uuid,
  _risk_level text,
  _company_id uuid
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  _system_abbr text;
  _level_abbr text;
  _seq integer;
  _code text;
BEGIN
  IF _system_id IS NOT NULL THEN
    SELECT upper(left(regexp_replace(name, '[^a-zA-Z0-9]', '', 'g'), 4))
    INTO _system_abbr
    FROM public.systems
    WHERE id = _system_id;
  END IF;
  _system_abbr := COALESCE(_system_abbr, 'GEN');

  _level_abbr := CASE _risk_level
    WHEN 'critical' THEN 'C'
    WHEN 'high' THEN 'H'
    WHEN 'medium' THEN 'M'
    WHEN 'low' THEN 'L'
    ELSE 'M'
  END;

  SELECT COALESCE(MAX(
    CASE 
      WHEN ra.code ~ '-[0-9]+$' 
      THEN (regexp_match(ra.code, '-([0-9]+)$'))[1]::integer 
      ELSE 0 
    END
  ), 0) + 1
  INTO _seq
  FROM public.risk_assessments ra
  WHERE ra.company_id = _company_id
    AND ra.assessment_type != 'IRA'
    AND ra.code IS NOT NULL
    AND ra.code LIKE 'FRA-' || _system_abbr || '-%';

  _code := 'FRA-' || _system_abbr || '-' || _level_abbr || '-' || lpad(_seq::text, 3, '0');
  
  RETURN _code;
END;
$fn$;
