-- Create template_packages table for the marketplace
CREATE TABLE public.template_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  system_name TEXT,
  gamp_category TEXT,
  application TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  document_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  company_id UUID NOT NULL REFERENCES public.companies(id),
  is_published BOOLEAN NOT NULL DEFAULT false,
  cover_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create template_package_items table to link packages to templates
CREATE TABLE public.template_package_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID NOT NULL REFERENCES public.template_packages(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.document_templates(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(package_id, template_id)
);

-- Create template_package_activations table for activation requests
CREATE TABLE public.template_package_activations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID NOT NULL REFERENCES public.template_packages(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  requested_by UUID REFERENCES public.profiles(id),
  approved_by UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(package_id, company_id)
);

-- Enable RLS
ALTER TABLE public.template_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_package_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_package_activations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for template_packages
-- Anyone can view published packages
CREATE POLICY "Anyone can view published packages"
ON public.template_packages
FOR SELECT
USING (is_published = true OR company_id = get_user_company_id(auth.uid()));

-- Users can insert packages for their company
CREATE POLICY "Users can insert packages for their company"
ON public.template_packages
FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- Users can update their company packages
CREATE POLICY "Users can update their company packages"
ON public.template_packages
FOR UPDATE
USING (company_id = get_user_company_id(auth.uid()));

-- Users can delete their company packages
CREATE POLICY "Users can delete their company packages"
ON public.template_packages
FOR DELETE
USING (company_id = get_user_company_id(auth.uid()));

-- RLS Policies for template_package_items
CREATE POLICY "Users can view package items"
ON public.template_package_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.template_packages 
    WHERE id = package_id 
    AND (is_published = true OR company_id = get_user_company_id(auth.uid()))
  )
);

CREATE POLICY "Users can insert package items for their packages"
ON public.template_package_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.template_packages 
    WHERE id = package_id 
    AND company_id = get_user_company_id(auth.uid())
  )
);

CREATE POLICY "Users can delete package items from their packages"
ON public.template_package_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.template_packages 
    WHERE id = package_id 
    AND company_id = get_user_company_id(auth.uid())
  )
);

-- RLS Policies for template_package_activations
-- Users can view their company activations, super_admin can see all
CREATE POLICY "Users can view activations"
ON public.template_package_activations
FOR SELECT
USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()));

-- Users can request activation for their company
CREATE POLICY "Users can request activation"
ON public.template_package_activations
FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- Only super_admin can update activations (approve/reject)
CREATE POLICY "Super admin can update activations"
ON public.template_package_activations
FOR UPDATE
USING (is_super_admin(auth.uid()));

-- Users can delete their pending activations
CREATE POLICY "Users can delete pending activations"
ON public.template_package_activations
FOR DELETE
USING (company_id = get_user_company_id(auth.uid()) AND status = 'pending');

-- Create trigger for updated_at
CREATE TRIGGER update_template_packages_updated_at
BEFORE UPDATE ON public.template_packages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();