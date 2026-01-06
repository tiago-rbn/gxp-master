import { useState, useEffect } from "react";
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
import { Company } from "@/hooks/useCompanies";

interface CompanyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
  onSubmit: (data: { name: string; cnpj?: string; address?: string; phone?: string }) => void;
  isSubmitting: boolean;
}

export function CompanyFormDialog({
  open,
  onOpenChange,
  company,
  onSubmit,
  isSubmitting,
}: CompanyFormDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    cnpj: "",
    address: "",
    phone: "",
  });

  useEffect(() => {
    if (company) {
      const settings = (company.settings as Record<string, any>) || {};
      setFormData({
        name: company.name || "",
        cnpj: company.cnpj || "",
        address: settings.address || "",
        phone: settings.phone || "",
      });
    } else {
      setFormData({ name: "", cnpj: "", address: "", phone: "" });
    }
  }, [company, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{company ? "Editar Empresa" : "Nova Empresa"}</DialogTitle>
          <DialogDescription>
            {company
              ? "Atualize as informações da empresa"
              : "Preencha os dados para criar uma nova empresa"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Empresa *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              value={formData.cnpj}
              onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
              placeholder="00.000.000/0000-00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.name}>
              {isSubmitting ? "Salvando..." : company ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
