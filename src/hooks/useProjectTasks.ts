import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ProjectTask {
  id: string;
  project_id: string;
  company_id: string;
  name: string;
  description?: string | null;
  phase?: string | null;
  status: string;
  priority: string;
  assigned_to?: string | null;
  estimated_hours?: number | null;
  actual_hours?: number | null;
  due_date?: string | null;
  completed_at?: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  assignee?: { full_name: string } | null;
}

export interface TaskTemplate {
  id: string;
  company_id: string;
  gamp_category: string;
  name: string;
  description?: string | null;
  phase?: string | null;
  estimated_hours?: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useProjectTasks(projectId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["project-tasks", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("project_tasks")
        .select(`
          *,
          assignee:profiles!project_tasks_assigned_to_fkey(full_name)
        `)
        .eq("project_id", projectId)
        .order("sort_order");

      if (error) throw error;
      return data as ProjectTask[];
    },
    enabled: !!user && !!projectId,
  });

  const addTask = useMutation({
    mutationFn: async (task: Omit<ProjectTask, "id" | "company_id" | "created_at" | "updated_at" | "assignee">) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user!.id)
        .single();

      if (!profile?.company_id) throw new Error("Company not found");

      const { data, error } = await supabase
        .from("project_tasks")
        .insert({ ...task, company_id: profile.company_id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks", projectId] });
      toast.success("Tarefa adicionada com sucesso!");
    },
    onError: (error) => {
      console.error("Error adding task:", error);
      toast.error("Erro ao adicionar tarefa");
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProjectTask> & { id: string }) => {
      const updateData: any = { ...updates, updated_at: new Date().toISOString() };
      
      if (updates.status === "completed" && !updates.completed_at) {
        updateData.completed_at = new Date().toISOString();
      } else if (updates.status !== "completed") {
        updateData.completed_at = null;
      }

      const { data, error } = await supabase
        .from("project_tasks")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks", projectId] });
      toast.success("Tarefa atualizada com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating task:", error);
      toast.error("Erro ao atualizar tarefa");
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("project_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks", projectId] });
      toast.success("Tarefa removida com sucesso!");
    },
    onError: (error) => {
      console.error("Error deleting task:", error);
      toast.error("Erro ao remover tarefa");
    },
  });

  const applyTemplate = useMutation({
    mutationFn: async (gampCategory: string) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user!.id)
        .single();

      if (!profile?.company_id) throw new Error("Company not found");

      const { data: templates, error: templatesError } = await supabase
        .from("task_templates")
        .select("*")
        .eq("company_id", profile.company_id)
        .eq("gamp_category", gampCategory)
        .order("sort_order");

      if (templatesError) throw templatesError;

      if (!templates || templates.length === 0) {
        throw new Error("Nenhum template encontrado para esta categoria");
      }

      const tasksToInsert = templates.map((template, index) => ({
        project_id: projectId,
        company_id: profile.company_id,
        name: template.name,
        description: template.description,
        phase: template.phase,
        estimated_hours: template.estimated_hours,
        status: "pending",
        priority: "medium",
        sort_order: index,
      }));

      const { error } = await supabase
        .from("project_tasks")
        .insert(tasksToInsert);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks", projectId] });
      toast.success("Template aplicado com sucesso!");
    },
    onError: (error: any) => {
      console.error("Error applying template:", error);
      toast.error(error.message || "Erro ao aplicar template");
    },
  });

  return {
    tasks,
    isLoading,
    addTask,
    updateTask,
    deleteTask,
    applyTemplate,
  };
}

export function useTaskTemplates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["task-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_templates")
        .select("*")
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

      if (!profile?.company_id) throw new Error("Company not found");

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
      toast.success("Template de tarefa criado com sucesso!");
    },
    onError: (error) => {
      console.error("Error adding template:", error);
      toast.error("Erro ao criar template");
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TaskTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from("task_templates")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-templates"] });
      toast.success("Template atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating template:", error);
      toast.error("Erro ao atualizar template");
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("task_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-templates"] });
      toast.success("Template removido com sucesso!");
    },
    onError: (error) => {
      console.error("Error deleting template:", error);
      toast.error("Erro ao remover template");
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
