import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Company = Tables<"companies"> & {
  user_count?: number;
};

export function useCompanies() {
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

  const { data: companies, isLoading, error } = useQuery({
    queryKey: ["companies", isSuperAdmin],
    queryFn: async () => {
      if (!isSuperAdmin) {
        throw new Error("Acesso não autorizado");
      }

      const { data: companiesData, error: companiesError } = await supabase
        .from("companies")
        .select("*")
        .order("name");

      if (companiesError) throw companiesError;

      // Get user counts per company
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("company_id");

      const userCounts = new Map<string, number>();
      profilesData?.forEach(p => {
        if (p.company_id) {
          userCounts.set(p.company_id, (userCounts.get(p.company_id) || 0) + 1);
        }
      });

      return companiesData.map(c => ({
        ...c,
        user_count: userCounts.get(c.id) || 0,
      })) as Company[];
    },
    enabled: !!user && isSuperAdmin === true,
  });

  const createCompany = useMutation({
    mutationFn: async (data: { name: string; cnpj?: string; settings?: Record<string, any> }) => {
      const { data: company, error } = await supabase
        .from("companies")
        .insert({
          name: data.name,
          cnpj: data.cnpj || null,
          settings: data.settings || {},
        })
        .select()
        .single();

      if (error) throw error;
      return company;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Empresa criada com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao criar empresa: " + error.message);
    },
  });

  const updateCompany = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TablesUpdate<"companies"> }) => {
      const { data, error } = await supabase
        .from("companies")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Empresa atualizada com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar empresa: " + error.message);
    },
  });

  return {
    companies,
    isLoading,
    error,
    isSuperAdmin,
    createCompany,
    updateCompany,
  };
}
