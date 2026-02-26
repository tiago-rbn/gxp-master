import { useState, useEffect } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { RiskIndicator } from "@/components/shared/RiskIndicator";
import { useSystemsForSelect } from "@/hooks/useRiskAssessments";
import { useProfiles } from "@/hooks/useSystems";
import { AlertTriangle, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export interface IRAQuestion {
  id: string;
  question: string;
  category: string;
  isCritical: boolean;
  weight: number;
}

export const IRA_QUESTIONS: IRAQuestion[] = [
  {
    id: "gxp_impact",
    question: "O sistema tem impacto em processos GxP (BPF, BPL, BPC)?",
    category: "Impacto Regulatório",
    isCritical: true,
    weight: 3,
  },
  {
    id: "data_integrity",
    question: "O sistema processa, armazena ou gerencia dados sujeitos a requisitos de integridade de dados (ALCOA+)?",
    category: "Integridade de Dados",
    isCritical: true,
    weight: 3,
  },
  {
    id: "patient_safety",
    question: "Uma falha no sistema pode afetar direta ou indiretamente a segurança do paciente?",
    category: "Segurança do Paciente",
    isCritical: true,
    weight: 3,
  },
  {
    id: "product_quality",
    question: "O sistema impacta na qualidade do produto?",
    category: "Qualidade do Produto",
    isCritical: true,
    weight: 3,
  },
  {
    id: "bpx_relevant",
    question: "O sistema é relevante para processos BPx?",
    category: "Impacto Regulatório",
    isCritical: false,
    weight: 2,
  },
  {
    id: "electronic_records",
    question: "O sistema gera registros eletrônicos que substituem registros em papel?",
    category: "Integridade de Dados",
    isCritical: false,
    weight: 2,
  },
  {
    id: "electronic_signatures",
    question: "O sistema utiliza assinaturas eletrônicas?",
    category: "Integridade de Dados",
    isCritical: false,
    weight: 2,
  },
  {
    id: "interfaces",
    question: "O sistema possui interfaces com outros sistemas computadorizados validados?",
    category: "Complexidade Técnica",
    isCritical: false,
    weight: 1,
  },
  {
    id: "custom_config",
    question: "O sistema possui configurações customizadas ou código personalizado?",
    category: "Complexidade Técnica",
    isCritical: false,
    weight: 1,
  },
  {
    id: "audit_trail",
    question: "O sistema possui funcionalidade de trilha de auditoria (audit trail)?",
    category: "Integridade de Dados",
    isCritical: false,
    weight: 1,
  },
  {
    id: "regulatory_submission",
    question: "Os dados do sistema são usados em submissões regulatórias?",
    category: "Impacto Regulatório",
    isCritical: true,
    weight: 3,
  },
  {
    id: "backup_recovery",
    question: "Uma falha no backup/recuperação do sistema pode causar perda de dados críticos?",
    category: "Continuidade",
    isCritical: false,
    weight: 2,
  },
];

export function calculateIRARiskLevel(responses: Record<string, boolean>): "low" | "medium" | "high" | "critical" {
  const criticalQuestions = IRA_QUESTIONS.filter((q) => q.isCritical);
  const hasCriticalYes = criticalQuestions.some((q) => responses[q.id] === true);

  if (hasCriticalYes) return "high";

  const yesCount = Object.values(responses).filter(Boolean).length;
  if (yesCount >= 6) return "high";
  if (yesCount >= 3) return "medium";
  return "low";
}

interface IRAQuestionnaireFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  risk?: any;
  onSubmit: (values: any) => void;
  isLoading?: boolean;
  prefilledSystemId?: string | null;
  prefilledSystemName?: string | null;
}

