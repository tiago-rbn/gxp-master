import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import type { TestCase } from "@/hooks/useTestCases";

const statusLabels: Record<string, string> = { pending: "Pendente", in_progress: "Em Execução", passed: "Aprovado", failed: "Reprovado", blocked: "Bloqueado" };
const statusColors: Record<string, string> = { pending: "bg-muted text-muted-foreground", passed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", failed: "bg-destructive/10 text-destructive", blocked: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" };

interface Props { open: boolean; onOpenChange: (o: boolean) => void; testCase: TestCase | null; onEdit: () => void; }

export function TestCaseViewDialog({ open, onOpenChange, testCase, onEdit }: Props) {
  if (!testCase) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Badge variant="outline">{testCase.code}</Badge>{testCase.title}
            </DialogTitle>
            <Button variant="outline" size="sm" onClick={onEdit}><Edit className="mr-2 h-4 w-4" />Editar</Button>
          </div>
        </DialogHeader>
        <div className="space-y-4">
          <Badge className={statusColors[testCase.status || "pending"]}>{statusLabels[testCase.status || "pending"]}</Badge>
          {testCase.description && <div><h4 className="text-sm font-medium text-muted-foreground mb-1">Descrição</h4><p className="text-sm whitespace-pre-wrap">{testCase.description}</p></div>}
          {testCase.preconditions && <div><h4 className="text-sm font-medium text-muted-foreground mb-1">Pré-condições</h4><p className="text-sm whitespace-pre-wrap">{testCase.preconditions}</p></div>}
          {testCase.steps && <div><h4 className="text-sm font-medium text-muted-foreground mb-1">Passos</h4><p className="text-sm whitespace-pre-wrap">{testCase.steps}</p></div>}
          {testCase.expected_results && <div><h4 className="text-sm font-medium text-muted-foreground mb-1">Resultados Esperados</h4><p className="text-sm whitespace-pre-wrap">{testCase.expected_results}</p></div>}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Sistema:</span> {testCase.system?.name || "-"}</div>
            <div><span className="text-muted-foreground">Projeto:</span> {testCase.project?.name || "-"}</div>
            <div><span className="text-muted-foreground">Resultado:</span> {testCase.result || "-"}</div>
            <div><span className="text-muted-foreground">Executado por:</span> {testCase.executor?.full_name || "-"}</div>
            <div><span className="text-muted-foreground">Executado em:</span> {testCase.executed_at ? new Date(testCase.executed_at).toLocaleDateString("pt-BR") : "-"}</div>
            <div><span className="text-muted-foreground">Atualizado:</span> {new Date(testCase.updated_at).toLocaleDateString("pt-BR")}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
