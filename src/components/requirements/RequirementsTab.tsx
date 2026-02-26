import { useState } from "react";
import { Plus, Search, FileText, Eye, Edit, Trash2, MoreHorizontal, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useRequirements, type Requirement } from "@/hooks/useRequirements";
import { RequirementFormDialog } from "./RequirementFormDialog";
import { RequirementViewDialog } from "./RequirementViewDialog";
import { DeleteRequirementDialog } from "./DeleteRequirementDialog";

const typeLabels: Record<string, string> = {
  functional: "Funcional",
  non_functional: "Não-Funcional",
  regulatory: "Regulatório",
  business: "Negócio",
  technical: "Técnico",
};

const priorityLabels: Record<string, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  active: "Ativo",
  approved: "Aprovado",
  deprecated: "Obsoleto",
};

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/10 text-primary",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  critical: "bg-destructive/10 text-destructive",
};

export function RequirementsTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Requirement | null>(null);

  const { requirements, isLoading, createRequirement, updateRequirement, deleteRequirement } = useRequirements();

  const filtered = requirements.filter((r) => {
    const matchSearch =
      r.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = typeFilter === "all" || r.type === typeFilter;
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const handleCreate = () => { setSelected(null); setIsFormOpen(true); };
  const handleView = (r: Requirement) => { setSelected(r); setIsViewOpen(true); };
  const handleEdit = (r: Requirement) => { setSelected(r); setIsFormOpen(true); setIsViewOpen(false); };
  const handleDelete = (r: Requirement) => { setSelected(r); setIsDeleteOpen(true); };

  const handleFormSubmit = (values: any) => {
    if (selected) {
      updateRequirement.mutate({ id: selected.id, ...values }, { onSuccess: () => setIsFormOpen(false) });
    } else {
      createRequirement.mutate(values, { onSuccess: () => setIsFormOpen(false) });
    }
  };

  const handleConfirmDelete = () => {
    if (selected) {
      deleteRequirement.mutate(selected.id, {
        onSuccess: () => { setIsDeleteOpen(false); setSelected(null); },
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Requisitos de Usuário</h2>
          <p className="text-sm text-muted-foreground">Gerencie os requisitos de especificação do usuário (URS)</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Requisito
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por código ou título..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Tipos</SelectItem>
                <SelectItem value="functional">Funcional</SelectItem>
                <SelectItem value="non_functional">Não-Funcional</SelectItem>
                <SelectItem value="regulatory">Regulatório</SelectItem>
                <SelectItem value="business">Negócio</SelectItem>
                <SelectItem value="technical">Técnico</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="deprecated">Obsoleto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {requirements.length === 0
                  ? "Nenhum requisito cadastrado ainda."
                  : "Nenhum requisito encontrado com os filtros aplicados."}
              </p>
              {requirements.length === 0 && (
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Requisito
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sistema</TableHead>
                  <TableHead>Atualizado</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleView(r)}>
                    <TableCell>
                      <Badge variant="outline">{r.code}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{r.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{typeLabels[r.type || "functional"]}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={priorityColors[r.priority || "medium"]}>
                        {priorityLabels[r.priority || "medium"]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{statusLabels[r.status || "draft"]}</Badge>
                    </TableCell>
                    <TableCell>{r.system?.name || "-"}</TableCell>
                    <TableCell>{new Date(r.updated_at).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleView(r); }}>
                            <Eye className="mr-2 h-4 w-4" /> Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(r); }}>
                            <Edit className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(r); }}>
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <RequirementFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        requirement={selected}
        onSubmit={handleFormSubmit}
        isLoading={createRequirement.isPending || updateRequirement.isPending}
      />
      <RequirementViewDialog
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        requirement={selected}
        onEdit={() => selected && handleEdit(selected)}
      />
      <DeleteRequirementDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        requirementTitle={selected?.title || ""}
        onConfirm={handleConfirmDelete}
        isLoading={deleteRequirement.isPending}
      />
    </div>
  );
}
