import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
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
import { TaskTemplate } from "@/hooks/useTaskTemplates";

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  phase: z.string().optional(),
  gamp_category: z.string().min(1, "Categoria GAMP é obrigatória"),
  estimated_hours: z.number().nullable(),
  sort_order: z.number(),
});

type FormData = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: TaskTemplate | null;
  onSubmit: (data: FormData) => Promise<void>;
}

const gampCategories = [
  { value: "1", label: "Categoria 1 - Infraestrutura" },
  { value: "3", label: "Categoria 3 - Software não configurável" },
  { value: "4", label: "Categoria 4 - Software configurável" },
  { value: "5", label: "Categoria 5 - Software customizado" },
];

const phases = [
  { value: "planning", label: "Planejamento" },
  { value: "specification", label: "Especificação" },
  { value: "development", label: "Desenvolvimento" },
  { value: "testing", label: "Testes" },
  { value: "deployment", label: "Implantação" },
  { value: "closure", label: "Encerramento" },
];

export function TaskTemplateFormDialog({ open, onOpenChange, template, onSubmit }: Props) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      phase: "",
      gamp_category: "4",
      estimated_hours: null,
      sort_order: 0,
    },
  });

  useEffect(() => {
    if (template) {
      form.reset({
        name: template.name,
        description: template.description || "",
        phase: template.phase || "",
        gamp_category: template.gamp_category,
        estimated_hours: template.estimated_hours,
        sort_order: template.sort_order,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        phase: "",
        gamp_category: "4",
        estimated_hours: null,
        sort_order: 0,
      });
    }
  }, [template, form]);

  const handleSubmit = async (data: FormData) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {template ? "Editar Template de Tarefa" : "Novo Template de Tarefa"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Elaborar Plano de Validação" {...field} />
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
                  <FormLabel>Categoria GAMP</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {gampCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
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
              name="phase"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fase</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a fase" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {phases.map((phase) => (
                        <SelectItem key={phase.value} value={phase.value}>
                          {phase.label}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descrição da tarefa" 
                      rows={3}
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
                name="estimated_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horas Estimadas</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0"
                        value={field.value || ""}
                        onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sort_order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ordem</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {template ? "Salvar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
