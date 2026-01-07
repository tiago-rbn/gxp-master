import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useSystemIRA(systemId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["system_ira", systemId],
    queryFn: async () => {
      if (!systemId) return null;
      
      const { data, error } = await supabase
        .from("risk_assessments")
        .select(`
          id,
          title,
          risk_level,
          status,
          probability,
          severity,
          detectability,
          created_at,
          assessor:profiles!risk_assessments_assessor_id_fkey(full_name)
        `)
        .eq("system_id", systemId)
        .eq("assessment_type", "IRA")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!systemId,
  });
}

export function useSystemsWithIRAStatus() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["systems_with_ira_status"],
    queryFn: async () => {
      // Fetch all systems with all fields
      const { data: systems, error: systemsError } = await supabase
        .from("systems")
        .select(`
          *,
          responsible:profiles!systems_responsible_id_fkey(full_name),
          system_owner:profiles!systems_system_owner_id_fkey(full_name),
          process_owner:profiles!systems_process_owner_id_fkey(full_name)
        `)
        .order("name");

      if (systemsError) throw systemsError;

      // Fetch all IRAs
      const { data: iras, error: irasError } = await supabase
        .from("risk_assessments")
        .select("id, system_id, risk_level, status, probability, severity, detectability")
        .eq("assessment_type", "IRA");

      if (irasError) throw irasError;

      // Map IRAs to systems
      const iraMap = new Map();
      iras?.forEach((ira) => {
        if (ira.system_id && !iraMap.has(ira.system_id)) {
          iraMap.set(ira.system_id, ira);
        }
      });

      // Combine data
      return systems?.map((system) => ({
        ...system,
        ira: iraMap.get(system.id) || null,
        hasIRA: iraMap.has(system.id),
      })) || [];
    },
    enabled: !!user,
  });
}

export function calculateRiskScore(probability: number, severity: number, detectability: number): number {
  return probability * severity * detectability;
}

export function getRiskScoreLevel(score: number): "low" | "medium" | "high" | "critical" {
  if (score >= 500) return "critical";
  if (score >= 200) return "high";
  if (score >= 50) return "medium";
  return "low";
}

export function getRiskScoreColor(score: number): string {
  if (score >= 500) return "text-destructive font-bold";
  if (score >= 200) return "text-destructive";
  if (score >= 50) return "text-warning";
  return "text-success";
}
