
-- Add approval fields to validation_projects
ALTER TABLE public.validation_projects 
ADD COLUMN IF NOT EXISTS approved_by uuid,
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Create requirements table for RTM
CREATE TABLE public.requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  project_id uuid REFERENCES public.validation_projects(id) ON DELETE CASCADE,
  system_id uuid REFERENCES public.systems(id) ON DELETE SET NULL,
  code text NOT NULL,
  title text NOT NULL,
  description text,
  type text DEFAULT 'functional',
  priority text DEFAULT 'medium',
  status text DEFAULT 'draft',
  source text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create test_cases table for RTM
CREATE TABLE public.test_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  project_id uuid REFERENCES public.validation_projects(id) ON DELETE CASCADE,
  system_id uuid REFERENCES public.systems(id) ON DELETE SET NULL,
  code text NOT NULL,
  title text NOT NULL,
  description text,
  preconditions text,
  steps text,
  expected_results text,
  status text DEFAULT 'pending',
  executed_by uuid,
  executed_at timestamp with time zone,
  result text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create RTM links table
CREATE TABLE public.rtm_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  requirement_id uuid NOT NULL REFERENCES public.requirements(id) ON DELETE CASCADE,
  test_case_id uuid NOT NULL REFERENCES public.test_cases(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(requirement_id, test_case_id)
);

-- Enable RLS
ALTER TABLE public.requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rtm_links ENABLE ROW LEVEL SECURITY;

-- RLS policies for requirements
CREATE POLICY "Users can view requirements in their company" ON public.requirements FOR SELECT USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can insert requirements in their company" ON public.requirements FOR INSERT WITH CHECK (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can update requirements in their company" ON public.requirements FOR UPDATE USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can delete requirements in their company" ON public.requirements FOR DELETE USING (company_id = get_user_company_id(auth.uid()));

-- RLS policies for test_cases
CREATE POLICY "Users can view test_cases in their company" ON public.test_cases FOR SELECT USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can insert test_cases in their company" ON public.test_cases FOR INSERT WITH CHECK (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can update test_cases in their company" ON public.test_cases FOR UPDATE USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can delete test_cases in their company" ON public.test_cases FOR DELETE USING (company_id = get_user_company_id(auth.uid()));

-- RLS policies for rtm_links
CREATE POLICY "Users can view rtm_links in their company" ON public.rtm_links FOR SELECT USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can insert rtm_links in their company" ON public.rtm_links FOR INSERT WITH CHECK (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can delete rtm_links in their company" ON public.rtm_links FOR DELETE USING (company_id = get_user_company_id(auth.uid()));

-- Create audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _company_id uuid;
  _user_id uuid;
BEGIN
  _user_id := auth.uid();
  
  IF TG_OP = 'DELETE' THEN
    _company_id := OLD.company_id;
  ELSE
    _company_id := NEW.company_id;
  END IF;
  
  IF _company_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  INSERT INTO public.audit_logs (
    action,
    entity_type,
    entity_id,
    user_id,
    company_id,
    old_values,
    new_values
  ) VALUES (
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    _user_id,
    _company_id,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create audit triggers for main tables
CREATE TRIGGER audit_validation_projects AFTER INSERT OR UPDATE OR DELETE ON public.validation_projects FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_documents AFTER INSERT OR UPDATE OR DELETE ON public.documents FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_change_requests AFTER INSERT OR UPDATE OR DELETE ON public.change_requests FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_systems AFTER INSERT OR UPDATE OR DELETE ON public.systems FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_risk_assessments AFTER INSERT OR UPDATE OR DELETE ON public.risk_assessments FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_requirements AFTER INSERT OR UPDATE OR DELETE ON public.requirements FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_test_cases AFTER INSERT OR UPDATE OR DELETE ON public.test_cases FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Update triggers for updated_at
CREATE TRIGGER update_requirements_updated_at BEFORE UPDATE ON public.requirements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_test_cases_updated_at BEFORE UPDATE ON public.test_cases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
