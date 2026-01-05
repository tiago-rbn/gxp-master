import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type RiskAssessment = Database["public"]["Tables"]["risk_assessments"]["Row"];
type RiskAssessmentInsert = Database["public"]["Tables"]["risk_assessments"]["Insert"];
type RiskAssessmentUpdate = Database["public"]["Tables"]["risk_assessments"]["Update"];

export function useRiskAssessments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: riskAssessments = [], isLoading, error } = useQuery({
    queryKey: ["risk_assessments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risk_assessments")
        .select(`
          *,
          system:systems(name),
          assessor:profiles!risk_assessments_assessor_id_fkey(full_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createRiskAssessment = useMutation({
    mutationFn: async (riskAssessment: Omit<RiskAssessmentInsert, "company_id">) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user!.id)
        .single();

      if (!profile?.company_id) throw new Error("Company not found");

      const { data, error } = await supabase
        .from("risk_assessments")
        .insert({ ...riskAssessment, company_id: profile.company_id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk_assessments"] });
      toast.success("Avaliação de risco criada com sucesso!");
    },
    onError: (error) => {
      console.error("Error creating risk assessment:", error);
      toast.error("Erro ao criar avaliação de risco");
    },
  });

  const updateRiskAssessment = useMutation({
    mutationFn: async ({ id, ...updates }: RiskAssessmentUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("risk_assessments")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk_assessments"] });
      toast.success("Avaliação de risco atualizada com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating risk assessment:", error);
      toast.error("Erro ao atualizar avaliação de risco");
    },
  });

  const deleteRiskAssessment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("risk_assessments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk_assessments"] });
      toast.success("Avaliação de risco excluída com sucesso!");
    },
    onError: (error) => {
      console.error("Error deleting risk assessment:", error);
      toast.error("Erro ao excluir avaliação de risco");
    },
  });

  // Stats calculation
  const stats = {
    high: riskAssessments.filter((r) => r.risk_level === "high").length,
    medium: riskAssessments.filter((r) => r.risk_level === "medium").length,
    low: riskAssessments.filter((r) => r.risk_level === "low").length,
    open: riskAssessments.filter((r) => r.status === "draft" || r.status === "pending").length,
  };

  return {
    riskAssessments,
    isLoading,
    error,
    stats,
    createRiskAssessment,
    updateRiskAssessment,
    deleteRiskAssessment,
  };
}

export function useSystemsForSelect() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["systems_select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("systems")
        .select("id, name")
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}
