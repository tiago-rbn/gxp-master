import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface VersionHistoryEntry {
  id: string;
  system_id: string;
  company_id: string;
  previous_version: string | null;
  new_version: string;
  change_description: string;
  update_date: string;
  has_bpx_impact: boolean;
  ira_review_requested: boolean;
  change_request_created: boolean;
  change_request_id: string | null;
  changed_by: string | null;
  created_at: string;
}

interface CreateVersionEntry {
  system_id: string;
  previous_version: string | null;
  new_version: string;
  change_description: string;
  update_date: string;
  has_bpx_impact?: boolean;
  ira_review_requested?: boolean;
  change_request_created?: boolean;
  change_request_id?: string | null;
}

export function useSystemVersionHistory(systemId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: versionHistory = [], isLoading } = useQuery({
    queryKey: ["system-version-history", systemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_version_history")
        .select("*")
        .eq("system_id", systemId!)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as VersionHistoryEntry[];
    },
    enabled: !!user && !!systemId,
  });

  const createVersionEntry = useMutation({
    mutationFn: async (entry: CreateVersionEntry) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user!.id)
        .single();

      if (!profile?.company_id) throw new Error("Company not found");

      const { data, error } = await supabase
        .from("system_version_history")
        .insert({
          ...entry,
          company_id: profile.company_id,
          changed_by: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-version-history"] });
      queryClient.invalidateQueries({ queryKey: ["systems"] });
    },
    onError: (error) => {
      console.error("Error creating version entry:", error);
      toast.error("Erro ao registrar mudança de versão");
    },
  });

  return {
    versionHistory,
    isLoading,
    createVersionEntry,
  };
}
