import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles"> & {
  role?: string;
  company_name?: string;
};

export function useProfiles() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check if user is super_admin
  const { data: isSuperAdmin } = useQuery({
    queryKey: ["is-super-admin", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "super_admin")
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  const { data: profiles, isLoading, error } = useQuery({
    queryKey: ["profiles", user?.id, isSuperAdmin],
    queryFn: async () => {
      let profilesQuery;

      if (isSuperAdmin) {
        // Super admin sees all profiles with company names
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("*, companies(name)")
          .order("full_name");

        if (profilesError) throw profilesError;

        // Fetch all roles
        const { data: rolesData } = await supabase
          .from("user_roles")
          .select("user_id, role");

        const rolesMap = new Map(rolesData?.map(r => [r.user_id, r.role]) || []);

        return profilesData.map(p => ({
          ...p,
          role: rolesMap.get(p.id) || "reader",
          company_name: (p.companies as { name: string } | null)?.name,
        })) as Profile[];
      } else {
        // Regular users only see their company's profiles
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

        // Fetch roles
        const { data: rolesData } = await supabase
          .from("user_roles")
          .select("user_id, role");

        const rolesMap = new Map(rolesData?.map(r => [r.user_id, r.role]) || []);

        return profilesData.map(p => ({
          ...p,
          role: rolesMap.get(p.id) || "reader",
        })) as Profile[];
      }
    },
    enabled: !!user && isSuperAdmin !== undefined,
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

  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);
      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: role as any });
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Perfil do usuário atualizado");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar perfil: " + error.message);
    },
  });

  return {
    profiles,
    isLoading,
    error,
    isSuperAdmin,
    updateProfile,
    toggleUserStatus,
    updateUserRole,
  };
}
