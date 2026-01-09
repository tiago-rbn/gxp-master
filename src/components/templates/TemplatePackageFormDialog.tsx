import { useState, useEffect } from "react";
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
import { useAuth } from "@/contexts/AuthContext";
import { useUserCompanies } from "@/hooks/useUserCompanies";
import { useTemplatePackages, TemplatePackage } from "@/hooks/useTemplatePackages";

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  system_name: z.string().optional(),
  gamp_category: z.string().optional(),
  application: z.string().min(1, "Aplicação é obrigatória"),
  price: z.coerce.number().min(0, "Preço deve ser maior ou igual a zero"),
  is_published: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

interface TemplatePackageFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editPackage?: TemplatePackage | null;
}

const gampCategories = [
  { value: "1", label: "Categoria 1 - Infraestrutura" },
  { value: "3", label: "Categoria 3 - Software Não Configurável" },
  { value: "4", label: "Categoria 4 - Software Configurável" },
  { value: "5", label: "Categoria 5 - Software Customizado" },
];

const commonApplications = [
  "Indústria Farmacêutica",
  "RDC 689/2022",
  "21 CFR Part 11",
  "GxP Compliance",
  "Data Integrity",
  "ANVISA",
  "FDA",
  "EU Annex 11",
  "GAMP 5",
  "ISO 13485",
];

export function TemplatePackageFormDialog({
  open,
  onOpenChange,
  editPackage,
}: TemplatePackageFormDialogProps) {
  const { user } = useAuth();
  const { activeCompany } = useUserCompanies();
  const companyId = activeCompany?.id;
  const { createPackage, updatePackage } = useTemplatePackages();
  const [customApplication, setCustomApplication] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      system_name: "",
      gamp_category: "",
      application: "",
      price: 0,
      is_published: false,
    },
  });

  useEffect(() => {
    if (editPackage) {
      form.reset({
        name: editPackage.name,
        description: editPackage.description || "",
        system_name: editPackage.system_name || "",
        gamp_category: editPackage.gamp_category || "",
        application: editPackage.application,
        price: editPackage.price,
        is_published: editPackage.is_published,
      });
      // Check if application is a custom one
      setCustomApplication(!commonApplications.includes(editPackage.application));
    } else {
      form.reset({
        name: "",
        description: "",
        system_name: "",
        gamp_category: "",
        application: "",
        price: 0,
        is_published: false,
      });
      setCustomApplication(false);
    }
  }, [editPackage, form, open]);

  const onSubmit = async (data: FormData) => {
    if (!companyId) return;

    if (editPackage) {
      await updatePackage.mutateAsync({ 
        id: editPackage.id, 
        name: data.name,
        application: data.application,
        price: data.price,
        is_published: data.is_published,
        gamp_category: data.gamp_category || null,
        system_name: data.system_name || null,
        description: data.description || null,
      });
    } else {
      const packageData = {
        name: data.name,
        application: data.application,
        price: data.price,
        is_published: data.is_published,
        company_id: companyId,
        created_by: user?.id || null,
        document_count: 0,
        gamp_category: data.gamp_category || null,
        system_name: data.system_name || null,
        description: data.description || null,
        cover_image_url: null,
      };
      await createPackage.mutateAsync(packageData);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editPackage ? "Editar Pacote de Templates" : "Novo Pacote de Templates"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Pacote</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Pacote Validação LIMS" {...field} />
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
                      placeholder="Descreva o conteúdo e objetivo do pacote..."
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
                name="system_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Sistema</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: SAP, LIMS, MES" {...field} />
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
                    <Select
                      onValueChange={(value) => field.onChange(value === "__none__" ? "" : value)}
                      value={field.value || "__none__"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">Todas as categorias</SelectItem>
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
            </div>

            <FormField
              control={form.control}
              name="application"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aplicação / Regulamentação</FormLabel>
                  <div className="space-y-2">
                    {!customApplication ? (
                      <Select
                        onValueChange={(value) => {
                          if (value === "__custom__") {
                            setCustomApplication(true);
                            field.onChange("");
                          } else {
                            field.onChange(value);
                          }
                        }}
                        value={field.value || "__placeholder__"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione ou digite uma nova..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {commonApplications.map((app) => (
                            <SelectItem key={app} value={app}>
                              {app}
                            </SelectItem>
                          ))}
                          <SelectItem value="__custom__">+ Adicionar nova aplicação</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Digite a aplicação/regulamentação..."
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCustomApplication(false);
                            field.onChange("");
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço (R$)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_published"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Publicar no Marketplace</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Tornar este pacote disponível para outras empresas adquirirem
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createPackage.isPending || updatePackage.isPending}
              >
                {editPackage ? "Salvar Alterações" : "Criar Pacote"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
