import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface TestCase {
  id: string;
  company_id: string;
  project_id: string | null;
  system_id: string | null;
  code: string;
  title: string;
  description: string | null;
  preconditions: string | null;
  steps: string | null;
  expected_results: string | null;
  status: string | null;
  executed_by: string | null;
  executed_at: string | null;
  result: string | null;
  created_at: string;
  updated_at: string;
  project?: { name: string } | null;
  system?: { name: string } | null;
  executor?: { full_name: string } | null;
}

export interface TestCaseInsert {
  code: string;
  title: string;
  description?: string | null;
  preconditions?: string | null;
  steps?: string | null;
  expected_results?: string | null;
  status?: string | null;
  result?: string | null;
  project_id?: string | null;
  system_id?: string | null;
}

export function useTestCases() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: testCases = [], isLoading, error } = useQuery({
    queryKey: ["test_cases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_cases")
        .select(`
          *,
          project:validation_projects(name),
          system:systems(name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch executor info separately
      const executorIds = [...new Set(data.filter(t => t.executed_by).map(t => t.executed_by))];
      let executors: Record<string, { full_name: string }> = {};
      
      if (executorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", executorIds);
        
        if (profiles) {
          executors = profiles.reduce((acc, p) => ({ ...acc, [p.id]: { full_name: p.full_name } }), {});
        }
      }
      
      return data.map(t => ({
        ...t,
        executor: t.executed_by ? executors[t.executed_by] : null
      })) as TestCase[];
    },
    enabled: !!user,
  });

  const createTestCase = useMutation({
    mutationFn: async (testCase: TestCaseInsert) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user!.id)
        .single();

      if (!profile?.company_id) throw new Error("Company not found");

      const { data, error } = await supabase
        .from("test_cases")
        .insert({ ...testCase, company_id: profile.company_id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test_cases"] });
      toast.success("Caso de teste criado com sucesso!");
    },
    onError: (error) => {
      console.error("Error creating test case:", error);
      toast.error("Erro ao criar caso de teste");
    },
  });

  const updateTestCase = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TestCaseInsert> & { id: string }) => {
      const { data, error } = await supabase
        .from("test_cases")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test_cases"] });
      toast.success("Caso de teste atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating test case:", error);
      toast.error("Erro ao atualizar caso de teste");
    },
  });

  const executeTestCase = useMutation({
    mutationFn: async ({ id, result }: { id: string; result: string }) => {
      const { data, error } = await supabase
        .from("test_cases")
        .update({ 
          result, 
          status: result === 'passed' ? 'passed' : result === 'failed' ? 'failed' : 'blocked',
          executed_by: user!.id,
          executed_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test_cases"] });
      toast.success("Caso de teste executado!");
    },
    onError: (error) => {
      console.error("Error executing test case:", error);
      toast.error("Erro ao executar caso de teste");
    },
  });

  const deleteTestCase = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("test_cases").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test_cases"] });
      toast.success("Caso de teste excluído com sucesso!");
    },
    onError: (error) => {
      console.error("Error deleting test case:", error);
      toast.error("Erro ao excluir caso de teste");
    },
  });

  const stats = {
    total: testCases.length,
    pending: testCases.filter(t => t.status === 'pending').length,
    passed: testCases.filter(t => t.status === 'passed').length,
    failed: testCases.filter(t => t.status === 'failed').length,
  };

  return {
    testCases,
    isLoading,
    error,
    stats,
    createTestCase,
    updateTestCase,
    executeTestCase,
    deleteTestCase,
  };
}
