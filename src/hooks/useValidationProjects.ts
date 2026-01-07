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
      
      // Fetch approver info separately
      const approverIds = [...new Set(data.filter(p => p.approved_by).map(p => p.approved_by))];
      let approvers: Record<string, { full_name: string }> = {};
      
      if (approverIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", approverIds);
        
        if (profiles) {
          approvers = profiles.reduce((acc, p) => ({ ...acc, [p.id]: { full_name: p.full_name } }), {});
        }
      }
      
      return data.map(p => ({
        ...p,
        approver: p.approved_by ? approvers[p.approved_by] : null
      }));
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

  // Submit project for approval
  const submitForApproval = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("validation_projects")
        .update({ status: "pending" as any })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["validation_projects"] });
      toast.success("Projeto enviado para aprovação!");
    },
    onError: (error) => {
      console.error("Error submitting project:", error);
      toast.error("Erro ao enviar projeto para aprovação");
    },
  });

  // Approve project
  const approveProject = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("validation_projects")
        .update({ 
          status: "approved" as any,
          approved_by: user!.id,
          approved_at: new Date().toISOString(),
          rejection_reason: null
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["validation_projects"] });
      toast.success("Projeto aprovado!");
    },
    onError: (error) => {
      console.error("Error approving project:", error);
      toast.error("Erro ao aprovar projeto");
    },
  });

  // Reject project
  const rejectProject = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data, error } = await supabase
        .from("validation_projects")
        .update({ 
          status: "rejected" as any,
          approved_by: user!.id,
          approved_at: new Date().toISOString(),
          rejection_reason: reason
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["validation_projects"] });
      toast.success("Projeto rejeitado");
    },
    onError: (error) => {
      console.error("Error rejecting project:", error);
      toast.error("Erro ao rejeitar projeto");
    },
  });

  // Mark project as completed
  const completeProject = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("validation_projects")
        .update({ 
          status: "completed" as any,
          progress: 100,
          completion_date: new Date().toISOString().split('T')[0]
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["validation_projects"] });
      toast.success("Projeto concluído!");
    },
    onError: (error) => {
      console.error("Error completing project:", error);
      toast.error("Erro ao concluir projeto");
    },
  });

  return {
    projects,
    isLoading,
    error,
    createProject,
    updateProject,
    deleteProject,
    submitForApproval,
    approveProject,
    rejectProject,
    completeProject,
  };
}
