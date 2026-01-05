import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Database } from "@/integrations/supabase/types";

type ValidationProject = Database["public"]["Tables"]["validation_projects"]["Row"] & {
  system?: { name: string } | null;
  manager?: { full_name: string } | null;
};

interface ProjectViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ValidationProject | null;
  onEdit: () => void;
}

const statusLabels: Record<string, string> = {
  draft: "Planejamento",
  pending: "Em Andamento",
  approved: "Revisão",
  rejected: "Rejeitado",
  completed: "Concluído",
  cancelled: "Pausado",
};

const projectTypeLabels: Record<string, string> = {
  initial_validation: "Validação Inicial",
  revalidation: "Revalidação",
  change_control: "Controle de Mudanças",
  periodic_review: "Revisão Periódica",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ProjectViewDialog({
  open,
  onOpenChange,
  project,
  onEdit,
}: ProjectViewDialogProps) {
  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{project.name}</DialogTitle>
          <DialogDescription>Detalhes do projeto de validação</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Sistema</Label>
              <p className="font-medium">{project.system?.name || "-"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Tipo</Label>
              <p className="font-medium">
                {projectTypeLabels[project.project_type || ""] || project.project_type || "-"}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <div className="mt-1">
                <Badge variant="outline">
                  {statusLabels[project.status || "draft"]}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Gerente</Label>
              {project.manager?.full_name ? (
                <div className="mt-1 flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-primary/10 text-xs text-primary">
                      {getInitials(project.manager.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{project.manager.full_name}</span>
                </div>
              ) : (
                <p className="font-medium">-</p>
              )}
            </div>
            <div>
              <Label className="text-muted-foreground">Data de Início</Label>
              <p className="font-medium">
                {project.start_date
                  ? new Date(project.start_date).toLocaleDateString("pt-BR")
                  : "-"}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Data Alvo</Label>
              <p className="font-medium">
                {project.target_date
                  ? new Date(project.target_date).toLocaleDateString("pt-BR")
                  : "-"}
              </p>
            </div>
            {project.completion_date && (
              <div>
                <Label className="text-muted-foreground">Data de Conclusão</Label>
                <p className="font-medium">
                  {new Date(project.completion_date).toLocaleDateString("pt-BR")}
                </p>
              </div>
            )}
          </div>

          {project.description && (
            <div>
              <Label className="text-muted-foreground">Descrição</Label>
              <p className="mt-1 rounded-lg bg-muted p-3">{project.description}</p>
            </div>
          )}

          <div>
            <Label className="text-muted-foreground">Progresso</Label>
            <div className="mt-2 space-y-2">
              <div className="flex justify-between text-sm">
                <span>{project.progress || 0}% concluído</span>
              </div>
              <Progress value={project.progress || 0} className="h-3" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={onEdit}>Editar Projeto</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
