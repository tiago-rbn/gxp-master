import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteDocumentTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  typeName: string;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteDocumentTypeDialog({
  open,
  onOpenChange,
  typeName,
  onConfirm,
  isDeleting,
}: DeleteDocumentTypeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remover tipo</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja remover o tipo "{typeName}"? Esta ação não afeta documentos existentes, mas eles manterão o código já salvo.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? "Removendo..." : "Remover"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
