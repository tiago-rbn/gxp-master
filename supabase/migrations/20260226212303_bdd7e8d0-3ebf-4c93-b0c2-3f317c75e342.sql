
-- System version history table
CREATE TABLE public.system_version_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  system_id UUID NOT NULL REFERENCES public.systems(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  previous_version TEXT,
  new_version TEXT NOT NULL,
  change_description TEXT NOT NULL,
  update_date DATE NOT NULL DEFAULT CURRENT_DATE,
  has_bpx_impact BOOLEAN DEFAULT false,
  ira_review_requested BOOLEAN DEFAULT false,
  change_request_created BOOLEAN DEFAULT false,
  change_request_id UUID REFERENCES public.change_requests(id),
  changed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.system_version_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view system version history in their company"
  ON public.system_version_history
  FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert system version history in their company"
  ON public.system_version_history
  FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- Index for faster lookups
CREATE INDEX idx_system_version_history_system_id ON public.system_version_history(system_id);
CREATE INDEX idx_system_version_history_company_id ON public.system_version_history(company_id);
