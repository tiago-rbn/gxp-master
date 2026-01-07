import { useState } from "react";
import { Package, ListTodo, Plus, Edit, Trash2, MoreHorizontal, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeliverableTemplates, DeliverableTemplate } from "@/hooks/useDeliverableTemplates";
import { useTaskTemplates, TaskTemplate } from "@/hooks/useTaskTemplates";
import { DeliverableTemplateFormDialog } from "./DeliverableTemplateFormDialog";
import { TaskTemplateFormDialog } from "./TaskTemplateFormDialog";
import { GampBadge } from "@/components/shared/GampBadge";

const gampCategoryLabels: Record<string, string> = {
  "1": "Cat. 1 - Infraestrutura",
  "3": "Cat. 3 - Não configurável",
  "4": "Cat. 4 - Configurável",
  "5": "Cat. 5 - Customizado",
};

const phaseLabels: Record<string, string> = {
  planning: "Planejamento",
  specification: "Especificação",
  development: "Desenvolvimento",
  testing: "Testes",
  deployment: "Implantação",
  closure: "Encerramento",
};

export function ProjectTemplatesTab() {
  const { 
    templates: deliverableTemplates, 
    isLoading: deliverableLoading,
    addTemplate: addDeliverable,
    updateTemplate: updateDeliverable,
    deleteTemplate: deleteDeliverable,
  } = useDeliverableTemplates();
  
  const { 
    templates: taskTemplates, 
    isLoading: taskLoading,
    addTemplate: addTask,
    updateTemplate: updateTask,
    deleteTemplate: deleteTask,
  } = useTaskTemplates();

  // Deliverable dialog states
  const [deliverableDialogOpen, setDeliverableDialogOpen] = useState(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState<DeliverableTemplate | null>(null);
  const [deleteDeliverableOpen, setDeleteDeliverableOpen] = useState(false);
  const [deliverableToDelete, setDeliverableToDelete] = useState<DeliverableTemplate | null>(null);

  // Task dialog states
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskTemplate | null>(null);
  const [deleteTaskOpen, setDeleteTaskOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<TaskTemplate | null>(null);

  // Deliverable handlers
  const handleNewDeliverable = () => {
    setSelectedDeliverable(null);
    setDeliverableDialogOpen(true);
  };

  const handleEditDeliverable = (template: DeliverableTemplate) => {
    setSelectedDeliverable(template);
    setDeliverableDialogOpen(true);
  };

  const handleDeliverableSubmit = async (data: Omit<DeliverableTemplate, "id" | "company_id" | "created_at" | "updated_at">) => {
    if (selectedDeliverable) {
      await updateDeliverable.mutateAsync({ id: selectedDeliverable.id, updates: data });
    } else {
      await addDeliverable.mutateAsync(data);
    }
  };

  const handleDeleteDeliverableClick = (template: DeliverableTemplate) => {
    setDeliverableToDelete(template);
    setDeleteDeliverableOpen(true);
  };

  const handleDeleteDeliverableConfirm = async () => {
    if (deliverableToDelete) {
      await deleteDeliverable.mutateAsync(deliverableToDelete.id);
      setDeleteDeliverableOpen(false);
      setDeliverableToDelete(null);
    }
  };

  // Task handlers
  const handleNewTask = () => {
    setSelectedTask(null);
    setTaskDialogOpen(true);
  };

  const handleEditTask = (template: TaskTemplate) => {
    setSelectedTask(template);
    setTaskDialogOpen(true);
  };

  const handleTaskSubmit = async (data: Omit<TaskTemplate, "id" | "company_id" | "created_at" | "updated_at">) => {
    if (selectedTask) {
      await updateTask.mutateAsync({ id: selectedTask.id, updates: data });
    } else {
      await addTask.mutateAsync(data);
    }
  };

  const handleDeleteTaskClick = (template: TaskTemplate) => {
    setTaskToDelete(template);
    setDeleteTaskOpen(true);
  };

  const handleDeleteTaskConfirm = async () => {
    if (taskToDelete) {
      await deleteTask.mutateAsync(taskToDelete.id);
      setDeleteTaskOpen(false);
      setTaskToDelete(null);
    }
  };

  // Group templates by GAMP category
  const groupByGamp = <T extends { gamp_category: string }>(items: T[] | undefined): Record<string, T[]> => {
    if (!items) return {};
    return items.reduce((acc, item) => {
      const cat = item.gamp_category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {} as Record<string, T[]>);
  };

  const deliverablesByGamp = groupByGamp(deliverableTemplates);
  const tasksByGamp = groupByGamp(taskTemplates);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Templates de Projetos</CardTitle>
        <CardDescription>
          Configure os templates de entregáveis e tarefas por categoria GAMP
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="deliverables" className="space-y-4">
          <TabsList>
            <TabsTrigger value="deliverables" className="gap-2">
              <Package className="h-4 w-4" />
              Entregáveis
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <ListTodo className="h-4 w-4" />
              Tarefas
            </TabsTrigger>
          </TabsList>

          {/* Deliverables Tab */}
          <TabsContent value="deliverables" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={handleNewDeliverable}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Template
              </Button>
            </div>

            {deliverableLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : Object.keys(deliverablesByGamp).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum template de entregável cadastrado.
              </div>
            ) : (
              Object.entries(deliverablesByGamp).map(([gamp, templates]) => (
                <div key={gamp} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <GampBadge category={gamp as "1" | "3" | "4" | "5"} />
                    <span className="text-sm text-muted-foreground">
                      ({templates.length} template{templates.length !== 1 ? "s" : ""})
                    </span>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">Ordem</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Tipo Doc.</TableHead>
                        <TableHead>Obrigatório</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {templates.map((template) => (
                        <TableRow key={template.id}>
                          <TableCell className="text-muted-foreground">
                            {template.sort_order}
                          </TableCell>
                          <TableCell>
                            <div>
                              <span className="font-medium">{template.name}</span>
                              {template.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {template.description}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {template.document_type ? (
                              <Badge variant="outline">{template.document_type}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={template.is_mandatory ? "default" : "secondary"}>
                              {template.is_mandatory ? "Sim" : "Não"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditDeliverable(template)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeleteDeliverableClick(template)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))
            )}
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={handleNewTask}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Template
              </Button>
            </div>

            {taskLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : Object.keys(tasksByGamp).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum template de tarefa cadastrado.
              </div>
            ) : (
              Object.entries(tasksByGamp).map(([gamp, templates]) => (
                <div key={gamp} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <GampBadge category={gamp as "1" | "3" | "4" | "5"} />
                    <span className="text-sm text-muted-foreground">
                      ({templates.length} template{templates.length !== 1 ? "s" : ""})
                    </span>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">Ordem</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Fase</TableHead>
                        <TableHead>Horas Est.</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {templates.map((template) => (
                        <TableRow key={template.id}>
                          <TableCell className="text-muted-foreground">
                            {template.sort_order}
                          </TableCell>
                          <TableCell>
                            <div>
                              <span className="font-medium">{template.name}</span>
                              {template.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {template.description}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {template.phase ? (
                              <Badge variant="outline">
                                {phaseLabels[template.phase] || template.phase}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {template.estimated_hours ? (
                              <span>{template.estimated_hours}h</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditTask(template)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeleteTaskClick(template)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Dialogs */}
      <DeliverableTemplateFormDialog
        open={deliverableDialogOpen}
        onOpenChange={setDeliverableDialogOpen}
        template={selectedDeliverable}
        onSubmit={handleDeliverableSubmit}
      />

      <TaskTemplateFormDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        template={selectedTask}
        onSubmit={handleTaskSubmit}
      />

      {/* Delete Deliverable Dialog */}
      <AlertDialog open={deleteDeliverableOpen} onOpenChange={setDeleteDeliverableOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Template de Entregável</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o template "{deliverableToDelete?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDeliverableConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Task Dialog */}
      <AlertDialog open={deleteTaskOpen} onOpenChange={setDeleteTaskOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Template de Tarefa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o template "{taskToDelete?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTaskConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
