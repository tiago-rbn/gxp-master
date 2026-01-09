import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfiles } from "@/hooks/useProfiles";
import { useUserCompanies } from "@/hooks/useUserCompanies";
import { toast } from "sonner";

export interface TemplatePackage {
  id: string;
  name: string;
  description: string | null;
  system_name: string | null;
  gamp_category: string | null;
  application: string;
  price: number;
  document_count: number;
  created_by: string | null;
  company_id: string;
  is_published: boolean;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
  creator?: {
    full_name: string;
  };
  company?: {
    name: string;
  };
}

export interface TemplatePackageItem {
  id: string;
  package_id: string;
  template_id: string;
  sort_order: number;
  created_at: string;
  template?: {
    id: string;
    name: string;
    document_type: string;
    description: string | null;
  };
}

export interface TemplatePackageActivation {
  id: string;
  package_id: string;
  company_id: string;
  requested_by: string | null;
  approved_by: string | null;
  status: 'pending' | 'approved' | 'rejected';
  notes: string | null;
  requested_at: string;
  approved_at: string | null;
  package?: TemplatePackage;
  company?: {
    name: string;
  };
  requester?: {
    full_name: string;
  };
  approver?: {
    full_name: string;
  };
}

export const useTemplatePackages = () => {
  const { user } = useAuth();
  const { activeCompany } = useUserCompanies();
  const companyId = activeCompany?.id;
  const queryClient = useQueryClient();

  // Fetch all published packages (marketplace)
  const { data: publishedPackages, isLoading: publishedLoading } = useQuery({
    queryKey: ["template-packages", "published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("template_packages")
        .select(`
          *,
          creator:profiles!template_packages_created_by_fkey(full_name),
          company:companies!template_packages_company_id_fkey(name)
        `)
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as TemplatePackage[];
    },
  });

  // Fetch company's own packages
  const { data: myPackages, isLoading: myPackagesLoading } = useQuery({
    queryKey: ["template-packages", "my", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from("template_packages")
        .select(`
          *,
          creator:profiles!template_packages_created_by_fkey(full_name)
        `)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as TemplatePackage[];
    },
    enabled: !!companyId,
  });

  // Create package
  const createPackage = useMutation({
    mutationFn: async (pkg: Omit<TemplatePackage, 'id' | 'created_at' | 'updated_at' | 'creator' | 'company'>) => {
      const { data, error } = await supabase
        .from("template_packages")
        .insert(pkg)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template-packages"] });
      toast.success("Pacote de templates criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar pacote: ${error.message}`);
    },
  });

  // Update package
  const updatePackage = useMutation({
    mutationFn: async ({ id, ...pkg }: Partial<TemplatePackage> & { id: string }) => {
      const { data, error } = await supabase
        .from("template_packages")
        .update(pkg)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template-packages"] });
      toast.success("Pacote atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar pacote: ${error.message}`);
    },
  });

  // Delete package
  const deletePackage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("template_packages")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template-packages"] });
      toast.success("Pacote excluído com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir pacote: ${error.message}`);
    },
  });

  return {
    publishedPackages,
    publishedLoading,
    myPackages,
    myPackagesLoading,
    createPackage,
    updatePackage,
    deletePackage,
  };
};

export const usePackageItems = (packageId: string | null) => {
  const queryClient = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ["template-package-items", packageId],
    queryFn: async () => {
      if (!packageId) return [];
      
      const { data, error } = await supabase
        .from("template_package_items")
        .select(`
          *,
          template:document_templates(id, name, document_type, description)
        `)
        .eq("package_id", packageId)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as TemplatePackageItem[];
    },
    enabled: !!packageId,
  });

  const addItem = useMutation({
    mutationFn: async ({ packageId, templateId }: { packageId: string; templateId: string }) => {
      const { data, error } = await supabase
        .from("template_package_items")
        .insert({ package_id: packageId, template_id: templateId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template-package-items"] });
      queryClient.invalidateQueries({ queryKey: ["template-packages"] });
    },
  });

  const removeItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from("template_package_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template-package-items"] });
      queryClient.invalidateQueries({ queryKey: ["template-packages"] });
    },
  });

  return { items, isLoading, addItem, removeItem };
};

export const usePackageActivations = () => {
  const { user } = useAuth();
  const { activeCompany } = useUserCompanies();
  const { isSuperAdmin } = useProfiles();
  const companyId = activeCompany?.id;
  const queryClient = useQueryClient();

  // Fetch activations - super_admin sees all pending, users see their own
  const { data: activations, isLoading } = useQuery({
    queryKey: ["template-package-activations", companyId, isSuperAdmin],
    queryFn: async () => {
      let query = supabase
        .from("template_package_activations")
        .select(`
          *,
          package:template_packages(*),
          company:companies!template_package_activations_company_id_fkey(name),
          requester:profiles!template_package_activations_requested_by_fkey(full_name),
          approver:profiles!template_package_activations_approved_by_fkey(full_name)
        `)
        .order("requested_at", { ascending: false });

      if (!isSuperAdmin) {
        query = query.eq("company_id", companyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TemplatePackageActivation[];
    },
    enabled: !!companyId,
  });

  // Request activation
  const requestActivation = useMutation({
    mutationFn: async ({ packageId, requestedBy }: { packageId: string; requestedBy: string }) => {
      if (!companyId) throw new Error("Company not found");

      const { data, error } = await supabase
        .from("template_package_activations")
        .insert({
          package_id: packageId,
          company_id: companyId,
          requested_by: requestedBy,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template-package-activations"] });
      toast.success("Solicitação de ativação enviada! Aguarde aprovação do administrador.");
    },
    onError: (error: Error) => {
      if (error.message.includes("duplicate")) {
        toast.error("Já existe uma solicitação para este pacote.");
      } else {
        toast.error(`Erro ao solicitar ativação: ${error.message}`);
      }
    },
  });

  // Approve/reject activation (super_admin only)
  const updateActivation = useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      approvedBy,
      notes 
    }: { 
      id: string; 
      status: 'approved' | 'rejected'; 
      approvedBy: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from("template_package_activations")
        .update({
          status,
          approved_by: approvedBy,
          approved_at: new Date().toISOString(),
          notes,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["template-package-activations"] });
      toast.success(
        variables.status === 'approved' 
          ? "Pacote ativado com sucesso!" 
          : "Solicitação rejeitada."
      );
    },
    onError: (error: Error) => {
      toast.error(`Erro ao processar solicitação: ${error.message}`);
    },
  });

  // Check if package is already activated or pending for current company
  const getActivationStatus = (packageId: string) => {
    if (!activations) return null;
    return activations.find(a => a.package_id === packageId);
  };

  return {
    activations,
    isLoading,
    requestActivation,
    updateActivation,
    getActivationStatus,
    isSuperAdmin,
  };
};
