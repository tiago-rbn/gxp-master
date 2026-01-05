import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type ChangeRequest = Database["public"]["Tables"]["change_requests"]["Row"];
type ChangeRequestInsert = Database["public"]["Tables"]["change_requests"]["Insert"];
type ChangeRequestUpdate = Database["public"]["Tables"]["change_requests"]["Update"];

export interface ChangeRequestWithRelations extends ChangeRequest {
  systems?: { id: string; name: string } | null;
  requester?: { id: string; full_name: string } | null;
  approver?: { id: string; full_name: string } | null;
}

export function useChangeRequests() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: changeRequests = [], isLoading, error } = useQuery({
    queryKey: ["change_requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("change_requests")
        .select(`
          *,
          systems:system_id(id, name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch requester and approver profiles separately to avoid ambiguous relationship
      const requestsWithProfiles = await Promise.all(
        (data || []).map(async (request) => {
          let requester = null;
          let approver = null;
          
          if (request.requester_id) {
            const { data: requesterData } = await supabase
              .from("profiles")
              .select("id, full_name")
              .eq("id", request.requester_id)
              .maybeSingle();
            requester = requesterData;
          }
          
          if (request.approver_id) {
            const { data: approverData } = await supabase
              .from("profiles")
              .select("id, full_name")
              .eq("id", request.approver_id)
              .maybeSingle();
            approver = approverData;
          }
          
          return { ...request, requester, approver };
        })
      );
      
      return requestsWithProfiles as ChangeRequestWithRelations[];
    },
    enabled: !!user,
  });

  const createChangeRequest = useMutation({
    mutationFn: async (newRequest: Omit<ChangeRequestInsert, "company_id">) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      if (!profile?.company_id) {
        throw new Error("Empresa não encontrada");
      }

      const { data, error } = await supabase
        .from("change_requests")
        .insert({
          ...newRequest,
          company_id: profile.company_id,
          requester_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["change_requests"] });
      toast.success("Solicitação de mudança criada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar solicitação: ${error.message}`);
    },
  });

  const updateChangeRequest = useMutation({
    mutationFn: async ({ id, ...updates }: ChangeRequestUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("change_requests")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["change_requests"] });
      toast.success("Solicitação atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar solicitação: ${error.message}`);
    },
  });

  const deleteChangeRequest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("change_requests")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["change_requests"] });
      toast.success("Solicitação excluída com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir solicitação: ${error.message}`);
    },
  });

  const advanceStatus = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const statusFlow: Record<string, string> = {
        pending: "in_review",
        in_review: "approved",
        approved: "in_progress",
        in_progress: "completed",
      };

      const nextStatus = statusFlow[currentStatus];
      if (!nextStatus) {
        throw new Error("Não é possível avançar este status");
      }

      const updates: ChangeRequestUpdate = { status: nextStatus as any };
      
      if (nextStatus === "approved") {
        updates.approver_id = user?.id;
        updates.approved_at = new Date().toISOString();
      }
      
      if (nextStatus === "completed") {
        updates.implemented_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("change_requests")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["change_requests"] });
      toast.success("Status avançado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao avançar status: ${error.message}`);
    },
  });

  const stats = {
    pending: changeRequests.filter((c) => c.status === "pending" || c.status === "draft").length,
    in_review: changeRequests.filter((c) => c.status === "approved").length, // in_review maps to approved in db enum
    in_progress: changeRequests.filter((c) => c.status === "pending").length,
    completed: changeRequests.filter((c) => c.status === "completed").length,
  };

  return {
    changeRequests,
    isLoading,
    error,
    stats,
    createChangeRequest,
    updateChangeRequest,
    deleteChangeRequest,
    advanceStatus,
  };
}
