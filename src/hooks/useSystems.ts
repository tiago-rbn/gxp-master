import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type System = Database["public"]["Tables"]["systems"]["Row"];
type SystemInsert = Database["public"]["Tables"]["systems"]["Insert"];
type SystemUpdate = Database["public"]["Tables"]["systems"]["Update"];

export function useSystems() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: systems = [], isLoading, error } = useQuery({
    queryKey: ["systems"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("systems")
        .select(`
          *,
          responsible:profiles!systems_responsible_id_fkey(full_name),
          system_owner:profiles!systems_system_owner_id_fkey(full_name),
          process_owner:profiles!systems_process_owner_id_fkey(full_name)
        `)
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createSystem = useMutation({
    mutationFn: async (system: Omit<SystemInsert, "company_id">) => {
      // Get user's company_id
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user!.id)
        .single();

      if (!profile?.company_id) throw new Error("Company not found");

      const { data, error } = await supabase
        .from("systems")
        .insert({ ...system, company_id: profile.company_id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["systems"] });
      toast.success("Sistema criado com sucesso!");
    },
    onError: (error) => {
      console.error("Error creating system:", error);
      toast.error("Erro ao criar sistema");
    },
  });

  const updateSystem = useMutation({
    mutationFn: async ({ id, ...updates }: SystemUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("systems")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["systems"] });
      toast.success("Sistema atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating system:", error);
      toast.error("Erro ao atualizar sistema");
    },
  });

  const deleteSystem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("systems").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["systems"] });
      toast.success("Sistema excluído com sucesso!");
    },
    onError: (error) => {
      console.error("Error deleting system:", error);
      toast.error("Erro ao excluir sistema");
    },
  });

  return {
    systems,
    isLoading,
    error,
    createSystem,
    updateSystem,
    deleteSystem,
  };
}

export function useProfiles() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .order("full_name");

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}
