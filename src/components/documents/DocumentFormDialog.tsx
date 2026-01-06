import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, X, FileText } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSystemsForSelect } from "@/hooks/useRiskAssessments";
import { useValidationProjects } from "@/hooks/useValidationProjects";
import { useDocumentTypes } from "@/hooks/useDocumentTypes";
import type { Database } from "@/integrations/supabase/types";

type Document = Database["public"]["Tables"]["documents"]["Row"];

const documentSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  document_type: z.string().min(1, "Tipo é obrigatório"),
  content: z.string().optional(),
  version: z.string().optional(),
  system_id: z.string().optional(),
  project_id: z.string().optional(),
  status: z.enum(["draft", "pending", "approved", "rejected", "completed", "cancelled"]),
});

type DocumentFormValues = z.infer<typeof documentSchema>;

interface DocumentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document?: Document | null;
  onSubmit: (values: DocumentFormValues & { file?: File }) => void;
  isLoading?: boolean;
  initialContent?: { content: string; type: string } | null;
}

export function DocumentFormDialog({
  open,
  onOpenChange,
  document,
  onSubmit,
  isLoading,
  initialContent,
}: DocumentFormDialogProps) {
  const { data: systems = [] } = useSystemsForSelect();
  const { projects = [] } = useValidationProjects();
  const { documentTypes, isLoading: documentTypesLoading } = useDocumentTypes();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      title: "",
      document_type: "URS",
      content: "",
      version: "1.0",
      system_id: "",
      project_id: "",
      status: "draft",
    },
  });

  useEffect(() => {
    if (document) {
      form.reset({
        title: document.title,
        document_type: document.document_type,
        content: document.content || "",
        version: document.version || "1.0",
        system_id: document.system_id || "",
        project_id: document.project_id || "",
        status: (document.status as "draft" | "pending" | "approved" | "rejected" | "completed" | "cancelled") || "draft",
      });
    } else if (initialContent) {
      form.reset({
        title: "",
        document_type: initialContent.type,
        content: initialContent.content,
        version: "1.0",
        system_id: "",
        project_id: "",
        status: "draft",
      });
    } else {
      form.reset({
        title: "",
        document_type: documentTypes?.[0]?.code || "URS",
        content: "",
        version: "1.0",
        system_id: "",
        project_id: "",
        status: "draft",
      });
      setSelectedFile(null);
    }
  }, [document, form, initialContent, documentTypes]);

  const handleSubmit = (values: DocumentFormValues) => {
    onSubmit({ ...values, file: selectedFile || undefined });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) { // 20MB limit
        alert("Arquivo muito grande. Máximo 20MB.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{document ? "Editar Documento" : "Novo Documento"}</DialogTitle>
          <DialogDescription>
            {document
              ? "Atualize as informações do documento"
              : "Preencha as informações para criar um novo documento"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: LIMS URS v2.0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="document_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Documento *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {documentTypesLoading && (
                          <SelectItem value={field.value} disabled>
                            Carregando tipos...
                          </SelectItem>
                        )}
                        {documentTypes?.map((type) => (
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
                name="version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Versão</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 1.0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Rascunho</SelectItem>
                        <SelectItem value="pending">Em Revisão</SelectItem>
                        <SelectItem value="approved">Aprovado</SelectItem>
                        <SelectItem value="rejected">Rejeitado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="system_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sistema</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o sistema" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {systems.map((system) => (
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
                name="project_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Projeto</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o projeto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
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
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conteúdo / Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o conteúdo ou objetivo do documento..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Upload */}
            <div className="space-y-2">
              <FormLabel>Arquivo</FormLabel>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              />
              
              {selectedFile ? (
                <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="flex-1 text-sm truncate">{selectedFile.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : document?.file_url ? (
                <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="flex-1 text-sm">Arquivo existente</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Substituir
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Clique para fazer upload ou arraste um arquivo
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, Word, Excel, PowerPoint (máx. 20MB)
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : document ? "Salvar Alterações" : "Criar Documento"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
