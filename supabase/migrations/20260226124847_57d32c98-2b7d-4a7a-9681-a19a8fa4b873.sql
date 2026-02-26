
-- Risk template packages (groups of reusable functional risks)
CREATE TABLE public.risk_template_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Individual risk items within a package
CREATE TABLE public.risk_template_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID NOT NULL REFERENCES public.risk_template_packages(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  severity INTEGER DEFAULT 3,
  probability INTEGER DEFAULT 3,
  detectability INTEGER DEFAULT 3,
  controls TEXT,
  tags TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for risk_template_packages
ALTER TABLE public.risk_template_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view risk template packages in their company"
  ON public.risk_template_packages FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert risk template packages in their company"
  ON public.risk_template_packages FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update risk template packages in their company"
  ON public.risk_template_packages FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete risk template packages in their company"
  ON public.risk_template_packages FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()));

-- RLS for risk_template_items
ALTER TABLE public.risk_template_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view risk template items in their company"
  ON public.risk_template_items FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert risk template items in their company"
  ON public.risk_template_items FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update risk template items in their company"
  ON public.risk_template_items FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete risk template items in their company"
  ON public.risk_template_items FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()));
