import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRiskRequirementLinks, useRiskTestCaseLinks } from "@/hooks/useRiskLinks";
import { useMitigationActions } from "@/hooks/useMitigationActions";
import { useRequirementDocuments } from "@/hooks/useRequirementDocuments";
import { useRequirements } from "@/hooks/useRequirements";
import { useTestCases } from "@/hooks/useTestCases";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Shield, TestTube2, FileCheck, ArrowRight, AlertTriangle, Plus, X, Link2 } from "lucide-react";

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

const documentTypeLabels: Record<string, string> = {
  URS: "URS - Especificação de Requisitos do Usuário",
  FS: "FS - Especificação Funcional",
  DS: "DS - Especificação de Design",
  SRS: "SRS - Especificação de Requisitos de Software",
  HRS: "HRS - Especificação de Requisitos de Hardware",
  FRS: "FRS - Especificação de Requisitos Funcionais",
};

export function RiskTraceabilityTab({ riskId, riskLevel }: RiskTraceabilityTabProps) {
  const { user } = useAuth();
  const { links: requirementLinks, addLink: addRequirementLink, removeLink: removeRequirementLink } = useRiskRequirementLinks(riskId);
  const { links: testCaseLinks, addLink: addTestCaseLink, removeLink: removeTestCaseLink } = useRiskTestCaseLinks(riskId);
  const { mitigationActions } = useMitigationActions(riskId);
  const { requirementDocuments, groupedDocuments } = useRequirementDocuments();
  const { requirements } = useRequirements();
  const { testCases } = useTestCases();
  
  const [selectedRequirement, setSelectedRequirement] = useState<string>("");
  const [selectedTestCase, setSelectedTestCase] = useState<string>("");

  // Get company ID for adding links
  const getCompanyId = async () => {
    if (!user?.id) return null;
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();
    return profile?.company_id;
  };

  const handleAddRequirement = async () => {
    if (!selectedRequirement) return;
    const companyId = await getCompanyId();
    if (!companyId) return;
    
    addRequirementLink.mutate({
      riskId,
      requirementId: selectedRequirement,
      companyId,
    });
    setSelectedRequirement("");
  };

  const handleAddTestCase = async () => {
    if (!selectedTestCase) return;
    const companyId = await getCompanyId();
    if (!companyId) return;
    
    addTestCaseLink.mutate({
      riskId,
      testCaseId: selectedTestCase,
      companyId,
    });
    setSelectedTestCase("");
  };

  // Filter out already linked requirements
  const linkedRequirementIds = requirementLinks.map((l: any) => l.requirement_id);
  const availableRequirements = requirements.filter((r: any) => !linkedRequirementIds.includes(r.id));

  // Filter out already linked test cases
  const linkedTestCaseIds = testCaseLinks.map((l: any) => l.test_case_id);
  const availableTestCases = testCases.filter((tc: any) => !linkedTestCaseIds.includes(tc.id));

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
          <CardContent className="space-y-3">
            {/* Add Requirement */}
            <div className="flex gap-2">
              <Select value={selectedRequirement} onValueChange={setSelectedRequirement}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecionar requisito..." />
                </SelectTrigger>
                <SelectContent>
                  {availableRequirements.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Nenhum requisito disponível
                    </SelectItem>
                  ) : (
                    availableRequirements.map((req: any) => (
                      <SelectItem key={req.id} value={req.id}>
                        [{req.code}] {req.title} ({req.type || "N/A"})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button 
                size="icon" 
                variant="outline" 
                onClick={handleAddRequirement}
                disabled={!selectedRequirement || addRequirementLink.isPending}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Suggested Requirements from Documents */}
            {Object.keys(groupedDocuments).length > 0 && (
              <div className="space-y-2 p-2 bg-muted/50 rounded-lg">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Link2 className="h-3 w-3" />
                  Documentos Sugeridos (URS, FS, DS):
                </p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(groupedDocuments).map(([type, docs]) => (
                    docs.slice(0, 3).map((doc: any) => (
                      <Badge 
                        key={doc.id} 
                        variant="outline" 
                        className="text-xs cursor-pointer hover:bg-primary/10"
                        title={`${type}: ${doc.title}`}
                      >
                        {type}: {doc.title.length > 15 ? doc.title.substring(0, 15) + '...' : doc.title}
                      </Badge>
                    ))
                  ))}
                </div>
              </div>
            )}

            {/* Linked Requirements List */}
            {requirementLinks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum requisito vinculado</p>
            ) : (
              <div className="space-y-2">
                {requirementLinks.map((link: any) => (
                  <div key={link.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">
                        {link.requirement?.code}
                      </Badge>
                      <span className="text-sm truncate max-w-[120px]">
                        {link.requirement?.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary">{link.requirement?.type}</Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => removeRequirementLink.mutate(link.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
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
          <CardContent className="space-y-3">
            {/* Add Test Case */}
            <div className="flex gap-2">
              <Select value={selectedTestCase} onValueChange={setSelectedTestCase}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecionar caso de teste..." />
                </SelectTrigger>
                <SelectContent>
                  {availableTestCases.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Nenhum caso de teste disponível
                    </SelectItem>
                  ) : (
                    availableTestCases.map((tc: any) => (
                      <SelectItem key={tc.id} value={tc.id}>
                        [{tc.code}] {tc.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button 
                size="icon" 
                variant="outline" 
                onClick={handleAddTestCase}
                disabled={!selectedTestCase || addTestCaseLink.isPending}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Linked Test Cases List */}
            {testCaseLinks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum caso de teste vinculado</p>
            ) : (
              <div className="space-y-2">
                {testCaseLinks.map((link: any) => (
                  <div key={link.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">
                        {link.test_case?.code}
                      </Badge>
                      <span className="text-sm truncate max-w-[120px]">
                        {link.test_case?.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge className={statusColors[link.test_case?.status] || ""}>
                        {link.test_case?.status === 'passed' ? 'Passou' :
                         link.test_case?.status === 'failed' ? 'Falhou' : 'Pendente'}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => removeTestCaseLink.mutate(link.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
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
              {(riskLevel === 'critical' || riskLevel === 'high') && (
                <p className="text-xs text-muted-foreground mt-2 p-2 bg-destructive/10 rounded">
                  ⚠️ Este risco requer cobertura de testes prioritária e validação rigorosa.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
