import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserCompanies } from "@/hooks/useUserCompanies";
import { toast } from "sonner";

export interface MitigationAction {
  id: string;
  risk_id: string;
  company_id: string;
  title: string;
  description: string | null;
  responsible_id: string | null;
  status: string;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  responsible?: { full_name: string } | null;
}

export interface MitigationActionInsert {
  risk_id: string;
  title: string;
  description?: string;
  responsible_id?: string;
  status?: string;
  due_date?: string;
}

export function useMitigationActions(riskId?: string) {
  const { user } = useAuth();
  const { activeCompany } = useUserCompanies();
  const queryClient = useQueryClient();

  const { data: mitigationActions = [], isLoading } = useQuery({
    queryKey: ["mitigation_actions", riskId],
    queryFn: async () => {
      const query = supabase
        .from("mitigation_actions")
        .select(`
          *,
          responsible:profiles!mitigation_actions_responsible_id_fkey(full_name)
        `)
        .order("created_at", { ascending: false });

      if (riskId) {
        query.eq("risk_id", riskId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MitigationAction[];
    },
    enabled: !!user,
  });

  const createMitigationAction = useMutation({
    mutationFn: async (action: MitigationActionInsert) => {
      if (!activeCompany?.id) throw new Error("Empresa não selecionada");

      const { data, error } = await supabase
        .from("mitigation_actions")
        .insert({
          ...action,
          company_id: activeCompany.id,
          responsible_id: action.responsible_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mitigation_actions"] });
      toast.success("Ação de mitigação criada com sucesso!");
    },
    onError: (error) => {
      console.error("Error creating mitigation action:", error);
      toast.error("Erro ao criar ação de mitigação");
    },
  });

  const updateMitigationAction = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<MitigationActionInsert>) => {
      const { data, error } = await supabase
        .from("mitigation_actions")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mitigation_actions"] });
      toast.success("Ação de mitigação atualizada com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating mitigation action:", error);
      toast.error("Erro ao atualizar ação de mitigação");
    },
  });

  const deleteMitigationAction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("mitigation_actions")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mitigation_actions"] });
      toast.success("Ação de mitigação removida com sucesso!");
    },
    onError: (error) => {
      console.error("Error deleting mitigation action:", error);
      toast.error("Erro ao remover ação de mitigação");
    },
  });

  const completeMitigationAction = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("mitigation_actions")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mitigation_actions"] });
      toast.success("Ação de mitigação concluída!");
    },
    onError: (error) => {
      console.error("Error completing mitigation action:", error);
      toast.error("Erro ao concluir ação de mitigação");
    },
  });

  return {
    mitigationActions,
    isLoading,
    createMitigationAction,
    updateMitigationAction,
    deleteMitigationAction,
    completeMitigationAction,
  };
}
