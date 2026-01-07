import { useNavigate } from "react-router-dom";
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
import { GampBadge } from "@/components/shared/GampBadge";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, ShieldAlert, ExternalLink } from "lucide-react";
import { useSystemIRA, calculateRiskScore, getRiskScoreColor, getRiskScoreLevel } from "@/hooks/useSystemIRA";
import type { Database } from "@/integrations/supabase/types";

type System = Database["public"]["Tables"]["systems"]["Row"] & {
  responsible?: { full_name: string } | null;
  system_owner?: { full_name: string } | null;
  process_owner?: { full_name: string } | null;
};

interface SystemViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  system: System | null;
  onEdit: () => void;
}

const validationStatusLabels: Record<string, string> = {
  not_started: "Não Iniciado",
  in_progress: "Em Andamento",
  validated: "Validado",
  expired: "Expirado",
  pending_revalidation: "Revalidação Pendente",
};

const criticalityLabels: Record<string, { label: string; className: string }> = {
  low: { label: "Baixa", className: "border-success/20 bg-success/10 text-success" },
  medium: { label: "Média", className: "border-warning/20 bg-warning/10 text-warning" },
  high: { label: "Alta", className: "border-destructive/20 bg-destructive/10 text-destructive" },
  critical: { label: "Crítica", className: "border-destructive/20 bg-destructive/10 text-destructive" },
};

const gampCategoryMap: Record<string, 1 | 3 | 4 | 5> = {
  "1": 1,
  "3": 3,
  "4": 4,
  "5": 5,
};

const installationLabels: Record<string, string> = {
  on_premise: "On-Premise",
  cloud: "Nuvem",
  hybrid: "Híbrido",
};

const riskLevelLabels: Record<string, { label: string; className: string }> = {
  low: { label: "Baixo", className: "border-success/20 bg-success/10 text-success" },
  medium: { label: "Médio", className: "border-warning/20 bg-warning/10 text-warning" },
  high: { label: "Alto", className: "border-destructive/20 bg-destructive/10 text-destructive" },
  critical: { label: "Crítico", className: "border-destructive/20 bg-destructive/10 text-destructive" },
};

export function SystemViewDialog({
  open,
  onOpenChange,
  system,
  onEdit,
}: SystemViewDialogProps) {
  const navigate = useNavigate();
  const { data: ira, isLoading: isLoadingIRA } = useSystemIRA(system?.id);

  if (!system) return null;

  const criticality = criticalityLabels[system.criticality || "medium"];
  const gampNum = gampCategoryMap[system.gamp_category];

  const riskScore = ira?.probability && ira?.severity && ira?.detectability
    ? calculateRiskScore(ira.probability, ira.severity, ira.detectability)
    : null;

  const handleCreateIRA = () => {
    onOpenChange(false);
    navigate(`/risks?createIRA=true&systemId=${system.id}&systemName=${encodeURIComponent(system.name)}`);
  };

  const handleViewIRA = () => {
    if (ira) {
      onOpenChange(false);
      navigate(`/risks?viewIRA=${ira.id}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{system.name}</DialogTitle>
          <DialogDescription>Detalhes do sistema</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Informações</TabsTrigger>
            <TabsTrigger value="ira">
              Avaliação de Risco Inicial (IRA)
              {!ira && !isLoadingIRA && (
                <AlertTriangle className="ml-2 h-4 w-4 text-warning" />
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Fornecedor</Label>
                  <p className="font-medium">{system.vendor || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Versão</Label>
                  <p className="font-medium">{system.version || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Categoria GAMP</Label>
                  <div className="mt-1">
                    <GampBadge category={gampNum} showDescription />
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Criticidade</Label>
                  <div className="mt-1">
                    <Badge variant="outline" className={criticality.className}>
                      {criticality.label}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Impacto GxP</Label>
                  <p className="font-medium">{system.gxp_impact ? "Sim" : "Não"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Integridade de Dados</Label>
                  <p className="font-medium">{system.data_integrity_impact ? "Sim" : "Não"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Local de Instalação</Label>
                  <p className="font-medium">
                    {installationLabels[system.installation_location || "on_premise"]}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status de Validação</Label>
                  <p className="font-medium">
                    {validationStatusLabels[system.validation_status || "not_started"]}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Responsável</Label>
                  <p className="font-medium">{system.responsible?.full_name || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Dono do Sistema</Label>
                  <p className="font-medium">{system.system_owner?.full_name || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Dono do Processo</Label>
                  <p className="font-medium">{system.process_owner?.full_name || "-"}</p>
                </div>
                {system.last_validation_date && (
                  <div>
                    <Label className="text-muted-foreground">Última Validação</Label>
                    <p className="font-medium">
                      {new Date(system.last_validation_date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                )}
                {system.next_revalidation_date && (
                  <div>
                    <Label className="text-muted-foreground">Próxima Revalidação</Label>
                    <p className="font-medium">
                      {new Date(system.next_revalidation_date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                )}
              </div>
              {system.description && (
                <div>
                  <Label className="text-muted-foreground">Descrição</Label>
                  <p className="font-medium mt-1">{system.description}</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="ira" className="mt-4">
            {isLoadingIRA ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : ira ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CheckCircle className="h-5 w-5 text-success" />
                    IRA Concluída
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Probabilidade</p>
                      <p className="text-2xl font-bold">{ira.probability}/10</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Severidade</p>
                      <p className="text-2xl font-bold">{ira.severity}/10</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Detectabilidade</p>
                      <p className="text-2xl font-bold">{ira.detectability}/10</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Risk Score (RPN)</p>
                      <p className={`text-2xl font-bold ${getRiskScoreColor(riskScore || 0)}`}>
                        {riskScore}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Nível de Risco</p>
                      <Badge 
                        variant="outline" 
                        className={riskLevelLabels[ira.risk_level || "low"].className}
                      >
                        {riskLevelLabels[ira.risk_level || "low"].label}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Responsável</p>
                      <p className="font-medium">{(ira as any).assessor?.full_name || "-"}</p>
                    </div>
                    <Button variant="outline" onClick={handleViewIRA}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Ver IRA Completa
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-warning/50 bg-warning/5">
                <CardContent className="py-8 text-center space-y-4">
                  <div className="flex justify-center">
                    <AlertTriangle className="h-12 w-12 text-warning" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Avaliação de Risco Inicial Pendente</h3>
                    <p className="text-muted-foreground mt-1">
                      Este sistema ainda não possui uma Avaliação de Risco Inicial (IRA). 
                      A IRA é obrigatória para determinar o nível de validação necessário.
                    </p>
                  </div>
                  <Button onClick={handleCreateIRA}>
                    <ShieldAlert className="mr-2 h-4 w-4" />
                    Realizar Avaliação de Risco Inicial
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={onEdit}>Editar Sistema</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
