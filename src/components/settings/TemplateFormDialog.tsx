import { useState, useEffect } from "react";
import { DocumentTemplate } from "@/hooks/useDocumentTemplates";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: DocumentTemplate | null;
  onSubmit: (data: Omit<DocumentTemplate, "id" | "created_at" | "updated_at">) => void;
  isSubmitting: boolean;
  companyId: string;
}

const documentTypes = [
  { value: "URS", label: "User Requirement Specification" },
  { value: "FS", label: "Functional Specification" },
  { value: "DS", label: "Design Specification" },
  { value: "IQ", label: "Installation Qualification" },
  { value: "OQ", label: "Operational Qualification" },
  { value: "PQ", label: "Performance Qualification" },
  { value: "RTM", label: "Requirements Traceability Matrix" },
  { value: "Report", label: "Validation Report" },
];

export function TemplateFormDialog({
  open,
  onOpenChange,
  template,
  onSubmit,
  isSubmitting,
  companyId,
}: TemplateFormDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    document_type: "URS",
    version: "1.0",
    content: "",
    is_active: true,
  });

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        document_type: template.document_type,
        version: template.version,
        content: template.content || "",
        is_active: template.is_active,
      });
    } else {
      setFormData({
        name: "",
        document_type: "URS",
        version: "1.0",
        content: "",
        is_active: true,
      });
    }
  }, [template, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      company_id: companyId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {template ? "Editar Template" : "Novo Template"}
          </DialogTitle>
          <DialogDescription>
            {template
              ? "Atualize as informações do template"
              : "Crie um novo template de documento"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="version">Versão</Label>
                <Input
                  id="version"
                  value={formData.version}
                  onChange={(e) =>
                    setFormData({ ...formData, version: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="document_type">Tipo de Documento</Label>
              <Select
                value={formData.document_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, document_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Conteúdo do Template (Markdown)</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                rows={8}
                placeholder="# Título do Documento&#10;&#10;## 1. Objetivo&#10;&#10;## 2. Escopo&#10;&#10;## 3. Requisitos"
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
