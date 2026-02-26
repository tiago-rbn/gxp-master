import { Plus, Search, Eye, Edit, Trash2, Loader2, ClipboardCheck } from "lucide-react";
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
import { useState } from "react";

interface IRAListTabProps {
  risks: any[];
  isLoading: boolean;
  onView: (risk: any) => void;
  onEdit: (risk: any) => void;
  onDelete: (risk: any) => void;
  onCreate: () => void;
}

const riskLevelToOldFormat: Record<string, "High" | "Medium" | "Low"> = {
  critical: "High", high: "High", medium: "Medium", low: "Low",
};

const statusLabels: Record<string, string> = {
  draft: "Rascunho", pending: "Pendente", approved: "Aprovado",
  rejected: "Rejeitado", completed: "Concluído", cancelled: "Cancelado",
};

export function IRAListTab({ risks, isLoading, onView, onEdit, onDelete, onCreate }: IRAListTabProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = risks.filter((r) =>
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.system?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar IRA por título ou sistema..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={onCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Nova IRA
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {risks.length === 0 ? "Nenhuma IRA cadastrada ainda." : "Nenhuma IRA encontrada."}
              </p>
              {risks.length === 0 && (
                <Button onClick={onCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeira IRA
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Sistema</TableHead>
                  <TableHead>Nível de Risco</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Respostas</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((risk) => {
                  const riskLevel = riskLevelToOldFormat[risk.risk_level || "low"];
                  const qResponses = risk.questionnaire_responses || [];
                  const yesCount = Array.isArray(qResponses) ? qResponses.filter((r: any) => r.answer).length : 0;
                  const totalCount = Array.isArray(qResponses) ? qResponses.length : 0;

                  return (
                    <TableRow key={risk.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onView(risk)}>
                      <TableCell className="font-medium">{risk.title}</TableCell>
                      <TableCell>{risk.system?.name || "-"}</TableCell>
                      <TableCell><RiskIndicator level={riskLevel} /></TableCell>
                      <TableCell>
                        <Badge variant="outline">{statusLabels[risk.status || "draft"]}</Badge>
                      </TableCell>
                      <TableCell>
                        {totalCount > 0 ? (
                          <span className="text-sm">{yesCount}/{totalCount} Sim</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
