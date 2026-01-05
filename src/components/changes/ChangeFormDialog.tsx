import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useSystems } from "@/hooks/useSystems";
import type { ChangeRequestWithRelations } from "@/hooks/useChangeRequests";

const formSchema = z.object({
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  description: z.string().optional(),
  system_id: z.string().optional(),
  change_type: z.string().min(1, "Selecione um tipo"),
  priority: z.enum(["low", "medium", "high"]),
  gxp_impact: z.boolean(),
  validation_required: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface ChangeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changeRequest?: ChangeRequestWithRelations | null;
  onSubmit: (data: FormValues) => void;
  isLoading?: boolean;
}

const changeTypes = [
  { value: "enhancement", label: "Melhoria" },
  { value: "bug_fix", label: "Correção de Bug" },
  { value: "configuration", label: "Configuração" },
  { value: "upgrade", label: "Upgrade" },
  { value: "new_feature", label: "Nova Funcionalidade" },
  { value: "decommission", label: "Desativação" },
];

export function ChangeFormDialog({
  open,
  onOpenChange,
  changeRequest,
  onSubmit,
  isLoading,
}: ChangeFormDialogProps) {
  const { systems } = useSystems();
  const isEditing = !!changeRequest;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      system_id: "",
      change_type: "",
      priority: "medium",
      gxp_impact: false,
      validation_required: false,
    },
  });

  useEffect(() => {
    if (changeRequest) {
      const priorityValue = changeRequest.priority === "critical" ? "high" : (changeRequest.priority || "medium");
      form.reset({
        title: changeRequest.title,
        description: changeRequest.description || "",
        system_id: changeRequest.system_id || "",
        change_type: changeRequest.change_type || "",
        priority: priorityValue as "low" | "medium" | "high",
        gxp_impact: changeRequest.gxp_impact || false,
        validation_required: changeRequest.validation_required || false,
      });
    } else {
      form.reset({
        title: "",
        description: "",
        system_id: "",
        change_type: "",
        priority: "medium",
        gxp_impact: false,
        validation_required: false,
      });
    }
  }, [changeRequest, form]);

  const handleSubmit = (data: FormValues) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Solicitação" : "Nova Solicitação de Mudança"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize as informações da solicitação de mudança"
              : "Preencha os dados para criar uma nova solicitação"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Título da solicitação" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva a mudança solicitada..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="system_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sistema</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {systems?.map((system) => (
                          <SelectItem key={system.id} value={system.id}>
                            {system.name}
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
                name="change_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Mudança</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {changeTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioridade</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
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

            <div className="flex gap-6">
              <FormField
                control={form.control}
                name="gxp_impact"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Impacto GxP</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="validation_required"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Requer Validação</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : isEditing ? "Salvar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
