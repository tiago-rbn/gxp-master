import { useSystemVersionHistory } from "@/hooks/useSystemVersionHistory";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, History, AlertTriangle, CheckCircle } from "lucide-react";

interface SystemVersionHistoryTabProps {
  systemId: string;
}

export function SystemVersionHistoryTab({ systemId }: SystemVersionHistoryTabProps) {
  const { versionHistory, isLoading } = useSystemVersionHistory(systemId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (versionHistory.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Nenhum histórico de versão registrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {versionHistory.map((entry, index) => (
        <Card key={entry.id} className={index === 0 ? "border-primary/30" : ""}>
          <CardContent className="py-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="font-mono">
                    {entry.previous_version || "—"} → {entry.new_version}
                  </Badge>
                  {entry.has_bpx_impact && (
                    <Badge variant="outline" className="border-destructive/20 bg-destructive/10 text-destructive gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Impacto BPx
                    </Badge>
                  )}
                  {entry.ira_review_requested && (
                    <Badge variant="outline" className="border-warning/20 bg-warning/10 text-warning gap-1">
                      IRA Revisada
                    </Badge>
                  )}
                  {index === 0 && (
                    <Badge className="bg-primary/10 text-primary border-primary/20" variant="outline">
                      Atual
                    </Badge>
                  )}
                </div>
                <p className="text-sm mt-2">{entry.change_description}</p>
              </div>
              <div className="text-right text-sm text-muted-foreground ml-4 flex-shrink-0">
                <p>{new Date(entry.update_date).toLocaleDateString("pt-BR")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
