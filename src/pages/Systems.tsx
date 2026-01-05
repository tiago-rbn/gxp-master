import { useState } from "react";
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { systems, type System } from "@/data/mockData";

export default function Systems() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<System | null>(null);

  const filteredSystems = systems.filter((system) => {
    const matchesSearch = system.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      system.vendor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || system.gampCategory.toString() === categoryFilter;
    const matchesStatus = statusFilter === "all" || system.validationStatus === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleViewSystem = (system: System) => {
    setSelectedSystem(system);
    setIsDialogOpen(true);
  };

  return (
    <AppLayout>
      <PageHeader
        title="Inventário de Sistemas"
        description="Gerencie todos os sistemas computadorizados da empresa"
        action={{
          label: "Novo Sistema",
          icon: Plus,
          onClick: () => {},
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
                  <SelectItem value="Validated">Validado</SelectItem>
                  <SelectItem value="In Progress">Em Andamento</SelectItem>
                  <SelectItem value="Pending">Pendente</SelectItem>
                  <SelectItem value="Expired">Expirado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Systems Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sistema</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Versão</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria GAMP</TableHead>
                <TableHead>Criticidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSystems.map((system) => (
                <TableRow key={system.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{system.name}</TableCell>
                  <TableCell>{system.vendor}</TableCell>
                  <TableCell>{system.version}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{system.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <GampBadge category={system.gampCategory} />
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        system.criticality === "High"
                          ? "border-destructive/20 bg-destructive/10 text-destructive"
                          : system.criticality === "Medium"
                          ? "border-warning/20 bg-warning/10 text-warning"
                          : "border-success/20 bg-success/10 text-success"
                      }
                    >
                      {system.criticality === "High" ? "Alta" : system.criticality === "Medium" ? "Média" : "Baixa"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={system.validationStatus} />
                  </TableCell>
                  <TableCell>{system.responsible}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewSystem(system)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
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
        </CardContent>
      </Card>

      {/* View System Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedSystem?.name}</DialogTitle>
            <DialogDescription>Detalhes do sistema</DialogDescription>
          </DialogHeader>
          {selectedSystem && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Fornecedor</Label>
                  <p className="font-medium">{selectedSystem.vendor}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Versão</Label>
                  <p className="font-medium">{selectedSystem.version}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tipo</Label>
                  <p className="font-medium">{selectedSystem.type}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Categoria GAMP</Label>
                  <div className="mt-1">
                    <GampBadge category={selectedSystem.gampCategory} showDescription />
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Impacto GxP</Label>
                  <p className="font-medium">{selectedSystem.gxpImpact}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Criticidade</Label>
                  <p className="font-medium">{selectedSystem.criticality}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status de Validação</Label>
                  <div className="mt-1">
                    <StatusBadge status={selectedSystem.validationStatus} />
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Responsável</Label>
                  <p className="font-medium">{selectedSystem.responsible}</p>
                </div>
                {selectedSystem.lastValidation && (
                  <div>
                    <Label className="text-muted-foreground">Última Validação</Label>
                    <p className="font-medium">{selectedSystem.lastValidation}</p>
                  </div>
                )}
                {selectedSystem.nextRevalidation && (
                  <div>
                    <Label className="text-muted-foreground">Próxima Revalidação</Label>
                    <p className="font-medium">{selectedSystem.nextRevalidation}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Fechar
            </Button>
            <Button>Editar Sistema</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}