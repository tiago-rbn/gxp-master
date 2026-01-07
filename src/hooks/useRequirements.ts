import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Requirement {
  id: string;
  company_id: string;
  project_id: string | null;
  system_id: string | null;
  code: string;
  title: string;
  description: string | null;
  type: string | null;
  priority: string | null;
  status: string | null;
  source: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  project?: { name: string } | null;
  system?: { name: string } | null;
  creator?: { full_name: string } | null;
}

export interface RequirementInsert {
  code: string;
  title: string;
  description?: string | null;
  type?: string | null;
  priority?: string | null;
  status?: string | null;
  source?: string | null;
  project_id?: string | null;
  system_id?: string | null;
}

export function useRequirements() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: requirements = [], isLoading, error } = useQuery({
    queryKey: ["requirements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requirements")
        .select(`
          *,
          project:validation_projects(name),
          system:systems(name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch creator info separately
      const creatorIds = [...new Set(data.filter(r => r.created_by).map(r => r.created_by))];
      let creators: Record<string, { full_name: string }> = {};
      
      if (creatorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", creatorIds);
        
        if (profiles) {
          creators = profiles.reduce((acc, p) => ({ ...acc, [p.id]: { full_name: p.full_name } }), {});
        }
      }
      
      return data.map(r => ({
        ...r,
        creator: r.created_by ? creators[r.created_by] : null
      })) as Requirement[];
    },
    enabled: !!user,
  });

  const createRequirement = useMutation({
    mutationFn: async (requirement: RequirementInsert) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user!.id)
        .single();

      if (!profile?.company_id) throw new Error("Company not found");

      const { data, error } = await supabase
        .from("requirements")
        .insert({ 
          ...requirement, 
          company_id: profile.company_id,
          created_by: user!.id 
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requirements"] });
      toast.success("Requisito criado com sucesso!");
    },
    onError: (error) => {
      console.error("Error creating requirement:", error);
      toast.error("Erro ao criar requisito");
    },
  });

  const updateRequirement = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RequirementInsert> & { id: string }) => {
      const { data, error } = await supabase
        .from("requirements")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requirements"] });
      toast.success("Requisito atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating requirement:", error);
      toast.error("Erro ao atualizar requisito");
    },
  });

  const deleteRequirement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("requirements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requirements"] });
      toast.success("Requisito excluído com sucesso!");
    },
    onError: (error) => {
      console.error("Error deleting requirement:", error);
      toast.error("Erro ao excluir requisito");
    },
  });

  return {
    requirements,
    isLoading,
    error,
    createRequirement,
    updateRequirement,
    deleteRequirement,
  };
}
