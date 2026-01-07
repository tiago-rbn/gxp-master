import { useState } from "react";
import { useAuditLogs } from "@/hooks/useAuditLogs";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  History,
  Search,
  Eye,
  Filter,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Calendar,
  CalendarIcon,
  X,
} from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { format, isAfter, isBefore, startOfDay, endOfDay, subDays, subWeeks, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AuditLog } from "@/hooks/useAuditLogs";
import { cn } from "@/lib/utils";

const entityTypeLabels: Record<string, string> = {
  validation_projects: "Projetos",
  documents: "Documentos",
  change_requests: "Mudanças",
  systems: "Sistemas",
  risk_assessments: "Riscos",
  requirements: "Requisitos",
  test_cases: "Casos de Teste",
};

const actionLabels: Record<string, { label: string; icon: typeof Plus; variant: "default" | "secondary" | "destructive" }> = {
  INSERT: { label: "Criado", icon: Plus, variant: "default" },
  UPDATE: { label: "Atualizado", icon: Edit, variant: "secondary" },
  DELETE: { label: "Excluído", icon: Trash2, variant: "destructive" },
};

export default function AuditTrail() {
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [viewingLog, setViewingLog] = useState<AuditLog | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const { auditLogs, isLoading, refetch, entityTypes, actions } = useAuditLogs(
    entityFilter !== "all" || actionFilter !== "all"
      ? {
          entity_type: entityFilter !== "all" ? entityFilter : undefined,
          action: actionFilter !== "all" ? actionFilter : undefined,
        }
      : undefined
  );

  const filteredLogs = auditLogs.filter((log) => {
    // Text search filter
    if (search) {
      const searchLower = search.toLowerCase();
      const matchesSearch = 
        log.entity_type.toLowerCase().includes(searchLower) ||
        log.action.toLowerCase().includes(searchLower) ||
        log.user?.full_name?.toLowerCase().includes(searchLower) ||
        log.user?.email?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Date range filter
    const logDate = new Date(log.created_at);
    if (startDate && isBefore(logDate, startOfDay(startDate))) {
      return false;
    }
    if (endDate && isAfter(logDate, endOfDay(endDate))) {
      return false;
    }

    return true;
  });

  const stats = {
    total: auditLogs.length,
    inserts: auditLogs.filter((l) => l.action === "INSERT").length,
    updates: auditLogs.filter((l) => l.action === "UPDATE").length,
    deletes: auditLogs.filter((l) => l.action === "DELETE").length,
  };

  const getActionBadge = (action: string) => {
    const config = actionLabels[action] || { label: action, icon: Edit, variant: "secondary" as const };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const renderJsonDiff = (oldValues: Record<string, any> | null, newValues: Record<string, any> | null) => {
    if (!oldValues && !newValues) return null;

    const allKeys = new Set([
      ...Object.keys(oldValues || {}),
      ...Object.keys(newValues || {}),
    ]);

    const changes: { key: string; old: any; new: any; changed: boolean }[] = [];

    allKeys.forEach((key) => {
      // Skip internal fields
      if (["id", "company_id", "created_at", "updated_at"].includes(key)) return;

      const oldVal = oldValues?.[key];
      const newVal = newValues?.[key];
      const changed = JSON.stringify(oldVal) !== JSON.stringify(newVal);

      if (changed || oldVal !== undefined || newVal !== undefined) {
        changes.push({ key, old: oldVal, new: newVal, changed });
      }
    });

    return (
      <div className="space-y-2">
        {changes.map(({ key, old, new: newV, changed }) => (
          <div
            key={key}
            className={`rounded p-2 text-sm ${
              changed ? "bg-yellow-500/10 border border-yellow-500/20" : "bg-muted/50"
            }`}
          >
            <span className="font-medium text-muted-foreground">{key}:</span>
            {changed ? (
              <div className="ml-4 space-y-1">
                {old !== undefined && (
                  <div className="flex items-center gap-2">
                    <span className="text-red-500">-</span>
                    <span className="text-red-500 line-through">
                      {typeof old === "object" ? JSON.stringify(old) : String(old ?? "null")}
                    </span>
                  </div>
                )}
                {newV !== undefined && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">+</span>
                    <span className="text-green-500">
                      {typeof newV === "object" ? JSON.stringify(newV) : String(newV ?? "null")}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <span className="ml-2">
                {typeof newV === "object" ? JSON.stringify(newV) : String(newV ?? old ?? "null")}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trilha de Auditoria"
        description="Histórico de todas as alterações no sistema"
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total de Registros" value={stats.total} icon={History} />
        <StatCard
          title="Criações"
          value={stats.inserts}
          icon={Plus}
        />
        <StatCard
          title="Atualizações"
          value={stats.updates}
          icon={Edit}
        />
        <StatCard
          title="Exclusões"
          value={stats.deletes}
          icon={Trash2}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por tipo, ação ou usuário..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              
              {/* Quick Period Filters */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    setStartDate(today);
                    setEndDate(today);
                  }}
                  className={cn(
                    startDate && endDate && 
                    format(startDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") &&
                    format(endDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") &&
                    "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  Hoje
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    setStartDate(subWeeks(today, 1));
                    setEndDate(today);
                  }}
                  className={cn(
                    startDate && endDate &&
                    format(startDate, "yyyy-MM-dd") === format(subWeeks(new Date(), 1), "yyyy-MM-dd") &&
                    format(endDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") &&
                    "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  Última semana
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    setStartDate(subMonths(today, 1));
                    setEndDate(today);
                  }}
                  className={cn(
                    startDate && endDate &&
                    format(startDate, "yyyy-MM-dd") === format(subMonths(new Date(), 1), "yyyy-MM-dd") &&
                    format(endDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") &&
                    "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  Último mês
                </Button>
              </div>

              {/* Date Range Filters */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[140px] justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Data início"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[140px] justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Data fim"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>

              {(startDate || endDate) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setStartDate(undefined);
                    setEndDate(undefined);
                  }}
                  title="Limpar datas"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}

              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipo de entidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas entidades</SelectItem>
                  {entityTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {entityTypeLabels[type] || type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Ação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas ações</SelectItem>
                  {actions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {actionLabels[action]?.label || action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : filteredLogs.length === 0 ? (
            <EmptyState
              icon={History}
              title="Nenhum registro encontrado"
              description="Os logs de auditoria aparecerão aqui quando houver alterações"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead className="text-right">Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            {format(new Date(log.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(log.created_at), "HH:mm:ss", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">
                          {log.user?.full_name || "Sistema"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {log.user?.email || "-"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {entityTypeLabels[log.entity_type] || log.entity_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewingLog(log)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!viewingLog} onOpenChange={() => setViewingLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Registro</DialogTitle>
          </DialogHeader>
          {viewingLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Data/Hora</Label>
                  <p className="font-medium">
                    {format(new Date(viewingLog.created_at), "dd/MM/yyyy 'às' HH:mm:ss", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Usuário</Label>
                  <p className="font-medium">
                    {viewingLog.user?.full_name || "Sistema"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {viewingLog.user?.email || "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Entidade</Label>
                  <p className="font-medium">
                    {entityTypeLabels[viewingLog.entity_type] || viewingLog.entity_type}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Ação</Label>
                  <div className="mt-1">{getActionBadge(viewingLog.action)}</div>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">ID da Entidade</Label>
                <p className="font-mono text-sm">{viewingLog.entity_id}</p>
              </div>

              <div>
                <Label className="text-muted-foreground mb-2 block">Alterações</Label>
                <ScrollArea className="h-[300px] rounded border p-4">
                  {renderJsonDiff(viewingLog.old_values, viewingLog.new_values)}
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
