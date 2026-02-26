import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useRiskVersions(riskAssessmentId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: versions = [], isLoading } = useQuery({
    queryKey: ["risk_assessment_versions", riskAssessmentId],
    queryFn: async () => {
      if (!riskAssessmentId) return [];
      const { data, error } = await supabase
        .from("risk_assessment_versions")
        .select("*, changed_by_profile:profiles!risk_assessment_versions_changed_by_fkey(full_name)")
        .eq("risk_assessment_id", riskAssessmentId)
        .order("created_at", { ascending: false });

      if (error) {
        // If the FK doesn't exist, try without join
        const { data: fallback, error: err2 } = await supabase
          .from("risk_assessment_versions")
          .select("*")
          .eq("risk_assessment_id", riskAssessmentId)
          .order("created_at", { ascending: false });
        if (err2) throw err2;
        return fallback;
      }
      return data;
    },
    enabled: !!user && !!riskAssessmentId,
  });

  const createVersion = useMutation({
    mutationFn: async (version: {
      risk_assessment_id: string;
      company_id: string;
      version: string;
      title: string;
      description?: string;
      assessment_type: string;
      system_id?: string;
      probability?: number;
      severity?: number;
      detectability?: number;
      risk_level?: string;
      residual_risk?: string;
      controls?: string;
      status?: string;
      tags?: string[];
      change_summary?: string;
      changed_by?: string;
    }) => {
      const { data, error } = await supabase
        .from("risk_assessment_versions")
        .insert(version)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk_assessment_versions", riskAssessmentId] });
    },
  });

  return { versions, isLoading, createVersion };
}
