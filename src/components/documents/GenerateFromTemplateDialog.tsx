import { useState, useMemo, useEffect } from "react";
import { FileText, Wand2, Copy, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useDocumentTemplatesNew, DocumentTemplate } from "@/hooks/useDocumentTemplatesNew";
import { useSystemsForSelect } from "@/hooks/useRiskAssessments";
import { useValidationProjects } from "@/hooks/useValidationProjects";
import { useRequirements } from "@/hooks/useRequirements";
import { useRiskAssessments } from "@/hooks/useRiskAssessments";
import { useTestCases } from "@/hooks/useTestCases";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface GenerateFromTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (data: { 
    content: string; 
    type: string; 
    title: string;
    systemId?: string;
    projectId?: string;
  }) => void;
}

interface PlaceholderValues {
  [key: string]: string;
}

// Helper to format list items as markdown table or list
function formatAsTable(items: { code: string; title: string; status?: string | null }[], includeStatus = true): string {
  if (items.length === 0) return "_Nenhum item encontrado_";
  
  const headers = includeStatus ? "| Código | Título | Status |" : "| Código | Título |";
  const divider = includeStatus ? "|--------|--------|--------|" : "|--------|--------|";
  const rows = items.map(item => 
    includeStatus 
      ? `| ${item.code} | ${item.title} | ${item.status || '-'} |`
      : `| ${item.code} | ${item.title} |`
  ).join("\n");
  
  return `${headers}\n${divider}\n${rows}`;
}

function formatAsList(items: { code: string; title: string }[]): string {
  if (items.length === 0) return "_Nenhum item encontrado_";
  return items.map(item => `- **${item.code}**: ${item.title}`).join("\n");
}

function formatRiskMatrix(risks: { title: string; risk_level?: string | null; probability?: number | null; severity?: number | null }[]): string {
  if (risks.length === 0) return "_Nenhum risco encontrado_";
  
  const headers = "| Risco | Nível | Probabilidade | Severidade | RPN |";
  const divider = "|-------|-------|---------------|------------|-----|";
  const rows = risks.map(r => {
    const rpn = (r.probability || 0) * (r.severity || 0);
    return `| ${r.title} | ${r.risk_level || '-'} | ${r.probability || '-'} | ${r.severity || '-'} | ${rpn || '-'} |`;
  }).join("\n");
  
  return `${headers}\n${divider}\n${rows}`;
}

