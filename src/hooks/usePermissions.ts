import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface PermissionRow {
  id?: string;
  company_id?: string;
  module: string;
  admin_access: boolean;
  validator_access: boolean;
  responsible_access: boolean;
  reader_access: boolean;
}

const DEFAULT_PERMISSIONS: Omit<PermissionRow, "id" | "company_id">[] = [
  { module: "Dashboard", admin_access: true, validator_access: true, responsible_access: true, reader_access: true },
  { module: "Inventário de Sistemas", admin_access: true, validator_access: true, responsible_access: true, reader_access: true },
  { module: "Criar/Editar Sistemas", admin_access: true, validator_access: true, responsible_access: false, reader_access: false },
  { module: "Gerenciamento de Riscos", admin_access: true, validator_access: true, responsible_access: true, reader_access: true },
  { module: "Criar/Editar Riscos", admin_access: true, validator_access: true, responsible_access: false, reader_access: false },
  { module: "Projetos de Validação", admin_access: true, validator_access: true, responsible_access: true, reader_access: true },
  { module: "Criar/Editar Projetos", admin_access: true, validator_access: true, responsible_access: false, reader_access: false },
  { module: "Documentação", admin_access: true, validator_access: true, responsible_access: true, reader_access: true },
  { module: "Aprovar Documentos", admin_access: true, validator_access: true, responsible_access: false, reader_access: false },
  { module: "Gerenciamento de Mudanças", admin_access: true, validator_access: true, responsible_access: true, reader_access: true },
  { module: "Configurações", admin_access: true, validator_access: false, responsible_access: false, reader_access: false },
];

export function usePermissions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: userRole } = useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data?.role || "reader";
    },
    enabled: !!user,
  });

  const canEditPermissions = userRole === "admin" || userRole === "super_admin";

  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ["permissions-matrix"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("permissions_matrix")
        .select("*")
        .order("module");

      if (error) throw error;

      // If no permissions exist, return defaults
      if (data.length === 0) {
        return DEFAULT_PERMISSIONS;
      }

      return data as PermissionRow[];
    },
    enabled: !!user,
  });

  const savePermissions = useMutation({
    mutationFn: async (permissionsData: PermissionRow[]) => {
      // Get user's company_id
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user!.id)
        .single();

      if (!profile?.company_id) throw new Error("Company not found");

      // Upsert all permissions
      for (const perm of permissionsData) {
        const { error } = await supabase
          .from("permissions_matrix")
          .upsert({
            company_id: profile.company_id,
            module: perm.module,
            admin_access: perm.admin_access,
            validator_access: perm.validator_access,
            responsible_access: perm.responsible_access,
            reader_access: perm.reader_access,
          }, {
            onConflict: "company_id,module",
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions-matrix"] });
      toast.success("Permissões salvas com sucesso!");
    },
    onError: (error) => {
      console.error("Error saving permissions:", error);
      toast.error("Erro ao salvar permissões");
    },
  });

  return {
    permissions,
    isLoading,
    savePermissions,
    canEditPermissions,
    userRole,
  };
}
