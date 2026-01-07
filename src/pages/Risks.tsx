import { useState } from "react";
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { RiskIndicator } from "@/components/shared/RiskIndicator";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRiskAssessments } from "@/hooks/useRiskAssessments";
import { RiskFormDialog } from "@/components/risks/RiskFormDialog";
import { RiskViewDialog } from "@/components/risks/RiskViewDialog";
import { DeleteRiskDialog } from "@/components/risks/DeleteRiskDialog";
import type { Database } from "@/integrations/supabase/types";

type RiskAssessment = Database["public"]["Tables"]["risk_assessments"]["Row"] & {
  system?: { name: string } | null;
  assessor?: { full_name: string } | null;
  approver?: { full_name: string } | null;
  reviewer?: { full_name: string } | null;
};

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const riskLevelToOldFormat: Record<string, "High" | "Medium" | "Low"> = {
  critical: "High",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export default function Risks() {
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<RiskAssessment | null>(null);

  const {
    riskAssessments,
    isLoading,
    stats,
    createRiskAssessment,
    updateRiskAssessment,
    deleteRiskAssessment,
  } = useRiskAssessments();

  // Extract all unique tags from risks
  const allTags = Array.from(
    new Set(riskAssessments.flatMap((r: any) => r.tags || []))
  ).sort();

  const filteredRisks = riskAssessments.filter((risk) => {
    const matchesSearch =
      risk.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (risk.system?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesLevel = levelFilter === "all" || risk.risk_level === levelFilter;
    const matchesType = typeFilter === "all" || risk.assessment_type === typeFilter;
    const matchesTag = tagFilter === "all" || ((risk as any).tags || []).includes(tagFilter);
    return matchesSearch && matchesLevel && matchesType && matchesTag;
  });

  const handleCreate = () => {
    setSelectedRisk(null);
    setIsFormOpen(true);
  };

  const handleView = (risk: RiskAssessment) => {
    setSelectedRisk(risk);
    setIsViewOpen(true);
  };

  const handleEdit = (risk: RiskAssessment) => {
    setSelectedRisk(risk);
    setIsFormOpen(true);
    setIsViewOpen(false);
  };

  const handleDelete = (risk: RiskAssessment) => {
    setSelectedRisk(risk);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = (values: any) => {
    const payload = {
      ...values,
      system_id: values.system_id || null,
      assessor_id: values.assessor_id || null,
      approver_id: values.approver_id || null,
      reviewer_id: values.reviewer_id || null,
      tags: values.tags || [],
    };

    if (selectedRisk) {
      updateRiskAssessment.mutate(
        { id: selectedRisk.id, ...payload },
        { onSuccess: () => setIsFormOpen(false) }
      );
    } else {
      createRiskAssessment.mutate(payload, { onSuccess: () => setIsFormOpen(false) });
    }
  };

  const handleConfirmDelete = () => {
    if (selectedRisk) {
      deleteRiskAssessment.mutate(selectedRisk.id, {
        onSuccess: () => {
          setIsDeleteOpen(false);
          setSelectedRisk(null);
        },
      });
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Gerenciamento de Riscos"
        description="Avaliações de risco inicial (IRA) e funcional (FRA)"
        action={{
          label: "Nova Avaliação",
          icon: Plus,
          onClick: handleCreate,
        }}
      />

      {/* Risk Summary Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-risk-high/10">
              <AlertTriangle className="h-6 w-6 text-risk-high" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.high}</p>
              <p className="text-sm text-muted-foreground">Riscos Altos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-risk-medium/10">
              <AlertTriangle className="h-6 w-6 text-risk-medium" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.medium}</p>
              <p className="text-sm text-muted-foreground">Riscos Médios</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-risk-low/10">
              <AlertTriangle className="h-6 w-6 text-risk-low" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.low}</p>
              <p className="text-sm text-muted-foreground">Riscos Baixos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
              <AlertTriangle className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.open}</p>
              <p className="text-sm text-muted-foreground">Em Aberto</p>
            </div>
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
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Tipos</SelectItem>
                  <SelectItem value="IRA">IRA</SelectItem>
                  <SelectItem value="FRA">FRA</SelectItem>
                  <SelectItem value="FMEA">FMEA</SelectItem>
                </SelectContent>
              </Select>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Níveis</SelectItem>
                  <SelectItem value="critical">Crítico</SelectItem>
                  <SelectItem value="high">Alto</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="low">Baixo</SelectItem>
                </SelectContent>
              </Select>
              {allTags.length > 0 && (
                <Select value={tagFilter} onValueChange={setTagFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Tag" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Tags</SelectItem>
                    {allTags.map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
                <SelectContent>
                  <SelectItem value="all">Todos Níveis</SelectItem>
                  <SelectItem value="critical">Crítico</SelectItem>
                  <SelectItem value="high">Alto</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="low">Baixo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredRisks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">
                {riskAssessments.length === 0
                  ? "Nenhuma avaliação de risco cadastrada ainda."
                  : "Nenhuma avaliação encontrada com os filtros aplicados."}
              </p>
              {riskAssessments.length === 0 && (
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeira Avaliação
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Sistema</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Nível de Risco</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Risco Residual</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRisks.map((risk) => {
                  const riskLevel = riskLevelToOldFormat[risk.risk_level || "low"];
                  const residualLevel = riskLevelToOldFormat[risk.residual_risk || "low"];

                  return (
                    <TableRow
                      key={risk.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleView(risk)}
                    >
                      <TableCell className="font-medium">{risk.title}</TableCell>
                      <TableCell>{risk.system?.name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{risk.assessment_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <RiskIndicator level={riskLevel} />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {statusLabels[risk.status || "draft"]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <RiskIndicator level={residualLevel} size="sm" />
                      </TableCell>
                      <TableCell>
                        {new Date(risk.created_at).toLocaleDateString("pt-BR")}
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
                                handleView(risk);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(risk);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(risk);
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
      <RiskFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        risk={selectedRisk}
        onSubmit={handleFormSubmit}
        isLoading={createRiskAssessment.isPending || updateRiskAssessment.isPending}
      />

      <RiskViewDialog
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        risk={selectedRisk}
        onEdit={() => selectedRisk && handleEdit(selectedRisk)}
      />

      <DeleteRiskDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        riskTitle={selectedRisk?.title || ""}
        onConfirm={handleConfirmDelete}
        isLoading={deleteRiskAssessment.isPending}
      />
    </AppLayout>
  );
}
