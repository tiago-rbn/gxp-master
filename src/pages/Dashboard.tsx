import { Server, CheckCircle, AlertTriangle, GitPullRequest, FolderKanban, Clock, FileText, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { RiskIndicator } from "@/components/shared/RiskIndicator";
import { GampBadge } from "@/components/shared/GampBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { 
  useDashboardStats, 
  useUpcomingRevalidations, 
  useRecentRisks, 
  useActiveProjects 
} from "@/hooks/useDashboardStats";
import { StatusType } from "@/components/shared/StatusBadge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  pending: "Pendente",
  approved: "Aprovado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const validationStatusLabels: Record<string, string> = {
  not_started: "Não Iniciado",
  in_progress: "Em Andamento",
  validated: "Validado",
  expired: "Expirado",
  pending_revalidation: "Revalidação Pendente",
};

const riskLevelMap: Record<string, "High" | "Medium" | "Low"> = {
  critical: "High",
  high: "High",
  medium: "Medium",
  low: "Low",
};

const gampCategoryMap: Record<string, 1 | 3 | 4 | 5> = {
  "1": 1,
  "3": 3,
  "4": 4,
  "5": 5,
};

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: upcomingRevalidations, isLoading: revalidationsLoading } = useUpcomingRevalidations();
  const { data: recentRisks, isLoading: risksLoading } = useRecentRisks();
  const { data: activeProjects, isLoading: projectsLoading } = useActiveProjects();

  const isLoading = statsLoading || revalidationsLoading || risksLoading || projectsLoading;

  const gampChartData = stats ? [
    { name: 'Cat. 1', value: stats.gampDistribution.gamp1, color: 'hsl(200, 80%, 50%)' },
    { name: 'Cat. 3', value: stats.gampDistribution.gamp3, color: 'hsl(145, 65%, 40%)' },
    { name: 'Cat. 4', value: stats.gampDistribution.gamp4, color: 'hsl(40, 90%, 50%)' },
    { name: 'Cat. 5', value: stats.gampDistribution.gamp5, color: 'hsl(280, 60%, 55%)' },
  ] : [];

  const projectStatusData = stats ? [
    { name: 'Rascunho', value: stats.projectStatus.draft },
    { name: 'Pendente', value: stats.projectStatus.pending },
    { name: 'Aprovado', value: stats.projectStatus.approved },
    { name: 'Concluído', value: stats.projectStatus.completed },
    { name: 'Cancelado', value: stats.projectStatus.cancelled },
  ] : [];

  const riskChartData = stats ? [
    { name: 'Baixo', value: stats.risksByLevel.low, color: 'hsl(145, 65%, 40%)' },
    { name: 'Médio', value: stats.risksByLevel.medium, color: 'hsl(40, 90%, 50%)' },
    { name: 'Alto', value: stats.risksByLevel.high, color: 'hsl(15, 80%, 55%)' },
    { name: 'Crítico', value: stats.risksByLevel.critical, color: 'hsl(0, 80%, 50%)' },
  ] : [];

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Dashboard"
        description="Visão geral do sistema de validação"
      />

      {/* KPI Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Sistemas"
          value={stats?.totalSystems || 0}
          icon={Server}
          variant="primary"
          description="Sistemas inventariados"
        />
        <StatCard
          title="Sistemas Validados"
          value={stats?.validatedSystems || 0}
          icon={CheckCircle}
          variant="success"
          description={stats?.totalSystems 
            ? `${Math.round((stats.validatedSystems / stats.totalSystems) * 100)}% do total`
            : "0% do total"
          }
        />
        <StatCard
          title="Riscos Altos/Críticos"
          value={stats?.highRisks || 0}
          icon={AlertTriangle}
          variant="destructive"
          description="Requerem atenção"
        />
        <StatCard
          title="Mudanças Pendentes"
          value={stats?.pendingChanges || 0}
          icon={GitPullRequest}
          variant="warning"
          description="Em análise ou implementação"
        />
      </div>

      {/* Secondary Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard
          title="Documentos"
          value={stats?.totalDocuments || 0}
          icon={FileText}
          description="Total de documentos cadastrados"
        />
        <StatCard
          title="Projetos Ativos"
          value={stats?.activeProjects || 0}
          icon={FolderKanban}
          description="Projetos em andamento"
        />
      </div>

      {/* Charts Row */}
      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sistemas por Categoria GAMP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {gampChartData.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={gampChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => value > 0 ? `${name}: ${value}` : ""}
                      labelLine={false}
                    >
                      {gampChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Nenhum sistema cadastrado
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status dos Projetos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {projectStatusData.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectStatusData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(215, 70%, 45%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Nenhum projeto cadastrado
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Riscos por Nível</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {riskChartData.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => value > 0 ? `${name}: ${value}` : ""}
                      labelLine={false}
                    >
                      {riskChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Nenhum risco cadastrado
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FolderKanban className="h-5 w-5" />
              Projetos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeProjects && activeProjects.length > 0 ? (
              <div className="space-y-4">
                {activeProjects.map((project) => (
                  <div key={project.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {project.system?.name || "Sistema não definido"}
                        </p>
                      </div>
                      <StatusBadge status={(project.status || "draft") as StatusType} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={project.progress || 0} className="flex-1" />
                      <span className="text-sm font-medium">{project.progress || 0}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum projeto ativo
              </div>
            )}
          </CardContent>
        </Card>

        {/* Open Risks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5" />
              Riscos em Aberto
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentRisks && recentRisks.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sistema</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Nível</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRisks.map((risk) => (
                    <TableRow key={risk.id}>
                      <TableCell className="font-medium">
                        {risk.system?.name || "N/A"}
                      </TableCell>
                      <TableCell>{risk.assessment_type}</TableCell>
                      <TableCell>
                        <RiskIndicator 
                          level={riskLevelMap[risk.risk_level || "medium"] || "Medium"} 
                          size="sm" 
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum risco em aberto
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Revalidations */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            Próximas Revalidações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingRevalidations && upcomingRevalidations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sistema</TableHead>
                  <TableHead>Categoria GAMP</TableHead>
                  <TableHead>Última Validação</TableHead>
                  <TableHead>Próxima Revalidação</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingRevalidations.map((system) => (
                  <TableRow key={system.id}>
                    <TableCell className="font-medium">{system.name}</TableCell>
                    <TableCell>
                      <GampBadge category={gampCategoryMap[system.gamp_category] || 5} />
                    </TableCell>
                    <TableCell>{formatDate(system.last_validation_date)}</TableCell>
                    <TableCell>{formatDate(system.next_revalidation_date)}</TableCell>
                    <TableCell>
                      <StatusBadge 
                        status={(system.validation_status || "not_started") as StatusType} 
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma revalidação agendada
            </div>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
