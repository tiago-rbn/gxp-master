import { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarkdownEditor } from "./MarkdownEditor";
import { DocumentTemplate, Placeholder } from "@/hooks/useDocumentTemplatesNew";
import { useDocumentTypes } from "@/hooks/useDocumentTypes";
import { useSystems } from "@/hooks/useSystems";

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  document_type: z.string().min(1, "Tipo de documento é obrigatório"),
  gamp_category: z.string().optional(),
  system_name: z.string().optional(),
  version: z.string().min(1, "Versão é obrigatória"),
  is_active: z.boolean(),
  content: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: DocumentTemplate | null;
  onSubmit: (data: Omit<DocumentTemplate, "id" | "company_id" | "created_at" | "updated_at">) => void;
  isSubmitting?: boolean;
}

const gampCategories = [
  { value: "1", label: "GAMP 1 - Infrastructure Software" },
  { value: "3", label: "GAMP 3 - Non-configured Products" },
  { value: "4", label: "GAMP 4 - Configured Products" },
  { value: "5", label: "GAMP 5 - Custom Applications" },
];

export function DocumentTemplateFormDialog({
  open,
  onOpenChange,
  template,
  onSubmit,
  isSubmitting = false,
}: Props) {
  const { documentTypes } = useDocumentTypes();
  const { systems } = useSystems();
  const [content, setContent] = useState("");
  const [placeholders, setPlaceholders] = useState<Placeholder[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      document_type: "",
      gamp_category: "",
      system_name: "",
      version: "1.0",
      is_active: true,
      content: "",
    },
  });

  useEffect(() => {
    if (template) {
      form.reset({
        name: template.name,
        description: template.description || "",
        document_type: template.document_type,
        gamp_category: template.gamp_category || "",
        system_name: template.system_name || "",
        version: template.version,
        is_active: template.is_active ?? true,
        content: template.content || "",
      });
      setContent(template.content || "");
      setPlaceholders(template.placeholders || []);
    } else {
      form.reset({
        name: "",
        description: "",
        document_type: documentTypes?.[0]?.code || "URS",
        gamp_category: "",
        system_name: "",
        version: "1.0",
        is_active: true,
        content: "",
      });
      setContent("");
      setPlaceholders([]);
    }
  }, [template, open, form, documentTypes]);

  // Extract placeholders from content
  useEffect(() => {
    const matches = content.match(/\{\{([^}]+)\}\}/g) || [];
    const keys = [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, "")))];
    
    const newPlaceholders = keys.map((key) => {
      const existing = placeholders.find((p) => p.key === key);
      return existing || { key, label: key.replace(/\./g, " ").replace(/^\w/, (c) => c.toUpperCase()) };
    });
    
    if (JSON.stringify(newPlaceholders) !== JSON.stringify(placeholders)) {
      setPlaceholders(newPlaceholders);
    }
  }, [content]);

  const handleSubmit = (data: FormData) => {
    onSubmit({
      name: data.name,
      document_type: data.document_type,
      version: data.version,
      is_active: data.is_active,
      description: data.description || null,
      gamp_category: data.gamp_category || null,
      system_name: data.system_name || null,
      content,
      is_default: template?.is_default ?? false,
      parent_template_id: template?.parent_template_id ?? null,
      placeholders,
      conditional_blocks: template?.conditional_blocks || [],
      created_by: template?.created_by ?? null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {template ? "Editar Template" : "Novo Template de Documento"}
          </DialogTitle>
          <DialogDescription>
            {template
              ? "Atualize as informações e conteúdo do template"
              : "Crie um novo template de documento de validação"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <Tabs defaultValue="info" className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="content">Conteúdo</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="flex-1 overflow-auto space-y-4 p-1">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Template</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: URS - Sistema ERP" />
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
                          <Input {...field} placeholder="1.0" />
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
                          {...field}
                          placeholder="Descrição do template..."
                          rows={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="document_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Documento</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(documentTypes || []).map((type) => (
                              <SelectItem key={type.id} value={type.code}>
                                {type.code} - {type.name}
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
                    name="gamp_category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria GAMP</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(value === "__all__" ? null : value)}
                          value={field.value || "__all__"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Todas as categorias" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="__all__">Todas as categorias</SelectItem>
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
                    name="system_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sistema Específico</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(value === "__all__" ? null : value)}
                          value={field.value || "__all__"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Todos os sistemas" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="__all__">Todos os sistemas</SelectItem>
                            {(systems || []).map((sys) => (
                              <SelectItem key={sys.id} value={sys.name}>
                                {sys.name}
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
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Template Ativo</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Templates inativos não aparecem nas opções de criação de documentos
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
              </TabsContent>

              <TabsContent value="content" className="flex-1 overflow-hidden p-1">
                <MarkdownEditor
                  value={content}
                  onChange={setContent}
                  placeholders={placeholders}
                  onPlaceholdersChange={setPlaceholders}
                  className="h-full"
                />
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-4">
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
        </Form>
      </DialogContent>
    </Dialog>
  );
}
