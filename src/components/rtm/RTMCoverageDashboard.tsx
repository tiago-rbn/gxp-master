import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  FileText,
  FlaskConical,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import type { Requirement } from "@/hooks/useRequirements";
import type { TestCase } from "@/hooks/useTestCases";
import type { RTMLink } from "@/hooks/useRTM";

interface RTMCoverageDashboardProps {
  requirements: Requirement[];
  testCases: TestCase[];
  rtmLinks: RTMLink[];
}

const COLORS = {
  passed: "#22c55e",
  failed: "#ef4444",
  pending: "#f59e0b",
  blocked: "#6b7280",
  uncovered: "#dc2626",
  covered: "#3b82f6",
};

export function RTMCoverageDashboard({
  requirements,
  testCases,
  rtmLinks,
}: RTMCoverageDashboardProps) {
  // Calculate comprehensive coverage statistics
  const coverageStats = useMemo(() => {
    const coveredReqIds = new Set(rtmLinks.map((l) => l.requirement_id));
    const uncoveredRequirements = requirements.filter(
      (r) => !coveredReqIds.has(r.id)
    );

    // Requirements with passed tests
    const passedReqIds = new Set(
      rtmLinks
        .filter((l) => l.test_case?.result === "passed")
        .map((l) => l.requirement_id)
    );

    // Requirements with failed tests
    const failedReqIds = new Set(
      rtmLinks
        .filter((l) => l.test_case?.result === "failed")
        .map((l) => l.requirement_id)
    );

    // Requirements with pending tests (covered but not executed)
    const pendingReqIds = new Set(
      rtmLinks
        .filter(
          (l) =>
            l.test_case?.status === "pending" ||
            (!l.test_case?.result && l.test_case?.status !== "passed" && l.test_case?.status !== "failed")
        )
        .map((l) => l.requirement_id)
    );

    // Calculate by priority
    const byPriority = {
      high: {
        total: requirements.filter((r) => r.priority === "high").length,
        covered: requirements.filter(
          (r) => r.priority === "high" && coveredReqIds.has(r.id)
        ).length,
        passed: requirements.filter(
          (r) => r.priority === "high" && passedReqIds.has(r.id)
        ).length,
      },
      medium: {
        total: requirements.filter((r) => r.priority === "medium").length,
        covered: requirements.filter(
          (r) => r.priority === "medium" && coveredReqIds.has(r.id)
        ).length,
        passed: requirements.filter(
          (r) => r.priority === "medium" && passedReqIds.has(r.id)
        ).length,
      },
      low: {
        total: requirements.filter((r) => r.priority === "low").length,
        covered: requirements.filter(
          (r) => r.priority === "low" && coveredReqIds.has(r.id)
        ).length,
        passed: requirements.filter(
          (r) => r.priority === "low" && passedReqIds.has(r.id)
        ).length,
      },
    };

    return {
      totalRequirements: requirements.length,
      coveredRequirements: coveredReqIds.size,
      uncoveredRequirements: uncoveredRequirements,
      passedRequirements: passedReqIds.size,
      failedRequirements: failedReqIds.size,
      pendingRequirements: pendingReqIds.size,
      coveragePercentage:
        requirements.length > 0
          ? Math.round((coveredReqIds.size / requirements.length) * 100)
          : 0,
      executionPercentage:
        coveredReqIds.size > 0
          ? Math.round(
              ((passedReqIds.size + failedReqIds.size) / coveredReqIds.size) * 100
            )
          : 0,
      passRate:
        passedReqIds.size + failedReqIds.size > 0
          ? Math.round(
              (passedReqIds.size / (passedReqIds.size + failedReqIds.size)) * 100
            )
          : 0,
      byPriority,
    };
  }, [requirements, rtmLinks]);

  // Test execution stats
  const testExecutionStats = useMemo(() => {
    const passed = testCases.filter((t) => t.result === "passed").length;
    const failed = testCases.filter((t) => t.result === "failed").length;
    const blocked = testCases.filter((t) => t.result === "blocked").length;
    const pending = testCases.filter(
      (t) => t.status === "pending" || !t.result
    ).length;

    return [
      { name: "Passou", value: passed, color: COLORS.passed },
      { name: "Falhou", value: failed, color: COLORS.failed },
      { name: "Pendente", value: pending, color: COLORS.pending },
      { name: "Bloqueado", value: blocked, color: COLORS.blocked },
    ];
  }, [testCases]);

  // Coverage by priority chart data
  const priorityChartData = useMemo(() => {
    return [
      {
        name: "Alta",
        Cobertos: coverageStats.byPriority.high.covered,
        "Não Cobertos":
          coverageStats.byPriority.high.total -
          coverageStats.byPriority.high.covered,
      },
      {
        name: "Média",
        Cobertos: coverageStats.byPriority.medium.covered,
        "Não Cobertos":
          coverageStats.byPriority.medium.total -
          coverageStats.byPriority.medium.covered,
      },
      {
        name: "Baixa",
        Cobertos: coverageStats.byPriority.low.covered,
        "Não Cobertos":
          coverageStats.byPriority.low.total -
          coverageStats.byPriority.low.covered,
      },
    ];
  }, [coverageStats]);

  const getPriorityBadge = (priority: string | null) => {
    const variants: Record<
      string,
      { variant: "default" | "secondary" | "destructive"; label: string }
    > = {
      high: { variant: "destructive", label: "Alta" },
      medium: { variant: "default", label: "Média" },
      low: { variant: "secondary", label: "Baixa" },
    };
    const config = variants[priority || "medium"] || variants.medium;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cobertura de Requisitos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {coverageStats.coveragePercentage}%
            </div>
            <Progress
              value={coverageStats.coveragePercentage}
              className="mt-2 h-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {coverageStats.coveredRequirements} de{" "}
              {coverageStats.totalRequirements} requisitos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Execução de Testes</CardTitle>
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {coverageStats.executionPercentage}%
            </div>
            <Progress
              value={coverageStats.executionPercentage}
              className="mt-2 h-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {testCases.filter((t) => t.result).length} de {testCases.length}{" "}
              testes executados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Aprovação</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {coverageStats.passRate}%
            </div>
            <div className="flex items-center gap-2 mt-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">{coverageStats.passedRequirements} passou</span>
              <XCircle className="h-4 w-4 text-red-500 ml-2" />
              <span className="text-sm">{coverageStats.failedRequirements} falhou</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sem Cobertura</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {coverageStats.uncoveredRequirements.length}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Requisitos sem casos de teste vinculados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Test Execution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status de Execução de Testes</CardTitle>
          </CardHeader>
          <CardContent>
            {testCases.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={testExecutionStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => (value > 0 ? `${name}: ${value}` : "")}
                    >
                      {testExecutionStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Nenhum caso de teste cadastrado
              </div>
            )}
          </CardContent>
        </Card>

        {/* Coverage by Priority Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cobertura por Prioridade</CardTitle>
          </CardHeader>
          <CardContent>
            {requirements.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityChartData} layout="vertical">
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={60} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="Cobertos"
                      stackId="a"
                      fill={COLORS.covered}
                      radius={[0, 4, 4, 0]}
                    />
                    <Bar
                      dataKey="Não Cobertos"
                      stackId="a"
                      fill={COLORS.uncovered}
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Nenhum requisito cadastrado
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Uncovered Requirements Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Requisitos Sem Cobertura de Testes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {coverageStats.uncoveredRequirements.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-green-600">
                Excelente! Todos os requisitos estão cobertos por testes.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coverageStats.uncoveredRequirements.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-mono text-sm">
                        {req.code}
                      </TableCell>
                      <TableCell className="font-medium">{req.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{req.type || "Funcional"}</Badge>
                      </TableCell>
                      <TableCell>{getPriorityBadge(req.priority)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{req.status || "Rascunho"}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-green-500/20 p-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Requisitos Aprovados</p>
                <p className="text-2xl font-bold text-green-600">
                  {coverageStats.passedRequirements}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-red-500/20 p-3">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Requisitos com Falha</p>
                <p className="text-2xl font-bold text-red-600">
                  {coverageStats.failedRequirements}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-yellow-500/20 p-3">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aguardando Execução</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {coverageStats.pendingRequirements}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
