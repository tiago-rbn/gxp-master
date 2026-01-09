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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateName: string;
  onConfirm: (newName: string) => void;
  isSubmitting?: boolean;
}

export function CloneTemplateDialog({
  open,
  onOpenChange,
  templateName,
  onConfirm,
  isSubmitting = false,
}: Props) {
  const [newName, setNewName] = useState(`${templateName} (Cópia)`);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Clonar Template</DialogTitle>
          <DialogDescription>
            Crie uma cópia do template "{templateName}" com um novo nome.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="newName">Nome do Novo Template</Label>
            <Input
              id="newName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Digite o nome do novo template"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => onConfirm(newName)}
            disabled={!newName.trim() || isSubmitting}
          >
            {isSubmitting ? "Clonando..." : "Clonar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
