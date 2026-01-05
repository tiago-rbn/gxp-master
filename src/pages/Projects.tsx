import { useState } from "react";
import { Plus, Search, MoreHorizontal, Eye, Edit, Trash2, Calendar, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useValidationProjects } from "@/hooks/useValidationProjects";
import { ProjectFormDialog } from "@/components/projects/ProjectFormDialog";
import { ProjectViewDialog } from "@/components/projects/ProjectViewDialog";
import { DeleteProjectDialog } from "@/components/projects/DeleteProjectDialog";
import type { Database } from "@/integrations/supabase/types";

type ValidationProject = Database["public"]["Tables"]["validation_projects"]["Row"] & {
  system?: { name: string } | null;
  manager?: { full_name: string } | null;
};

const statusLabels: Record<string, string> = {
  draft: "Planejamento",
  pending: "Em Andamento",
  approved: "Revisão",
  rejected: "Rejeitado",
  completed: "Concluído",
  cancelled: "Pausado",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getProgressColor(progress: number) {
  if (progress === 100) return "bg-success";
  if (progress >= 50) return "bg-primary";
  return "bg-warning";
}

export default function Projects() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ValidationProject | null>(null);

  const { projects, isLoading, createProject, updateProject, deleteProject } =
    useValidationProjects();

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.system?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = () => {
    setSelectedProject(null);
    setIsFormOpen(true);
  };

  const handleView = (project: ValidationProject) => {
    setSelectedProject(project);
    setIsViewOpen(true);
  };

  const handleEdit = (project: ValidationProject) => {
    setSelectedProject(project);
    setIsFormOpen(true);
    setIsViewOpen(false);
  };

  const handleDelete = (project: ValidationProject) => {
    setSelectedProject(project);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = (values: any) => {
    const payload = {
      ...values,
      system_id: values.system_id || null,
      manager_id: values.manager_id || null,
      start_date: values.start_date || null,
      target_date: values.target_date || null,
      completion_date: values.completion_date || null,
    };

    if (selectedProject) {
      updateProject.mutate(
        { id: selectedProject.id, ...payload },
        { onSuccess: () => setIsFormOpen(false) }
      );
    } else {
      createProject.mutate(payload, { onSuccess: () => setIsFormOpen(false) });
    }
  };

  const handleConfirmDelete = () => {
    if (selectedProject) {
      deleteProject.mutate(selectedProject.id, {
        onSuccess: () => {
          setIsDeleteOpen(false);
          setSelectedProject(null);
        },
      });
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Projetos de Validação"
        description="Acompanhe e gerencie os projetos de validação"
        action={{
          label: "Novo Projeto",
          icon: Plus,
          onClick: handleCreate,
        }}
      />

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou sistema..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="draft">Planejamento</SelectItem>
                <SelectItem value="pending">Em Andamento</SelectItem>
                <SelectItem value="approved">Revisão</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Pausado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-4">
              {projects.length === 0
                ? "Nenhum projeto cadastrado ainda."
                : "Nenhum projeto encontrado com os filtros aplicados."}
            </p>
            {projects.length === 0 && (
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Projeto
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="flex flex-col transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {project.system?.name || "Sem sistema"}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleView(project)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(project)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(project)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-4">
                  <Badge variant="outline">
                    {statusLabels[project.status || "draft"]}
                  </Badge>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">{project.progress || 0}%</span>
                    </div>
                    <Progress
                      value={project.progress || 0}
                      className={getProgressColor(project.progress || 0)}
                    />
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    {project.target_date && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(project.target_date).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                {project.manager?.full_name ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-primary/10 text-xs text-primary">
                        {getInitials(project.manager.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">
                      {project.manager.full_name}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Sem gerente</span>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <ProjectFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        project={selectedProject}
        onSubmit={handleFormSubmit}
        isLoading={createProject.isPending || updateProject.isPending}
      />

      <ProjectViewDialog
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        project={selectedProject}
        onEdit={() => selectedProject && handleEdit(selectedProject)}
      />

      <DeleteProjectDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        projectName={selectedProject?.name || ""}
        onConfirm={handleConfirmDelete}
        isLoading={deleteProject.isPending}
      />
    </AppLayout>
  );
}
