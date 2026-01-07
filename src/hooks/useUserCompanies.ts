import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface UserCompany {
  id: string;
  user_id: string;
  company_id: string;
  is_primary: boolean;
  created_at: string;
  company?: {
    id: string;
    name: string;
    logo_url: string | null;
  };
}

export function useUserCompanies() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: userCompanies = [], isLoading } = useQuery({
    queryKey: ["user-companies", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("user_companies")
        .select(`
          id,
          user_id,
          company_id,
          is_primary,
          created_at,
          company:companies(id, name, logo_url)
        `)
        .eq("user_id", user.id);

      if (error) throw error;
      return data as unknown as UserCompany[];
    },
    enabled: !!user?.id,
  });

  const activeCompany = userCompanies.find((uc) => uc.is_primary)?.company || userCompanies[0]?.company;

  const switchCompany = useMutation({
    mutationFn: async (companyId: string) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase.rpc("switch_user_company", {
        _user_id: user.id,
        _company_id: companyId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-companies"] });
      queryClient.invalidateQueries({ queryKey: ["company-settings"] });
      // Invalidate all data queries to refresh with new company context
      queryClient.invalidateQueries();
      toast.success("Empresa alterada com sucesso");
    },
    onError: (error) => {
      console.error("Error switching company:", error);
      toast.error("Erro ao alterar empresa");
    },
  });

  return {
    userCompanies,
    activeCompany,
    isLoading,
    switchCompany,
    hasMultipleCompanies: userCompanies.length > 1,
  };
}

export function useAddUserToCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      companyId,
      setPrimary = false,
    }: {
      userId: string;
      companyId: string;
      setPrimary?: boolean;
    }) => {
      const { data, error } = await supabase.rpc("add_user_to_company", {
        _user_id: userId,
        _company_id: companyId,
        _set_primary: setPrimary,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["user-companies"] });
      toast.success("Usuário adicionado à empresa");
    },
    onError: (error) => {
      console.error("Error adding user to company:", error);
      toast.error("Erro ao adicionar usuário à empresa");
    },
  });
}

export function useRemoveUserFromCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      companyId,
    }: {
      userId: string;
      companyId: string;
    }) => {
      const { data, error } = await supabase.rpc("remove_user_from_company", {
        _user_id: userId,
        _company_id: companyId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["user-companies"] });
      toast.success("Usuário removido da empresa");
    },
    onError: (error) => {
      console.error("Error removing user from company:", error);
      toast.error("Erro ao remover usuário da empresa");
    },
  });
}