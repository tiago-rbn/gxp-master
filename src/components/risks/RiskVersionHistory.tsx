import { useRiskVersions } from "@/hooks/useRiskVersions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, History, Clock } from "lucide-react";
import { RiskIndicator } from "@/components/shared/RiskIndicator";

const riskLevelToOldFormat: Record<string, "High" | "Medium" | "Low"> = {
  critical: "High", high: "High", medium: "Medium", low: "Low",
};

const statusLabels: Record<string, string> = {
  draft: "Rascunho", pending: "Pendente", approved: "Aprovado",
  rejected: "Rejeitado", completed: "Concluído", cancelled: "Cancelado",
};

interface RiskVersionHistoryProps {
  riskId: string;
}

export function RiskVersionHistory({ riskId }: RiskVersionHistoryProps) {
  const { versions, isLoading } = useRiskVersions(riskId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <History className="h-8 w-8 mb-2" />
        <p>Nenhum histórico de alteração registrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {versions.map((v: any, index: number) => {
        const riskLevel = riskLevelToOldFormat[v.risk_level || "low"];
        const rpn = (v.probability || 1) * (v.severity || 1) * (v.detectability || 1);

        return (
          <Card key={v.id} className={index === 0 ? "border-primary/30" : ""}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={index === 0 ? "default" : "outline"}>v{v.version}</Badge>
                  <span className="text-sm font-medium">{v.title}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {new Date(v.created_at).toLocaleString("pt-BR")}
                </div>
              </div>

              {v.change_summary && (
                <p className="text-sm text-muted-foreground bg-muted rounded p-2">
                  {v.change_summary}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Risco:</span>
                  <RiskIndicator level={riskLevel} size="sm" />
                </div>
                <span className="text-muted-foreground">RPN: {rpn}</span>
                <Badge variant="outline">{statusLabels[v.status || "draft"]}</Badge>
                {v.changed_by_profile?.full_name && (
                  <span className="text-muted-foreground">por {v.changed_by_profile.full_name}</span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
