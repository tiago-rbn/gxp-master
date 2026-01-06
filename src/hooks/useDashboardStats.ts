import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DashboardStats {
  totalSystems: number;
  validatedSystems: number;
  highRisks: number;
  pendingChanges: number;
  totalDocuments: number;
  activeProjects: number;
  gampDistribution: {
    gamp1: number;
    gamp3: number;
    gamp4: number;
    gamp5: number;
  };
  projectStatus: {
    draft: number;
    pending: number;
    approved: number;
    completed: number;
    cancelled: number;
  };
  risksByLevel: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

export interface RecentSystem {
  id: string;
  name: string;
  gamp_category: string;
  validation_status: string | null;
  last_validation_date: string | null;
  next_revalidation_date: string | null;
}

export interface RecentRisk {
  id: string;
  title: string;
  risk_level: string | null;
  assessment_type: string;
  status: string | null;
  system?: { name: string } | null;
}

export interface RecentProject {
  id: string;
  name: string;
  status: string | null;
  progress: number | null;
  system?: { name: string } | null;
}

export interface RecentChange {
  id: string;
  title: string;
  status: string | null;
  priority: string | null;
  system?: { name: string } | null;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async (): Promise<DashboardStats> => {
      // Fetch all data in parallel
      const [systemsRes, risksRes, changesRes, documentsRes, projectsRes] = await Promise.all([
        supabase.from("systems").select("id, gamp_category, validation_status"),
        supabase.from("risk_assessments").select("id, risk_level, status"),
        supabase.from("change_requests").select("id, status"),
        supabase.from("documents").select("id"),
        supabase.from("validation_projects").select("id, status"),
      ]);

      const systems = systemsRes.data || [];
      const risks = risksRes.data || [];
      const changes = changesRes.data || [];
      const documents = documentsRes.data || [];
      const projects = projectsRes.data || [];

      // Calculate stats
      const totalSystems = systems.length;
      const validatedSystems = systems.filter(s => s.validation_status === "validated").length;
      
      const highRisks = risks.filter(
        r => (r.risk_level === "high" || r.risk_level === "critical") && 
             r.status !== "approved" && r.status !== "completed"
      ).length;
      
      const pendingChanges = changes.filter(
        c => c.status === "pending" || c.status === "approved"
      ).length;

      // GAMP distribution
      const gampDistribution = {
        gamp1: systems.filter(s => s.gamp_category === "1").length,
        gamp3: systems.filter(s => s.gamp_category === "3").length,
        gamp4: systems.filter(s => s.gamp_category === "4").length,
        gamp5: systems.filter(s => s.gamp_category === "5").length,
      };

      // Project status
      const projectStatus = {
        draft: projects.filter(p => p.status === "draft").length,
        pending: projects.filter(p => p.status === "pending").length,
        approved: projects.filter(p => p.status === "approved").length,
        completed: projects.filter(p => p.status === "completed").length,
        cancelled: projects.filter(p => p.status === "cancelled").length,
      };

      // Risks by level
      const risksByLevel = {
        low: risks.filter(r => r.risk_level === "low").length,
        medium: risks.filter(r => r.risk_level === "medium").length,
        high: risks.filter(r => r.risk_level === "high").length,
        critical: risks.filter(r => r.risk_level === "critical").length,
      };

      return {
        totalSystems,
        validatedSystems,
        highRisks,
        pendingChanges,
        totalDocuments: documents.length,
        activeProjects: projects.filter(p => p.status === "pending" || p.status === "approved").length,
        gampDistribution,
        projectStatus,
        risksByLevel,
      };
    },
  });
}

export function useUpcomingRevalidations() {
  return useQuery({
    queryKey: ["upcoming-revalidations"],
    queryFn: async (): Promise<RecentSystem[]> => {
      const { data, error } = await supabase
        .from("systems")
        .select("id, name, gamp_category, validation_status, last_validation_date, next_revalidation_date")
        .not("next_revalidation_date", "is", null)
        .order("next_revalidation_date", { ascending: true })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
  });
}

export function useRecentRisks() {
  return useQuery({
    queryKey: ["recent-risks"],
    queryFn: async (): Promise<RecentRisk[]> => {
      const { data, error } = await supabase
        .from("risk_assessments")
        .select("id, title, risk_level, assessment_type, status, system:systems(name)")
        .in("status", ["draft", "pending"])
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
  });
}

export function useActiveProjects() {
  return useQuery({
    queryKey: ["active-projects"],
    queryFn: async (): Promise<RecentProject[]> => {
      const { data, error } = await supabase
        .from("validation_projects")
        .select("id, name, status, progress, system:systems(name)")
        .in("status", ["pending", "approved", "draft"])
        .order("updated_at", { ascending: false })
        .limit(4);

      if (error) throw error;
      return data || [];
    },
  });
}

export function useRecentChanges() {
  return useQuery({
    queryKey: ["recent-changes"],
    queryFn: async (): Promise<RecentChange[]> => {
      const { data, error } = await supabase
        .from("change_requests")
        .select("id, title, status, priority, system:systems(name)")
        .in("status", ["pending", "approved"])
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
  });
}
