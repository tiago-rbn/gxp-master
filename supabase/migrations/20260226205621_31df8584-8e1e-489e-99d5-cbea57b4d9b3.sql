
-- Auto-code existing FRA risks
DO $$
DECLARE
  r RECORD;
  new_code text;
BEGIN
  FOR r IN 
    SELECT id, system_id, risk_level::text as rl, company_id
    FROM public.risk_assessments
    WHERE assessment_type != 'IRA'
      AND (code IS NULL OR code = '')
    ORDER BY created_at ASC
  LOOP
    new_code := public.generate_risk_code(r.system_id, r.rl, r.company_id);
    UPDATE public.risk_assessments SET code = new_code WHERE id = r.id;
  END LOOP;
END;
$$;
