import { useState } from "react";
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
import { useRiskRequirementLinks, useRiskTestCaseLinks } from "@/hooks/useRiskLinks";
import { useRequirements } from "@/hooks/useRequirements";
import { useTestCases } from "@/hooks/useTestCases";
import { useUserCompanies } from "@/hooks/useUserCompanies";
import { RiskTraceabilityTab } from "./RiskTraceabilityTab";
import { MitigationActionsTab } from "./MitigationActionsTab";
import { Plus, X, FileText, TestTube2, Tag } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Database } from "@/integrations/supabase/types";

type RiskAssessment = Database["public"]["Tables"]["risk_assessments"]["Row"] & {
  system?: { name: string } | null;
  assessor?: { full_name: string } | null;
  approver?: { full_name: string } | null;
  reviewer?: { full_name: string } | null;
  tags?: string[];
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

// GAMP5 Risk Matrix Component (5x5)
function RiskMatrix({ probability, severity }: { probability: number; severity: number }) {
  const cells = [];
  for (let s = 5; s >= 1; s--) {
    for (let p = 1; p <= 5; p++) {
      const isActive = p === probability && s === severity;
      const riskScore = p * s;
      let color = "bg-success/20";
      if (riskScore >= 16) color = "bg-risk-high/20";
      else if (riskScore >= 8) color = "bg-risk-medium/20";
      
      cells.push(
        <div
          key={`${p}-${s}`}
          className={`flex h-8 w-8 items-center justify-center rounded border text-[10px] ${color} ${
            isActive ? "ring-2 ring-primary ring-offset-1" : ""
          }`}
        >
          {isActive ? <div className="h-3 w-3 rounded-full bg-primary" /> : riskScore}
        </div>
      );
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground writing-mode-vertical -rotate-180 [writing-mode:vertical-rl]">Impacto</span>
        <div className="grid grid-cols-5 gap-1">{cells}</div>
      </div>
      <div className="flex justify-between w-full text-xs text-muted-foreground mt-1 pl-6">
        <span>1</span>
        <span>Probabilidade</span>
        <span>5</span>
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
  const { activeCompany } = useUserCompanies();
  const { links: requirementLinks, addLink: addRequirementLink, removeLink: removeRequirementLink } = useRiskRequirementLinks(risk?.id);
  const { links: testCaseLinks, addLink: addTestCaseLink, removeLink: removeTestCaseLink } = useRiskTestCaseLinks(risk?.id);
  const { requirements } = useRequirements();
  const { testCases } = useTestCases();

  const [selectedRequirement, setSelectedRequirement] = useState("");
  const [selectedTestCase, setSelectedTestCase] = useState("");

  if (!risk) return null;

  const riskLevel = riskLevelToOldFormat[risk.risk_level || "low"];
  const residualLevel = riskLevelToOldFormat[risk.residual_risk || "low"];

  const linkedRequirementIds = requirementLinks.map((l: any) => l.requirement_id);
  const linkedTestCaseIds = testCaseLinks.map((l: any) => l.test_case_id);

  const availableRequirements = requirements.filter((r) => !linkedRequirementIds.includes(r.id));
  const availableTestCases = testCases.filter((t) => !linkedTestCaseIds.includes(t.id));

  const handleAddRequirement = () => {
    if (selectedRequirement && activeCompany?.id) {
      addRequirementLink.mutate({
        riskId: risk.id,
        requirementId: selectedRequirement,
        companyId: activeCompany.id,
      });
      setSelectedRequirement("");
    }
  };

  const handleAddTestCase = () => {
    if (selectedTestCase && activeCompany?.id) {
      addTestCaseLink.mutate({
        riskId: risk.id,
        testCaseId: selectedTestCase,
        companyId: activeCompany.id,
      });
      setSelectedTestCase("");
    }
  };

  // IRA type only shows Details, Team, and Mitigation tabs
  const isIRA = risk.assessment_type === "IRA";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
          <TabsList className={`grid w-full ${isIRA ? "grid-cols-3" : "grid-cols-7"}`}>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="team">Responsáveis</TabsTrigger>
            {!isIRA && <TabsTrigger value="requirements">Requisitos</TabsTrigger>}
            {!isIRA && <TabsTrigger value="testcases">Testes</TabsTrigger>}
            <TabsTrigger value="mitigation">Mitigação</TabsTrigger>
            {!isIRA && <TabsTrigger value="traceability">Rastreabilidade</TabsTrigger>}
            {!isIRA && <TabsTrigger value="matrix">Matriz</TabsTrigger>}
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
                <Label className="text-muted-foreground">Impacto (Severidade)</Label>
                <p className="font-medium">{risk.severity || 0} / 5</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Probabilidade</Label>
                <p className="font-medium">{risk.probability || 0} / 5</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Detectabilidade</Label>
                <p className="font-medium">{risk.detectability || 0} / 5</p>
              </div>
              <div>
                <Label className="text-muted-foreground">RPN (GAMP5)</Label>
                <p className="font-medium">
                  {(risk.probability || 1) * (risk.severity || 1) * (risk.detectability || 1)}
                  <span className="text-xs text-muted-foreground ml-1">/ 125</span>
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
                <Label className="text-muted-foreground">Risco Residual</Label>
                <div className="mt-1">
                  <RiskIndicator level={residualLevel} size="lg" />
                </div>
              </div>
            </div>

            {/* Tags */}
            {(risk as any).tags && (risk as any).tags.length > 0 && (
              <div className="pt-4">
                <Label className="text-muted-foreground flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  Tags
                </Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(risk as any).tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}

            {risk.description && (
              <div className="pt-4">
                <Label className="text-muted-foreground">Descrição</Label>
                <p className="mt-1 rounded-lg bg-muted p-3">{risk.description}</p>
              </div>
            )}

            {risk.controls && (
              <div className="pt-4">
                <Label className="text-muted-foreground">Controles Implementados</Label>
                <p className="mt-1 rounded-lg bg-muted p-3">{risk.controls}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="team" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Risk Owner (Responsável)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{risk.assessor?.full_name || "Não definido"}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Aprovador</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{risk.approver?.full_name || "Não definido"}</p>
                  {(risk as any).approved_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Aprovado em: {new Date((risk as any).approved_at).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Revisor</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{risk.reviewer?.full_name || "Não definido"}</p>
                  {(risk as any).reviewed_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Revisado em: {new Date((risk as any).reviewed_at).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {!isIRA && (
            <TabsContent value="requirements" className="space-y-4 pt-4">
              <div className="flex gap-2">
                <Select value={selectedRequirement} onValueChange={setSelectedRequirement}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione um requisito para vincular..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRequirements.map((req) => (
                      <SelectItem key={req.id} value={req.id}>
                        {req.code} - {req.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddRequirement} disabled={!selectedRequirement}>
                  <Plus className="h-4 w-4 mr-1" />
                  Vincular
                </Button>
              </div>

              <div className="space-y-2">
                {requirementLinks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mb-2" />
                    <p>Nenhum requisito vinculado a este risco</p>
                  </div>
                ) : (
                  requirementLinks.map((link: any) => (
                    <Card key={link.id}>
                      <CardContent className="flex items-center justify-between p-3">
                        <div>
                          <Badge variant="outline" className="mr-2">{link.requirement?.code}</Badge>
                          <span className="font-medium">{link.requirement?.title}</span>
                          <Badge variant="secondary" className="ml-2">{link.requirement?.type}</Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRequirementLink.mutate(link.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          )}

          {!isIRA && (
            <TabsContent value="testcases" className="space-y-4 pt-4">
              <div className="flex gap-2">
                <Select value={selectedTestCase} onValueChange={setSelectedTestCase}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione um caso de teste para vincular..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTestCases.map((tc) => (
                      <SelectItem key={tc.id} value={tc.id}>
                        {tc.code} - {tc.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddTestCase} disabled={!selectedTestCase}>
                  <Plus className="h-4 w-4 mr-1" />
                  Vincular
                </Button>
              </div>

              <div className="space-y-2">
                {testCaseLinks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <TestTube2 className="h-8 w-8 mb-2" />
                    <p>Nenhum caso de teste vinculado a este risco</p>
                  </div>
                ) : (
                  testCaseLinks.map((link: any) => (
                    <Card key={link.id}>
                      <CardContent className="flex items-center justify-between p-3">
                        <div>
                          <Badge variant="outline" className="mr-2">{link.test_case?.code}</Badge>
                          <span className="font-medium">{link.test_case?.title}</span>
                          <Badge 
                            variant={link.test_case?.status === "passed" ? "default" : "secondary"} 
                            className="ml-2"
                          >
                            {link.test_case?.status || "Pendente"}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTestCaseLink.mutate(link.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          )}

          <TabsContent value="mitigation" className="pt-4">
            <MitigationActionsTab riskId={risk.id} />
          </TabsContent>

          {!isIRA && (
            <TabsContent value="traceability" className="pt-4">
              <RiskTraceabilityTab riskId={risk.id} riskLevel={risk.risk_level || "low"} />
            </TabsContent>
          )}

          {!isIRA && (
            <TabsContent value="matrix" className="pt-4">
              <div className="flex flex-col items-center gap-6">
                <Card className="p-6">
                  <CardHeader className="p-0 pb-4">
                    <CardTitle className="text-center text-lg">Matriz de Risco GAMP5 (5×5)</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <RiskMatrix
                      probability={Math.min(risk.probability || 3, 5)}
                      severity={Math.min(risk.severity || 3, 5)}
                    />
                  </CardContent>
                </Card>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-success/20 border" />
                    <span>Baixo (1-7)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-risk-medium/20 border" />
                    <span>Médio (8-15)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-risk-high/20 border" />
                    <span>Alto (16-25)</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground text-center max-w-md">
                  Metodologia GAMP5 2ª Edição - Avaliação baseada em Impacto GxP (segurança do paciente, qualidade do produto, integridade de dados) × Probabilidade de ocorrência
                </div>
              </div>
            </TabsContent>
          )}
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
