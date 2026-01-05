import { useState } from "react";
import { Plus, Search, MoreHorizontal, Eye, Edit, Calendar, User } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { validationProjects, type ValidationProject } from "@/data/mockData";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function Projects() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ValidationProject | null>(null);

  const filteredProjects = validationProjects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.systemName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewProject = (project: ValidationProject) => {
    setSelectedProject(project);
    setIsDialogOpen(true);
  };

  const getProgressColor = (progress: number) => {
    if (progress === 100) return "bg-success";
    if (progress >= 50) return "bg-primary";
    return "bg-warning";
  };

  return (
    <AppLayout>
      <PageHeader
        title="Projetos de Validação"
        description="Acompanhe e gerencie os projetos de validação"
        action={{
          label: "Novo Projeto",
          icon: Plus,
          onClick: () => {},
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
                <SelectItem value="Planning">Planejamento</SelectItem>
                <SelectItem value="In Progress">Em Andamento</SelectItem>
                <SelectItem value="Review">Revisão</SelectItem>
                <SelectItem value="Completed">Concluído</SelectItem>
                <SelectItem value="On Hold">Pausado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="flex flex-col transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{project.systemName}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleViewProject(project)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Visualizar
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-4">
                <StatusBadge status={project.status} />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className={getProgressColor(project.progress)} />
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{project.endDate}</span>
                  </div>
                  <Badge variant="outline">{project.documents} docs</Badge>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary/10 text-xs text-primary">
                    {getInitials(project.responsible)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">{project.responsible}</span>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* View Project Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedProject?.name}</DialogTitle>
            <DialogDescription>Detalhes do projeto de validação</DialogDescription>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Sistema</Label>
                  <p className="font-medium">{selectedProject.systemName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <StatusBadge status={selectedProject.status} />
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Responsável</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-primary/10 text-xs text-primary">
                        {getInitials(selectedProject.responsible)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{selectedProject.responsible}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Documentos</Label>
                  <p className="font-medium">{selectedProject.documents} documentos</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Data de Início</Label>
                  <p className="font-medium">{selectedProject.startDate}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Data de Término</Label>
                  <p className="font-medium">{selectedProject.endDate}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Progresso</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{selectedProject.progress}% concluído</span>
                  </div>
                  <Progress value={selectedProject.progress} className="h-3" />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Fechar
            </Button>
            <Button>Editar Projeto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}