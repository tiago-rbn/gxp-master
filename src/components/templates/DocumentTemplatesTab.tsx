import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  History,
  FileDown,
  FileText,
  Loader2,
} from "lucide-react";
import { useDocumentTemplatesNew, DocumentTemplate } from "@/hooks/useDocumentTemplatesNew";
import { DocumentTemplateFormDialog } from "./DocumentTemplateFormDialog";
import { CloneTemplateDialog } from "./CloneTemplateDialog";
import { TemplateVersionsDialog } from "./TemplateVersionsDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function DocumentTemplatesTab() {
  const {
    templates,
    isLoading,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    cloneTemplate,
    loadDefaultTemplates,
  } = useDocumentTemplatesNew();

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterGamp, setFilterGamp] = useState<string>("all");

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<DocumentTemplate | null>(null);
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [templateToClone, setTemplateToClone] = useState<DocumentTemplate | null>(null);
  const [versionsDialogOpen, setVersionsDialogOpen] = useState(false);
  const [templateForVersions, setTemplateForVersions] = useState<DocumentTemplate | null>(null);

  // Get unique document types from templates
  const documentTypes = [...new Set((templates || []).map((t) => t.document_type))];

  // Filter templates
  const filteredTemplates = (templates || []).filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(search.toLowerCase()) ||
      template.document_type.toLowerCase().includes(search.toLowerCase()) ||
      (template.description || "").toLowerCase().includes(search.toLowerCase());

    const matchesType = filterType === "all" || template.document_type === filterType;
    const matchesGamp = filterGamp === "all" || template.gamp_category === filterGamp || (!template.gamp_category && filterGamp === "all");

    return matchesSearch && matchesType && matchesGamp;
  });

  const handleCreate = () => {
    setSelectedTemplate(null);
    setFormDialogOpen(true);
  };

  const handleEdit = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setFormDialogOpen(true);
  };

  const handleDelete = (template: DocumentTemplate) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const handleClone = (template: DocumentTemplate) => {
    setTemplateToClone(template);
    setCloneDialogOpen(true);
  };

  const handleViewVersions = (template: DocumentTemplate) => {
    setTemplateForVersions(template);
    setVersionsDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (templateToDelete) {
      await deleteTemplate.mutateAsync(templateToDelete.id);
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  const confirmClone = async (newName: string) => {
    if (templateToClone) {
      await cloneTemplate.mutateAsync({ templateId: templateToClone.id, newName });
      setCloneDialogOpen(false);
      setTemplateToClone(null);
    }
  };

  const handleFormSubmit = async (data: Omit<DocumentTemplate, "id" | "company_id" | "created_at" | "updated_at">) => {
    if (selectedTemplate) {
      await updateTemplate.mutateAsync({
        id: selectedTemplate.id,
        updates: data,
        createVersion: true,
        changeSummary: "Atualização do template",
      });
    } else {
      await addTemplate.mutateAsync(data);
    }
    setFormDialogOpen(false);
    setSelectedTemplate(null);
  };

  const getGampLabel = (category: string | null) => {
    if (!category) return null;
    const labels: Record<string, string> = {
      "1": "GAMP 1",
      "3": "GAMP 3",
      "4": "GAMP 4",
      "5": "GAMP 5",
    };
    return labels[category] || category;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Templates de Documentos
              </CardTitle>
              <CardDescription>
                Gerencie os templates de documentos de validação da empresa
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => loadDefaultTemplates.mutate()}
                disabled={loadDefaultTemplates.isPending}
              >
                {loadDefaultTemplates.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4 mr-2" />
                )}
                Carregar Templates Padrão
              </Button>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Template
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo de documento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {documentTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterGamp} onValueChange={setFilterGamp}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoria GAMP" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                <SelectItem value="1">GAMP 1</SelectItem>
                <SelectItem value="3">GAMP 3</SelectItem>
                <SelectItem value="4">GAMP 4</SelectItem>
                <SelectItem value="5">GAMP 5</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <ScrollArea className="h-[500px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  Nenhum template encontrado
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {templates?.length === 0
                    ? "Clique em 'Carregar Templates Padrão' para começar ou crie um novo template."
                    : "Tente ajustar os filtros de busca."}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>GAMP</TableHead>
                    <TableHead>Sistema</TableHead>
                    <TableHead>Versão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Atualizado</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{template.name}</p>
                          {template.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                              {template.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{template.document_type}</Badge>
                      </TableCell>
                      <TableCell>
                        {template.gamp_category ? (
                          <Badge variant="secondary">
                            {getGampLabel(template.gamp_category)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Todos</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {template.system_name || (
                          <span className="text-muted-foreground text-sm">Todos</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">v{template.version}</Badge>
                      </TableCell>
                      <TableCell>
                        {template.is_active ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(template.updated_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(template)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleClone(template)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Clonar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewVersions(template)}>
                              <History className="h-4 w-4 mr-2" />
                              Histórico de Versões
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(template)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <DocumentTemplateFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        template={selectedTemplate}
        onSubmit={handleFormSubmit}
        isSubmitting={addTemplate.isPending || updateTemplate.isPending}
      />

      <CloneTemplateDialog
        open={cloneDialogOpen}
        onOpenChange={setCloneDialogOpen}
        templateName={templateToClone?.name || ""}
        onConfirm={confirmClone}
        isSubmitting={cloneTemplate.isPending}
      />

      <TemplateVersionsDialog
        open={versionsDialogOpen}
        onOpenChange={setVersionsDialogOpen}
        templateId={templateForVersions?.id || null}
        templateName={templateForVersions?.name || ""}
        currentVersion={templateForVersions?.version || ""}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Template</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o template "{templateToDelete?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
