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
import { GampBadge } from "@/components/shared/GampBadge";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/integrations/supabase/types";

type System = Database["public"]["Tables"]["systems"]["Row"] & {
  responsible?: { full_name: string } | null;
  system_owner?: { full_name: string } | null;
  process_owner?: { full_name: string } | null;
};

interface SystemViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  system: System | null;
  onEdit: () => void;
}

const validationStatusLabels: Record<string, string> = {
  not_started: "Não Iniciado",
  in_progress: "Em Andamento",
  validated: "Validado",
  expired: "Expirado",
  pending_revalidation: "Revalidação Pendente",
};

const criticalityLabels: Record<string, { label: string; className: string }> = {
  low: { label: "Baixa", className: "border-success/20 bg-success/10 text-success" },
  medium: { label: "Média", className: "border-warning/20 bg-warning/10 text-warning" },
  high: { label: "Alta", className: "border-destructive/20 bg-destructive/10 text-destructive" },
  critical: { label: "Crítica", className: "border-destructive/20 bg-destructive/10 text-destructive" },
};

const gampCategoryMap: Record<string, 1 | 3 | 4 | 5> = {
  "1": 1,
  "3": 3,
  "4": 4,
  "5": 5,
};

const installationLabels: Record<string, string> = {
  on_premise: "On-Premise",
  cloud: "Nuvem",
  hybrid: "Híbrido",
};

export function SystemViewDialog({
  open,
  onOpenChange,
  system,
  onEdit,
}: SystemViewDialogProps) {
  if (!system) return null;

  const criticality = criticalityLabels[system.criticality || "medium"];
  const gampNum = gampCategoryMap[system.gamp_category];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{system.name}</DialogTitle>
          <DialogDescription>Detalhes do sistema</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Fornecedor</Label>
              <p className="font-medium">{system.vendor || "-"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Versão</Label>
              <p className="font-medium">{system.version || "-"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Categoria GAMP</Label>
              <div className="mt-1">
                <GampBadge category={gampNum} showDescription />
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Criticidade</Label>
              <div className="mt-1">
                <Badge variant="outline" className={criticality.className}>
                  {criticality.label}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Impacto GxP</Label>
              <p className="font-medium">{system.gxp_impact ? "Sim" : "Não"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Integridade de Dados</Label>
              <p className="font-medium">{system.data_integrity_impact ? "Sim" : "Não"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">BPx Relevante</Label>
              <p className="font-medium">{system.bpx_relevant ? "Sim" : "Não"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Local de Instalação</Label>
              <p className="font-medium">
                {installationLabels[system.installation_location || "on_premise"]}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Status de Validação</Label>
              <p className="font-medium">
                {validationStatusLabels[system.validation_status || "not_started"]}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Responsável</Label>
              <p className="font-medium">{system.responsible?.full_name || "-"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Dono do Sistema</Label>
              <p className="font-medium">{system.system_owner?.full_name || "-"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Dono do Processo</Label>
              <p className="font-medium">{system.process_owner?.full_name || "-"}</p>
            </div>
            {system.last_validation_date && (
              <div>
                <Label className="text-muted-foreground">Última Validação</Label>
                <p className="font-medium">
                  {new Date(system.last_validation_date).toLocaleDateString("pt-BR")}
                </p>
              </div>
            )}
            {system.next_revalidation_date && (
              <div>
                <Label className="text-muted-foreground">Próxima Revalidação</Label>
                <p className="font-medium">
                  {new Date(system.next_revalidation_date).toLocaleDateString("pt-BR")}
                </p>
              </div>
            )}
          </div>
          {system.description && (
            <div>
              <Label className="text-muted-foreground">Descrição</Label>
              <p className="font-medium mt-1">{system.description}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={onEdit}>Editar Sistema</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
