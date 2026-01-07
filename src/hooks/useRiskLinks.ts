import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useRiskRequirementLinks(riskId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: links = [], isLoading } = useQuery({
    queryKey: ["risk_requirement_links", riskId],
    queryFn: async () => {
      const query = supabase
        .from("risk_requirement_links")
        .select(`
          *,
          requirement:requirements(id, code, title, type)
        `)
        .order("created_at", { ascending: false });

      if (riskId) {
        query.eq("risk_id", riskId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const addLink = useMutation({
    mutationFn: async ({ riskId, requirementId, companyId }: { riskId: string; requirementId: string; companyId: string }) => {
      const { data, error } = await supabase
        .from("risk_requirement_links")
        .insert({ risk_id: riskId, requirement_id: requirementId, company_id: companyId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk_requirement_links"] });
      toast.success("Requisito vinculado com sucesso!");
    },
    onError: (error) => {
      console.error("Error adding requirement link:", error);
      toast.error("Erro ao vincular requisito");
    },
  });

  const removeLink = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase
        .from("risk_requirement_links")
        .delete()
        .eq("id", linkId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk_requirement_links"] });
      toast.success("Vínculo removido com sucesso!");
    },
    onError: (error) => {
      console.error("Error removing requirement link:", error);
      toast.error("Erro ao remover vínculo");
    },
  });

  return { links, isLoading, addLink, removeLink };
}

export function useRiskTestCaseLinks(riskId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: links = [], isLoading } = useQuery({
    queryKey: ["risk_test_case_links", riskId],
    queryFn: async () => {
      const query = supabase
        .from("risk_test_case_links")
        .select(`
          *,
          test_case:test_cases(id, code, title, status)
        `)
        .order("created_at", { ascending: false });

      if (riskId) {
        query.eq("risk_id", riskId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const addLink = useMutation({
    mutationFn: async ({ riskId, testCaseId, companyId }: { riskId: string; testCaseId: string; companyId: string }) => {
      const { data, error } = await supabase
        .from("risk_test_case_links")
        .insert({ risk_id: riskId, test_case_id: testCaseId, company_id: companyId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk_test_case_links"] });
      toast.success("Caso de teste vinculado com sucesso!");
    },
    onError: (error) => {
      console.error("Error adding test case link:", error);
      toast.error("Erro ao vincular caso de teste");
    },
  });

  const removeLink = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase
        .from("risk_test_case_links")
        .delete()
        .eq("id", linkId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk_test_case_links"] });
      toast.success("Vínculo removido com sucesso!");
    },
    onError: (error) => {
      console.error("Error removing test case link:", error);
      toast.error("Erro ao remover vínculo");
    },
  });

  return { links, isLoading, addLink, removeLink };
}
