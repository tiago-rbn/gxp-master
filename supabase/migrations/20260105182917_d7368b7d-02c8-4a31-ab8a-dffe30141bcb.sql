-- Enum para roles de usuário
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'validator', 'responsible', 'reader');

-- Enum para categorias GAMP
CREATE TYPE public.gamp_category AS ENUM ('1', '3', '4', '5');

-- Enum para níveis de risco
CREATE TYPE public.risk_level AS ENUM ('low', 'medium', 'high', 'critical');

-- Enum para status geral
CREATE TYPE public.status_type AS ENUM ('draft', 'pending', 'approved', 'rejected', 'completed', 'cancelled');

-- Enum para status de validação
CREATE TYPE public.validation_status AS ENUM ('not_started', 'in_progress', 'validated', 'expired', 'pending_revalidation');

-- Tabela de empresas (tenants)
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de perfis de usuários
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  department TEXT,
  position TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de roles de usuários (separada para segurança)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'reader',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Tabela de sistemas
CREATE TABLE public.systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  vendor TEXT,
  version TEXT,
  gamp_category gamp_category NOT NULL,
  criticality risk_level DEFAULT 'medium',
  validation_status validation_status DEFAULT 'not_started',
  gxp_impact BOOLEAN DEFAULT false,
  data_integrity_impact BOOLEAN DEFAULT false,
  responsible_id UUID REFERENCES public.profiles(id),
  last_validation_date DATE,
  next_revalidation_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de avaliações de risco (IRA/FRA)
CREATE TABLE public.risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  system_id UUID REFERENCES public.systems(id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('IRA', 'FRA')),
  title TEXT NOT NULL,
  description TEXT,
  probability INTEGER CHECK (probability >= 1 AND probability <= 5),
  severity INTEGER CHECK (severity >= 1 AND severity <= 5),
  detectability INTEGER CHECK (detectability >= 1 AND detectability <= 5),
  risk_level risk_level,
  controls TEXT,
  residual_risk risk_level,
  status status_type DEFAULT 'draft',
  assessor_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de projetos de validação
CREATE TABLE public.validation_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  system_id UUID REFERENCES public.systems(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  project_type TEXT,
  status status_type DEFAULT 'draft',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  start_date DATE,
  target_date DATE,
  completion_date DATE,
  manager_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de documentos
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  system_id UUID REFERENCES public.systems(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.validation_projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  document_type TEXT NOT NULL,
  version TEXT DEFAULT '1.0',
  status status_type DEFAULT 'draft',
  content TEXT,
  file_url TEXT,
  author_id UUID REFERENCES public.profiles(id),
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de solicitações de mudança
CREATE TABLE public.change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  system_id UUID REFERENCES public.systems(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  change_type TEXT,
  priority risk_level DEFAULT 'medium',
  gxp_impact BOOLEAN DEFAULT false,
  validation_required BOOLEAN DEFAULT false,
  status status_type DEFAULT 'pending',
  requester_id UUID REFERENCES public.profiles(id),
  approver_id UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  implemented_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de audit log
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validation_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Função para verificar role do usuário
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para obter company_id do usuário
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id
  FROM public.profiles
  WHERE id = _user_id
$$;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_systems_updated_at BEFORE UPDATE ON public.systems FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_risk_assessments_updated_at BEFORE UPDATE ON public.risk_assessments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_validation_projects_updated_at BEFORE UPDATE ON public.validation_projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_change_requests_updated_at BEFORE UPDATE ON public.change_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies para companies
CREATE POLICY "Users can view their own company" ON public.companies FOR SELECT USING (id = public.get_user_company_id(auth.uid()));

-- RLS Policies para profiles
CREATE POLICY "Users can view profiles in their company" ON public.profiles FOR SELECT USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());

-- RLS Policies para user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (user_id = auth.uid());

-- RLS Policies para systems (multi-tenant)
CREATE POLICY "Users can view systems in their company" ON public.systems FOR SELECT USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Users can insert systems in their company" ON public.systems FOR INSERT WITH CHECK (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Users can update systems in their company" ON public.systems FOR UPDATE USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Users can delete systems in their company" ON public.systems FOR DELETE USING (company_id = public.get_user_company_id(auth.uid()));

-- RLS Policies para risk_assessments (multi-tenant)
CREATE POLICY "Users can view risks in their company" ON public.risk_assessments FOR SELECT USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Users can insert risks in their company" ON public.risk_assessments FOR INSERT WITH CHECK (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Users can update risks in their company" ON public.risk_assessments FOR UPDATE USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Users can delete risks in their company" ON public.risk_assessments FOR DELETE USING (company_id = public.get_user_company_id(auth.uid()));

-- RLS Policies para validation_projects (multi-tenant)
CREATE POLICY "Users can view projects in their company" ON public.validation_projects FOR SELECT USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Users can insert projects in their company" ON public.validation_projects FOR INSERT WITH CHECK (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Users can update projects in their company" ON public.validation_projects FOR UPDATE USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Users can delete projects in their company" ON public.validation_projects FOR DELETE USING (company_id = public.get_user_company_id(auth.uid()));

-- RLS Policies para documents (multi-tenant)
CREATE POLICY "Users can view documents in their company" ON public.documents FOR SELECT USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Users can insert documents in their company" ON public.documents FOR INSERT WITH CHECK (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Users can update documents in their company" ON public.documents FOR UPDATE USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Users can delete documents in their company" ON public.documents FOR DELETE USING (company_id = public.get_user_company_id(auth.uid()));

-- RLS Policies para change_requests (multi-tenant)
CREATE POLICY "Users can view changes in their company" ON public.change_requests FOR SELECT USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Users can insert changes in their company" ON public.change_requests FOR INSERT WITH CHECK (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Users can update changes in their company" ON public.change_requests FOR UPDATE USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Users can delete changes in their company" ON public.change_requests FOR DELETE USING (company_id = public.get_user_company_id(auth.uid()));

-- RLS Policies para audit_logs (multi-tenant, apenas leitura)
CREATE POLICY "Users can view audit logs in their company" ON public.audit_logs FOR SELECT USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- Função para criar perfil e empresa padrão no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_company_id UUID;
BEGIN
  -- Criar empresa padrão para o usuário
  INSERT INTO public.companies (name)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'company_name', 'Minha Empresa'))
  RETURNING id INTO new_company_id;
  
  -- Criar perfil do usuário
  INSERT INTO public.profiles (id, company_id, full_name, email)
  VALUES (
    NEW.id,
    new_company_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  
  -- Atribuir role de admin para o primeiro usuário da empresa
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin');
  
  RETURN NEW;
END;
$$;

-- Trigger para criar perfil no signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();