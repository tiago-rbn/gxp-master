import { useState } from "react";
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, AlertTriangle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { RiskIndicator } from "@/components/shared/RiskIndicator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { riskAssessments, type RiskAssessment } from "@/data/mockData";

// Risk Matrix Component
function RiskMatrix({ probability, severity }: { probability: number; severity: number }) {
  const cells = [];
  for (let s = 3; s >= 1; s--) {
    for (let p = 1; p <= 3; p++) {
      const isActive = p === probability && s === severity;
      const riskScore = p * s;
      let color = "bg-success/20";
      if (riskScore >= 6) color = "bg-risk-high/20";
      else if (riskScore >= 3) color = "bg-risk-medium/20";
      
      cells.push(
        <div
          key={`${p}-${s}`}
          className={`flex h-10 w-10 items-center justify-center rounded border ${color} ${
            isActive ? "ring-2 ring-primary ring-offset-2" : ""
          }`}
        >
          {isActive && <div className="h-4 w-4 rounded-full bg-primary" />}
        </div>
      );
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="grid grid-cols-3 gap-1">{cells}</div>
      <div className="flex justify-between w-full text-xs text-muted-foreground mt-1">
        <span>Baixa</span>
        <span>Probabilidade</span>
        <span>Alta</span>
      </div>
    </div>
  );
}

export default function Risks() {
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<RiskAssessment | null>(null);

  const filteredRisks = riskAssessments.filter((risk) => {
    const matchesSearch = risk.systemName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === "all" || risk.riskLevel === levelFilter;
    const matchesType = typeFilter === "all" || risk.type === typeFilter;
    return matchesSearch && matchesLevel && matchesType;
  });

  const riskStats = {
    high: riskAssessments.filter(r => r.riskLevel === 'High').length,
    medium: riskAssessments.filter(r => r.riskLevel === 'Medium').length,
    low: riskAssessments.filter(r => r.riskLevel === 'Low').length,
    open: riskAssessments.filter(r => r.status === 'Open').length,
  };

  const handleViewRisk = (risk: RiskAssessment) => {
    setSelectedRisk(risk);
    setIsDialogOpen(true);
  };

  return (
    <AppLayout>
      <PageHeader
        title="Gerenciamento de Riscos"
        description="Avaliações de risco inicial (IRA) e funcional (FRA)"
        action={{
          label: "Nova Avaliação",
          icon: Plus,
          onClick: () => {},
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
              <p className="text-2xl font-bold">{riskStats.high}</p>
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
              <p className="text-2xl font-bold">{riskStats.medium}</p>
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
              <p className="text-2xl font-bold">{riskStats.low}</p>
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
              <p className="text-2xl font-bold">{riskStats.open}</p>
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
                placeholder="Buscar por sistema..."
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
                </SelectContent>
              </Select>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Níveis</SelectItem>
                  <SelectItem value="High">Alto</SelectItem>
                  <SelectItem value="Medium">Médio</SelectItem>
                  <SelectItem value="Low">Baixo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
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
              {filteredRisks.map((risk) => (
                <TableRow key={risk.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{risk.systemName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{risk.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <RiskIndicator level={risk.riskLevel} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={risk.status} />
                  </TableCell>
                  <TableCell>
                    <RiskIndicator level={risk.residualRisk} size="sm" />
                  </TableCell>
                  <TableCell>{risk.createdAt}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewRisk(risk)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
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

      {/* View Risk Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Avaliação de Risco - {selectedRisk?.systemName}</DialogTitle>
            <DialogDescription>
              {selectedRisk?.type === 'IRA' ? 'Avaliação de Risco Inicial' : 'Avaliação de Risco Funcional'}
            </DialogDescription>
          </DialogHeader>
          {selectedRisk && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Detalhes</TabsTrigger>
                <TabsTrigger value="matrix">Matriz de Risco</TabsTrigger>
                <TabsTrigger value="controls">Controles</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Impacto na Qualidade</Label>
                    <p className="font-medium">{selectedRisk.qualityImpact} / 3</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Impacto no Paciente</Label>
                    <p className="font-medium">{selectedRisk.patientImpact} / 3</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Impacto nos Dados</Label>
                    <p className="font-medium">{selectedRisk.dataImpact} / 3</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Probabilidade</Label>
                    <p className="font-medium">{selectedRisk.probability} / 3</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Severidade</Label>
                    <p className="font-medium">{selectedRisk.severity} / 3</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Detectabilidade</Label>
                    <p className="font-medium">{selectedRisk.detectability} / 3</p>
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <div>
                    <Label className="text-muted-foreground">Nível de Risco</Label>
                    <div className="mt-1">
                      <RiskIndicator level={selectedRisk.riskLevel} size="lg" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      <StatusBadge status={selectedRisk.status} />
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="matrix" className="pt-4">
                <div className="flex flex-col items-center gap-6">
                  <Card className="p-6">
                    <CardHeader className="p-0 pb-4">
                      <CardTitle className="text-center text-lg">Matriz de Risco</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <RiskMatrix 
                        probability={selectedRisk.probability} 
                        severity={selectedRisk.severity} 
                      />
                    </CardContent>
                  </Card>
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded bg-risk-low/20" />
                      <span>Baixo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded bg-risk-medium/20" />
                      <span>Médio</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded bg-risk-high/20" />
                      <span>Alto</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="controls" className="space-y-4 pt-4">
                <div>
                  <Label className="text-muted-foreground">Controles Implementados</Label>
                  <p className="mt-1 rounded-lg bg-muted p-3">{selectedRisk.controls}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <Label className="text-muted-foreground">Risco Residual</Label>
                    <div className="mt-1">
                      <RiskIndicator level={selectedRisk.residualRisk} size="lg" />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Fechar
            </Button>
            <Button>Editar Avaliação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}