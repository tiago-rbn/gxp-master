import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskIndicator } from "@/components/shared/RiskIndicator";
import { CheckCircle2, XCircle, Edit } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MitigationActionsTab } from "./MitigationActionsTab";

const riskLevelToOldFormat: Record<string, "High" | "Medium" | "Low"> = {
  critical: "High", high: "High", medium: "Medium", low: "Low",
};

const statusLabels: Record<string, string> = {
  draft: "Rascunho", pending: "Pendente", approved: "Aprovado",
  rejected: "Rejeitado", completed: "Concluído", cancelled: "Cancelado",
};

interface IRAViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  risk: any;
  onEdit: () => void;
}

export function IRAViewDialog({ open, onOpenChange, risk, onEdit }: IRAViewDialogProps) {
  if (!risk) return null;

  const riskLevel = riskLevelToOldFormat[risk.risk_level || "low"];
  const responses = risk.questionnaire_responses || [];
  const categories = Array.from(new Set(responses.map((r: any) => r.category)));
  const yesCount = responses.filter((r: any) => r.answer).length;
  const criticalYes = responses.filter((r: any) => r.isCritical && r.answer);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{risk.title}</DialogTitle>
          <DialogDescription>Avaliação de Risco Inicial (IRA)</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="questionnaire" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="questionnaire">Questionário</TabsTrigger>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="mitigation">Mitigação</TabsTrigger>
          </TabsList>

          <TabsContent value="questionnaire" className="space-y-4 pt-4">
            {/* Summary */}
            <Card className="border-2">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Resultado da IRA</p>
                    <div className="mt-1"><RiskIndicator level={riskLevel} size="lg" /></div>
                  </div>
                  <div className="text-right text-sm">
                    <p><strong>{yesCount}</strong> respostas "Sim" de {responses.length}</p>
                    {criticalYes.length > 0 && (
                      <p className="text-destructive font-medium">{criticalYes.length} pergunta(s) crítica(s) com "Sim"</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Responses by category */}
            {categories.map((category: string) => (
              <div key={category} className="space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">{category}</h4>
                {responses.filter((r: any) => r.category === category).map((r: any) => (
                  <Card key={r.id} className={r.answer && r.isCritical ? "border-destructive/50 bg-destructive/5" : ""}>
                    <CardContent className="p-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 flex-1">
                        {r.isCritical && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">CRÍTICA</Badge>}
                        <span className="text-sm">{r.question}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {r.answer ? (
                          <><CheckCircle2 className="h-4 w-4 text-destructive" /><span className="text-sm font-medium text-destructive">Sim</span></>
                        ) : (
                          <><XCircle className="h-4 w-4 text-success" /><span className="text-sm font-medium text-success">Não</span></>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="details" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Sistema</Label>
                <p className="font-medium">{risk.system?.name || "-"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <p><Badge variant="outline">{statusLabels[risk.status || "draft"]}</Badge></p>
              </div>
              <div>
                <Label className="text-muted-foreground">Responsável</Label>
                <p className="font-medium">{risk.assessor?.full_name || "Não definido"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Aprovador</Label>
                <p className="font-medium">{risk.approver?.full_name || "Não definido"}</p>
              </div>
            </div>
            {risk.description && (
              <div>
                <Label className="text-muted-foreground">Observações</Label>
                <p className="mt-1 rounded-lg bg-muted p-3">{risk.description}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="mitigation" className="pt-4">
            <MitigationActionsTab riskId={risk.id} />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          <Button onClick={onEdit}><Edit className="mr-2 h-4 w-4" />Editar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
