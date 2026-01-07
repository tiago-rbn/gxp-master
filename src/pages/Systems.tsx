import { useState } from "react";
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, Trash2, Loader2, Upload, AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSystems } from "@/hooks/useSystems";
import { useSystemsWithIRAStatus, calculateRiskScore, getRiskScoreColor } from "@/hooks/useSystemIRA";
import { SystemFormDialog } from "@/components/systems/SystemFormDialog";
import { SystemViewDialog } from "@/components/systems/SystemViewDialog";
import { DeleteSystemDialog } from "@/components/systems/DeleteSystemDialog";
import { ImportSystemsDialog, ParsedSystem } from "@/components/systems/ImportSystemsDialog";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type System = Database["public"]["Tables"]["systems"]["Row"] & {
  responsible?: { full_name: string } | null;
  system_owner?: { full_name: string } | null;
  process_owner?: { full_name: string } | null;
  ira?: {
    id: string;
    risk_level: string | null;
    status: string | null;
    probability: number | null;
    severity: number | null;
    detectability: number | null;
  } | null;
  hasIRA?: boolean;
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
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<System | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const navigate = useNavigate();

  const { systems, isLoading: isLoadingSystems, createSystem, updateSystem, deleteSystem } = useSystems();
  const { data: systemsWithIRA = [], isLoading: isLoadingIRA } = useSystemsWithIRAStatus();

  const isLoading = isLoadingSystems || isLoadingIRA;

  // Use systems with IRA status if available, otherwise fall back to regular systems
  const systemsData = systemsWithIRA.length > 0 ? systemsWithIRA : systems;

  const filteredSystems = systemsData.filter((system) => {
    const matchesSearch =
      system.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (system.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesCategory =
      categoryFilter === "all" || system.gamp_category === categoryFilter;
    const matchesStatus =
      statusFilter === "all" || system.validation_status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleCreateIRA = (system: System) => {
    navigate(`/risks?createIRA=true&systemId=${system.id}&systemName=${encodeURIComponent(system.name)}`);
  };

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
      system_owner_id: values.system_owner_id || null,
      process_owner_id: values.process_owner_id || null,
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

  const handleImport = async (systems: ParsedSystem[]) => {
    setIsImporting(true);
    let successCount = 0;
    let errorCount = 0;

    for (const system of systems) {
      try {
        await createSystem.mutateAsync({
          name: system.name,
          vendor: system.vendor,
          version: system.version,
          gamp_category: system.gamp_category as "1" | "3" | "4" | "5",
          criticality: system.criticality as "low" | "medium" | "high" | "critical",
          validation_status: system.validation_status as any,
          description: system.description,
          gxp_impact: system.gxp_impact,
          data_integrity_impact: system.data_integrity_impact,
          bpx_relevant: system.bpx_relevant,
          installation_location: system.installation_location,
        });
        successCount++;
      } catch (error) {
        console.error("Error importing system:", system.name, error);
        errorCount++;
      }
    }

    setIsImporting(false);
    setIsImportOpen(false);

    if (successCount > 0) {
      toast.success(`${successCount} sistema(s) importado(s) com sucesso!`);
    }
    if (errorCount > 0) {
      toast.error(`Falha ao importar ${errorCount} sistema(s).`);
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
      />

      {/* Action Buttons */}
      <div className="flex gap-2 mb-6">
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Sistema
        </Button>
        <Button variant="outline" onClick={() => setIsImportOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Importar CSV
        </Button>
      </div>

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
                  <TableHead>Categoria GAMP</TableHead>
                  <TableHead>Criticidade</TableHead>
                  <TableHead>IRA Status</TableHead>
                  <TableHead>Status Validação</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSystems.map((system) => {
                  const gampNum = gampCategoryMap[system.gamp_category];
                  const criticality = criticalityConfig[system.criticality || "medium"];
                  const statusLabel = validationStatusLabels[system.validation_status || "not_started"];
                  const statusColor = validationStatusColors[system.validation_status || "not_started"];
                  const hasIRA = (system as System).hasIRA;
                  const ira = (system as System).ira;
                  const riskScore = ira?.probability && ira?.severity && ira?.detectability
                    ? calculateRiskScore(ira.probability, ira.severity, ira.detectability)
                    : null;

                  return (
                    <TableRow
                      key={system.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleView(system as System)}
                    >
                      <TableCell className="font-medium">{system.name}</TableCell>
                      <TableCell>{system.vendor || "-"}</TableCell>
                      <TableCell>
                        <GampBadge category={gampNum} />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={criticality.className}>
                          {criticality.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                {hasIRA ? (
                                  <Badge variant="outline" className="border-success/20 bg-success/10 text-success gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    RPN: {riskScore}
                                  </Badge>
                                ) : (
                                  <Badge 
                                    variant="outline" 
                                    className="border-warning/20 bg-warning/10 text-warning gap-1 cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCreateIRA(system as System);
                                    }}
                                  >
                                    <AlertTriangle className="h-3 w-3" />
                                    Pendente
                                  </Badge>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              {hasIRA 
                                ? `IRA concluída - Risk Score: ${riskScore}` 
                                : "Clique para realizar a Avaliação de Risco Inicial"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColor}>
                          {statusLabel}
                        </Badge>
                      </TableCell>
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
                                handleView(system as System);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Visualizar
                            </DropdownMenuItem>
                            {!hasIRA && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCreateIRA(system as System);
                                }}
                              >
                                <ShieldAlert className="mr-2 h-4 w-4" />
                                Criar IRA
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(system as System);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(system as System);
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

      <ImportSystemsDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImport={handleImport}
        isLoading={isImporting}
      />
    </AppLayout>
  );
}
