import { useState } from "react";
import { Plus, Search, FlaskConical, Eye, Edit, Trash2, MoreHorizontal, Loader2, PlayCircle, CheckCircle, XCircle, Clock } from "lucide-react";
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
import { useTestCases, type TestCase } from "@/hooks/useTestCases";
import { TestCaseFormDialog } from "./TestCaseFormDialog";
import { TestCaseViewDialog } from "./TestCaseViewDialog";
import { DeleteTestCaseDialog } from "./DeleteTestCaseDialog";

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  in_progress: "Em Execução",
  passed: "Aprovado",
  failed: "Reprovado",
  blocked: "Bloqueado",
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="h-3 w-3" />,
  passed: <CheckCircle className="h-3 w-3" />,
  failed: <XCircle className="h-3 w-3" />,
  blocked: <XCircle className="h-3 w-3" />,
};

const statusColors: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  in_progress: "bg-primary/10 text-primary",
  passed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  failed: "bg-destructive/10 text-destructive",
  blocked: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

export function TestCasesTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<TestCase | null>(null);

  const { testCases, isLoading, stats, createTestCase, updateTestCase, executeTestCase, deleteTestCase } = useTestCases();

  const filtered = testCases.filter((t) => {
    const matchSearch = t.code.toLowerCase().includes(searchTerm.toLowerCase()) || t.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCreate = () => { setSelected(null); setIsFormOpen(true); };
  const handleView = (t: TestCase) => { setSelected(t); setIsViewOpen(true); };
  const handleEdit = (t: TestCase) => { setSelected(t); setIsFormOpen(true); setIsViewOpen(false); };
  const handleDelete = (t: TestCase) => { setSelected(t); setIsDeleteOpen(true); };

  const handleFormSubmit = (values: any) => {
    if (selected) {
      updateTestCase.mutate({ id: selected.id, ...values }, { onSuccess: () => setIsFormOpen(false) });
    } else {
      createTestCase.mutate(values, { onSuccess: () => setIsFormOpen(false) });
    }
  };

  const handleExecute = (id: string, result: string) => {
    executeTestCase.mutate({ id, result });
  };

  const handleConfirmDelete = () => {
    if (selected) {
      deleteTestCase.mutate(selected.id, { onSuccess: () => { setIsDeleteOpen(false); setSelected(null); } });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Casos de Teste</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie casos de teste para qualificação dos sistemas
            {stats.total > 0 && (
              <span className="ml-2">
                — {stats.passed} aprovados, {stats.failed} reprovados, {stats.pending} pendentes
              </span>
            )}
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Caso de Teste
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por código ou título..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="passed">Aprovado</SelectItem>
                <SelectItem value="failed">Reprovado</SelectItem>
                <SelectItem value="blocked">Bloqueado</SelectItem>
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
              <FlaskConical className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">{testCases.length === 0 ? "Nenhum caso de teste cadastrado." : "Nenhum caso de teste encontrado."}</p>
              {testCases.length === 0 && <Button onClick={handleCreate}><Plus className="mr-2 h-4 w-4" />Criar Primeiro Caso de Teste</Button>}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Sistema</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead>Executado por</TableHead>
                  <TableHead>Atualizado</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow key={t.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleView(t)}>
                    <TableCell><Badge variant="outline">{t.code}</Badge></TableCell>
                    <TableCell className="font-medium">{t.title}</TableCell>
                    <TableCell>{t.system?.name || "-"}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[t.status || "pending"]}>
                        {statusLabels[t.status || "pending"]}
                      </Badge>
                    </TableCell>
                    <TableCell>{t.result || "-"}</TableCell>
                    <TableCell>{t.executor?.full_name || "-"}</TableCell>
                    <TableCell>{new Date(t.updated_at).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleView(t); }}><Eye className="mr-2 h-4 w-4" />Visualizar</DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(t); }}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                          {t.status === "pending" && (
                            <>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleExecute(t.id, "passed"); }}><CheckCircle className="mr-2 h-4 w-4" />Aprovar</DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleExecute(t.id, "failed"); }}><XCircle className="mr-2 h-4 w-4" />Reprovar</DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(t); }}><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
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

      <TestCaseFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} testCase={selected} onSubmit={handleFormSubmit} isLoading={createTestCase.isPending || updateTestCase.isPending} />
      <TestCaseViewDialog open={isViewOpen} onOpenChange={setIsViewOpen} testCase={selected} onEdit={() => selected && handleEdit(selected)} />
      <DeleteTestCaseDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen} testCaseTitle={selected?.title || ""} onConfirm={handleConfirmDelete} isLoading={deleteTestCase.isPending} />
    </div>
  );
}
