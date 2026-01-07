import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  user_id: string | null;
  company_id: string;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  created_at: string;
  user?: { full_name: string; email: string } | null;
}

export function useAuditLogs(filters?: {
  entity_type?: string;
  action?: string;
  from_date?: string;
  to_date?: string;
}) {
  const { user } = useAuth();

  const { data: auditLogs = [], isLoading, error, refetch } = useQuery({
    queryKey: ["audit_logs", filters],
    queryFn: async () => {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (filters?.entity_type) {
        query = query.eq("entity_type", filters.entity_type);
      }
      if (filters?.action) {
        query = query.eq("action", filters.action);
      }
      if (filters?.from_date) {
        query = query.gte("created_at", filters.from_date);
      }
      if (filters?.to_date) {
        query = query.lte("created_at", filters.to_date);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch user info separately
      const userIds = [...new Set(data.filter(l => l.user_id).map(l => l.user_id))];
      let users: Record<string, { full_name: string; email: string }> = {};

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);

        if (profiles) {
          users = profiles.reduce((acc, p) => ({ ...acc, [p.id]: { full_name: p.full_name, email: p.email } }), {});
        }
      }

      return data.map(log => ({
        ...log,
        user: log.user_id ? users[log.user_id] : null
      })) as AuditLog[];
    },
    enabled: !!user,
  });

  const entityTypes = [...new Set(auditLogs.map(l => l.entity_type))];
  const actions = [...new Set(auditLogs.map(l => l.action))];

  return {
    auditLogs,
    isLoading,
    error,
    refetch,
    entityTypes,
    actions,
  };
}
