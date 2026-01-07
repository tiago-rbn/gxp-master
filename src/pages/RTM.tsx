import { useState } from "react";
import { useRequirements, Requirement } from "@/hooks/useRequirements";
import { useTestCases, TestCase } from "@/hooks/useTestCases";
import { useRTM } from "@/hooks/useRTM";
import { useSystemsForSelect } from "@/hooks/useRiskAssessments";
import { useValidationProjects } from "@/hooks/useValidationProjects";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  FlaskConical,
  Link2,
  Plus,
  Search,
  Trash2,
  Edit,
  Eye,
  Play,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { RTMCoverageDashboard } from "@/components/rtm/RTMCoverageDashboard";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function RTM() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [search, setSearch] = useState("");

  // Requirements state
  const [reqDialogOpen, setReqDialogOpen] = useState(false);
  const [editingReq, setEditingReq] = useState<Requirement | null>(null);
  const [reqForm, setReqForm] = useState({
    code: "",
    title: "",
    description: "",
    type: "functional",
    priority: "medium",
    status: "draft",
    source: "",
    project_id: "",
    system_id: "",
  });

  // Test case state
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<TestCase | null>(null);
  const [testForm, setTestForm] = useState({
    code: "",
    title: "",
    description: "",
    preconditions: "",
    steps: "",
    expected_results: "",
    project_id: "",
    system_id: "",
  });

  // Link state
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedReqId, setSelectedReqId] = useState("");
  const [selectedTestId, setSelectedTestId] = useState("");

  // Execute test state
  const [executeDialogOpen, setExecuteDialogOpen] = useState(false);
  const [executingTest, setExecutingTest] = useState<TestCase | null>(null);
  const [testResult, setTestResult] = useState("");

  const { requirements, isLoading: reqLoading, createRequirement, updateRequirement, deleteRequirement } = useRequirements();
  const { testCases, isLoading: testLoading, stats: testStats, createTestCase, updateTestCase, executeTestCase, deleteTestCase } = useTestCases();
  const { rtmLinks, isLoading: rtmLoading, stats: rtmStats, createLink, deleteLink } = useRTM();
  const { data: systems = [] } = useSystemsForSelect();
  const { projects } = useValidationProjects();

  const filteredRequirements = requirements.filter(
    (r) =>
      r.code.toLowerCase().includes(search.toLowerCase()) ||
      r.title.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTestCases = testCases.filter(
    (t) =>
      t.code.toLowerCase().includes(search.toLowerCase()) ||
      t.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleReqSubmit = async () => {
    if (editingReq) {
      await updateRequirement.mutateAsync({ id: editingReq.id, ...reqForm });
    } else {
      await createRequirement.mutateAsync(reqForm);
    }
    setReqDialogOpen(false);
    resetReqForm();
  };

  const handleTestSubmit = async () => {
    if (editingTest) {
      await updateTestCase.mutateAsync({ id: editingTest.id, ...testForm });
    } else {
      await createTestCase.mutateAsync(testForm);
    }
    setTestDialogOpen(false);
    resetTestForm();
  };

  const handleLinkSubmit = async () => {
    if (selectedReqId && selectedTestId) {
      await createLink.mutateAsync({ requirement_id: selectedReqId, test_case_id: selectedTestId });
      setLinkDialogOpen(false);
      setSelectedReqId("");
      setSelectedTestId("");
    }
  };

  const handleExecuteSubmit = async () => {
    if (executingTest && testResult) {
      await executeTestCase.mutateAsync({ id: executingTest.id, result: testResult });
      setExecuteDialogOpen(false);
      setExecutingTest(null);
      setTestResult("");
    }
  };

  const resetReqForm = () => {
    setEditingReq(null);
    setReqForm({
      code: "",
      title: "",
      description: "",
      type: "functional",
      priority: "medium",
      status: "draft",
      source: "",
      project_id: "",
      system_id: "",
    });
  };

  const resetTestForm = () => {
    setEditingTest(null);
    setTestForm({
      code: "",
      title: "",
      description: "",
      preconditions: "",
      steps: "",
      expected_results: "",
      project_id: "",
      system_id: "",
    });
  };

  const openEditReq = (req: Requirement) => {
    setEditingReq(req);
    setReqForm({
      code: req.code,
      title: req.title,
      description: req.description || "",
      type: req.type || "functional",
      priority: req.priority || "medium",
      status: req.status || "draft",
      source: req.source || "",
      project_id: req.project_id || "",
      system_id: req.system_id || "",
    });
    setReqDialogOpen(true);
  };

  const openEditTest = (test: TestCase) => {
    setEditingTest(test);
    setTestForm({
      code: test.code,
      title: test.title,
      description: test.description || "",
      preconditions: test.preconditions || "",
      steps: test.steps || "",
      expected_results: test.expected_results || "",
      project_id: test.project_id || "",
      system_id: test.system_id || "",
    });
    setTestDialogOpen(true);
  };

  const getStatusBadge = (status: string | null) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      draft: { variant: "secondary", label: "Rascunho" },
      active: { variant: "default", label: "Ativo" },
      approved: { variant: "default", label: "Aprovado" },
      pending: { variant: "outline", label: "Pendente" },
      passed: { variant: "default", label: "Passou" },
      failed: { variant: "destructive", label: "Falhou" },
      blocked: { variant: "secondary", label: "Bloqueado" },
    };
    const config = variants[status || "draft"] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getResultIcon = (result: string | null) => {
    if (result === "passed") return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (result === "failed") return <XCircle className="h-4 w-4 text-red-500" />;
    if (result === "blocked") return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return null;
  };

  const isLoading = reqLoading || testLoading || rtmLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Matriz de Rastreabilidade (RTM)"
        description="Gerencie requisitos, casos de teste e rastreabilidade"
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Requisitos"
          value={requirements.length}
          icon={FileText}
        />
        <StatCard
          title="Casos de Teste"
          value={testCases.length}
          description={`${testStats.passed} passou, ${testStats.failed} falhou`}
          icon={FlaskConical}
        />
        <StatCard
          title="Links RTM"
          value={rtmStats.totalLinks}
          description={`${rtmStats.coveredRequirements} req. cobertos`}
          icon={Link2}
        />
        <StatCard
          title="Cobertura"
          value={requirements.length > 0 ? `${Math.round((rtmStats.coveredRequirements / requirements.length) * 100)}%` : "0%"}
          description="Requisitos com testes"
          icon={CheckCircle}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="dashboard" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="requirements">Requisitos</TabsTrigger>
            <TabsTrigger value="testcases">Casos de Teste</TabsTrigger>
            <TabsTrigger value="matrix">Matriz RTM</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            {activeTab === "requirements" && (
              <Button onClick={() => { resetReqForm(); setReqDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Requisito
              </Button>
            )}
            {activeTab === "testcases" && (
              <Button onClick={() => { resetTestForm(); setTestDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Caso de Teste
              </Button>
            )}
            {activeTab === "matrix" && (
              <Button onClick={() => setLinkDialogOpen(true)}>
                <Link2 className="h-4 w-4 mr-2" />
                Criar Link
              </Button>
            )}
          </div>
        </div>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="mt-4">
          <RTMCoverageDashboard
            requirements={requirements}
            testCases={testCases}
            rtmLinks={rtmLinks}
          />
        </TabsContent>

        {/* Requirements Tab */}
        <TabsContent value="requirements" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {filteredRequirements.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="Nenhum requisito encontrado"
                  description="Crie seu primeiro requisito para começar"
                  action={{
                    label: "Novo Requisito",
                    onClick: () => { resetReqForm(); setReqDialogOpen(true); }
                  }}
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sistema</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequirements.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell className="font-mono text-sm">{req.code}</TableCell>
                        <TableCell className="font-medium">{req.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{req.type || "Funcional"}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={req.priority === "high" ? "destructive" : req.priority === "low" ? "secondary" : "default"}>
                            {req.priority === "high" ? "Alta" : req.priority === "low" ? "Baixa" : "Média"}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(req.status)}</TableCell>
                        <TableCell>{req.system?.name || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditReq(req)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteRequirement.mutate(req.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Cases Tab */}
        <TabsContent value="testcases" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {filteredTestCases.length === 0 ? (
                <EmptyState
                  icon={FlaskConical}
                  title="Nenhum caso de teste encontrado"
                  description="Crie seu primeiro caso de teste"
                  action={{
                    label: "Novo Caso de Teste",
                    onClick: () => { resetTestForm(); setTestDialogOpen(true); }
                  }}
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Resultado</TableHead>
                      <TableHead>Sistema</TableHead>
                      <TableHead>Executado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTestCases.map((test) => (
                      <TableRow key={test.id}>
                        <TableCell className="font-mono text-sm">{test.code}</TableCell>
                        <TableCell className="font-medium">{test.title}</TableCell>
                        <TableCell>{getStatusBadge(test.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getResultIcon(test.result)}
                            {test.result || "-"}
                          </div>
                        </TableCell>
                        <TableCell>{test.system?.name || "-"}</TableCell>
                        <TableCell>
                          {test.executed_at
                            ? format(new Date(test.executed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setExecutingTest(test);
                                setExecuteDialogOpen(true);
                              }}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openEditTest(test)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteTestCase.mutate(test.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* RTM Matrix Tab */}
        <TabsContent value="matrix" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Matriz de Rastreabilidade</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {rtmLinks.length === 0 ? (
                <EmptyState
                  icon={Link2}
                  title="Nenhum link encontrado"
                  description="Crie links entre requisitos e casos de teste"
                  action={{
                    label: "Criar Link",
                    onClick: () => setLinkDialogOpen(true)
                  }}
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Requisito</TableHead>
                      <TableHead>Caso de Teste</TableHead>
                      <TableHead>Status Req.</TableHead>
                      <TableHead>Resultado Teste</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rtmLinks.map((link) => (
                      <TableRow key={link.id}>
                        <TableCell>
                          <div>
                            <span className="font-mono text-sm">{link.requirement?.code}</span>
                            <p className="text-sm text-muted-foreground">{link.requirement?.title}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="font-mono text-sm">{link.test_case?.code}</span>
                            <p className="text-sm text-muted-foreground">{link.test_case?.title}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(link.requirement?.status || null)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getResultIcon(link.test_case?.result || null)}
                            {link.test_case?.result || "Não executado"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => deleteLink.mutate(link.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Requirement Dialog */}
      <Dialog open={reqDialogOpen} onOpenChange={setReqDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingReq ? "Editar Requisito" : "Novo Requisito"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código *</Label>
                <Input
                  value={reqForm.code}
                  onChange={(e) => setReqForm({ ...reqForm, code: e.target.value })}
                  placeholder="REQ-001"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={reqForm.type} onValueChange={(v) => setReqForm({ ...reqForm, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="functional">Funcional</SelectItem>
                    <SelectItem value="non-functional">Não Funcional</SelectItem>
                    <SelectItem value="business">Negócio</SelectItem>
                    <SelectItem value="regulatory">Regulatório</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={reqForm.title}
                onChange={(e) => setReqForm({ ...reqForm, title: e.target.value })}
                placeholder="Título do requisito"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={reqForm.description}
                onChange={(e) => setReqForm({ ...reqForm, description: e.target.value })}
                placeholder="Descrição detalhada do requisito"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select value={reqForm.priority} onValueChange={(v) => setReqForm({ ...reqForm, priority: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={reqForm.status} onValueChange={(v) => setReqForm({ ...reqForm, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="approved">Aprovado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fonte</Label>
                <Input
                  value={reqForm.source}
                  onChange={(e) => setReqForm({ ...reqForm, source: e.target.value })}
                  placeholder="URS, Regulamento..."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sistema</Label>
                <Select value={reqForm.system_id} onValueChange={(v) => setReqForm({ ...reqForm, system_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {systems.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Projeto</Label>
                <Select value={reqForm.project_id} onValueChange={(v) => setReqForm({ ...reqForm, project_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReqDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleReqSubmit} disabled={!reqForm.code || !reqForm.title}>
              {editingReq ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Case Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTest ? "Editar Caso de Teste" : "Novo Caso de Teste"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código *</Label>
                <Input
                  value={testForm.code}
                  onChange={(e) => setTestForm({ ...testForm, code: e.target.value })}
                  placeholder="TC-001"
                />
              </div>
              <div className="space-y-2">
                <Label>Sistema</Label>
                <Select value={testForm.system_id} onValueChange={(v) => setTestForm({ ...testForm, system_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {systems.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={testForm.title}
                onChange={(e) => setTestForm({ ...testForm, title: e.target.value })}
                placeholder="Título do caso de teste"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={testForm.description}
                onChange={(e) => setTestForm({ ...testForm, description: e.target.value })}
                placeholder="Objetivo do teste"
              />
            </div>
            <div className="space-y-2">
              <Label>Pré-condições</Label>
              <Textarea
                value={testForm.preconditions}
                onChange={(e) => setTestForm({ ...testForm, preconditions: e.target.value })}
                placeholder="Condições necessárias antes do teste"
              />
            </div>
            <div className="space-y-2">
              <Label>Passos</Label>
              <Textarea
                value={testForm.steps}
                onChange={(e) => setTestForm({ ...testForm, steps: e.target.value })}
                placeholder="1. Primeiro passo&#10;2. Segundo passo..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Resultados Esperados</Label>
              <Textarea
                value={testForm.expected_results}
                onChange={(e) => setTestForm({ ...testForm, expected_results: e.target.value })}
                placeholder="O que deve acontecer"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleTestSubmit} disabled={!testForm.code || !testForm.title}>
              {editingTest ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Link RTM</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Requisito *</Label>
              <Select value={selectedReqId} onValueChange={setSelectedReqId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um requisito..." />
                </SelectTrigger>
                <SelectContent>
                  {requirements.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.code} - {r.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Caso de Teste *</Label>
              <Select value={selectedTestId} onValueChange={setSelectedTestId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um caso de teste..." />
                </SelectTrigger>
                <SelectContent>
                  {testCases.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.code} - {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleLinkSubmit} disabled={!selectedReqId || !selectedTestId}>
              Criar Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Execute Test Dialog */}
      <Dialog open={executeDialogOpen} onOpenChange={setExecuteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Executar Caso de Teste</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {executingTest && (
              <>
                <div className="space-y-2">
                  <Label>Caso de Teste</Label>
                  <p className="text-sm font-medium">{executingTest.code} - {executingTest.title}</p>
                </div>
                {executingTest.steps && (
                  <div className="space-y-2">
                    <Label>Passos</Label>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{executingTest.steps}</p>
                  </div>
                )}
                {executingTest.expected_results && (
                  <div className="space-y-2">
                    <Label>Resultado Esperado</Label>
                    <p className="text-sm text-muted-foreground">{executingTest.expected_results}</p>
                  </div>
                )}
              </>
            )}
            <div className="space-y-2">
              <Label>Resultado *</Label>
              <Select value={testResult} onValueChange={setTestResult}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o resultado..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="passed">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Passou
                    </div>
                  </SelectItem>
                  <SelectItem value="failed">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      Falhou
                    </div>
                  </SelectItem>
                  <SelectItem value="blocked">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      Bloqueado
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExecuteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleExecuteSubmit} disabled={!testResult}>
              Registrar Resultado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
