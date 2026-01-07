import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ProjectDeliverable {
  id: string;
  project_id: string;
  company_id: string;
  name: string;
  description?: string | null;
  document_type?: string | null;
  status: string;
  is_mandatory: boolean;
  document_id?: string | null;
  due_date?: string | null;
  completed_at?: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  document?: { id: string; title: string; version: string } | null;
}

export interface DeliverableTemplate {
  id: string;
  company_id: string;
  gamp_category: string;
  name: string;
  description?: string | null;
  document_type?: string | null;
  is_mandatory: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useProjectDeliverables(projectId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: deliverables = [], isLoading } = useQuery({
    queryKey: ["project-deliverables", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("project_deliverables")
        .select(`
          *,
          document:documents(id, title, version)
        `)
        .eq("project_id", projectId)
        .order("sort_order");

      if (error) throw error;
      return data as ProjectDeliverable[];
    },
    enabled: !!user && !!projectId,
  });

  const addDeliverable = useMutation({
    mutationFn: async (deliverable: Omit<ProjectDeliverable, "id" | "company_id" | "created_at" | "updated_at" | "document">) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user!.id)
        .single();

      if (!profile?.company_id) throw new Error("Company not found");

      const { data, error } = await supabase
        .from("project_deliverables")
        .insert({ ...deliverable, company_id: profile.company_id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-deliverables", projectId] });
      toast.success("Entregável adicionado com sucesso!");
    },
    onError: (error) => {
      console.error("Error adding deliverable:", error);
      toast.error("Erro ao adicionar entregável");
    },
  });

  const updateDeliverable = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProjectDeliverable> & { id: string }) => {
      const { data, error } = await supabase
        .from("project_deliverables")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-deliverables", projectId] });
      toast.success("Entregável atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating deliverable:", error);
      toast.error("Erro ao atualizar entregável");
    },
  });

  const deleteDeliverable = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("project_deliverables").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-deliverables", projectId] });
      toast.success("Entregável removido com sucesso!");
    },
    onError: (error) => {
      console.error("Error deleting deliverable:", error);
      toast.error("Erro ao remover entregável");
    },
  });

  const linkDocument = useMutation({
    mutationFn: async ({ deliverableId, documentId }: { deliverableId: string; documentId: string | null }) => {
      const updates: any = { 
        document_id: documentId, 
        updated_at: new Date().toISOString() 
      };
      
      if (documentId) {
        updates.status = "completed";
        updates.completed_at = new Date().toISOString();
      } else {
        updates.status = "pending";
        updates.completed_at = null;
      }

      const { data, error } = await supabase
        .from("project_deliverables")
        .update(updates)
        .eq("id", deliverableId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-deliverables", projectId] });
      toast.success("Documento vinculado com sucesso!");
    },
    onError: (error) => {
      console.error("Error linking document:", error);
      toast.error("Erro ao vincular documento");
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

      // Get templates for the category
      const { data: templates, error: templatesError } = await supabase
        .from("deliverable_templates")
        .select("*")
        .eq("company_id", profile.company_id)
        .eq("gamp_category", gampCategory)
        .order("sort_order");

      if (templatesError) throw templatesError;

      if (!templates || templates.length === 0) {
        throw new Error("Nenhum template encontrado para esta categoria");
      }

      // Create deliverables from templates
      const deliverablesToInsert = templates.map((template, index) => ({
        project_id: projectId,
        company_id: profile.company_id,
        name: template.name,
        description: template.description,
        document_type: template.document_type,
        is_mandatory: template.is_mandatory,
        status: "pending",
        sort_order: index,
      }));

      const { error } = await supabase
        .from("project_deliverables")
        .insert(deliverablesToInsert);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-deliverables", projectId] });
      toast.success("Template aplicado com sucesso!");
    },
    onError: (error: any) => {
      console.error("Error applying template:", error);
      toast.error(error.message || "Erro ao aplicar template");
    },
  });

  return {
    deliverables,
    isLoading,
    addDeliverable,
    updateDeliverable,
    deleteDeliverable,
    linkDocument,
    applyTemplate,
  };
}

export function useDeliverableTemplates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["deliverable-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deliverable_templates")
        .select("*")
        .order("gamp_category")
        .order("sort_order");

      if (error) throw error;
      return data as DeliverableTemplate[];
    },
    enabled: !!user,
  });

  const addTemplate = useMutation({
    mutationFn: async (template: Omit<DeliverableTemplate, "id" | "company_id" | "created_at" | "updated_at">) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user!.id)
        .single();

      if (!profile?.company_id) throw new Error("Company not found");

      const { data, error } = await supabase
        .from("deliverable_templates")
        .insert({ ...template, company_id: profile.company_id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliverable-templates"] });
      toast.success("Template de entregável criado com sucesso!");
    },
    onError: (error) => {
      console.error("Error adding template:", error);
      toast.error("Erro ao criar template");
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DeliverableTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from("deliverable_templates")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliverable-templates"] });
      toast.success("Template atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating template:", error);
      toast.error("Erro ao atualizar template");
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("deliverable_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliverable-templates"] });
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
