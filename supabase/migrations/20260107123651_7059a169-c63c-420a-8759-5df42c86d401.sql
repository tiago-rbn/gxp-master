-- Templates de entregáveis por categoria de software
CREATE TABLE IF NOT EXISTS public.deliverable_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  gamp_category text NOT NULL,
  name text NOT NULL,
  description text,
  document_type text,
  is_mandatory boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Templates de tarefas por categoria de software
CREATE TABLE IF NOT EXISTS public.task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  gamp_category text NOT NULL,
  name text NOT NULL,
  description text,
  phase text,
  estimated_hours integer,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Entregáveis do projeto
CREATE TABLE IF NOT EXISTS public.project_deliverables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.validation_projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  document_type text,
  status text DEFAULT 'pending',
  is_mandatory boolean DEFAULT true,
  document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  due_date date,
  completed_at timestamp with time zone,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tarefas do projeto
CREATE TABLE IF NOT EXISTS public.project_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.validation_projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  phase text,
  status text DEFAULT 'pending',
  priority text DEFAULT 'medium',
  assigned_to uuid REFERENCES public.profiles(id),
  estimated_hours integer,
  actual_hours integer,
  due_date date,
  completed_at timestamp with time zone,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deliverable_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

-- Policies for deliverable_templates
CREATE POLICY "Users can view deliverable templates in their company"
ON public.deliverable_templates FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert deliverable templates in their company"
ON public.deliverable_templates FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update deliverable templates in their company"
ON public.deliverable_templates FOR UPDATE
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete deliverable templates in their company"
ON public.deliverable_templates FOR DELETE
USING (company_id = get_user_company_id(auth.uid()));

-- Policies for task_templates
CREATE POLICY "Users can view task templates in their company"
ON public.task_templates FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert task templates in their company"
ON public.task_templates FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update task templates in their company"
ON public.task_templates FOR UPDATE
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete task templates in their company"
ON public.task_templates FOR DELETE
USING (company_id = get_user_company_id(auth.uid()));

-- Policies for project_deliverables
CREATE POLICY "Users can view project deliverables in their company"
ON public.project_deliverables FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert project deliverables in their company"
ON public.project_deliverables FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update project deliverables in their company"
ON public.project_deliverables FOR UPDATE
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete project deliverables in their company"
ON public.project_deliverables FOR DELETE
USING (company_id = get_user_company_id(auth.uid()));

-- Policies for project_tasks
CREATE POLICY "Users can view project tasks in their company"
ON public.project_tasks FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert project tasks in their company"
ON public.project_tasks FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update project tasks in their company"
ON public.project_tasks FOR UPDATE
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete project tasks in their company"
ON public.project_tasks FOR DELETE
USING (company_id = get_user_company_id(auth.uid()));