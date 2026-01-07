import { useState } from "react";
import { Plus, Trash2, FileText, Link2, Check, Clock, MoreHorizontal, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProjectDeliverables, ProjectDeliverable } from "@/hooks/useProjectDeliverables";
import { useDocuments } from "@/hooks/useDocuments";
import { useDocumentTypes } from "@/hooks/useDocumentTypes";
import { useDeliverableTemplates } from "@/hooks/useDeliverableTemplates";

interface ProjectDeliverablesTabProps {
  projectId: string;
  gampCategory?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Pendente", className: "bg-muted text-muted-foreground" },
  in_progress: { label: "Em Andamento", className: "bg-warning/10 text-warning border-warning/20" },
  completed: { label: "Concluído", className: "bg-success/10 text-success border-success/20" },
};

export function ProjectDeliverablesTab({ projectId, gampCategory }: ProjectDeliverablesTabProps) {
  const { deliverables, isLoading, addDeliverable, updateDeliverable, deleteDeliverable, linkDocument, applyTemplate } = useProjectDeliverables(projectId);
  const { documents } = useDocuments();
  const { documentTypes } = useDocumentTypes();
  const { templates: deliverableTemplates } = useDeliverableTemplates();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [isApplyTemplateOpen, setIsApplyTemplateOpen] = useState(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState<ProjectDeliverable | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>("");
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    document_type: "",
    is_mandatory: true,
    due_date: "",
  });

  const handleOpenForm = (deliverable?: ProjectDeliverable) => {
    if (deliverable) {
      setSelectedDeliverable(deliverable);
      setFormData({
        name: deliverable.name,
        description: deliverable.description || "",
        document_type: deliverable.document_type || "",
        is_mandatory: deliverable.is_mandatory,
        due_date: deliverable.due_date || "",
      });
    } else {
      setSelectedDeliverable(null);
      setFormData({
        name: "",
        description: "",
        document_type: "",
        is_mandatory: true,
        due_date: "",
      });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    if (selectedDeliverable) {
      await updateDeliverable.mutateAsync({
        id: selectedDeliverable.id,
        ...formData,
        due_date: formData.due_date || null,
      });
    } else {
      await addDeliverable.mutateAsync({
        project_id: projectId,
        ...formData,
        due_date: formData.due_date || null,
        status: "pending",
        sort_order: deliverables.length,
      });
    }
    setIsFormOpen(false);
  };

  const handleOpenLink = (deliverable: ProjectDeliverable) => {
    setSelectedDeliverable(deliverable);
    setSelectedDocumentId(deliverable.document_id || "");
    setIsLinkOpen(true);
  };

  const handleLinkDocument = async () => {
    if (selectedDeliverable) {
      await linkDocument.mutateAsync({
        deliverableId: selectedDeliverable.id,
        documentId: selectedDocumentId || null,
      });
    }
    setIsLinkOpen(false);
  };

  const handleApplyTemplate = async () => {
    if (gampCategory) {
      await applyTemplate.mutateAsync(gampCategory);
      setIsApplyTemplateOpen(false);
    }
  };

  const templatesForCategory = deliverableTemplates?.filter(t => t.gamp_category === gampCategory) || [];
  const templateCount = templatesForCategory.length;

  const handleToggleStatus = async (deliverable: ProjectDeliverable) => {
    const newStatus = deliverable.status === "completed" ? "pending" : "completed";
    await updateDeliverable.mutateAsync({
      id: deliverable.id,
      status: newStatus,
      completed_at: newStatus === "completed" ? new Date().toISOString() : null,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {deliverables.filter(d => d.status === "completed").length} de {deliverables.length} concluídos
        </div>
        <div className="flex gap-2">
          {gampCategory && templateCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => setIsApplyTemplateOpen(true)} disabled={applyTemplate.isPending}>
              <Download className="mr-2 h-4 w-4" />
              Aplicar Template ({templateCount})
            </Button>
          )}
          <Button size="sm" onClick={() => handleOpenForm()}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Entregável
          </Button>
        </div>
      </div>

      {deliverables.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum entregável cadastrado.</p>
          <p className="text-sm">Adicione entregáveis ou aplique um template.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Entregável</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deliverables.map((deliverable) => {
              const status = statusConfig[deliverable.status] || statusConfig.pending;
              return (
                <TableRow key={deliverable.id}>
                  <TableCell>
                    <Checkbox
                      checked={deliverable.status === "completed"}
                      onCheckedChange={() => handleToggleStatus(deliverable)}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <span className={`font-medium ${deliverable.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                        {deliverable.name}
                      </span>
                      {deliverable.is_mandatory && (
                        <Badge variant="outline" className="ml-2 text-xs">Obrigatório</Badge>
                      )}
                      {deliverable.description && (
                        <p className="text-xs text-muted-foreground mt-1">{deliverable.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {deliverable.document_type || "-"}
                  </TableCell>
                  <TableCell>
                    {deliverable.document ? (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-sm">{deliverable.document.title}</span>
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => handleOpenLink(deliverable)}>
                        <Link2 className="mr-2 h-4 w-4" />
                        Vincular
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={status.className}>
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenForm(deliverable)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenLink(deliverable)}>
                          <Link2 className="mr-2 h-4 w-4" />
                          {deliverable.document_id ? "Alterar Documento" : "Vincular Documento"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteDeliverable.mutate(deliverable.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedDeliverable ? "Editar Entregável" : "Novo Entregável"}</DialogTitle>
            <DialogDescription>
              Defina os detalhes do entregável do projeto.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Plano de Validação"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o entregável..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Documento</Label>
                <Select value={formData.document_type} onValueChange={(v) => setFormData({ ...formData, document_type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type.id} value={type.code}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data Limite</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_mandatory"
                checked={formData.is_mandatory}
                onCheckedChange={(checked) => setFormData({ ...formData, is_mandatory: !!checked })}
              />
              <Label htmlFor="is_mandatory" className="cursor-pointer">Entregável obrigatório</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!formData.name || addDeliverable.isPending || updateDeliverable.isPending}>
              {addDeliverable.isPending || updateDeliverable.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Document Dialog */}
      <Dialog open={isLinkOpen} onOpenChange={setIsLinkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular Documento</DialogTitle>
            <DialogDescription>
              Selecione um documento existente para vincular a este entregável.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Documento</Label>
              <Select value={selectedDocumentId} onValueChange={setSelectedDocumentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um documento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum documento</SelectItem>
                  {documents
                    .filter(doc => !selectedDeliverable?.document_type || doc.document_type === selectedDeliverable.document_type)
                    .map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>
                        {doc.title} (v{doc.version})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkOpen(false)}>Cancelar</Button>
            <Button onClick={handleLinkDocument} disabled={linkDocument.isPending}>
              {linkDocument.isPending ? "Vinculando..." : "Vincular"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apply Template Confirmation Dialog */}
      <AlertDialog open={isApplyTemplateOpen} onOpenChange={setIsApplyTemplateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aplicar Template de Entregáveis</AlertDialogTitle>
            <AlertDialogDescription>
              Serão adicionados {templateCount} entregáveis do template da categoria GAMP {gampCategory}.
              {deliverables.length > 0 && (
                <span className="block mt-2 text-warning font-medium">
                  Atenção: Este projeto já possui {deliverables.length} entregável(is). 
                  Os novos itens serão adicionados aos existentes.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleApplyTemplate} disabled={applyTemplate.isPending}>
              {applyTemplate.isPending ? "Aplicando..." : "Aplicar Template"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
