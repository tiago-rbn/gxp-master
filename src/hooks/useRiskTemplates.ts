import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface RiskTemplatePackage {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  category: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  items?: RiskTemplateItem[];
}

export interface RiskTemplateItem {
  id: string;
  package_id: string;
  company_id: string;
  title: string;
  description: string | null;
  severity: number | null;
  probability: number | null;
  detectability: number | null;
  controls: string | null;
  tags: string[] | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

export function useRiskTemplates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ["risk_template_packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risk_template_packages")
        .select("*, items:risk_template_items(*)")
        .order("name");

      if (error) throw error;
      return data as RiskTemplatePackage[];
    },
    enabled: !!user,
  });

  const createPackage = useMutation({
    mutationFn: async (pkg: { name: string; description?: string; category?: string }) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user!.id)
        .single();
      if (!profile?.company_id) throw new Error("Company not found");

      const { data, error } = await supabase
        .from("risk_template_packages")
        .insert({ ...pkg, company_id: profile.company_id, created_by: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk_template_packages"] });
      toast.success("Pacote de riscos criado!");
    },
    onError: () => toast.error("Erro ao criar pacote"),
  });

  const updatePackage = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; description?: string; category?: string }) => {
      const { error } = await supabase
        .from("risk_template_packages")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk_template_packages"] });
      toast.success("Pacote atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar pacote"),
  });

  const deletePackage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("risk_template_packages")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk_template_packages"] });
      toast.success("Pacote excluído!");
    },
    onError: () => toast.error("Erro ao excluir pacote"),
  });

  const createItem = useMutation({
    mutationFn: async (item: { package_id: string; title: string; description?: string; severity?: number; probability?: number; detectability?: number; controls?: string; tags?: string[] }) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user!.id)
        .single();
      if (!profile?.company_id) throw new Error("Company not found");

      const { data, error } = await supabase
        .from("risk_template_items")
        .insert({ ...item, company_id: profile.company_id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk_template_packages"] });
      toast.success("Risco adicionado ao pacote!");
    },
    onError: () => toast.error("Erro ao adicionar risco"),
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; title?: string; description?: string; severity?: number; probability?: number; detectability?: number; controls?: string; tags?: string[] }) => {
      const { error } = await supabase
        .from("risk_template_items")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk_template_packages"] });
      toast.success("Risco atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar risco"),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("risk_template_items")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk_template_packages"] });
      toast.success("Risco removido do pacote!");
    },
    onError: () => toast.error("Erro ao remover risco"),
  });

  return {
    packages,
    isLoading,
    createPackage,
    updatePackage,
    deletePackage,
    createItem,
    updateItem,
    deleteItem,
  };
}
