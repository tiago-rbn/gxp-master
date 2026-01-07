import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserCompanies } from "@/hooks/useUserCompanies";
import { toast } from "sonner";

export interface TestEvidence {
  id: string;
  test_case_id: string;
  company_id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  evidence_type: string;
  uploaded_by: string | null;
  created_at: string;
  uploader?: { full_name: string } | null;
}

export interface TestEvidenceInsert {
  test_case_id: string;
  title: string;
  description?: string;
  file_url?: string;
  evidence_type?: string;
}

export function useTestEvidence(testCaseId?: string) {
  const { user } = useAuth();
  const { activeCompany } = useUserCompanies();
  const queryClient = useQueryClient();

  const { data: evidence = [], isLoading } = useQuery({
    queryKey: ["test_evidence", testCaseId],
    queryFn: async () => {
      const query = supabase
        .from("test_evidence")
        .select(`
          *,
          uploader:profiles!test_evidence_uploaded_by_fkey(full_name)
        `)
        .order("created_at", { ascending: false });

      if (testCaseId) {
        query.eq("test_case_id", testCaseId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TestEvidence[];
    },
    enabled: !!user,
  });

  const createEvidence = useMutation({
    mutationFn: async (evidenceData: TestEvidenceInsert) => {
      if (!activeCompany?.id) throw new Error("Empresa não selecionada");

      const { data, error } = await supabase
        .from("test_evidence")
        .insert({
          ...evidenceData,
          company_id: activeCompany.id,
          uploaded_by: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test_evidence"] });
      toast.success("Evidência adicionada com sucesso!");
    },
    onError: (error) => {
      console.error("Error creating test evidence:", error);
      toast.error("Erro ao adicionar evidência");
    },
  });

  const deleteEvidence = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("test_evidence")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test_evidence"] });
      toast.success("Evidência removida com sucesso!");
    },
    onError: (error) => {
      console.error("Error deleting test evidence:", error);
      toast.error("Erro ao remover evidência");
    },
  });

  return {
    evidence,
    isLoading,
    createEvidence,
    deleteEvidence,
  };
}
