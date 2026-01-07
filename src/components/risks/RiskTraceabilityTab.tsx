import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRiskRequirementLinks, useRiskTestCaseLinks } from "@/hooks/useRiskLinks";
import { useMitigationActions } from "@/hooks/useMitigationActions";
import { useTestEvidence } from "@/hooks/useTestEvidence";
import { FileText, Shield, TestTube2, FileCheck, ArrowRight, AlertTriangle } from "lucide-react";

interface RiskTraceabilityTabProps {
  riskId: string;
  riskLevel?: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  in_progress: "bg-primary/10 text-primary",
  completed: "bg-success/10 text-success",
  passed: "bg-success/10 text-success",
  failed: "bg-destructive/10 text-destructive",
};

export function RiskTraceabilityTab({ riskId, riskLevel }: RiskTraceabilityTabProps) {
  const { links: requirementLinks } = useRiskRequirementLinks(riskId);
  const { links: testCaseLinks } = useRiskTestCaseLinks(riskId);
  const { mitigationActions } = useMitigationActions(riskId);

  // Get evidence for all linked test cases
  const testCaseIds = testCaseLinks.map((l: any) => l.test_case_id);

  return (
    <div className="space-y-6">
      {/* Traceability Chain Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Cadeia de Rastreabilidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-2 overflow-x-auto py-4">
            {/* Requirements */}
            <div className="flex flex-col items-center min-w-[120px]">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                <FileText className="h-6 w-6 text-blue-500" />
              </div>
              <span className="mt-2 text-sm font-medium">Requisitos</span>
              <Badge variant="secondary" className="mt-1">
                {requirementLinks.length}
              </Badge>
            </div>

            <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />

            {/* Risk */}
            <div className="flex flex-col items-center min-w-[120px]">
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                riskLevel === 'critical' || riskLevel === 'high' 
                  ? 'bg-destructive/10' 
                  : riskLevel === 'medium' 
                  ? 'bg-warning/10' 
                  : 'bg-success/10'
              }`}>
                <AlertTriangle className={`h-6 w-6 ${
                  riskLevel === 'critical' || riskLevel === 'high' 
                    ? 'text-destructive' 
                    : riskLevel === 'medium' 
                    ? 'text-warning' 
                    : 'text-success'
                }`} />
              </div>
              <span className="mt-2 text-sm font-medium">Risco</span>
              <Badge variant="outline" className="mt-1 capitalize">
                {riskLevel}
              </Badge>
            </div>

            <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />

            {/* Mitigation Actions */}
            <div className="flex flex-col items-center min-w-[120px]">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10">
                <Shield className="h-6 w-6 text-purple-500" />
              </div>
              <span className="mt-2 text-sm font-medium">Mitigações</span>
              <Badge variant="secondary" className="mt-1">
                {mitigationActions.length}
              </Badge>
            </div>

            <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />

            {/* Test Cases */}
            <div className="flex flex-col items-center min-w-[120px]">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                <TestTube2 className="h-6 w-6 text-green-500" />
              </div>
              <span className="mt-2 text-sm font-medium">Testes</span>
              <Badge variant="secondary" className="mt-1">
                {testCaseLinks.length}
              </Badge>
            </div>

            <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />

            {/* Evidence */}
            <div className="flex flex-col items-center min-w-[120px]">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10">
                <FileCheck className="h-6 w-6 text-orange-500" />
              </div>
              <span className="mt-2 text-sm font-medium">Evidências</span>
              <Badge variant="secondary" className="mt-1">
                -
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Traceability */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Requirements */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              Requisitos Vinculados (URS, FS, DS)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {requirementLinks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum requisito vinculado</p>
            ) : (
              requirementLinks.map((link: any) => (
                <div key={link.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      {link.requirement?.code}
                    </Badge>
                    <span className="text-sm truncate max-w-[150px]">
                      {link.requirement?.title}
                    </span>
                  </div>
                  <Badge variant="secondary">{link.requirement?.type}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Mitigation Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-500" />
              Ações de Mitigação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {mitigationActions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma ação de mitigação</p>
            ) : (
              mitigationActions.map((action) => (
                <div key={action.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <span className="text-sm truncate max-w-[200px]">{action.title}</span>
                  <Badge className={statusColors[action.status] || ""}>
                    {action.status === 'completed' ? 'Concluído' : 
                     action.status === 'in_progress' ? 'Em Andamento' : 'Pendente'}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Test Cases */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TestTube2 className="h-4 w-4 text-green-500" />
              Casos de Teste (IQ, OQ, PQ)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {testCaseLinks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum caso de teste vinculado</p>
            ) : (
              testCaseLinks.map((link: any) => (
                <div key={link.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      {link.test_case?.code}
                    </Badge>
                    <span className="text-sm truncate max-w-[150px]">
                      {link.test_case?.title}
                    </span>
                  </div>
                  <Badge className={statusColors[link.test_case?.status] || ""}>
                    {link.test_case?.status === 'passed' ? 'Passou' :
                     link.test_case?.status === 'failed' ? 'Falhou' : 'Pendente'}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Test Prioritization by Risk */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Priorização Baseada em Risco
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Nível de Risco:</span>
                <Badge className={
                  riskLevel === 'critical' ? 'bg-destructive text-destructive-foreground' :
                  riskLevel === 'high' ? 'bg-destructive/80 text-destructive-foreground' :
                  riskLevel === 'medium' ? 'bg-warning text-warning-foreground' :
                  'bg-success text-success-foreground'
                }>
                  {riskLevel === 'critical' ? 'Crítico' :
                   riskLevel === 'high' ? 'Alto' :
                   riskLevel === 'medium' ? 'Médio' : 'Baixo'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Prioridade de Teste:</span>
                <Badge variant="outline">
                  {riskLevel === 'critical' || riskLevel === 'high' ? 'Máxima' :
                   riskLevel === 'medium' ? 'Normal' : 'Baixa'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Cobertura:</span>
                <span className="text-sm font-medium">
                  {testCaseLinks.length > 0 ? 
                    `${testCaseLinks.filter((l: any) => l.test_case?.status === 'passed').length}/${testCaseLinks.length} testes` : 
                    'Sem cobertura'}
                </span>
              </div>
              {riskLevel === 'critical' || riskLevel === 'high' ? (
                <p className="text-xs text-muted-foreground mt-2 p-2 bg-destructive/10 rounded">
                  ⚠️ Este risco requer cobertura de testes prioritária e validação rigorosa.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
