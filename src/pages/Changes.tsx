import { useState } from "react";
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, ArrowRight } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { changeRequests, type ChangeRequest } from "@/data/mockData";

const statusWorkflow = ["Requested", "Analysis", "Approved", "Implementing", "Completed"];

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
  Enhancement: "Melhoria",
  "Bug Fix": "Correção",
  Configuration: "Configuração",
  Upgrade: "Upgrade",
};

const priorityColors: Record<string, string> = {
  High: "bg-destructive/10 text-destructive border-destructive/20",
  Medium: "bg-warning/10 text-warning border-warning/20",
  Low: "bg-success/10 text-success border-success/20",
};

const gxpImpactColors: Record<string, string> = {
  High: "bg-destructive/10 text-destructive border-destructive/20",
  Medium: "bg-warning/10 text-warning border-warning/20",
  Low: "bg-info/10 text-info border-info/20",
  None: "bg-muted text-muted-foreground border-border",
};

export default function Changes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedChange, setSelectedChange] = useState<ChangeRequest | null>(null);

  const filteredChanges = changeRequests.filter((change) => {
    const matchesSearch =
      change.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      change.systemName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || change.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewChange = (change: ChangeRequest) => {
    setSelectedChange(change);
    setIsDialogOpen(true);
  };

  const changeStats = {
    requested: changeRequests.filter((c) => c.status === "Requested").length,
    analysis: changeRequests.filter((c) => c.status === "Analysis").length,
    implementing: changeRequests.filter((c) => c.status === "Implementing").length,
    completed: changeRequests.filter((c) => c.status === "Completed").length,
  };

  return (
    <AppLayout>
      <PageHeader
        title="Gerenciamento de Mudanças"
        description="Controle de mudanças em sistemas validados"
        action={{
          label: "Nova Solicitação",
          icon: Plus,
          onClick: () => {},
        }}
      />

      {/* Workflow Summary */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-muted-foreground">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{changeStats.requested}</p>
            <p className="text-sm text-muted-foreground">Solicitadas</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-info">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{changeStats.analysis}</p>
            <p className="text-sm text-muted-foreground">Em Análise</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{changeStats.implementing}</p>
            <p className="text-sm text-muted-foreground">Implementando</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-success">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{changeStats.completed}</p>
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
                <SelectItem value="Requested">Solicitado</SelectItem>
                <SelectItem value="Analysis">Em Análise</SelectItem>
                <SelectItem value="Approved">Aprovado</SelectItem>
                <SelectItem value="Implementing">Implementando</SelectItem>
                <SelectItem value="Completed">Concluído</SelectItem>
                <SelectItem value="Rejected">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Changes Table */}
      <Card>
        <CardContent className="p-0">
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
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredChanges.map((change) => (
                <TableRow key={change.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{change.title}</TableCell>
                  <TableCell>{change.systemName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{typeLabels[change.type] || change.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={priorityColors[change.priority]}>
                      {change.priority === "High" ? "Alta" : change.priority === "Medium" ? "Média" : "Baixa"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={gxpImpactColors[change.gxpImpact]}>
                      {change.gxpImpact}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={change.status} />
                  </TableCell>
                  <TableCell>
                    <WorkflowIndicator currentStatus={change.status} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewChange(change)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <ArrowRight className="mr-2 h-4 w-4" />
                          Avançar Status
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Change Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedChange?.title}</DialogTitle>
            <DialogDescription>Solicitação de Mudança</DialogDescription>
          </DialogHeader>
          {selectedChange && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Sistema</Label>
                  <p className="font-medium">{selectedChange.systemName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tipo</Label>
                  <p className="font-medium">{typeLabels[selectedChange.type]}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Prioridade</Label>
                  <div className="mt-1">
                    <Badge variant="outline" className={priorityColors[selectedChange.priority]}>
                      {selectedChange.priority === "High" ? "Alta" : selectedChange.priority === "Medium" ? "Média" : "Baixa"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Impacto GxP</Label>
                  <div className="mt-1">
                    <Badge variant="outline" className={gxpImpactColors[selectedChange.gxpImpact]}>
                      {selectedChange.gxpImpact}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Solicitante</Label>
                  <p className="font-medium">{selectedChange.requester}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Data da Solicitação</Label>
                  <p className="font-medium">{selectedChange.createdAt}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Status Atual</Label>
                <div className="mt-2">
                  <StatusBadge status={selectedChange.status} />
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Workflow</Label>
                <div className="mt-3 flex items-center justify-between">
                  {statusWorkflow.map((status, index) => {
                    const currentIndex = statusWorkflow.indexOf(selectedChange.status);
                    const isActive = index <= currentIndex;
                    const isCurrent = index === currentIndex;
                    
                    return (
                      <div key={status} className="flex flex-1 items-center">
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                              isCurrent
                                ? "bg-primary text-primary-foreground"
                                : isActive
                                ? "bg-primary/20 text-primary"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <span className="mt-1 text-xs text-muted-foreground">
                            {status === "Requested"
                              ? "Solicitado"
                              : status === "Analysis"
                              ? "Análise"
                              : status === "Approved"
                              ? "Aprovado"
                              : status === "Implementing"
                              ? "Impl."
                              : "Concluído"}
                          </span>
                        </div>
                        {index < statusWorkflow.length - 1 && (
                          <div
                            className={`mx-2 h-0.5 flex-1 ${
                              isActive && index < currentIndex ? "bg-primary" : "bg-muted"
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Fechar
            </Button>
            <Button>Editar Solicitação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}