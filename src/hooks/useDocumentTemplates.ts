import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface DocumentTemplate {
  id: string;
  company_id: string;
  name: string;
  document_type: string;
  content: string | null;
  version: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Since we don't have a templates table, we'll use company settings to store templates
export function useDocumentTemplates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // We'll store templates in company settings as JSON
  const { data: templates, isLoading, error } = useQuery({
    queryKey: ["document-templates", user?.id],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user!.id)
        .single();

      if (!profile?.company_id) throw new Error("Empresa não encontrada");

      const { data: company, error } = await supabase
        .from("companies")
        .select("settings")
        .eq("id", profile.company_id)
        .single();

      if (error) throw error;

      // Return templates from settings or default templates
      const settings = company?.settings as Record<string, unknown> | null;
      const savedTemplates = settings?.templates as DocumentTemplate[] | undefined;

      if (savedTemplates && savedTemplates.length > 0) {
        return savedTemplates;
      }

      // Default templates
      return [
        { id: "1", company_id: profile.company_id, name: "URS Template", document_type: "URS", content: null, version: "2.0", is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: "2", company_id: profile.company_id, name: "Functional Specification", document_type: "FS", content: null, version: "1.5", is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: "3", company_id: profile.company_id, name: "IQ Protocol", document_type: "IQ", content: null, version: "3.0", is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: "4", company_id: profile.company_id, name: "OQ Protocol", document_type: "OQ", content: null, version: "3.0", is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: "5", company_id: profile.company_id, name: "PQ Protocol", document_type: "PQ", content: null, version: "2.5", is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: "6", company_id: profile.company_id, name: "Validation Report", document_type: "Report", content: null, version: "1.0", is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      ] as DocumentTemplate[];
    },
    enabled: !!user,
  });

  const saveTemplates = useMutation({
    mutationFn: async (newTemplates: DocumentTemplate[]) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user!.id)
        .single();

      if (!profile?.company_id) throw new Error("Empresa não encontrada");

      const { data: company } = await supabase
        .from("companies")
        .select("settings")
        .eq("id", profile.company_id)
        .single();

      const currentSettings = (company?.settings as Record<string, unknown>) || {};
      const templatesAsJson = JSON.parse(JSON.stringify(newTemplates));

      const { error } = await supabase
        .from("companies")
        .update({
          settings: { ...currentSettings, templates: templatesAsJson },
        })
        .eq("id", profile.company_id);

      if (error) throw error;
      return newTemplates;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-templates"] });
    },
    onError: (error) => {
      toast.error("Erro ao salvar templates: " + error.message);
    },
  });

  const addTemplate = useMutation({
    mutationFn: async (template: Omit<DocumentTemplate, "id" | "created_at" | "updated_at">) => {
      const newTemplate: DocumentTemplate = {
        ...template,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updatedTemplates = [...(templates || []), newTemplate];
      await saveTemplates.mutateAsync(updatedTemplates);
      return newTemplate;
    },
    onSuccess: () => {
      toast.success("Template criado com sucesso");
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<DocumentTemplate> }) => {
      const updatedTemplates = (templates || []).map((t) =>
        t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t
      );
      await saveTemplates.mutateAsync(updatedTemplates);
    },
    onSuccess: () => {
      toast.success("Template atualizado com sucesso");
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const updatedTemplates = (templates || []).filter((t) => t.id !== id);
      await saveTemplates.mutateAsync(updatedTemplates);
    },
    onSuccess: () => {
      toast.success("Template removido com sucesso");
    },
  });

  return {
    templates,
    isLoading,
    error,
    addTemplate,
    updateTemplate,
    deleteTemplate,
  };
}
