import { Server, CheckCircle, AlertTriangle, GitPullRequest, FolderKanban, Clock } from "lucide-react";
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
  dashboardStats, 
  systems, 
  validationProjects, 
  riskAssessments 
} from "@/data/mockData";
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

const gampChartData = [
  { name: 'Cat. 1', value: dashboardStats.gampDistribution.gamp1, color: 'hsl(200, 80%, 50%)' },
  { name: 'Cat. 3', value: dashboardStats.gampDistribution.gamp3, color: 'hsl(145, 65%, 40%)' },
  { name: 'Cat. 4', value: dashboardStats.gampDistribution.gamp4, color: 'hsl(40, 90%, 50%)' },
  { name: 'Cat. 5', value: dashboardStats.gampDistribution.gamp5, color: 'hsl(280, 60%, 55%)' },
];

const projectStatusData = [
  { name: 'Planejamento', value: dashboardStats.projectStatus.planning },
  { name: 'Em Andamento', value: dashboardStats.projectStatus.inProgress },
  { name: 'Revisão', value: dashboardStats.projectStatus.review },
  { name: 'Concluído', value: dashboardStats.projectStatus.completed },
  { name: 'Pausado', value: dashboardStats.projectStatus.onHold },
];

const upcomingRevalidations = systems
  .filter(s => s.nextRevalidation)
  .sort((a, b) => new Date(a.nextRevalidation!).getTime() - new Date(b.nextRevalidation!).getTime())
  .slice(0, 5);

const recentRisks = riskAssessments
  .filter(r => r.status === 'Open')
  .slice(0, 4);

const activeProjects = validationProjects
  .filter(p => p.status === 'In Progress' || p.status === 'Planning')
  .slice(0, 4);

export default function Dashboard() {
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
          value={dashboardStats.totalSystems}
          icon={Server}
          variant="primary"
          description="Sistemas inventariados"
        />
        <StatCard
          title="Sistemas Validados"
          value={dashboardStats.validatedSystems}
          icon={CheckCircle}
          variant="success"
          description={`${Math.round((dashboardStats.validatedSystems / dashboardStats.totalSystems) * 100)}% do total`}
        />
        <StatCard
          title="Riscos Altos Abertos"
          value={dashboardStats.highRisks}
          icon={AlertTriangle}
          variant="destructive"
          description="Requerem atenção"
        />
        <StatCard
          title="Mudanças Pendentes"
          value={dashboardStats.pendingChanges}
          icon={GitPullRequest}
          variant="warning"
          description="Em análise ou implementação"
        />
      </div>

      {/* Charts Row */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sistemas por Categoria GAMP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gampChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status dos Projetos de Validação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectStatusData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(215, 70%, 45%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
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
            <div className="space-y-4">
              {activeProjects.map((project) => (
                <div key={project.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-muted-foreground">{project.systemName}</p>
                    </div>
                    <StatusBadge status={project.status} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={project.progress} className="flex-1" />
                    <span className="text-sm font-medium">{project.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
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
                    <TableCell className="font-medium">{risk.systemName}</TableCell>
                    <TableCell>{risk.type}</TableCell>
                    <TableCell>
                      <RiskIndicator level={risk.riskLevel} size="sm" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
                    <GampBadge category={system.gampCategory} />
                  </TableCell>
                  <TableCell>{system.lastValidation}</TableCell>
                  <TableCell>{system.nextRevalidation}</TableCell>
                  <TableCell>
                    <StatusBadge status={system.validationStatus} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppLayout>
  );
}