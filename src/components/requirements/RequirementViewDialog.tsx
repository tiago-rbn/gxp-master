import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import type { Requirement } from "@/hooks/useRequirements";

const typeLabels: Record<string, string> = {
  functional: "Funcional",
  non_functional: "Não-Funcional",
  regulatory: "Regulatório",
  business: "Negócio",
  technical: "Técnico",
};

const priorityLabels: Record<string, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  active: "Ativo",
  approved: "Aprovado",
  deprecated: "Obsoleto",
};

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/10 text-primary",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  critical: "bg-destructive/10 text-destructive",
};

interface RequirementViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requirement: Requirement | null;
  onEdit: () => void;
}

export function RequirementViewDialog({
  open,
  onOpenChange,
  requirement,
  onEdit,
}: RequirementViewDialogProps) {
  if (!requirement) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Badge variant="outline">{requirement.code}</Badge>
              {requirement.title}
            </DialogTitle>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              {typeLabels[requirement.type || "functional"]}
            </Badge>
            <Badge className={priorityColors[requirement.priority || "medium"]}>
              {priorityLabels[requirement.priority || "medium"]}
            </Badge>
            <Badge variant="outline">
              {statusLabels[requirement.status || "draft"]}
            </Badge>
          </div>

          {requirement.description && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Descrição</h4>
              <p className="text-sm whitespace-pre-wrap">{requirement.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Sistema:</span>{" "}
              <span>{requirement.system?.name || "-"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Projeto:</span>{" "}
              <span>{requirement.project?.name || "-"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Fonte:</span>{" "}
              <span>{requirement.source || "-"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Criado por:</span>{" "}
              <span>{requirement.creator?.full_name || "-"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Criado em:</span>{" "}
              <span>{new Date(requirement.created_at).toLocaleDateString("pt-BR")}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Atualizado em:</span>{" "}
              <span>{new Date(requirement.updated_at).toLocaleDateString("pt-BR")}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
