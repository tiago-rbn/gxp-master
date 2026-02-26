import { useState } from "react";
import { Plus, Search, Paperclip, Eye, Trash2, MoreHorizontal, Loader2, Image, FileText, Video } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useTestEvidence, type TestEvidence } from "@/hooks/useTestEvidence";
import { useTestCases } from "@/hooks/useTestCases";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";

const evidenceTypeLabels: Record<string, string> = {
  screenshot: "Screenshot",
  document: "Documento",
  video: "Vídeo",
  log: "Log",
  other: "Outro",
};

const evidenceTypeIcons: Record<string, React.ReactNode> = {
  screenshot: <Image className="h-4 w-4" />,
  document: <FileText className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
};

const formSchema = z.object({
  test_case_id: z.string().min(1, "Caso de teste é obrigatório"),
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  evidence_type: z.string().optional(),
  file_url: z.string().optional(),
});

export function TestEvidenceTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<TestEvidence | null>(null);

  const { evidence, isLoading, createEvidence, deleteEvidence } = useTestEvidence();
  const { testCases } = useTestCases();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { test_case_id: "", title: "", description: "", evidence_type: "screenshot", file_url: "" },
  });

  const filtered = evidence.filter((e) => {
    const matchSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = typeFilter === "all" || e.evidence_type === typeFilter;
    return matchSearch && matchType;
  });

  const handleCreate = () => {
    form.reset({ test_case_id: "", title: "", description: "", evidence_type: "screenshot", file_url: "" });
    setIsFormOpen(true);
  };

  const handleFormSubmit = (values: any) => {
    createEvidence.mutate(values, { onSuccess: () => setIsFormOpen(false) });
  };

  const handleDelete = (e: TestEvidence) => { setSelected(e); setIsDeleteOpen(true); };
  const handleConfirmDelete = () => {
    if (selected) {
      deleteEvidence.mutate(selected.id, { onSuccess: () => { setIsDeleteOpen(false); setSelected(null); } });
    }
  };

  const getTestCaseCode = (testCaseId: string) => {
    const tc = testCases.find(t => t.id === testCaseId);
    return tc ? tc.code : "-";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Evidências de Teste</h2>
          <p className="text-sm text-muted-foreground">Gerencie evidências e anexos vinculados aos casos de teste ({evidence.length} evidências)</p>
        </div>
        <Button onClick={handleCreate}><Plus className="mr-2 h-4 w-4" />Nova Evidência</Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Tipos</SelectItem>
                <SelectItem value="screenshot">Screenshot</SelectItem>
                <SelectItem value="document">Documento</SelectItem>
                <SelectItem value="video">Vídeo</SelectItem>
                <SelectItem value="log">Log</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Paperclip className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">{evidence.length === 0 ? "Nenhuma evidência cadastrada." : "Nenhuma evidência encontrada."}</p>
              {evidence.length === 0 && <Button onClick={handleCreate}><Plus className="mr-2 h-4 w-4" />Adicionar Primeira Evidência</Button>}
            </div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Título</TableHead><TableHead>Tipo</TableHead><TableHead>Caso de Teste</TableHead><TableHead>Enviado por</TableHead><TableHead>Data</TableHead><TableHead className="w-[50px]"></TableHead></TableRow></TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell><div className="flex items-center gap-2">{evidenceTypeIcons[e.evidence_type || "other"] || <Paperclip className="h-4 w-4" />}<span className="font-medium">{e.title}</span></div></TableCell>
                    <TableCell><Badge variant="secondary">{evidenceTypeLabels[e.evidence_type || "other"]}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{getTestCaseCode(e.test_case_id)}</Badge></TableCell>
                    <TableCell>{e.uploader?.full_name || "-"}</TableCell>
                    <TableCell>{new Date(e.created_at).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {e.file_url && <DropdownMenuItem onClick={() => window.open(e.file_url!, '_blank')}><Eye className="mr-2 h-4 w-4" />Visualizar</DropdownMenuItem>}
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(e)}><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Evidence Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nova Evidência</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
              <FormField control={form.control} name="test_case_id" render={({ field }) => (
                <FormItem><FormLabel>Caso de Teste *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                    <SelectContent>{testCases.map(tc => <SelectItem key={tc.id} value={tc.id}>{tc.code} - {tc.title}</SelectItem>)}</SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Título *</FormLabel><FormControl><Input placeholder="Título da evidência" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="evidence_type" render={({ field }) => (
                <FormItem><FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="screenshot">Screenshot</SelectItem><SelectItem value="document">Documento</SelectItem><SelectItem value="video">Vídeo</SelectItem><SelectItem value="log">Log</SelectItem><SelectItem value="other">Outro</SelectItem></SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea rows={3} placeholder="Descrição..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="file_url" render={({ field }) => (
                <FormItem><FormLabel>URL do Arquivo</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createEvidence.isPending}>{createEvidence.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Criar</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir Evidência</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja excluir "{selected?.title}"?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteEvidence.isPending}>
              {deleteEvidence.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
