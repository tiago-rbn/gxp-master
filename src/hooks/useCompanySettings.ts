import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { DocumentType } from "@/hooks/useDocumentTypes";

export interface CompanySettings {
  id: string;
  name: string;
  cnpj: string | null;
  logo_url: string | null;
  settings: {
    address?: string;
    phone?: string;
    risk_threshold?: number;
    auto_revalidation?: boolean;
    notify_high_risks?: boolean;
    require_dual_approval?: boolean;
    critical_revalidation_months?: number;
    non_critical_revalidation_months?: number;
    revalidation_alert_days?: number;
    document_expiration_days?: number;
    document_types?: DocumentType[];
  } | null;
}

export function useCompanySettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: company, isLoading, error } = useQuery({
    queryKey: ["company-settings", user?.id],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user!.id)
        .single();

      if (!profile?.company_id) throw new Error("Empresa não encontrada");

      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", profile.company_id)
        .single();

      if (error) throw error;
      return data as CompanySettings;
    },
    enabled: !!user,
  });

  const updateCompany = useMutation({
    mutationFn: async (updates: Partial<CompanySettings>) => {
      if (!company?.id) throw new Error("Empresa não encontrada");

      const { data, error } = await supabase
        .from("companies")
        .update({
          name: updates.name,
          cnpj: updates.cnpj,
          logo_url: updates.logo_url,
          settings: updates.settings,
        })
        .eq("id", company.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-settings"] });
      toast.success("Configurações atualizadas com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar configurações: " + error.message);
    },
  });

  return {
    company,
    isLoading,
    error,
    updateCompany,
  };
}
