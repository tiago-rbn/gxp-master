import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskIndicator } from "@/components/shared/RiskIndicator";
import type { Database } from "@/integrations/supabase/types";

type RiskAssessment = Database["public"]["Tables"]["risk_assessments"]["Row"] & {
  system?: { name: string } | null;
  assessor?: { full_name: string } | null;
};

interface RiskViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  risk: RiskAssessment | null;
  onEdit: () => void;
}

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const riskLevelToOldFormat: Record<string, "High" | "Medium" | "Low"> = {
  critical: "High",
  high: "High",
  medium: "Medium",
  low: "Low",
};

// Risk Matrix Component
function RiskMatrix({ probability, severity }: { probability: number; severity: number }) {
  // Convert 1-10 scale to 1-3 for matrix display
  const probLevel = Math.ceil(probability / 3.33);
  const sevLevel = Math.ceil(severity / 3.33);
  
  const cells = [];
  for (let s = 3; s >= 1; s--) {
    for (let p = 1; p <= 3; p++) {
      const isActive = p === probLevel && s === sevLevel;
      const riskScore = p * s;
      let color = "bg-success/20";
      if (riskScore >= 6) color = "bg-risk-high/20";
      else if (riskScore >= 3) color = "bg-risk-medium/20";
      
      cells.push(
        <div
          key={`${p}-${s}`}
          className={`flex h-10 w-10 items-center justify-center rounded border ${color} ${
            isActive ? "ring-2 ring-primary ring-offset-2" : ""
          }`}
        >
          {isActive && <div className="h-4 w-4 rounded-full bg-primary" />}
        </div>
      );
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="grid grid-cols-3 gap-1">{cells}</div>
      <div className="flex justify-between w-full text-xs text-muted-foreground mt-1">
        <span>Baixa</span>
        <span>Probabilidade</span>
        <span>Alta</span>
      </div>
    </div>
  );
}

export function RiskViewDialog({
  open,
  onOpenChange,
  risk,
  onEdit,
}: RiskViewDialogProps) {
  if (!risk) return null;

  const riskLevel = riskLevelToOldFormat[risk.risk_level || "low"];
  const residualLevel = riskLevelToOldFormat[risk.residual_risk || "low"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{risk.title}</DialogTitle>
          <DialogDescription>
            {risk.assessment_type === "IRA"
              ? "Avaliação de Risco Inicial"
              : risk.assessment_type === "FRA"
              ? "Avaliação de Risco Funcional"
              : risk.assessment_type}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="matrix">Matriz de Risco</TabsTrigger>
            <TabsTrigger value="controls">Controles</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Sistema</Label>
                <p className="font-medium">{risk.system?.name || "-"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Tipo</Label>
                <p className="font-medium">
                  <Badge variant="outline">{risk.assessment_type}</Badge>
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Probabilidade</Label>
                <p className="font-medium">{risk.probability || 0} / 10</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Severidade</Label>
                <p className="font-medium">{risk.severity || 0} / 10</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Detectabilidade</Label>
                <p className="font-medium">{risk.detectability || 0} / 10</p>
              </div>
              <div>
                <Label className="text-muted-foreground">RPN</Label>
                <p className="font-medium">
                  {(risk.probability || 1) * (risk.severity || 1) * (risk.detectability || 1)}
                </p>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <div>
                <Label className="text-muted-foreground">Nível de Risco</Label>
                <div className="mt-1">
                  <RiskIndicator level={riskLevel} size="lg" />
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <div className="mt-1">
                  <Badge variant="outline">{statusLabels[risk.status || "draft"]}</Badge>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Avaliador</Label>
                <p className="font-medium mt-1">{risk.assessor?.full_name || "-"}</p>
              </div>
            </div>

            {risk.description && (
              <div className="pt-4">
                <Label className="text-muted-foreground">Descrição</Label>
                <p className="mt-1 rounded-lg bg-muted p-3">{risk.description}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="matrix" className="pt-4">
            <div className="flex flex-col items-center gap-6">
              <Card className="p-6">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-center text-lg">Matriz de Risco</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <RiskMatrix
                    probability={risk.probability || 5}
                    severity={risk.severity || 5}
                  />
                </CardContent>
              </Card>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-risk-low/20" />
                  <span>Baixo</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-risk-medium/20" />
                  <span>Médio</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-risk-high/20" />
                  <span>Alto</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="controls" className="space-y-4 pt-4">
            <div>
              <Label className="text-muted-foreground">Controles Implementados</Label>
              <p className="mt-1 rounded-lg bg-muted p-3">
                {risk.controls || "Nenhum controle registrado"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <Label className="text-muted-foreground">Risco Residual</Label>
                <div className="mt-1">
                  <RiskIndicator level={residualLevel} size="lg" />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={onEdit}>Editar Avaliação</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
