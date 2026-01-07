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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeliverableTemplate } from "@/hooks/useDeliverableTemplates";

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  document_type: z.string().optional(),
  gamp_category: z.string().min(1, "Categoria GAMP é obrigatória"),
  is_mandatory: z.boolean(),
  sort_order: z.number(),
});

type FormData = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: DeliverableTemplate | null;
  onSubmit: (data: FormData) => Promise<void>;
}

const gampCategories = [
  { value: "1", label: "Categoria 1 - Infraestrutura" },
  { value: "3", label: "Categoria 3 - Software não configurável" },
  { value: "4", label: "Categoria 4 - Software configurável" },
  { value: "5", label: "Categoria 5 - Software customizado" },
];

export function DeliverableTemplateFormDialog({ open, onOpenChange, template, onSubmit }: Props) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      document_type: "",
      gamp_category: "4",
      is_mandatory: true,
      sort_order: 0,
    },
  });

  useEffect(() => {
    if (template) {
      form.reset({
        name: template.name,
        description: template.description || "",
        document_type: template.document_type || "",
        gamp_category: template.gamp_category,
        is_mandatory: template.is_mandatory,
        sort_order: template.sort_order,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        document_type: "",
        gamp_category: "4",
        is_mandatory: true,
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
            {template ? "Editar Template de Entregável" : "Novo Template de Entregável"}
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
                    <Input placeholder="Ex: Plano de Validação" {...field} />
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
              name="document_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Documento</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: VP, URS, IQ, OQ, PQ" {...field} />
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
                      placeholder="Descrição do entregável" 
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

              <FormField
                control={form.control}
                name="is_mandatory"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <FormLabel className="text-sm font-normal">
                      Obrigatório
                    </FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
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
