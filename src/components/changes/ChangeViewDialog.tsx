import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge, type StatusType } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import type { ChangeRequestWithRelations } from "@/hooks/useChangeRequests";

const statusWorkflow = ["pending", "in_review", "approved", "in_progress", "completed"];

const statusLabels: Record<string, string> = {
  pending: "Solicitado",
  in_review: "Análise",
  approved: "Aprovado",
  in_progress: "Impl.",
  completed: "Concluído",
};

const typeLabels: Record<string, string> = {
  enhancement: "Melhoria",
  bug_fix: "Correção de Bug",
  configuration: "Configuração",
  upgrade: "Upgrade",
  new_feature: "Nova Funcionalidade",
  decommission: "Desativação",
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  high: { label: "Alta", className: "bg-destructive/10 text-destructive border-destructive/20" },
  medium: { label: "Média", className: "bg-warning/10 text-warning border-warning/20" },
  low: { label: "Baixa", className: "bg-success/10 text-success border-success/20" },
};

interface ChangeViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changeRequest: ChangeRequestWithRelations | null;
  onEdit: () => void;
  onAdvanceStatus: () => void;
  canAdvanceStatus: boolean;
}

export function ChangeViewDialog({
  open,
  onOpenChange,
  changeRequest,
  onEdit,
  onAdvanceStatus,
  canAdvanceStatus,
}: ChangeViewDialogProps) {
  if (!changeRequest) return null;

  const currentIndex = statusWorkflow.indexOf(changeRequest.status || "pending");
  const priorityKey = changeRequest.priority === "critical" ? "high" : (changeRequest.priority || "medium");
  const priority = priorityConfig[priorityKey];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{changeRequest.title}</DialogTitle>
          <DialogDescription>Solicitação de Mudança</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Sistema</Label>
              <p className="font-medium">
                {changeRequest.systems?.name || "Não especificado"}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Tipo</Label>
              <p className="font-medium">
                {typeLabels[changeRequest.change_type || ""] || changeRequest.change_type}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Prioridade</Label>
              <div className="mt-1">
                <Badge variant="outline" className={priority.className}>
                  {priority.label}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Impacto GxP</Label>
              <div className="mt-1">
                <Badge
                  variant="outline"
                  className={
                    changeRequest.gxp_impact
                      ? "bg-destructive/10 text-destructive border-destructive/20"
                      : "bg-muted text-muted-foreground"
                  }
                >
                  {changeRequest.gxp_impact ? "Sim" : "Não"}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Solicitante</Label>
              <p className="font-medium">
                {changeRequest.requester?.full_name || "Não identificado"}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Data da Solicitação</Label>
              <p className="font-medium">
                {format(new Date(changeRequest.created_at), "dd/MM/yyyy", {
                  locale: ptBR,
                })}
              </p>
            </div>
            {changeRequest.approver && (
              <div>
                <Label className="text-muted-foreground">Aprovado por</Label>
                <p className="font-medium">{changeRequest.approver.full_name}</p>
              </div>
            )}
            {changeRequest.approved_at && (
              <div>
                <Label className="text-muted-foreground">Data de Aprovação</Label>
                <p className="font-medium">
                  {format(new Date(changeRequest.approved_at), "dd/MM/yyyy", {
                    locale: ptBR,
                  })}
                </p>
              </div>
            )}
          </div>

          {changeRequest.description && (
            <div>
              <Label className="text-muted-foreground">Descrição</Label>
              <p className="mt-1 whitespace-pre-wrap text-sm">
                {changeRequest.description}
              </p>
            </div>
          )}

          <div>
            <Label className="text-muted-foreground">Status Atual</Label>
            <div className="mt-2">
              <StatusBadge status={(changeRequest.status || "pending") as StatusType} />
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground">Workflow</Label>
            <div className="mt-3 flex items-center justify-between">
              {statusWorkflow.map((status, index) => {
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
                        {statusLabels[status]}
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {canAdvanceStatus && (
            <Button variant="secondary" onClick={onAdvanceStatus}>
              Avançar Status
            </Button>
          )}
          <Button onClick={onEdit}>Editar Solicitação</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
