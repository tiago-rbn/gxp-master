import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSystemsForSelect } from "@/hooks/useRiskAssessments";
import { useProfiles } from "@/hooks/useSystems";
import { useValidationProjects } from "@/hooks/useValidationProjects";
import { useChangeRequests } from "@/hooks/useChangeRequests";
import { X, Plus } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type RiskAssessment = Database["public"]["Tables"]["risk_assessments"]["Row"] & {
  tags?: string[];
};

const riskSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  assessment_type: z.string().min(1, "Tipo é obrigatório"),
  system_id: z.string().optional(),
  probability: z.number().min(1).max(10),
  severity: z.number().min(1).max(10),
  detectability: z.number().min(1).max(10),
  risk_level: z.enum(["low", "medium", "high", "critical"]),
  residual_risk: z.enum(["low", "medium", "high", "critical"]).optional(),
  controls: z.string().optional(),
  status: z.enum(["draft", "pending", "approved", "rejected", "completed", "cancelled"]),
  assessor_id: z.string().optional(),
  approver_id: z.string().optional(),
  reviewer_id: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

type RiskFormValues = z.infer<typeof riskSchema>;

interface RiskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  risk?: RiskAssessment | null;
  onSubmit: (values: RiskFormValues) => void;
  isLoading?: boolean;
}

function calculateRiskLevel(probability: number, severity: number, detectability: number): "low" | "medium" | "high" | "critical" {
  const rpn = probability * severity * detectability;
  if (rpn >= 500) return "critical";
  if (rpn >= 200) return "high";
  if (rpn >= 50) return "medium";
  return "low";
}

