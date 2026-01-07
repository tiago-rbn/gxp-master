import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export interface DocumentType {
  id: string;
  code: string;
  name: string;
  description?: string;
  color?: string;
}

export const defaultDocumentTypes: DocumentType[] = [
  {
    id: "URS",
    code: "URS",
    name: "User Requirements Specification",
    description: "Requisitos do usuário para o sistema",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  {
    id: "FS",
    code: "FS",
    name: "Functional Specification",
    description: "Especificação funcional detalhada",
    color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  },
  {
    id: "DS",
    code: "DS",
    name: "Design Specification",
    description: "Especificação de design e arquitetura",
    color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  },
  {
    id: "IQ",
    code: "IQ",
    name: "Installation Qualification",
    description: "Plano e evidências da qualificação de instalação",
    color: "bg-green-500/10 text-green-600 border-green-500/20",
  },
  {
    id: "OQ",
    code: "OQ",
    name: "Operational Qualification",
    description: "Plano e evidências da qualificação operacional",
    color: "bg-teal-500/10 text-teal-600 border-teal-500/20",
  },
  {
    id: "PQ",
    code: "PQ",
    name: "Performance Qualification",
    description: "Plano e evidências da qualificação de performance",
    color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  },
  {
    id: "RTM",
    code: "RTM",
    name: "Requirements Traceability Matrix",
    description: "Matriz de rastreabilidade de requisitos",
    color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  },
  {
    id: "Report",
    code: "Report",
    name: "Validation Report",
    description: "Relatório consolidado de validação",
    color: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  },
];

export function useDocumentTypes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: documentTypes = defaultDocumentTypes, isLoading, error } = useQuery({
    queryKey: ["document-types", user?.id],
    queryFn: async () => {
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

      const settings = (company?.settings as Record<string, unknown>) || {};
      const savedTypes = settings.document_types as DocumentType[] | undefined;

      if (savedTypes && savedTypes.length > 0) {
        return savedTypes;
      }

      return defaultDocumentTypes;
    },
    enabled: !!user,
  });

  const persistDocumentTypes = useMutation({
    mutationFn: async (types: DocumentType[]) => {
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

      const { error } = await supabase
        .from("companies")
        .update({
          settings: { ...currentSettings, document_types: types } as unknown as { [key: string]: Json | undefined },
        })
        .eq("id", profile.company_id);

      if (error) throw error;
      return types;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-types"] });
    },
    onError: (error) => {
      toast.error("Erro ao salvar tipos de documento: " + error.message);
    },
  });

  const addDocumentType = useMutation({
    mutationFn: async (type: Omit<DocumentType, "id">) => {
      const normalizedCode = type.code.trim().toUpperCase();
      const exists = (documentTypes || []).some(
        (t) => t.code.toUpperCase() === normalizedCode
      );

      if (exists) {
        throw new Error("Já existe um tipo com esse código");
      }

      const newType: DocumentType = {
        ...type,
        id: crypto.randomUUID(),
        code: normalizedCode,
      };

      const updated = [...(documentTypes || []), newType];
      await persistDocumentTypes.mutateAsync(updated);
      return newType;
    },
    onSuccess: () => {
      toast.success("Tipo de documento criado com sucesso");
    },
  });

  const updateDocumentType = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<DocumentType, "id">>;
    }) => {
      const updated = (documentTypes || []).map((type) =>
        type.id === id
          ? {
              ...type,
              ...updates,
              code: updates.code ? updates.code.trim().toUpperCase() : type.code,
            }
          : type
      );
      await persistDocumentTypes.mutateAsync(updated);
    },
    onSuccess: () => {
      toast.success("Tipo de documento atualizado");
    },
  });

  const deleteDocumentType = useMutation({
    mutationFn: async (id: string) => {
      const updated = (documentTypes || []).filter((type) => type.id !== id);
      await persistDocumentTypes.mutateAsync(updated);
    },
    onSuccess: () => {
      toast.success("Tipo de documento removido");
    },
  });

  return {
    documentTypes,
    isLoading,
    error,
    addDocumentType,
    updateDocumentType,
    deleteDocumentType,
  };
}
