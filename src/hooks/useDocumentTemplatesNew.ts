import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

export interface Placeholder {
  key: string;
  label: string;
}

export interface ConditionalBlock {
  id: string;
  condition: string;
  content: string;
}

export interface DocumentTemplate {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  document_type: string;
  gamp_category: string | null;
  system_name: string | null;
  content: string | null;
  version: string;
  is_active: boolean | null;
  is_default: boolean | null;
  parent_template_id: string | null;
  placeholders: Placeholder[];
  conditional_blocks: ConditionalBlock[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TemplateVersion {
  id: string;
  template_id: string;
  company_id: string;
  version: string;
  content: string | null;
  change_summary: string | null;
  created_by: string | null;
  created_at: string;
}

export function useDocumentTemplatesNew() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: templates, isLoading, error } = useQuery({
    queryKey: ["document-templates-new", user?.id],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user!.id)
        .single();

      if (!profile?.company_id) throw new Error("Empresa não encontrada");

      const { data, error } = await supabase
        .from("document_templates")
        .select("*")
        .eq("company_id", profile.company_id)
        .order("document_type")
        .order("name");

      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        placeholders: Array.isArray(item.placeholders) 
          ? item.placeholders as unknown as Placeholder[]
          : [],
        conditional_blocks: Array.isArray(item.conditional_blocks)
          ? item.conditional_blocks as unknown as ConditionalBlock[]
          : []
      })) as DocumentTemplate[];
    },
    enabled: !!user,
  });

  const addTemplate = useMutation({
    mutationFn: async (template: Omit<DocumentTemplate, "id" | "company_id" | "created_at" | "updated_at">) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user!.id)
        .single();

      if (!profile?.company_id) throw new Error("Empresa não encontrada");

      const { data, error } = await supabase
        .from("document_templates")
        .insert({
          ...template,
          company_id: profile.company_id,
          created_by: user!.id,
          placeholders: template.placeholders as unknown as Json,
          conditional_blocks: template.conditional_blocks as unknown as Json,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-templates-new"] });
      toast.success("Template criado com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao criar template: " + error.message);
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ 
      id, 
      updates, 
      createVersion = false,
      changeSummary 
    }: { 
      id: string; 
      updates: Partial<DocumentTemplate>;
      createVersion?: boolean;
      changeSummary?: string;
    }) => {
      // Get current template for versioning
      if (createVersion) {
        const { data: currentTemplate } = await supabase
          .from("document_templates")
          .select("*")
          .eq("id", id)
          .single();

        if (currentTemplate) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("company_id")
            .eq("id", user!.id)
            .single();

          // Save current version
          await supabase
            .from("template_versions")
            .insert({
              template_id: id,
              company_id: profile!.company_id,
              version: currentTemplate.version,
              content: currentTemplate.content,
              change_summary: changeSummary,
              created_by: user!.id,
            });
        }
      }

      const { error } = await supabase
        .from("document_templates")
        .update({
          ...updates,
          placeholders: updates.placeholders as unknown as Json,
          conditional_blocks: updates.conditional_blocks as unknown as Json,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-templates-new"] });
      queryClient.invalidateQueries({ queryKey: ["template-versions"] });
      toast.success("Template atualizado com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar template: " + error.message);
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("document_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-templates-new"] });
      toast.success("Template removido com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao remover template: " + error.message);
    },
  });

  const cloneTemplate = useMutation({
    mutationFn: async ({ templateId, newName }: { templateId: string; newName: string }) => {
      const { data: original, error: fetchError } = await supabase
        .from("document_templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (fetchError) throw fetchError;

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user!.id)
        .single();

      if (!profile?.company_id) throw new Error("Empresa não encontrada");

      const { data, error } = await supabase
        .from("document_templates")
        .insert({
          company_id: profile.company_id,
          name: newName,
          description: original.description,
          document_type: original.document_type,
          gamp_category: original.gamp_category,
          system_name: original.system_name,
          content: original.content,
          version: "1.0",
          is_active: true,
          is_default: false,
          parent_template_id: templateId,
          placeholders: original.placeholders,
          conditional_blocks: original.conditional_blocks,
          created_by: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-templates-new"] });
      toast.success("Template clonado com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao clonar template: " + error.message);
    },
  });

  const loadDefaultTemplates = useMutation({
    mutationFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user!.id)
        .single();

      if (!profile?.company_id) throw new Error("Empresa não encontrada");

      const { error } = await supabase.rpc("populate_default_document_templates", {
        _company_id: profile.company_id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-templates-new"] });
      toast.success("Templates padrão carregados com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao carregar templates: " + error.message);
    },
  });

  return {
    templates,
    isLoading,
    error,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    cloneTemplate,
    loadDefaultTemplates,
  };
}

export function useTemplateVersions(templateId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["template-versions", templateId],
    queryFn: async () => {
      if (!templateId) return [];

      const { data, error } = await supabase
        .from("template_versions")
        .select("*, created_by_profile:profiles!template_versions_created_by_fkey(full_name)")
        .eq("template_id", templateId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as (TemplateVersion & { created_by_profile: { full_name: string } | null })[];
    },
    enabled: !!user && !!templateId,
  });
}
