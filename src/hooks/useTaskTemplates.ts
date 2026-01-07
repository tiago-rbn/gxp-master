import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface TaskTemplate {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  phase: string | null;
  gamp_category: string;
  estimated_hours: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useTaskTemplates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ["task-templates", user?.id],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user!.id)
        .single();

      if (!profile?.company_id) throw new Error("Empresa não encontrada");

      const { data, error } = await supabase
        .from("task_templates")
        .select("*")
        .eq("company_id", profile.company_id)
        .order("gamp_category")
        .order("sort_order");

      if (error) throw error;
      return data as TaskTemplate[];
    },
    enabled: !!user,
  });

  const addTemplate = useMutation({
    mutationFn: async (template: Omit<TaskTemplate, "id" | "company_id" | "created_at" | "updated_at">) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user!.id)
        .single();

      if (!profile?.company_id) throw new Error("Empresa não encontrada");

      const { data, error } = await supabase
        .from("task_templates")
        .insert({ ...template, company_id: profile.company_id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-templates"] });
      toast.success("Template de tarefa criado com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao criar template: " + error.message);
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TaskTemplate> }) => {
      const { error } = await supabase
        .from("task_templates")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-templates"] });
      toast.success("Template atualizado com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar template: " + error.message);
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("task_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-templates"] });
      toast.success("Template removido com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao remover template: " + error.message);
    },
  });

  return {
    templates,
    isLoading,
    addTemplate,
    updateTemplate,
    deleteTemplate,
  };
}
