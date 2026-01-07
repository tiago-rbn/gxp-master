-- Add approver and reviewer columns to risk_assessments
ALTER TABLE public.risk_assessments 
ADD COLUMN IF NOT EXISTS approver_id uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS reviewer_id uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone;

-- Create junction table for risk-requirement associations
CREATE TABLE IF NOT EXISTS public.risk_requirement_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id uuid NOT NULL REFERENCES public.risk_assessments(id) ON DELETE CASCADE,
  requirement_id uuid NOT NULL REFERENCES public.requirements(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(risk_id, requirement_id)
);

-- Create junction table for risk-test case associations
CREATE TABLE IF NOT EXISTS public.risk_test_case_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id uuid NOT NULL REFERENCES public.risk_assessments(id) ON DELETE CASCADE,
  test_case_id uuid NOT NULL REFERENCES public.test_cases(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(risk_id, test_case_id)
);

-- Enable RLS on new tables
ALTER TABLE public.risk_requirement_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_test_case_links ENABLE ROW LEVEL SECURITY;

-- RLS policies for risk_requirement_links
CREATE POLICY "Users can view risk requirement links from their company"
ON public.risk_requirement_links FOR SELECT
USING (company_id IN (SELECT public.get_user_companies(auth.uid())));

CREATE POLICY "Users can create risk requirement links for their company"
ON public.risk_requirement_links FOR INSERT
WITH CHECK (company_id IN (SELECT public.get_user_companies(auth.uid())));

CREATE POLICY "Users can delete risk requirement links from their company"
ON public.risk_requirement_links FOR DELETE
USING (company_id IN (SELECT public.get_user_companies(auth.uid())));

-- RLS policies for risk_test_case_links
CREATE POLICY "Users can view risk test case links from their company"
ON public.risk_test_case_links FOR SELECT
USING (company_id IN (SELECT public.get_user_companies(auth.uid())));

CREATE POLICY "Users can create risk test case links for their company"
ON public.risk_test_case_links FOR INSERT
WITH CHECK (company_id IN (SELECT public.get_user_companies(auth.uid())));

CREATE POLICY "Users can delete risk test case links from their company"
ON public.risk_test_case_links FOR DELETE
USING (company_id IN (SELECT public.get_user_companies(auth.uid())));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_risk_requirement_links_risk_id ON public.risk_requirement_links(risk_id);
CREATE INDEX IF NOT EXISTS idx_risk_requirement_links_requirement_id ON public.risk_requirement_links(requirement_id);
CREATE INDEX IF NOT EXISTS idx_risk_test_case_links_risk_id ON public.risk_test_case_links(risk_id);
CREATE INDEX IF NOT EXISTS idx_risk_test_case_links_test_case_id ON public.risk_test_case_links(test_case_id);