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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Copy } from "lucide-react";

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onSuccess: () => void;
}

export function CreateUserDialog({
  open,
  onOpenChange,
  companyId,
  onSuccess,
}: CreateUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    password: "",
    role: "reader",
    department: "",
    position: "",
  });

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password }));
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(formData.password);
    toast.success("Senha copiada para a área de transferência");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.full_name || !formData.password) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: {
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          company_id: companyId,
          role: formData.role,
          department: formData.department || undefined,
          position: formData.position || undefined,
        },
      });

      if (error) {
        console.error("Error creating user:", error);
        toast.error(error.message || "Erro ao criar usuário");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success("Usuário criado com sucesso! Informe a senha temporária ao usuário.");
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("Erro ao criar usuário");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: "",
      full_name: "",
      password: "",
      role: "reader",
      department: "",
      position: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Novo Usuário</DialogTitle>
          <DialogDescription>
            Crie uma conta para um novo usuário. Uma senha temporária será definida.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="full_name">Nome Completo *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, full_name: e.target.value }))
                }
                placeholder="Nome do usuário"
                required
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="email@exemplo.com"
                required
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha Temporária *</Label>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0"
                  onClick={generatePassword}
                >
                  Gerar senha
                </Button>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, password: e.target.value }))
                    }
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-8 top-0 h-full"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={copyPassword}
                    disabled={!formData.password}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Anote esta senha para informar ao usuário. Ele deverá alterá-la no primeiro acesso.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Perfil *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reader">Leitor</SelectItem>
                  <SelectItem value="responsible">Responsável</SelectItem>
                  <SelectItem value="validator">Validador</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Departamento</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, department: e.target.value }))
                }
                placeholder="Ex: TI, Qualidade"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="position">Cargo</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, position: e.target.value }))
                }
                placeholder="Ex: Analista, Gerente"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Usuário
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}