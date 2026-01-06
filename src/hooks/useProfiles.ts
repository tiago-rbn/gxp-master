import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles"> & {
  role?: string;
};

export function useProfiles() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profiles, isLoading, error } = useQuery({
    queryKey: ["profiles", user?.id],
    queryFn: async () => {
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user!.id)
        .single();

      if (!currentProfile?.company_id) throw new Error("Empresa não encontrada");

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .eq("company_id", currentProfile.company_id)
        .order("full_name");

      if (profilesError) throw profilesError;

      // Fetch roles separately
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("user_id, role");

      const rolesMap = new Map(rolesData?.map(r => [r.user_id, r.role]) || []);

      return profilesData.map(p => ({
        ...p,
        role: rolesMap.get(p.id) || "reader",
      })) as Profile[];
    },
    enabled: !!user,
  });

  const updateProfile = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Tables<"profiles">> }) => {
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Usuário atualizado com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar usuário: " + error.message);
    },
  });

  const toggleUserStatus = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from("profiles")
        .update({ is_active: isActive })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success(variables.isActive ? "Usuário ativado" : "Usuário desativado");
    },
    onError: (error) => {
      toast.error("Erro ao alterar status: " + error.message);
    },
  });

  return {
    profiles,
    isLoading,
    error,
    updateProfile,
    toggleUserStatus,
  };
}
