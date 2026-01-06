import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles, Loader2, Copy, Check } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDocumentTypes, defaultDocumentTypes } from "@/hooks/useDocumentTypes";

const formSchema = z.object({
  documentType: z.string().min(1, "Selecione um tipo de documento"),
  systemName: z.string().min(1, "Nome do sistema é obrigatório"),
  systemDescription: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  additionalContext: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AIDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseContent?: (content: string, documentType: string) => void;
}

export function AIDocumentDialog({ open, onOpenChange, onUseContent }: AIDocumentDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { documentTypes } = useDocumentTypes();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      documentType: "",
      systemName: "",
      systemDescription: "",
      additionalContext: "",
    },
  });

  useEffect(() => {
    const availableTypes = documentTypes?.length ? documentTypes : defaultDocumentTypes;
    if (!form.getValues("documentType") && availableTypes[0]) {
      form.setValue("documentType", availableTypes[0].code);
    }
  }, [documentTypes, form]);

  const onSubmit = async (data: FormData) => {
    setIsGenerating(true);
    setGeneratedContent(null);

    try {
      const { data: result, error } = await supabase.functions.invoke('generate-document', {
        body: data,
      });

      if (error) throw error;

      setGeneratedContent(result.content);
      toast.success("Documento gerado com sucesso!");
    } catch (error: any) {
      console.error("Error generating document:", error);
      toast.error(error.message || "Erro ao gerar documento");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (generatedContent) {
      await navigator.clipboard.writeText(generatedContent);
      setCopied(true);
      toast.success("Conteúdo copiado!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUseContent = () => {
    if (generatedContent && onUseContent) {
      const selectedType = form.getValues("documentType");
      onUseContent(generatedContent, selectedType);
      onOpenChange(false);
      resetDialog();
    }
  };

  const resetDialog = () => {
    form.reset();
    setGeneratedContent(null);
    setCopied(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetDialog();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Gerar Documento com IA
          </DialogTitle>
          <DialogDescription>
            Use inteligência artificial para gerar documentos de validação completos baseados nas melhores práticas GAMP 5.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Section */}
          <div className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="documentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Documento</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(documentTypes?.length ? documentTypes : defaultDocumentTypes).map((type) => (
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
                  name="systemName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Sistema</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: SAP ERP, LIMS, MES" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="systemDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição do Sistema</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva o sistema, suas funcionalidades principais e o contexto de uso..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="additionalContext"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contexto Adicional (Opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Informações adicionais como requisitos específicos, integrações, etc."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando documento...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Gerar Documento
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </div>

          {/* Preview Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Prévia do Documento</h3>
              {generatedContent && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  {onUseContent && (
                    <Button size="sm" onClick={handleUseContent}>
                      Usar Conteúdo
                    </Button>
                  )}
                </div>
              )}
            </div>
            <ScrollArea className="h-[400px] rounded-md border bg-muted/30 p-4">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Gerando documento com IA...
                  </p>
                </div>
              ) : generatedContent ? (
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {generatedContent}
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                  <Sparkles className="h-12 w-12 opacity-20" />
                  <p className="text-sm">
                    Preencha o formulário e clique em "Gerar Documento"
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
