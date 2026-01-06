import { useState } from "react";
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, Trash2, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { GampBadge } from "@/components/shared/GampBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useSystems } from "@/hooks/useSystems";
import { SystemFormDialog } from "@/components/systems/SystemFormDialog";
import { SystemViewDialog } from "@/components/systems/SystemViewDialog";
import { DeleteSystemDialog } from "@/components/systems/DeleteSystemDialog";
import type { Database } from "@/integrations/supabase/types";

type System = Database["public"]["Tables"]["systems"]["Row"] & {
  responsible?: { full_name: string } | null;
};

const gampCategoryMap: Record<string, 1 | 3 | 4 | 5> = {
  "1": 1,
  "3": 3,
  "4": 4,
  "5": 5,
};

const validationStatusLabels: Record<string, string> = {
  not_started: "Não Iniciado",
  in_progress: "Em Andamento",
  validated: "Validado",
  expired: "Expirado",
  pending_revalidation: "Revalidação Pendente",
};

const validationStatusColors: Record<string, string> = {
  not_started: "bg-muted text-muted-foreground",
  in_progress: "bg-warning/10 text-warning border-warning/20",
  validated: "bg-success/10 text-success border-success/20",
  expired: "bg-destructive/10 text-destructive border-destructive/20",
  pending_revalidation: "bg-orange-500/10 text-orange-600 border-orange-500/20",
};

const criticalityConfig: Record<string, { label: string; className: string }> = {
  low: { label: "Baixa", className: "border-success/20 bg-success/10 text-success" },
  medium: { label: "Média", className: "border-warning/20 bg-warning/10 text-warning" },
  high: { label: "Alta", className: "border-destructive/20 bg-destructive/10 text-destructive" },
  critical: { label: "Crítica", className: "border-destructive/20 bg-destructive/10 text-destructive" },
};

export default function Systems() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<System | null>(null);

  const { systems, isLoading, createSystem, updateSystem, deleteSystem } = useSystems();

  const filteredSystems = systems.filter((system) => {
    const matchesSearch =
      system.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (system.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesCategory =
      categoryFilter === "all" || system.gamp_category === categoryFilter;
    const matchesStatus =
      statusFilter === "all" || system.validation_status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleCreate = () => {
    setSelectedSystem(null);
    setIsFormOpen(true);
  };

  const handleView = (system: System) => {
    setSelectedSystem(system);
    setIsViewOpen(true);
  };

  const handleEdit = (system: System) => {
    setSelectedSystem(system);
    setIsFormOpen(true);
    setIsViewOpen(false);
  };

  const handleDelete = (system: System) => {
    setSelectedSystem(system);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = (values: any) => {
    const payload = {
      ...values,
      responsible_id: values.responsible_id || null,
      last_validation_date: values.last_validation_date || null,
      next_revalidation_date: values.next_revalidation_date || null,
    };

    if (selectedSystem) {
      updateSystem.mutate(
        { id: selectedSystem.id, ...payload },
        { onSuccess: () => setIsFormOpen(false) }
      );
    } else {
      createSystem.mutate(payload, { onSuccess: () => setIsFormOpen(false) });
    }
  };

  const handleConfirmDelete = () => {
    if (selectedSystem) {
      deleteSystem.mutate(selectedSystem.id, {
        onSuccess: () => {
          setIsDeleteOpen(false);
          setSelectedSystem(null);
        },
      });
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Inventário de Sistemas"
        description="Gerencie todos os sistemas computadorizados da empresa"
        action={{
          label: "Novo Sistema",
          icon: Plus,
          onClick: handleCreate,
        }}
      />

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou fornecedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Categorias</SelectItem>
                  <SelectItem value="1">Categoria 1</SelectItem>
                  <SelectItem value="3">Categoria 3</SelectItem>
                  <SelectItem value="4">Categoria 4</SelectItem>
                  <SelectItem value="5">Categoria 5</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="validated">Validado</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="not_started">Não Iniciado</SelectItem>
                  <SelectItem value="expired">Expirado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Systems Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredSystems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">
                {systems.length === 0
                  ? "Nenhum sistema cadastrado ainda."
                  : "Nenhum sistema encontrado com os filtros aplicados."}
              </p>
              {systems.length === 0 && (
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Primeiro Sistema
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sistema</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Versão</TableHead>
                  <TableHead>Categoria GAMP</TableHead>
                  <TableHead>Criticidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSystems.map((system) => {
                  const gampNum = gampCategoryMap[system.gamp_category];
                  const criticality = criticalityConfig[system.criticality || "medium"];
                  const statusLabel = validationStatusLabels[system.validation_status || "not_started"];
                  const statusColor = validationStatusColors[system.validation_status || "not_started"];

                  return (
                    <TableRow
                      key={system.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleView(system)}
                    >
                      <TableCell className="font-medium">{system.name}</TableCell>
                      <TableCell>{system.vendor || "-"}</TableCell>
                      <TableCell>{system.version || "-"}</TableCell>
                      <TableCell>
                        <GampBadge category={gampNum} />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={criticality.className}>
                          {criticality.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColor}>
                          {statusLabel}
                        </Badge>
                      </TableCell>
                      <TableCell>{system.responsible?.full_name || "-"}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleView(system);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(system);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(system);
                              }}
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
        </CardContent>
      </Card>

      {/* Dialogs */}
      <SystemFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        system={selectedSystem}
        onSubmit={handleFormSubmit}
        isLoading={createSystem.isPending || updateSystem.isPending}
      />

      <SystemViewDialog
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        system={selectedSystem}
        onEdit={() => selectedSystem && handleEdit(selectedSystem)}
      />

      <DeleteSystemDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        systemName={selectedSystem?.name || ""}
        onConfirm={handleConfirmDelete}
        isLoading={deleteSystem.isPending}
      />
    </AppLayout>
  );
}
