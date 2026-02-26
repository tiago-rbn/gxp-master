import { useState } from "react";
import { Plus, Search, Eye, Edit, Trash2, Loader2, ChevronDown, ChevronRight, FolderOpen, AlertTriangle, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RiskIndicator } from "@/components/shared/RiskIndicator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface FRAGroupedTabProps {
  risks: any[];
  isLoading: boolean;
  onView: (risk: any) => void;
  onEdit: (risk: any) => void;
  onDelete: (risk: any) => void;
  onCreate: () => void;
  onLoadTemplate: () => void;
}

const riskLevelToOldFormat: Record<string, "High" | "Medium" | "Low"> = {
  critical: "High", high: "High", medium: "Medium", low: "Low",
};

const statusLabels: Record<string, string> = {
  draft: "Rascunho", pending: "Pendente", approved: "Aprovado",
  rejected: "Rejeitado", completed: "Concluído", cancelled: "Cancelado",
};

export function FRAGroupedTab({ risks, isLoading, onView, onEdit, onDelete, onCreate, onLoadTemplate }: FRAGroupedTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedSystems, setExpandedSystems] = useState<Set<string>>(new Set(["no-system"]));

  const filtered = risks.filter((r) =>
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.system?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  // Group by system
  const grouped = new Map<string, { name: string; risks: any[] }>();
  filtered.forEach((risk) => {
    const key = risk.system_id || "no-system";
    const name = risk.system?.name || "Sem Sistema";
    if (!grouped.has(key)) {
      grouped.set(key, { name, risks: [] });
    }
    grouped.get(key)!.risks.push(risk);
  });

  const toggleSystem = (key: string) => {
    setExpandedSystems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Expand all by default on first render
  const expandAll = () => {
    setExpandedSystems(new Set(Array.from(grouped.keys())));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar FRA por título ou sistema..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={expandAll}>Expandir Todos</Button>
              <Button variant="outline" onClick={onLoadTemplate}>
                <Package className="mr-2 h-4 w-4" />
                Carregar Template
              </Button>
              <Button onClick={onCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Nova FRA
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {risks.length === 0 ? "Nenhuma FRA cadastrada ainda." : "Nenhuma FRA encontrada."}
            </p>
            {risks.length === 0 && (
              <Button onClick={onCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira FRA
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {Array.from(grouped.entries()).map(([key, group]) => {
            const isExpanded = expandedSystems.has(key);
            const highCount = group.risks.filter((r) => r.risk_level === "high" || r.risk_level === "critical").length;
            const mediumCount = group.risks.filter((r) => r.risk_level === "medium").length;

            return (
              <Collapsible key={key} open={isExpanded} onOpenChange={() => toggleSystem(key)}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardContent className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                          <FolderOpen className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <h3 className="font-semibold">{group.name}</h3>
                            <p className="text-sm text-muted-foreground">{group.risks.length} risco(s) funcional(is)</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {highCount > 0 && (
                            <Badge variant="destructive">{highCount} Alto(s)</Badge>
                          )}
                          {mediumCount > 0 && (
                            <Badge className="bg-warning text-warning-foreground">{mediumCount} Médio(s)</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Título</TableHead>
                            <TableHead>Nível de Risco</TableHead>
                            <TableHead>RPN</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Risco Residual</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.risks.map((risk) => {
                            const riskLevel = riskLevelToOldFormat[risk.risk_level || "low"];
                            const residualLevel = riskLevelToOldFormat[risk.residual_risk || "low"];
                            const rpn = (risk.probability || 1) * (risk.severity || 1) * (risk.detectability || 1);

                            return (
                              <TableRow key={risk.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onView(risk)}>
                                <TableCell className="font-medium">{risk.title}</TableCell>
                                <TableCell><RiskIndicator level={riskLevel} /></TableCell>
                                <TableCell>{rpn}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{statusLabels[risk.status || "draft"]}</Badge>
                                </TableCell>
                                <TableCell><RiskIndicator level={residualLevel} size="sm" /></TableCell>
                                <TableCell>{new Date(risk.created_at).toLocaleDateString("pt-BR")}</TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                      <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(risk); }}>
                                        <Eye className="mr-2 h-4 w-4" />Visualizar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(risk); }}>
                                        <Edit className="mr-2 h-4 w-4" />Editar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(risk); }}>
                                        <Trash2 className="mr-2 h-4 w-4" />Excluir
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      )}
    </div>
  );
}
