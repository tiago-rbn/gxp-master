import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle, 
  XCircle, 
  Send, 
  Clock, 
  AlertTriangle,
  Trophy,
  FileDown,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { exportProjectToPDF } from "@/lib/pdfExport";
import type { Database } from "@/integrations/supabase/types";

type ValidationProject = Database["public"]["Tables"]["validation_projects"]["Row"] & {
  system?: { name: string } | null;
  manager?: { full_name: string } | null;
  approver?: { full_name: string } | null;
};

interface ProjectViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ValidationProject | null;
  onEdit: () => void;
  onSubmitForApproval?: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string, reason: string) => void;
  onComplete?: (id: string) => void;
  isSubmitting?: boolean;
}

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  pending: "Aguardando Aprovação",
  approved: "Aprovado",
  rejected: "Rejeitado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  pending: "outline",
  approved: "default",
  rejected: "destructive",
  completed: "default",
  cancelled: "secondary",
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
  onSubmitForApproval,
  onApprove,
  onReject,
  onComplete,
  isSubmitting = false,
}: ProjectViewDialogProps) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  if (!project) return null;

  const canSubmitForApproval = project.status === "draft" || project.status === "rejected";
  const canApproveOrReject = project.status === "pending";
  const canComplete = project.status === "approved";

  const handleReject = () => {
    if (onReject && rejectionReason.trim()) {
      onReject(project.id, rejectionReason);
      setShowRejectForm(false);
      setRejectionReason("");
    }
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      exportProjectToPDF(project);
      toast.success("PDF exportado com sucesso!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Erro ao exportar PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {project.name}
            <Badge variant={statusVariants[project.status || "draft"]}>
              {statusLabels[project.status || "draft"]}
            </Badge>
          </DialogTitle>
          <DialogDescription>Detalhes do projeto de validação</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Approval Status Section */}
          {(project.status === "pending" || project.status === "approved" || project.status === "rejected") && (
            <>
              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  {project.status === "pending" && <Clock className="h-4 w-4 text-yellow-500" />}
                  {project.status === "approved" && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {project.status === "rejected" && <XCircle className="h-4 w-4 text-red-500" />}
                  Status de Aprovação
                </h4>
                
                {project.status === "pending" && (
                  <p className="text-sm text-muted-foreground">
                    Aguardando revisão e aprovação do gerente.
                  </p>
                )}
                
                {(project.status === "approved" || project.status === "rejected") && project.approver && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">
                      {project.status === "approved" ? "Aprovado" : "Rejeitado"} por:
                    </span>
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="bg-primary/10 text-xs text-primary">
                        {getInitials(project.approver.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{project.approver.full_name}</span>
                    {project.approved_at && (
                      <span className="text-muted-foreground">
                        em {new Date(project.approved_at).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </div>
                )}
                
                {project.status === "rejected" && project.rejection_reason && (
                  <div className="mt-2 rounded bg-destructive/10 p-3 border border-destructive/20">
                    <p className="text-sm font-medium text-destructive flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Motivo da Rejeição
                    </p>
                    <p className="text-sm mt-1">{project.rejection_reason}</p>
                  </div>
                )}
              </div>
              <Separator />
            </>
          )}

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

          {/* Reject Form */}
          {showRejectForm && (
            <div className="space-y-3 rounded-lg border border-destructive/30 p-4 bg-destructive/5">
              <Label>Motivo da Rejeição *</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Descreva o motivo da rejeição..."
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowRejectForm(false)}>
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleReject}
                  disabled={!rejectionReason.trim() || isSubmitting}
                >
                  Confirmar Rejeição
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={handleExportPDF}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            Exportar PDF
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          
          {/* Submit for Approval */}
          {canSubmitForApproval && onSubmitForApproval && (
            <Button 
              onClick={() => onSubmitForApproval(project.id)}
              disabled={isSubmitting}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              Enviar para Aprovação
            </Button>
          )}

          {/* Approve / Reject */}
          {canApproveOrReject && !showRejectForm && (
            <>
              {onReject && (
                <Button 
                  variant="destructive" 
                  onClick={() => setShowRejectForm(true)}
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Rejeitar
                </Button>
              )}
              {onApprove && (
                <Button 
                  onClick={() => onApprove(project.id)}
                  disabled={isSubmitting}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4" />
                  Aprovar
                </Button>
              )}
            </>
          )}

          {/* Complete */}
          {canComplete && onComplete && (
            <Button 
              onClick={() => onComplete(project.id)}
              disabled={isSubmitting}
              className="gap-2"
            >
              <Trophy className="h-4 w-4" />
              Marcar como Concluído
            </Button>
          )}

          {/* Edit (only for draft/rejected) */}
          {(project.status === "draft" || project.status === "rejected") && (
            <Button onClick={onEdit}>Editar Projeto</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
