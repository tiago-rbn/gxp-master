import { useState } from "react";
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, ArrowRight, Trash2, Loader2, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge, type StatusType } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useChangeRequests, type ChangeRequestWithRelations } from "@/hooks/useChangeRequests";
import { ChangeFormDialog } from "@/components/changes/ChangeFormDialog";
import { ChangeViewDialog } from "@/components/changes/ChangeViewDialog";
import { DeleteChangeDialog } from "@/components/changes/DeleteChangeDialog";

const statusWorkflow = ["pending", "in_review", "approved", "in_progress", "completed"];

function WorkflowIndicator({ currentStatus }: { currentStatus: string }) {
  const currentIndex = statusWorkflow.indexOf(currentStatus);

  return (
    <div className="flex items-center gap-1">
      {statusWorkflow.slice(0, -1).map((status, index) => {
        const isActive = index <= currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={status} className="flex items-center">
            <div
              className={`h-2.5 w-2.5 rounded-full ${
                isCurrent
                  ? "bg-primary ring-2 ring-primary/30"
                  : isActive
                  ? "bg-primary"
                  : "bg-muted"
              }`}
            />
            {index < statusWorkflow.length - 2 && (
              <div
                className={`h-0.5 w-4 ${isActive ? "bg-primary" : "bg-muted"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

const typeLabels: Record<string, string> = {
  enhancement: "Melhoria",
  bug_fix: "Correção",
  configuration: "Configuração",
  upgrade: "Upgrade",
  new_feature: "Nova Func.",
  decommission: "Desativação",
};

const priorityColors: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-success/10 text-success border-success/20",
};

const priorityLabels: Record<string, string> = {
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};

export default function Changes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedChange, setSelectedChange] = useState<ChangeRequestWithRelations | null>(null);

  const {
    changeRequests,
    isLoading,
    stats,
    createChangeRequest,
    updateChangeRequest,
    deleteChangeRequest,
    advanceStatus,
  } = useChangeRequests();

  const filteredChanges = changeRequests.filter((change) => {
    const matchesSearch =
      change.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      change.systems?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || change.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = () => {
    setSelectedChange(null);
    setIsFormOpen(true);
  };

  const handleView = (change: ChangeRequestWithRelations) => {
    setSelectedChange(change);
    setIsViewOpen(true);
  };

  const handleEdit = (change: ChangeRequestWithRelations) => {
    setSelectedChange(change);
    setIsFormOpen(true);
    setIsViewOpen(false);
  };

  const handleDelete = (change: ChangeRequestWithRelations) => {
    setSelectedChange(change);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = (data: any) => {
    if (selectedChange) {
      updateChangeRequest.mutate(
        { id: selectedChange.id, ...data },
        { onSuccess: () => setIsFormOpen(false) }
      );
    } else {
      createChangeRequest.mutate(data, {
        onSuccess: () => setIsFormOpen(false),
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedChange) {
      deleteChangeRequest.mutate(selectedChange.id, {
        onSuccess: () => setIsDeleteOpen(false),
      });
    }
  };

  const handleAdvanceStatus = () => {
    if (selectedChange) {
      advanceStatus.mutate(
        { id: selectedChange.id, currentStatus: selectedChange.status || "pending" },
        { onSuccess: () => setIsViewOpen(false) }
      );
    }
  };

  const canAdvanceStatus = (status: string | null) => {
    return status && status !== "completed" && status !== "rejected";
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Gerenciamento de Mudanças"
        description="Controle de mudanças em sistemas validados"
        action={{
          label: "Nova Solicitação",
          icon: Plus,
          onClick: handleCreate,
        }}
      />

      {/* Workflow Summary */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-muted-foreground">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{stats.pending}</p>
            <p className="text-sm text-muted-foreground">Solicitadas</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-info">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{stats.in_review}</p>
            <p className="text-sm text-muted-foreground">Em Análise</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{stats.in_progress}</p>
            <p className="text-sm text-muted-foreground">Implementando</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-success">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{stats.completed}</p>
            <p className="text-sm text-muted-foreground">Concluídas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por título ou sistema..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="pending">Solicitado</SelectItem>
                <SelectItem value="in_review">Em Análise</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="in_progress">Implementando</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Changes Table */}
      <Card>
        <CardContent className="p-0">
          {filteredChanges.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Nenhuma solicitação encontrada"
              description="Crie uma nova solicitação de mudança para começar."
              action={{
                label: "Nova Solicitação",
                onClick: handleCreate,
              }}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Sistema</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Impacto GxP</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChanges.map((change) => (
                  <TableRow
                    key={change.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleView(change)}
                  >
                    <TableCell className="font-medium">{change.title}</TableCell>
                    <TableCell>{change.systems?.name || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {typeLabels[change.change_type || ""] || change.change_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={priorityColors[change.priority || "medium"]}
                      >
                        {priorityLabels[change.priority || "medium"]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          change.gxp_impact
                            ? "bg-destructive/10 text-destructive border-destructive/20"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {change.gxp_impact ? "Sim" : "Não"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={(change.status || "pending") as StatusType} />
                    </TableCell>
                    <TableCell>
                      <WorkflowIndicator currentStatus={change.status || "pending"} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(change.created_at), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleView(change); }}>
                            <Eye className="mr-2 h-4 w-4" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(change); }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          {canAdvanceStatus(change.status) && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                advanceStatus.mutate({
                                  id: change.id,
                                  currentStatus: change.status || "pending",
                                });
                              }}
                            >
                              <ArrowRight className="mr-2 h-4 w-4" />
                              Avançar Status
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => { e.stopPropagation(); handleDelete(change); }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
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
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ChangeFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        changeRequest={selectedChange}
        onSubmit={handleFormSubmit}
        isLoading={createChangeRequest.isPending || updateChangeRequest.isPending}
      />

      <ChangeViewDialog
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        changeRequest={selectedChange}
        onEdit={() => handleEdit(selectedChange!)}
        onAdvanceStatus={handleAdvanceStatus}
        canAdvanceStatus={canAdvanceStatus(selectedChange?.status || null)}
      />

      <DeleteChangeDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDeleteConfirm}
        changeTitle={selectedChange?.title}
        isLoading={deleteChangeRequest.isPending}
      />
    </AppLayout>
  );
}