export function IRAQuestionnaireForm({
  open,
  onOpenChange,
  risk,
  onSubmit,
  isLoading,
  prefilledSystemId,
  prefilledSystemName,
}: IRAQuestionnaireFormProps) {
  const { data: systems = [] } = useSystemsForSelect();
  const { data: profiles = [] } = useProfiles();

  const [title, setTitle] = useState("");
  const [systemId, setSystemId] = useState("");
  const [assessorId, setAssessorId] = useState("");
  const [approverId, setApproverId] = useState("");
  const [reviewerId, setReviewerId] = useState("");
  const [observations, setObservations] = useState("");
  const [responses, setResponses] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (risk) {
      setTitle(risk.title || "");
      setSystemId(risk.system_id || "");
      setAssessorId(risk.assessor_id || "");
      setApproverId(risk.approver_id || "");
      setReviewerId(risk.reviewer_id || "");
      setObservations(risk.description || "");
      const existing = risk.questionnaire_responses || [];
      const map: Record<string, boolean> = {};
      if (Array.isArray(existing)) {
        existing.forEach((r: any) => { map[r.id] = r.answer; });
      }
      setResponses(map);
    } else {
      const sysId = prefilledSystemId || "";
      const sysName = prefilledSystemName || "";
      setTitle(sysName ? `IRA - ${sysName}` : "");
      setSystemId(sysId);
      setAssessorId("");
      setApproverId("");
      setReviewerId("");
      setObservations("");
      setResponses({});
    }
  }, [risk, open, prefilledSystemId, prefilledSystemName]);

  const toggleResponse = (questionId: string) => {
    setResponses((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const riskLevel = calculateIRARiskLevel(responses);
  const riskLevelLabels: Record<string, { label: string; variant: "High" | "Medium" | "Low" }> = {
    low: { label: "Baixo", variant: "Low" },
    medium: { label: "Médio", variant: "Medium" },
    high: { label: "Alto", variant: "High" },
    critical: { label: "Crítico", variant: "High" },
  };

  const answeredCount = Object.keys(responses).length;
  const yesCount = Object.values(responses).filter(Boolean).length;

  const categories = Array.from(new Set(IRA_QUESTIONS.map((q) => q.category)));

  const handleSubmit = () => {
    const questionnaireResponses = IRA_QUESTIONS.map((q) => ({
      id: q.id,
      question: q.question,
      category: q.category,
      isCritical: q.isCritical,
      answer: responses[q.id] || false,
    }));

    onSubmit({
      title: title || "IRA",
      description: observations,
      assessment_type: "IRA",
      system_id: systemId || null,
      probability: yesCount,
      severity: riskLevel === "high" ? 8 : riskLevel === "medium" ? 5 : 2,
      detectability: 5,
      risk_level: riskLevel,
      residual_risk: "low",
      controls: "",
      status: "draft",
      assessor_id: assessorId || null,
      approver_id: approverId || null,
      reviewer_id: reviewerId || null,
      tags: [`tipo:IRA`],
      questionnaire_responses: questionnaireResponses,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{risk ? "Editar IRA" : "Nova Avaliação de Risco Inicial (IRA)"}</DialogTitle>
          <DialogDescription>
            Responda às perguntas abaixo para determinar o nível de risco inicial do sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: IRA - Nome do Sistema" />
            </div>
            <div className="space-y-2">
              <Label>Sistema *</Label>
              <Select value={systemId} onValueChange={setSystemId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o sistema" />
                </SelectTrigger>
                <SelectContent>
                  {systems.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Select value={assessorId} onValueChange={setAssessorId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Aprovador</Label>
              <Select value={approverId} onValueChange={setApproverId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Risk Level Summary */}
          <Card className="border-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`h-6 w-6 ${riskLevel === "high" ? "text-destructive" : riskLevel === "medium" ? "text-warning" : "text-success"}`} />
                  <div>
                    <p className="text-sm text-muted-foreground">Nível de Risco Calculado</p>
                    <div className="mt-1">
                      <RiskIndicator level={riskLevelLabels[riskLevel].variant} size="lg" />
                    </div>
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>{answeredCount}/{IRA_QUESTIONS.length} respondidas</p>
                  <p>{yesCount} respostas "Sim"</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions by Category */}
          {categories.map((category) => (
            <div key={category} className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">{category}</h4>
              {IRA_QUESTIONS.filter((q) => q.category === category).map((question) => {
                const answered = question.id in responses;
                const isYes = responses[question.id] === true;
                return (
                  <Card key={question.id} className={`transition-colors ${isYes && question.isCritical ? "border-destructive/50 bg-destructive/5" : ""}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {question.isCritical && (
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">CRÍTICA</Badge>
                            )}
                            <span className="text-sm font-medium">{question.question}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex items-center gap-2">
                            {answered && (
                              isYes ? (
                                <CheckCircle2 className="h-4 w-4 text-destructive" />
                              ) : (
                                <XCircle className="h-4 w-4 text-success" />
                              )
                            )}
                            <span className="text-xs text-muted-foreground w-8">{isYes ? "Sim" : "Não"}</span>
                            <Switch
                              checked={isYes}
                              onCheckedChange={() => toggleResponse(question.id)}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ))}

          {/* Observations */}
          <div className="space-y-2">
            <Label>Observações / Justificativas</Label>
            <Textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Adicione observações relevantes sobre a avaliação..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isLoading || !title}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {risk ? "Atualizar" : "Salvar IRA"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
