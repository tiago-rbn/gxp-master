import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Document = Database["public"]["Tables"]["documents"]["Row"];
type DocumentInsert = Database["public"]["Tables"]["documents"]["Insert"];
type DocumentUpdate = Database["public"]["Tables"]["documents"]["Update"];

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
      .createSignedUrl(path, 3600); // 1 hour expiry

    if (error) throw error;
    return data.signedUrl;
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
    mutationFn: async ({ id, file, ...updates }: DocumentUpdate & { id: string; file?: File }) => {
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
      toast.success("Documento atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating document:", error);
      toast.error("Erro ao atualizar documento");
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (id: string) => {
      // First get the document to delete the file
      const { data: doc } = await supabase
        .from("documents")
        .select("file_url")
        .eq("id", id)
        .single();

      // Delete file from storage if exists
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

  // Stats calculation
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
  };
}
