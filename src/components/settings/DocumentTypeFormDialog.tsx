import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { DocumentType } from "@/hooks/useDocumentTypes";

interface DocumentTypeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentType: DocumentType | null;
  onSubmit: (data: Omit<DocumentType, "id">) => void;
  isSubmitting: boolean;
}

export function DocumentTypeFormDialog({
  open,
  onOpenChange,
  documentType,
  onSubmit,
  isSubmitting,
}: DocumentTypeFormDialogProps) {
  const [formData, setFormData] = useState<Omit<DocumentType, "id">>({
    code: "",
    name: "",
    description: "",
    color: "",
  });

  useEffect(() => {
    if (documentType) {
      setFormData({
        code: documentType.code,
        name: documentType.name,
        description: documentType.description || "",
        color: documentType.color || "",
      });
    } else {
      setFormData({
        code: "",
        name: "",
        description: "",
        color: "",
      });
    }
  }, [documentType, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      code: formData.code.trim().toUpperCase(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{documentType ? "Editar Tipo de Documento" : "Novo Tipo de Documento"}</DialogTitle>
          <DialogDescription>
            {documentType
              ? "Atualize as informações do tipo"
              : "Cadastre um novo tipo para classificar documentos"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Ex: URS"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Classe de cor (opcional)</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="Ex: bg-blue-500/10 text-blue-600 border-blue-500/20"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome descritivo do tipo"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Breve descrição para o time"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
