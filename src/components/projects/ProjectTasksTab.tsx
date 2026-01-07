import { useState } from "react";
import { Plus, Trash2, ListTodo, MoreHorizontal, Loader2, User, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProjectTasks, ProjectTask } from "@/hooks/useProjectTasks";
import { useProfiles } from "@/hooks/useProfiles";
import { useTaskTemplates } from "@/hooks/useTaskTemplates";

interface ProjectTasksTabProps {
  projectId: string;
  gampCategory?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Pendente", className: "bg-muted text-muted-foreground" },
  in_progress: { label: "Em Andamento", className: "bg-warning/10 text-warning border-warning/20" },
  completed: { label: "Concluído", className: "bg-success/10 text-success border-success/20" },
  blocked: { label: "Bloqueado", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  low: { label: "Baixa", className: "border-success/20 text-success" },
  medium: { label: "Média", className: "border-warning/20 text-warning" },
  high: { label: "Alta", className: "border-destructive/20 text-destructive" },
};

const phaseOptions = [
  "Planejamento",
  "Especificação",
  "Desenvolvimento",
  "Testes",
  "Documentação",
  "Aprovação",
  "Encerramento",
];

export function ProjectTasksTab({ projectId, gampCategory }: ProjectTasksTabProps) {
  const { tasks, isLoading, addTask, updateTask, deleteTask, applyTemplate } = useProjectTasks(projectId);
  const { profiles } = useProfiles();
  const { templates: taskTemplates } = useTaskTemplates();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isApplyTemplateOpen, setIsApplyTemplateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    phase: "",
    priority: "medium",
    assigned_to: "",
    estimated_hours: "",
    due_date: "",
  });

  const handleOpenForm = (task?: ProjectTask) => {
    if (task) {
      setSelectedTask(task);
      setFormData({
        name: task.name,
        description: task.description || "",
        phase: task.phase || "",
        priority: task.priority || "medium",
        assigned_to: task.assigned_to || "",
        estimated_hours: task.estimated_hours?.toString() || "",
        due_date: task.due_date || "",
      });
    } else {
      setSelectedTask(null);
      setFormData({
        name: "",
        description: "",
        phase: "",
        priority: "medium",
        assigned_to: "",
        estimated_hours: "",
        due_date: "",
      });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    const taskData = {
      name: formData.name,
      description: formData.description || null,
      phase: formData.phase || null,
      priority: formData.priority,
      assigned_to: formData.assigned_to || null,
      estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours) : null,
      due_date: formData.due_date || null,
    };

    if (selectedTask) {
      await updateTask.mutateAsync({ id: selectedTask.id, ...taskData });
    } else {
      await addTask.mutateAsync({
        project_id: projectId,
        ...taskData,
        status: "pending",
        sort_order: tasks.length,
      });
    }
    setIsFormOpen(false);
  };

  const handleApplyTemplate = async () => {
    if (gampCategory) {
      await applyTemplate.mutateAsync(gampCategory);
      setIsApplyTemplateOpen(false);
    }
  };

  const templatesForCategory = taskTemplates?.filter(t => t.gamp_category === gampCategory) || [];
  const templateCount = templatesForCategory.length;

  const handleToggleStatus = async (task: ProjectTask) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    await updateTask.mutateAsync({ id: task.id, status: newStatus });
  };

  const handleStatusChange = async (task: ProjectTask, newStatus: string) => {
    await updateTask.mutateAsync({ id: task.id, status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const totalEstimatedHours = tasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
  const totalActualHours = tasks.reduce((sum, t) => sum + (t.actual_hours || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{completedTasks} de {tasks.length} concluídas</span>
          {totalEstimatedHours > 0 && (
            <span>Estimado: {totalEstimatedHours}h</span>
          )}
        </div>
        <div className="flex gap-2">
          {gampCategory && templateCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => setIsApplyTemplateOpen(true)} disabled={applyTemplate.isPending}>
              <Download className="mr-2 h-4 w-4" />
              Aplicar Template ({templateCount})
            </Button>
          )}
          <Button size="sm" onClick={() => handleOpenForm()}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Tarefa
          </Button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <ListTodo className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhuma tarefa cadastrada.</p>
          <p className="text-sm">Adicione tarefas ou aplique um template.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Tarefa</TableHead>
              <TableHead>Fase</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => {
              const status = statusConfig[task.status] || statusConfig.pending;
              const priority = priorityConfig[task.priority] || priorityConfig.medium;
              return (
                <TableRow key={task.id}>
                  <TableCell>
                    <Checkbox
                      checked={task.status === "completed"}
                      onCheckedChange={() => handleToggleStatus(task)}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <span className={`font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                        {task.name}
                      </span>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                      )}
                      {task.estimated_hours && (
                        <span className="text-xs text-muted-foreground">
                          {task.estimated_hours}h estimadas
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {task.phase || "-"}
                  </TableCell>
                  <TableCell>
                    {task.assignee ? (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{task.assignee.full_name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={priority.className}>
                      {priority.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select value={task.status} onValueChange={(v) => handleStatusChange(task, v)}>
                      <SelectTrigger className="h-8 w-32">
                        <Badge variant="outline" className={status.className}>
                          {status.label}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="in_progress">Em Andamento</SelectItem>
                        <SelectItem value="completed">Concluído</SelectItem>
                        <SelectItem value="blocked">Bloqueado</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenForm(task)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteTask.mutate(task.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTask ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
            <DialogDescription>
              Defina os detalhes da tarefa do projeto.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Elaborar especificação de requisitos"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva a tarefa..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fase</Label>
                <Select value={formData.phase} onValueChange={(v) => setFormData({ ...formData, phase: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a fase" />
                  </SelectTrigger>
                  <SelectContent>
                    {phaseOptions.map((phase) => (
                      <SelectItem key={phase} value={phase}>
                        {phase}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Responsável</Label>
                <Select value={formData.assigned_to} onValueChange={(v) => setFormData({ ...formData, assigned_to: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles?.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Horas Estimadas</Label>
                <Input
                  type="number"
                  value={formData.estimated_hours}
                  onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                  placeholder="Ex: 8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Data Limite</Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!formData.name || addTask.isPending || updateTask.isPending}>
              {addTask.isPending || updateTask.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apply Template Confirmation Dialog */}
      <AlertDialog open={isApplyTemplateOpen} onOpenChange={setIsApplyTemplateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aplicar Template de Tarefas</AlertDialogTitle>
            <AlertDialogDescription>
              Serão adicionadas {templateCount} tarefas do template da categoria GAMP {gampCategory}.
              {tasks.length > 0 && (
                <span className="block mt-2 text-warning font-medium">
                  Atenção: Este projeto já possui {tasks.length} tarefa(s). 
                  Os novos itens serão adicionados aos existentes.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleApplyTemplate} disabled={applyTemplate.isPending}>
              {applyTemplate.isPending ? "Aplicando..." : "Aplicar Template"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
