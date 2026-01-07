import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Hook to fetch documents of type URS, FS, DS as requirement sources
export function useRequirementDocuments() {
  const { user } = useAuth();

  const { data: requirementDocuments = [], isLoading } = useQuery({
    queryKey: ["requirement_documents"],
    queryFn: async () => {
      // Document types that represent requirements
      const requirementTypes = ["URS", "FS", "DS", "SRS", "HRS", "FRS"];
      
      const { data, error } = await supabase
        .from("documents")
        .select(`
          id,
          title,
          document_type,
          version,
          status,
          system:systems(id, name),
          project:validation_projects!documents_project_id_fkey(id, name)
        `)
        .in("document_type", requirementTypes)
        .order("document_type", { ascending: true })
        .order("title", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Group documents by type for easy display
  const groupedDocuments = requirementDocuments.reduce((acc, doc) => {
    const type = doc.document_type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(doc);
    return acc;
  }, {} as Record<string, typeof requirementDocuments>);

  return { 
    requirementDocuments, 
    groupedDocuments,
    isLoading 
  };
}
