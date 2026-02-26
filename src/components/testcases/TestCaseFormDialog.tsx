import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useSystems } from "@/hooks/useSystems";
import { useValidationProjects } from "@/hooks/useValidationProjects";
import type { TestCase } from "@/hooks/useTestCases";

const formSchema = z.object({
  code: z.string().min(1, "Código é obrigatório"),
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  preconditions: z.string().optional(),
  steps: z.string().optional(),
  expected_results: z.string().optional(),
  status: z.string().optional(),
  project_id: z.string().optional(),
  system_id: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testCase: TestCase | null;
  onSubmit: (values: FormValues) => void;
  isLoading: boolean;
}

export function TestCaseFormDialog({ open, onOpenChange, testCase, onSubmit, isLoading }: Props) {
  const { systems } = useSystems();
  const { projects } = useValidationProjects();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { code: "", title: "", description: "", preconditions: "", steps: "", expected_results: "", status: "pending", project_id: "", system_id: "" },
  });

  useEffect(() => {
    if (open) {
      if (testCase) {
        form.reset({
          code: testCase.code, title: testCase.title, description: testCase.description || "",
          preconditions: testCase.preconditions || "", steps: testCase.steps || "",
          expected_results: testCase.expected_results || "", status: testCase.status || "pending",
          project_id: testCase.project_id || "", system_id: testCase.system_id || "",
        });
      } else {
        form.reset({ code: "", title: "", description: "", preconditions: "", steps: "", expected_results: "", status: "pending", project_id: "", system_id: "" });
      }
    }
  }, [open, testCase, form]);

  const handleSubmit = (values: FormValues) => {
    onSubmit({ ...values, project_id: values.project_id || undefined, system_id: values.system_id || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{testCase ? "Editar Caso de Teste" : "Novo Caso de Teste"}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="code" render={({ field }) => (
                <FormItem><FormLabel>Código *</FormLabel><FormControl><Input placeholder="TC-001" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="in_progress">Em Execução</SelectItem>
                      <SelectItem value="passed">Aprovado</SelectItem>
                      <SelectItem value="failed">Reprovado</SelectItem>
                      <SelectItem value="blocked">Bloqueado</SelectItem>
                    </SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Título *</FormLabel><FormControl><Input placeholder="Título do caso de teste" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea rows={2} placeholder="Descrição..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="preconditions" render={({ field }) => (
              <FormItem><FormLabel>Pré-condições</FormLabel><FormControl><Textarea rows={2} placeholder="Pré-condições para execução..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="steps" render={({ field }) => (
              <FormItem><FormLabel>Passos</FormLabel><FormControl><Textarea rows={4} placeholder="1. Passo um&#10;2. Passo dois..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="expected_results" render={({ field }) => (
              <FormItem><FormLabel>Resultados Esperados</FormLabel><FormControl><Textarea rows={3} placeholder="Resultados esperados..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="system_id" render={({ field }) => (
                <FormItem><FormLabel>Sistema</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="">Nenhum</SelectItem>{systems.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="project_id" render={({ field }) => (
                <FormItem><FormLabel>Projeto</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="">Nenhum</SelectItem>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{testCase ? "Salvar" : "Criar"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
