import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type ValidationProject = Database["public"]["Tables"]["validation_projects"]["Row"];
type ValidationProjectInsert = Database["public"]["Tables"]["validation_projects"]["Insert"];
type ValidationProjectUpdate = Database["public"]["Tables"]["validation_projects"]["Update"];

export function useValidationProjects() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ["validation_projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("validation_projects")
        .select(`
          *,
          system:systems(name),
          manager:profiles!validation_projects_manager_id_fkey(full_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createProject = useMutation({
    mutationFn: async (project: Omit<ValidationProjectInsert, "company_id">) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user!.id)
        .single();

      if (!profile?.company_id) throw new Error("Company not found");

      const { data, error } = await supabase
        .from("validation_projects")
        .insert({ ...project, company_id: profile.company_id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["validation_projects"] });
      toast.success("Projeto criado com sucesso!");
    },
    onError: (error) => {
      console.error("Error creating project:", error);
      toast.error("Erro ao criar projeto");
    },
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, ...updates }: ValidationProjectUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("validation_projects")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["validation_projects"] });
      toast.success("Projeto atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating project:", error);
      toast.error("Erro ao atualizar projeto");
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("validation_projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["validation_projects"] });
      toast.success("Projeto excluído com sucesso!");
    },
    onError: (error) => {
      console.error("Error deleting project:", error);
      toast.error("Erro ao excluir projeto");
    },
  });

  return {
    projects,
    isLoading,
    error,
    createProject,
    updateProject,
    deleteProject,
  };
}
