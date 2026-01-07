import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface RTMLink {
  id: string;
  company_id: string;
  requirement_id: string;
  test_case_id: string;
  created_at: string;
  requirement?: {
    code: string;
    title: string;
    status: string | null;
  };
  test_case?: {
    code: string;
    title: string;
    status: string | null;
    result: string | null;
  };
}

export function useRTM() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: rtmLinks = [], isLoading, error } = useQuery({
    queryKey: ["rtm_links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rtm_links")
        .select(`
          *,
          requirement:requirements(code, title, status),
          test_case:test_cases(code, title, status, result)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as RTMLink[];
    },
    enabled: !!user,
  });

  const createLink = useMutation({
    mutationFn: async ({ requirement_id, test_case_id }: { requirement_id: string; test_case_id: string }) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user!.id)
        .single();

      if (!profile?.company_id) throw new Error("Company not found");

      const { data, error } = await supabase
        .from("rtm_links")
        .insert({ requirement_id, test_case_id, company_id: profile.company_id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rtm_links"] });
      toast.success("Link criado com sucesso!");
    },
    onError: (error: any) => {
      console.error("Error creating link:", error);
      if (error.code === '23505') {
        toast.error("Este link já existe!");
      } else {
        toast.error("Erro ao criar link");
      }
    },
  });

  const deleteLink = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rtm_links").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rtm_links"] });
      toast.success("Link removido com sucesso!");
    },
    onError: (error) => {
      console.error("Error deleting link:", error);
      toast.error("Erro ao remover link");
    },
  });

  // Calculate coverage stats
  const stats = {
    totalLinks: rtmLinks.length,
    coveredRequirements: new Set(rtmLinks.map(l => l.requirement_id)).size,
    testedRequirements: new Set(
      rtmLinks
        .filter(l => l.test_case?.status === 'passed' || l.test_case?.status === 'failed')
        .map(l => l.requirement_id)
    ).size,
    passedLinks: rtmLinks.filter(l => l.test_case?.result === 'passed').length,
    failedLinks: rtmLinks.filter(l => l.test_case?.result === 'failed').length,
  };

  return {
    rtmLinks,
    isLoading,
    error,
    stats,
    createLink,
    deleteLink,
  };
}
