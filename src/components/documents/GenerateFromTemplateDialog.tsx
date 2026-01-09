import { useState, useMemo, useEffect } from "react";
import { FileText, Wand2, Copy, Eye } from "lucide-react";
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
import { useDocumentTemplatesNew, DocumentTemplate } from "@/hooks/useDocumentTemplatesNew";
import { useSystemsForSelect } from "@/hooks/useRiskAssessments";
import { useValidationProjects } from "@/hooks/useValidationProjects";
import { useAuth } from "@/contexts/AuthContext";
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

export function GenerateFromTemplateDialog({
  open,
  onOpenChange,
  onGenerate,
}: GenerateFromTemplateDialogProps) {
  const { templates, isLoading: templatesLoading } = useDocumentTemplatesNew();
  const { data: systems = [] } = useSystemsForSelect();
  const { projects = [] } = useValidationProjects();
  const { user } = useAuth();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedSystemId, setSelectedSystemId] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [documentTitle, setDocumentTitle] = useState<string>("");
  const [customPlaceholders, setCustomPlaceholders] = useState<PlaceholderValues>({});
  const [activeTab, setActiveTab] = useState<string>("config");

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

  // Auto-fill placeholders based on selected system/project
  const autoFilledPlaceholders = useMemo<PlaceholderValues>(() => {
    const values: PlaceholderValues = {};
    const now = new Date();

    // Data atual
    values["data.atual"] = format(now, "dd/MM/yyyy", { locale: ptBR });
    values["data.hora"] = format(now, "HH:mm", { locale: ptBR });
    values["data.completa"] = format(now, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

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
    }

    // Usuário
    if (user) {
      values["usuario.nome"] = (user as any).user_metadata?.full_name || user.email || "";
      values["usuario.email"] = user.email || "";
    }

    // Empresa
    values["empresa.nome"] = ""; // Will be filled from profile if needed

    return values;
  }, [selectedSystem, selectedProject, user]);

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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(autoFilledPlaceholders)
                        .filter(([key]) => extractedPlaceholders.includes(key))
                        .map(([key, value]) => (
                          <div key={key} className="space-y-1">
                            <Label className="text-xs font-mono text-muted-foreground">
                              {`{{${key}}}`}
                            </Label>
                            <Input
                              value={value}
                              onChange={(e) => setCustomPlaceholders(prev => ({
                                ...prev,
                                [key]: e.target.value
                              }))}
                              className="h-8 text-sm"
                            />
                          </div>
                        ))}
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
