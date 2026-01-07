import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Document = Database["public"]["Tables"]["documents"]["Row"];
type DocumentInsert = Database["public"]["Tables"]["documents"]["Insert"];
type DocumentUpdate = Database["public"]["Tables"]["documents"]["Update"];

interface DocumentVersion {
  id: string;
  document_id: string;
  version: string;
  title: string;
  content: string | null;
  file_url: string | null;
  created_by: string | null;
  created_at: string;
  change_summary: string | null;
  creator?: { full_name: string } | null;
}

export function useDocuments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading, error } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select(`
          *,
          system:systems(name),
          author:profiles!documents_author_id_fkey(full_name),
          approver:profiles!documents_approved_by_fkey(full_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const uploadFile = async (file: File, companyId: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${companyId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(fileName, file);

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    return data.path;
  };

  const getFileUrl = (path: string) => {
    const { data } = supabase.storage
      .from('documents')
      .getPublicUrl(path);
    
    return data.publicUrl;
  };

  const getSignedUrl = async (path: string) => {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(path, 3600);

    if (error) throw error;
    return data.signedUrl;
  };

  // Save current version before updating
  const saveVersion = async (documentId: string, changeSummary?: string) => {
    const { data: currentDoc } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (!currentDoc) return;

    await supabase.from("document_versions").insert({
      document_id: documentId,
      company_id: currentDoc.company_id,
      version: currentDoc.version || "1.0",
      title: currentDoc.title,
      content: currentDoc.content,
      file_url: currentDoc.file_url,
      created_by: user?.id,
      change_summary: changeSummary,
    });
  };

  // Get version history for a document
  const useDocumentVersions = (documentId: string | null) => {
    return useQuery({
      queryKey: ["document-versions", documentId],
      queryFn: async () => {
        if (!documentId) return [];
        
        const { data, error } = await supabase
          .from("document_versions")
          .select("*")
          .eq("document_id", documentId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Fetch creator names separately
        const creatorIds = [...new Set(data.map(v => v.created_by).filter(Boolean))];
        let creatorsMap: Record<string, string> = {};
        
        if (creatorIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", creatorIds);
          
          creatorsMap = (profiles || []).reduce((acc, p) => {
            acc[p.id] = p.full_name;
            return acc;
          }, {} as Record<string, string>);
        }

        return data.map(v => ({
          ...v,
          creator: v.created_by ? { full_name: creatorsMap[v.created_by] || "Desconhecido" } : null,
        })) as DocumentVersion[];
      },
      enabled: !!documentId && !!user,
    });
  };

  const createDocument = useMutation({
    mutationFn: async ({ file, ...document }: Omit<DocumentInsert, "company_id"> & { file?: File }) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user!.id)
        .single();

      if (!profile?.company_id) throw new Error("Company not found");

      let fileUrl = null;
      if (file) {
        fileUrl = await uploadFile(file, profile.company_id);
      }

      const { data, error } = await supabase
        .from("documents")
        .insert({ 
          ...document, 
          company_id: profile.company_id,
          file_url: fileUrl,
          author_id: user!.id 
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Documento criado com sucesso!");
    },
    onError: (error) => {
      console.error("Error creating document:", error);
      toast.error("Erro ao criar documento");
    },
  });

  const updateDocument = useMutation({
    mutationFn: async ({ 
      id, 
      file, 
      changeSummary,
      ...updates 
    }: DocumentUpdate & { id: string; file?: File; changeSummary?: string }) => {
      // Save current version before updating
      await saveVersion(id, changeSummary);

      let fileUrl = updates.file_url;
      
      if (file) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("company_id")
          .eq("id", user!.id)
          .single();

        if (!profile?.company_id) throw new Error("Company not found");
        fileUrl = await uploadFile(file, profile.company_id);
      }

      const { data, error } = await supabase
        .from("documents")
        .update({ ...updates, file_url: fileUrl })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["document-versions"] });
      toast.success("Documento atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating document:", error);
      toast.error("Erro ao atualizar documento");
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (id: string) => {
      const { data: doc } = await supabase
        .from("documents")
        .select("file_url")
        .eq("id", id)
        .single();

      if (doc?.file_url) {
        await supabase.storage
          .from('documents')
          .remove([doc.file_url]);
      }

      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Documento excluído com sucesso!");
    },
    onError: (error) => {
      console.error("Error deleting document:", error);
      toast.error("Erro ao excluir documento");
    },
  });

  const stats = {
    total: documents.length,
    approved: documents.filter((d) => d.status === "approved").length,
    inReview: documents.filter((d) => d.status === "pending").length,
    draft: documents.filter((d) => d.status === "draft").length,
  };

  return {
    documents,
    isLoading,
    error,
    stats,
    createDocument,
    updateDocument,
    deleteDocument,
    getSignedUrl,
    useDocumentVersions,
  };
}