export function GenerateFromTemplateDialog({
  open,
  onOpenChange,
  onGenerate,
}: GenerateFromTemplateDialogProps) {
  const { templates, isLoading: templatesLoading } = useDocumentTemplatesNew();
  const { data: systems = [] } = useSystemsForSelect();
  const { projects = [] } = useValidationProjects();
  const { requirements, isLoading: reqLoading } = useRequirements();
  const { riskAssessments, isLoading: riskLoading } = useRiskAssessments();
  const { testCases, isLoading: testLoading } = useTestCases();
  const { user } = useAuth();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedSystemId, setSelectedSystemId] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [documentTitle, setDocumentTitle] = useState<string>("");
  const [customPlaceholders, setCustomPlaceholders] = useState<PlaceholderValues>({});
  const [activeTab, setActiveTab] = useState<string>("config");
  const [companyName, setCompanyName] = useState<string>("");

  // Fetch company name
  useEffect(() => {
    const fetchCompany = async () => {
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id, companies:company_id(name)")
        .eq("id", user.id)
        .single();
      
      if (profile?.companies) {
        setCompanyName((profile.companies as any).name || "");
      }
    };
    if (open) fetchCompany();
  }, [user, open]);

  const selectedTemplate = useMemo(() => 
    templates?.find(t => t.id === selectedTemplateId),
    [templates, selectedTemplateId]
  );

  const selectedSystem = useMemo(() =>
    systems.find(s => s.id === selectedSystemId),
    [systems, selectedSystemId]
  );

  const selectedProject = useMemo(() =>
    projects.find(p => p.id === selectedProjectId),
    [projects, selectedProjectId]
  );

  // Filter related data by system/project
  const filteredRequirements = useMemo(() => {
    return requirements.filter(r => 
      (selectedSystemId && r.system_id === selectedSystemId) ||
      (selectedProjectId && r.project_id === selectedProjectId)
    );
  }, [requirements, selectedSystemId, selectedProjectId]);

  const filteredRisks = useMemo(() => {
    return riskAssessments.filter(r => 
      selectedSystemId && r.system_id === selectedSystemId
    );
  }, [riskAssessments, selectedSystemId]);

  const filteredTestCases = useMemo(() => {
    return testCases.filter(t => 
      (selectedSystemId && t.system_id === selectedSystemId) ||
      (selectedProjectId && t.project_id === selectedProjectId)
    );
  }, [testCases, selectedSystemId, selectedProjectId]);

  // Auto-fill placeholders based on selected system/project
  const autoFilledPlaceholders = useMemo<PlaceholderValues>(() => {
    const values: PlaceholderValues = {};
    const now = new Date();

    // Data atual
    values["data.atual"] = format(now, "dd/MM/yyyy", { locale: ptBR });
    values["data.hora"] = format(now, "HH:mm", { locale: ptBR });
    values["data.completa"] = format(now, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    values["data.ano"] = format(now, "yyyy");

    // Sistema
    if (selectedSystem) {
      values["sistema.nome"] = selectedSystem.name || "";
      values["sistema.versao"] = (selectedSystem as any).version || "";
      values["sistema.fornecedor"] = (selectedSystem as any).vendor || "";
      values["sistema.descricao"] = (selectedSystem as any).description || "";
      values["sistema.categoria_gamp"] = (selectedSystem as any).gamp_category || "";
      values["sistema.localizacao"] = (selectedSystem as any).installation_location || "";
    }

    // Projeto
    if (selectedProject) {
      values["projeto.nome"] = selectedProject.name || "";
      values["projeto.descricao"] = selectedProject.description || "";
      values["projeto.tipo"] = selectedProject.project_type || "";
      values["projeto.data_inicio"] = selectedProject.start_date 
        ? format(new Date(selectedProject.start_date), "dd/MM/yyyy", { locale: ptBR })
        : "";
      values["projeto.data_alvo"] = selectedProject.target_date
        ? format(new Date(selectedProject.target_date), "dd/MM/yyyy", { locale: ptBR })
        : "";
      values["projeto.status"] = selectedProject.status || "";
      values["projeto.progresso"] = `${selectedProject.progress || 0}%`;
    }

    // Usuário
    if (user) {
      values["usuario.nome"] = (user as any).user_metadata?.full_name || user.email || "";
      values["usuario.email"] = user.email || "";
    }

    // Empresa
    values["empresa.nome"] = companyName;

    // Requisitos
    values["requisitos.total"] = String(filteredRequirements.length);
    values["requisitos.aprovados"] = String(filteredRequirements.filter(r => r.status === "approved").length);
    values["requisitos.pendentes"] = String(filteredRequirements.filter(r => r.status === "pending" || r.status === "draft").length);
    values["requisitos.lista"] = formatAsList(filteredRequirements.map(r => ({ code: r.code, title: r.title })));
    values["requisitos.tabela"] = formatAsTable(filteredRequirements.map(r => ({ code: r.code, title: r.title, status: r.status })));
    values["requisitos.funcionais"] = formatAsList(
      filteredRequirements.filter(r => r.type === "functional").map(r => ({ code: r.code, title: r.title }))
    );
    values["requisitos.nao_funcionais"] = formatAsList(
      filteredRequirements.filter(r => r.type === "non_functional").map(r => ({ code: r.code, title: r.title }))
    );

    // Riscos
    values["riscos.total"] = String(filteredRisks.length);
    values["riscos.altos"] = String(filteredRisks.filter(r => r.risk_level === "high" || r.risk_level === "critical").length);
    values["riscos.medios"] = String(filteredRisks.filter(r => r.risk_level === "medium").length);
    values["riscos.baixos"] = String(filteredRisks.filter(r => r.risk_level === "low").length);
    values["riscos.lista"] = formatAsList(filteredRisks.map(r => ({ code: r.assessment_type, title: r.title })));
    values["riscos.tabela"] = formatRiskMatrix(filteredRisks);
    values["riscos.matriz"] = formatRiskMatrix(filteredRisks);

    // Casos de Teste
    values["testes.total"] = String(filteredTestCases.length);
    values["testes.executados"] = String(filteredTestCases.filter(t => t.status === "passed" || t.status === "failed").length);
    values["testes.aprovados"] = String(filteredTestCases.filter(t => t.status === "passed").length);
    values["testes.reprovados"] = String(filteredTestCases.filter(t => t.status === "failed").length);
    values["testes.pendentes"] = String(filteredTestCases.filter(t => t.status === "pending").length);
    values["testes.lista"] = formatAsList(filteredTestCases.map(t => ({ code: t.code, title: t.title })));
    values["testes.tabela"] = formatAsTable(filteredTestCases.map(t => ({ code: t.code, title: t.title, status: t.status })));

    // Estatísticas combinadas
    const passRate = filteredTestCases.length > 0 
      ? Math.round((filteredTestCases.filter(t => t.status === "passed").length / filteredTestCases.length) * 100)
      : 0;
    values["testes.taxa_aprovacao"] = `${passRate}%`;

    const reqCoverage = filteredRequirements.length > 0
      ? Math.round((filteredRequirements.filter(r => r.status === "approved").length / filteredRequirements.length) * 100)
      : 0;
    values["requisitos.cobertura"] = `${reqCoverage}%`;

    return values;
  }, [selectedSystem, selectedProject, user, companyName, filteredRequirements, filteredRisks, filteredTestCases]);

  // Extract placeholders from template content
  const extractedPlaceholders = useMemo(() => {
    if (!selectedTemplate?.content) return [];
    
    const regex = /\{\{([^}]+)\}\}/g;
    const matches = new Set<string>();
    let match;
    
    while ((match = regex.exec(selectedTemplate.content)) !== null) {
      matches.add(match[1].trim());
    }
    
    return Array.from(matches);
  }, [selectedTemplate]);

  // Placeholders that need manual input (not auto-filled)
  const manualPlaceholders = useMemo(() => {
    return extractedPlaceholders.filter(p => !autoFilledPlaceholders[p]);
  }, [extractedPlaceholders, autoFilledPlaceholders]);

  // All placeholder values (auto + manual)
  const allPlaceholderValues = useMemo(() => ({
    ...autoFilledPlaceholders,
    ...customPlaceholders,
  }), [autoFilledPlaceholders, customPlaceholders]);

  // Generate filled content
  const filledContent = useMemo(() => {
    if (!selectedTemplate?.content) return "";
    
    let content = selectedTemplate.content;
    
    // Replace all placeholders
    Object.entries(allPlaceholderValues).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\}\\}`, 'g');
      content = content.replace(regex, value || `{{${key}}}`);
    });
    
    return content;
  }, [selectedTemplate, allPlaceholderValues]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedTemplateId("");
      setSelectedSystemId("");
      setSelectedProjectId("");
      setDocumentTitle("");
      setCustomPlaceholders({});
      setActiveTab("config");
    }
  }, [open]);

  // Auto-generate title based on template and system
  useEffect(() => {
    if (selectedTemplate && selectedSystem) {
      setDocumentTitle(`${selectedTemplate.document_type} - ${selectedSystem.name}`);
    } else if (selectedTemplate) {
      setDocumentTitle(selectedTemplate.name);
    }
  }, [selectedTemplate, selectedSystem]);

  const handleGenerate = () => {
    if (!filledContent || !documentTitle) return;

    onGenerate({
      content: filledContent,
      type: selectedTemplate?.document_type || "URS",
      title: documentTitle,
      systemId: selectedSystemId || undefined,
      projectId: selectedProjectId || undefined,
    });

    onOpenChange(false);
  };

  const handleCopyContent = () => {
    navigator.clipboard.writeText(filledContent);
  };

  // Filter templates by system's GAMP category if selected
  const filteredTemplates = useMemo(() => {
    if (!templates) return [];
    if (!selectedSystem) return templates.filter(t => t.is_active);
    
    const systemGamp = (selectedSystem as any).gamp_category;
    return templates.filter(t => 
      t.is_active && (!t.gamp_category || t.gamp_category === systemGamp || t.gamp_category === "all")
    );
  }, [templates, selectedSystem]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Gerar Documento a partir de Template
          </DialogTitle>
          <DialogDescription>
            Selecione um template e os dados para preencher automaticamente os placeholders
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="config">1. Configuração</TabsTrigger>
            <TabsTrigger value="placeholders" disabled={!selectedTemplateId}>
              2. Placeholders
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={!selectedTemplateId}>
              3. Pré-visualização
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="flex-1 overflow-auto space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sistema (opcional)</Label>
                <Select value={selectedSystemId} onValueChange={setSelectedSystemId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um sistema" />
                  </SelectTrigger>
                  <SelectContent>
                    {systems.map((system) => (
                      <SelectItem key={system.id} value={system.id}>
                        {system.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Projeto (opcional)</Label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Template *</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template" />
                </SelectTrigger>
                <SelectContent>
                  {templatesLoading && (
                    <SelectItem value="" disabled>Carregando...</SelectItem>
                  )}
                  {filteredTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>{template.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {template.document_type}
                        </Badge>
                        {template.gamp_category && (
                          <Badge variant="secondary" className="text-xs">
                            GAMP {template.gamp_category}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplate && (
              <div className="p-4 rounded-lg border bg-muted/30">
                <h4 className="font-medium mb-2">{selectedTemplate.name}</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  {selectedTemplate.description}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Badge>{selectedTemplate.document_type}</Badge>
                  {selectedTemplate.gamp_category && (
                    <Badge variant="outline">GAMP {selectedTemplate.gamp_category}</Badge>
                  )}
                  <Badge variant="secondary">v{selectedTemplate.version}</Badge>
                </div>
                {extractedPlaceholders.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-1">
                      Placeholders detectados: {extractedPlaceholders.length}
                    </p>
                    <div className="flex gap-1 flex-wrap">
                      {extractedPlaceholders.slice(0, 5).map(p => (
                        <Badge key={p} variant="outline" className="text-xs font-mono">
                          {`{{${p}}}`}
                        </Badge>
                      ))}
                      {extractedPlaceholders.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{extractedPlaceholders.length - 5} mais
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Título do Documento *</Label>
              <Input
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="Ex: URS - Sistema LIMS v2.0"
              />
            </div>

            {/* Available placeholders info */}
            {(selectedSystemId || selectedProjectId) && (
              <div className="p-4 rounded-lg border bg-primary/5 space-y-3">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-primary" />
                  Dados Disponíveis para Preenchimento
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Requisitos</span>
                    <p className="font-medium">{filteredRequirements.length} encontrados</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Riscos</span>
                    <p className="font-medium">{filteredRisks.length} encontrados</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Casos de Teste</span>
                    <p className="font-medium">{filteredTestCases.length} encontrados</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Status</span>
                    <p className="font-medium">
                      {reqLoading || riskLoading || testLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : "Carregado"}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Placeholders disponíveis:</p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs font-mono">{"{{requisitos.tabela}}"}</Badge>
                    <Badge variant="outline" className="text-xs font-mono">{"{{riscos.matriz}}"}</Badge>
                    <Badge variant="outline" className="text-xs font-mono">{"{{testes.tabela}}"}</Badge>
                    <Badge variant="outline" className="text-xs font-mono">{"{{requisitos.total}}"}</Badge>
                    <Badge variant="outline" className="text-xs font-mono">{"{{testes.taxa_aprovacao}}"}</Badge>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="placeholders" className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {/* Auto-filled placeholders */}
                {Object.entries(autoFilledPlaceholders).filter(([key]) => 
                  extractedPlaceholders.includes(key)
                ).length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Wand2 className="h-4 w-4 text-primary" />
                      Preenchidos Automaticamente
                    </h4>
                    <div className="space-y-3">
                      {Object.entries(autoFilledPlaceholders)
                        .filter(([key]) => extractedPlaceholders.includes(key))
                        .map(([key, value]) => {
                          const isMultiLine = value.includes("\n") || value.length > 100;
                          return (
                            <div key={key} className={isMultiLine ? "col-span-2" : ""}>
                              <Label className="text-xs font-mono text-muted-foreground mb-1 block">
                                {`{{${key}}}`}
                              </Label>
                              {isMultiLine ? (
                                <Textarea
                                  value={customPlaceholders[key] ?? value}
                                  onChange={(e) => setCustomPlaceholders(prev => ({
                                    ...prev,
                                    [key]: e.target.value
                                  }))}
                                  className="text-xs font-mono min-h-[100px]"
                                  rows={4}
                                />
                              ) : (
                                <Input
                                  value={customPlaceholders[key] ?? value}
                                  onChange={(e) => setCustomPlaceholders(prev => ({
                                    ...prev,
                                    [key]: e.target.value
                                  }))}
                                  className="h-8 text-sm"
                                />
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Manual placeholders */}
                {manualPlaceholders.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Preenchimento Manual</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {manualPlaceholders.map((key) => (
                        <div key={key} className="space-y-1">
                          <Label className="text-xs font-mono">
                            {`{{${key}}}`}
                          </Label>
                          <Input
                            value={customPlaceholders[key] || ""}
                            onChange={(e) => setCustomPlaceholders(prev => ({
                              ...prev,
                              [key]: e.target.value
                            }))}
                            placeholder={`Valor para ${key}`}
                            className="h-8 text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {extractedPlaceholders.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Este template não possui placeholders
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 overflow-hidden mt-4">
            <div className="flex justify-end mb-2">
              <Button variant="outline" size="sm" onClick={handleCopyContent}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar Conteúdo
              </Button>
            </div>
            <ScrollArea className="h-[400px] border rounded-lg p-4 bg-muted/20">
              <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap font-mono text-xs">
                {filledContent || "Selecione um template para visualizar"}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {activeTab !== "preview" ? (
            <Button
              onClick={() => setActiveTab(activeTab === "config" ? "placeholders" : "preview")}
              disabled={!selectedTemplateId}
            >
              Próximo
            </Button>
          ) : (
            <Button onClick={handleGenerate} disabled={!documentTitle || !filledContent}>
              <FileText className="h-4 w-4 mr-2" />
              Gerar Documento
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
