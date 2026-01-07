import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Invitation {
  id: string;
  company_id: string;
  email: string;
  role: string;
  token: string;
  status: string;
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
  invited_by: string | null;
  inviter?: {
    full_name: string;
  };
}

export function useInvitations() {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();

  const { data: invitations, isLoading, error } = useQuery({
    queryKey: ["invitations", user?.id],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user!.id)
        .single();

      if (!profile?.company_id) throw new Error("Empresa não encontrada");

      const { data, error } = await supabase
        .from("invitations")
        .select(`
          *,
          inviter:invited_by(full_name)
        `)
        .eq("company_id", profile.company_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Invitation[];
    },
    enabled: !!user,
  });

  const sendInvitation = useMutation({
    mutationFn: async ({
      email,
      role,
      companyId,
      companyName,
      inviterName,
      companyLogoUrl,
    }: {
      email: string;
      role: string;
      companyId: string;
      companyName: string;
      inviterName: string;
      companyLogoUrl?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("send-invitation", {
        body: { email, role, companyId, companyName, inviterName, companyLogoUrl },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      toast.success("Convite enviado com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao enviar convite");
    },
  });

  const cancelInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from("invitations")
        .update({ status: "cancelled" })
        .eq("id", invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      toast.success("Convite cancelado");
    },
    onError: (error) => {
      toast.error("Erro ao cancelar convite: " + error.message);
    },
  });

  const resendInvitation = useMutation({
    mutationFn: async (invitation: Invitation) => {
      // First, cancel the old invitation
      await supabase
        .from("invitations")
        .update({ status: "cancelled" })
        .eq("id", invitation.id);

      // Get company info
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id, full_name, companies(name, logo_url)")
        .eq("id", user!.id)
        .single();

      if (!profile) throw new Error("Perfil não encontrado");

      const companyData = profile.companies as unknown as { name: string; logo_url: string | null };

      // Send new invitation
      const { data, error } = await supabase.functions.invoke("send-invitation", {
        body: {
          email: invitation.email,
          role: invitation.role,
          companyId: profile.company_id,
          companyName: companyData?.name || "Empresa",
          inviterName: profile.full_name,
          companyLogoUrl: companyData?.logo_url,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      toast.success("Convite reenviado com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao reenviar convite");
    },
  });

  return {
    invitations,
    isLoading,
    error,
    sendInvitation,
    cancelInvitation,
    resendInvitation,
  };
}
