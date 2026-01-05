import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProfiles } from "@/hooks/useSystems";
import type { Database } from "@/integrations/supabase/types";

type System = Database["public"]["Tables"]["systems"]["Row"];
type GampCategory = Database["public"]["Enums"]["gamp_category"];
type RiskLevel = Database["public"]["Enums"]["risk_level"];
type ValidationStatus = Database["public"]["Enums"]["validation_status"];

const systemSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  vendor: z.string().optional(),
  version: z.string().optional(),
  gamp_category: z.enum(["1", "3", "4", "5"]),
  criticality: z.enum(["low", "medium", "high", "critical"]).optional(),
  gxp_impact: z.boolean().optional(),
  data_integrity_impact: z.boolean().optional(),
  validation_status: z.enum(["not_started", "in_progress", "validated", "expired", "pending_revalidation"]).optional(),
  responsible_id: z.string().optional(),
  last_validation_date: z.string().optional(),
  next_revalidation_date: z.string().optional(),
});

type SystemFormValues = z.infer<typeof systemSchema>;

interface SystemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  system?: System | null;
  onSubmit: (values: SystemFormValues) => void;
  isLoading?: boolean;
}

export function SystemFormDialog({
  open,
  onOpenChange,
  system,
  onSubmit,
  isLoading,
}: SystemFormDialogProps) {
  const { data: profiles = [] } = useProfiles();

  const form = useForm<SystemFormValues>({
    resolver: zodResolver(systemSchema),
    defaultValues: {
      name: "",
      description: "",
      vendor: "",
      version: "",
      gamp_category: "4",
      criticality: "medium",
      gxp_impact: false,
      data_integrity_impact: false,
      validation_status: "not_started",
      responsible_id: "",
      last_validation_date: "",
      next_revalidation_date: "",
    },
  });

  useEffect(() => {
    if (system) {
      form.reset({
        name: system.name,
        description: system.description || "",
        vendor: system.vendor || "",
        version: system.version || "",
        gamp_category: system.gamp_category as "1" | "3" | "4" | "5",
        criticality: (system.criticality as "low" | "medium" | "high" | "critical") || "medium",
        gxp_impact: system.gxp_impact || false,
        data_integrity_impact: system.data_integrity_impact || false,
        validation_status: (system.validation_status as "not_started" | "in_progress" | "validated" | "expired" | "pending_revalidation") || "not_started",
        responsible_id: system.responsible_id || "",
        last_validation_date: system.last_validation_date || "",
        next_revalidation_date: system.next_revalidation_date || "",
      });
    } else {
      form.reset({
        name: "",
        description: "",
        vendor: "",
        version: "",
        gamp_category: "4",
        criticality: "medium",
        gxp_impact: false,
        data_integrity_impact: false,
        validation_status: "not_started",
        responsible_id: "",
        last_validation_date: "",
        next_revalidation_date: "",
      });
    }
  }, [system, form]);

  const handleSubmit = (values: SystemFormValues) => {
    onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{system ? "Editar Sistema" : "Novo Sistema"}</DialogTitle>
          <DialogDescription>
            {system
              ? "Atualize as informações do sistema"
              : "Preencha as informações para cadastrar um novo sistema"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Sistema *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: SAP ERP" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vendor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornecedor</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: SAP SE" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Versão</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 2024.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gamp_category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria GAMP *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">Categoria 1 - Infraestrutura</SelectItem>
                        <SelectItem value="3">Categoria 3 - COTS</SelectItem>
                        <SelectItem value="4">Categoria 4 - Configurado</SelectItem>
                        <SelectItem value="5">Categoria 5 - Customizado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="criticality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Criticidade</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a criticidade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="validation_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status de Validação</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="not_started">Não Iniciado</SelectItem>
                        <SelectItem value="in_progress">Em Andamento</SelectItem>
                        <SelectItem value="validated">Validado</SelectItem>
                        <SelectItem value="expired">Expirado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="responsible_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o responsável" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {profiles.map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {profile.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="last_validation_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Última Validação</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="next_revalidation_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Próxima Revalidação</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o propósito e funcionalidades do sistema..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col sm:flex-row gap-4">
              <FormField
                control={form.control}
                name="gxp_impact"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="cursor-pointer">Impacto GxP</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_integrity_impact"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="cursor-pointer">Impacto em Integridade de Dados</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : system ? "Salvar Alterações" : "Criar Sistema"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