export function RiskFormDialog({
  open,
  onOpenChange,
  risk,
  onSubmit,
  isLoading,
}: RiskFormDialogProps) {
  const { data: systems = [] } = useSystemsForSelect();
  const { data: profiles = [] } = useProfiles();
  const { projects } = useValidationProjects();
  const { changeRequests } = useChangeRequests();
  
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const form = useForm<RiskFormValues>({
    resolver: zodResolver(riskSchema),
    defaultValues: {
      title: "",
      description: "",
      assessment_type: "IRA",
      system_id: "",
      probability: 5,
      severity: 5,
      detectability: 5,
      risk_level: "medium",
      residual_risk: "low",
      controls: "",
      status: "draft",
      assessor_id: "",
      approver_id: "",
      reviewer_id: "",
      tags: [],
    },
  });

  const probability = form.watch("probability");
  const severity = form.watch("severity");
  const detectability = form.watch("detectability");

  useEffect(() => {
    const newRiskLevel = calculateRiskLevel(probability, severity, detectability);
    form.setValue("risk_level", newRiskLevel);
  }, [probability, severity, detectability, form]);

  useEffect(() => {
    if (risk) {
      const riskTags = (risk as any).tags || [];
      setTags(riskTags);
      form.reset({
        title: risk.title,
        description: risk.description || "",
        assessment_type: risk.assessment_type,
        system_id: risk.system_id || "",
        probability: risk.probability || 5,
        severity: risk.severity || 5,
        detectability: risk.detectability || 5,
        risk_level: (risk.risk_level as "low" | "medium" | "high" | "critical") || "medium",
        residual_risk: (risk.residual_risk as "low" | "medium" | "high" | "critical") || "low",
        controls: risk.controls || "",
        status: (risk.status as "draft" | "pending" | "approved" | "rejected" | "completed" | "cancelled") || "draft",
        assessor_id: risk.assessor_id || "",
        approver_id: (risk as any).approver_id || "",
        reviewer_id: (risk as any).reviewer_id || "",
        tags: riskTags,
      });
    } else {
      setTags([]);
      form.reset({
        title: "",
        description: "",
        assessment_type: "IRA",
        system_id: "",
        probability: 5,
        severity: 5,
        detectability: 5,
        risk_level: "medium",
        residual_risk: "low",
        controls: "",
        status: "draft",
        assessor_id: "",
        approver_id: "",
        reviewer_id: "",
        tags: [],
      });
    }
  }, [risk, form]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()];
      setTags(newTags);
      form.setValue("tags", newTags);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter((t) => t !== tagToRemove);
    setTags(newTags);
    form.setValue("tags", newTags);
  };

  const handleAddSystemTag = (systemName: string) => {
    const tag = `sistema:${systemName}`;
    if (!tags.includes(tag)) {
      const newTags = [...tags, tag];
      setTags(newTags);
      form.setValue("tags", newTags);
    }
  };

  const handleAddProjectTag = (projectName: string) => {
    const tag = `projeto:${projectName}`;
    if (!tags.includes(tag)) {
      const newTags = [...tags, tag];
      setTags(newTags);
      form.setValue("tags", newTags);
    }
  };

  const handleAddChangeTag = (changeTitle: string) => {
    const tag = `mudança:${changeTitle}`;
    if (!tags.includes(tag)) {
      const newTags = [...tags, tag];
      setTags(newTags);
      form.setValue("tags", newTags);
    }
  };

  const handleSubmit = (values: RiskFormValues) => {
    onSubmit({ ...values, tags });
  };

  const riskLevelLabels: Record<string, { label: string; className: string }> = {
    low: { label: "Baixo", className: "text-success" },
    medium: { label: "Médio", className: "text-warning" },
    high: { label: "Alto", className: "text-destructive" },
    critical: { label: "Crítico", className: "text-destructive font-bold" },
  };

  const currentRiskLevel = riskLevelLabels[form.watch("risk_level")];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{risk ? "Editar Avaliação de Risco" : "Nova Avaliação de Risco"}</DialogTitle>
          <DialogDescription>
            {risk
              ? "Atualize as informações da avaliação de risco"
              : "Preencha as informações para criar uma nova avaliação"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Avaliação de Risco do LIMS" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assessment_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Avaliação *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="IRA">IRA - Avaliação de Risco Inicial</SelectItem>
                        <SelectItem value="FRA">FRA - Avaliação de Risco Funcional</SelectItem>
                        <SelectItem value="FMEA">FMEA - Análise de Modo e Efeito de Falha</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="system_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sistema Relacionado</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o sistema" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {systems.map((system) => (
                          <SelectItem key={system.id} value={system.id}>
                            {system.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Rascunho</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="approved">Aprovado</SelectItem>
                        <SelectItem value="completed">Concluído</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assessor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Risk Owner (Responsável)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o responsável" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {profiles.map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {profile.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="approver_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aprovador</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o aprovador" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {profiles.map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {profile.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reviewer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Revisor</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o revisor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {profiles.map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {profile.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="residual_risk"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Risco Residual</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o risco residual" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Baixo</SelectItem>
                        <SelectItem value="medium">Médio</SelectItem>
                        <SelectItem value="high">Alto</SelectItem>
                        <SelectItem value="critical">Crítico</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o risco e seu contexto..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Risk Factors */}
            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Fatores de Risco (RPN)</h4>
                <div className="text-sm">
                  Nível calculado: <span className={currentRiskLevel.className}>{currentRiskLevel.label}</span>
                </div>
              </div>

              <FormField
                control={form.control}
                name="probability"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between">
                      <FormLabel>Probabilidade</FormLabel>
                      <span className="text-sm text-muted-foreground">{field.value}/10</span>
                    </div>
                    <FormControl>
                      <Slider
                        min={1}
                        max={10}
                        step={1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="severity"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between">
                      <FormLabel>Severidade</FormLabel>
                      <span className="text-sm text-muted-foreground">{field.value}/10</span>
                    </div>
                    <FormControl>
                      <Slider
                        min={1}
                        max={10}
                        step={1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="detectability"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between">
                      <FormLabel>Detectabilidade</FormLabel>
                      <span className="text-sm text-muted-foreground">{field.value}/10</span>
                    </div>
                    <FormControl>
                      <Slider
                        min={1}
                        max={10}
                        step={1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="text-sm text-muted-foreground">
                RPN (Risk Priority Number) = {probability} × {severity} × {detectability} = {probability * severity * detectability}
              </div>
            </div>

            <FormField
              control={form.control}
              name="controls"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Controles Implementados</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva os controles implementados para mitigar o risco..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags Section */}
            <div className="space-y-3 rounded-lg border p-4">
              <h4 className="font-medium">Tags de Agrupamento</h4>
              <p className="text-xs text-muted-foreground">
                Use tags para agrupar riscos por sistema, projeto ou controle de mudança
              </p>

              <div className="flex gap-2">
                <Input
                  placeholder="Digite uma tag e pressione Enter..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="icon" onClick={handleAddTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Quick Add Tags - Sistemas */}
              {systems.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Sistemas:</span>
                  <div className="flex flex-wrap gap-1">
                    {systems.map((system) => (
                      <Button
                        key={system.id}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs px-2"
                        onClick={() => handleAddSystemTag(system.name)}
                        disabled={tags.includes(`sistema:${system.name}`)}
                      >
                        + {system.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Add Tags - Projetos */}
              {projects.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Projetos:</span>
                  <div className="flex flex-wrap gap-1">
                    {projects.map((project) => (
                      <Button
                        key={project.id}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs px-2"
                        onClick={() => handleAddProjectTag(project.name)}
                        disabled={tags.includes(`projeto:${project.name}`)}
                      >
                        + {project.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Add Tags - Controles de Mudança */}
              {changeRequests.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Controles de Mudança:</span>
                  <div className="flex flex-wrap gap-1">
                    {changeRequests.map((change) => (
                      <Button
                        key={change.id}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs px-2"
                        onClick={() => handleAddChangeTag(change.title)}
                        disabled={tags.includes(`mudança:${change.title}`)}
                      >
                        + {change.title.length > 20 ? change.title.substring(0, 20) + '...' : change.title}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <span className="text-xs font-medium text-muted-foreground w-full mb-1">Tags selecionadas:</span>
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 rounded-full hover:bg-muted"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : risk ? "Salvar Alterações" : "Criar Avaliação"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
