-- Add tags column to risk_assessments for grouping
ALTER TABLE public.risk_assessments 
ADD COLUMN tags text[] DEFAULT '{}';

-- Create mitigation_actions table for Mitigation Actions linked to risks
CREATE TABLE public.mitigation_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  risk_id UUID NOT NULL REFERENCES public.risk_assessments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  responsible_id UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'pending',
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create test_evidence table for evidence linked to test cases
CREATE TABLE public.test_evidence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  test_case_id UUID NOT NULL REFERENCES public.test_cases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  evidence_type TEXT DEFAULT 'screenshot',
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.mitigation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_evidence ENABLE ROW LEVEL SECURITY;

-- RLS policies for mitigation_actions
CREATE POLICY "Users can view mitigation actions in their company"
ON public.mitigation_actions FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert mitigation actions in their company"
ON public.mitigation_actions FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update mitigation actions in their company"
ON public.mitigation_actions FOR UPDATE
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete mitigation actions in their company"
ON public.mitigation_actions FOR DELETE
USING (company_id = get_user_company_id(auth.uid()));

-- RLS policies for test_evidence
CREATE POLICY "Users can view test evidence in their company"
ON public.test_evidence FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert test evidence in their company"
ON public.test_evidence FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update test evidence in their company"
ON public.test_evidence FOR UPDATE
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete test evidence in their company"
ON public.test_evidence FOR DELETE
USING (company_id = get_user_company_id(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_risk_assessments_tags ON public.risk_assessments USING GIN(tags);
CREATE INDEX idx_mitigation_actions_risk_id ON public.mitigation_actions(risk_id);
CREATE INDEX idx_test_evidence_test_case_id ON public.test_evidence(test_case_id);