import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusType = 
  | 'Validated' | 'In Progress' | 'Pending' | 'Expired'
  | 'Draft' | 'Review' | 'Approved' | 'Obsolete'
  | 'Planning' | 'Completed' | 'On Hold'
  | 'Requested' | 'Analysis' | 'Implementing' | 'Rejected'
  | 'Active' | 'Inactive'
  | 'Open' | 'Mitigated' | 'Accepted'
  // Database status values (lowercase)
  | 'pending' | 'in_review' | 'approved' | 'in_progress' | 'completed' | 'rejected' | 'draft' | 'cancelled'
  // Validation status values
  | 'not_started' | 'validated' | 'expired' | 'pending_revalidation'
  // Portuguese labels (for compatibility)
  | 'Rascunho' | 'Pendente' | 'Aprovado' | 'Concluído' | 'Cancelado' 
  | 'Não Iniciado' | 'Em Andamento' | 'Validado' | 'Expirado' | 'Revalidação Pendente';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; variant: string }> = {
  // Validation Status
  'Validated': { label: 'Validado', variant: 'bg-success/10 text-success border-success/20' },
  'In Progress': { label: 'Em Andamento', variant: 'bg-info/10 text-info border-info/20' },
  'Pending': { label: 'Pendente', variant: 'bg-warning/10 text-warning border-warning/20' },
  'Expired': { label: 'Expirado', variant: 'bg-destructive/10 text-destructive border-destructive/20' },
  
  // Document Status
  'Draft': { label: 'Rascunho', variant: 'bg-muted text-muted-foreground border-border' },
  'Review': { label: 'Em Revisão', variant: 'bg-info/10 text-info border-info/20' },
  'Approved': { label: 'Aprovado', variant: 'bg-success/10 text-success border-success/20' },
  'Obsolete': { label: 'Obsoleto', variant: 'bg-muted text-muted-foreground border-border' },
  
  // Project Status
  'Planning': { label: 'Planejamento', variant: 'bg-muted text-muted-foreground border-border' },
  'Completed': { label: 'Concluído', variant: 'bg-success/10 text-success border-success/20' },
  'On Hold': { label: 'Pausado', variant: 'bg-warning/10 text-warning border-warning/20' },
  
  // Change Request Status (legacy)
  'Requested': { label: 'Solicitado', variant: 'bg-muted text-muted-foreground border-border' },
  'Analysis': { label: 'Em Análise', variant: 'bg-info/10 text-info border-info/20' },
  'Implementing': { label: 'Implementando', variant: 'bg-primary/10 text-primary border-primary/20' },
  'Rejected': { label: 'Rejeitado', variant: 'bg-destructive/10 text-destructive border-destructive/20' },
  
  // User Status
  'Active': { label: 'Ativo', variant: 'bg-success/10 text-success border-success/20' },
  'Inactive': { label: 'Inativo', variant: 'bg-muted text-muted-foreground border-border' },
  
  // Risk Status
  'Open': { label: 'Aberto', variant: 'bg-warning/10 text-warning border-warning/20' },
  'Mitigated': { label: 'Mitigado', variant: 'bg-success/10 text-success border-success/20' },
  'Accepted': { label: 'Aceito', variant: 'bg-info/10 text-info border-info/20' },
  
  // Database status values (lowercase)
  'pending': { label: 'Solicitado', variant: 'bg-muted text-muted-foreground border-border' },
  'in_review': { label: 'Em Análise', variant: 'bg-info/10 text-info border-info/20' },
  'approved': { label: 'Aprovado', variant: 'bg-success/10 text-success border-success/20' },
  'in_progress': { label: 'Implementando', variant: 'bg-primary/10 text-primary border-primary/20' },
  'completed': { label: 'Concluído', variant: 'bg-success/10 text-success border-success/20' },
  'rejected': { label: 'Rejeitado', variant: 'bg-destructive/10 text-destructive border-destructive/20' },
  'draft': { label: 'Rascunho', variant: 'bg-muted text-muted-foreground border-border' },
  'cancelled': { label: 'Cancelado', variant: 'bg-muted text-muted-foreground border-border' },
  
  // Validation status values
  'not_started': { label: 'Não Iniciado', variant: 'bg-muted text-muted-foreground border-border' },
  'validated': { label: 'Validado', variant: 'bg-success/10 text-success border-success/20' },
  'expired': { label: 'Expirado', variant: 'bg-destructive/10 text-destructive border-destructive/20' },
  'pending_revalidation': { label: 'Revalidação Pendente', variant: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  
  // Portuguese labels (for compatibility)
  'Rascunho': { label: 'Rascunho', variant: 'bg-muted text-muted-foreground border-border' },
  'Pendente': { label: 'Pendente', variant: 'bg-warning/10 text-warning border-warning/20' },
  'Aprovado': { label: 'Aprovado', variant: 'bg-success/10 text-success border-success/20' },
  'Concluído': { label: 'Concluído', variant: 'bg-success/10 text-success border-success/20' },
  'Cancelado': { label: 'Cancelado', variant: 'bg-muted text-muted-foreground border-border' },
  'Não Iniciado': { label: 'Não Iniciado', variant: 'bg-muted text-muted-foreground border-border' },
  'Em Andamento': { label: 'Em Andamento', variant: 'bg-info/10 text-info border-info/20' },
  'Validado': { label: 'Validado', variant: 'bg-success/10 text-success border-success/20' },
  'Expirado': { label: 'Expirado', variant: 'bg-destructive/10 text-destructive border-destructive/20' },
  'Revalidação Pendente': { label: 'Revalidação Pendente', variant: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: 'bg-muted text-muted-foreground' };
  
  return (
    <Badge 
      variant="outline" 
      className={cn("font-medium", config.variant, className)}
    >
      {config.label}
    </Badge>
  );
}