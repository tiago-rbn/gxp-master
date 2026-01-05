import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteRiskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  riskTitle: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeleteRiskDialog({
  open,
  onOpenChange,
  riskTitle,
  onConfirm,
  isLoading,
}: DeleteRiskDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Avaliação de Risco</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir a avaliação <strong>{riskTitle}</strong>?
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
