import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { useMitigationActions, MitigationActionInsert } from "@/hooks/useMitigationActions";
import { useProfiles } from "@/hooks/useSystems";
import { Plus, Shield, Check, Trash2, Calendar, User } from "lucide-react";

interface MitigationActionsTabProps {
  riskId: string;
}

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  in_progress: "Em Andamento",
  completed: "Concluído",
};

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  in_progress: "bg-primary/10 text-primary border-primary/20",
  completed: "bg-success/10 text-success border-success/20",
};

export function MitigationActionsTab({ riskId }: MitigationActionsTabProps) {
  const { mitigationActions, createMitigationAction, updateMitigationAction, deleteMitigationAction, completeMitigationAction, isLoading } = useMitigationActions(riskId);
  const { data: profiles = [] } = useProfiles();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<MitigationActionInsert>({
    risk_id: riskId,
    title: "",
    description: "",
    responsible_id: "",
    status: "pending",
    due_date: "",
  });

  const handleCreate = () => {
    createMitigationAction.mutate(formData, {
      onSuccess: () => {
        setIsFormOpen(false);
        setFormData({
          risk_id: riskId,
          title: "",
          description: "",
          responsible_id: "",
          status: "pending",
          due_date: "",
        });
      },
    });
  };

  const handleComplete = (id: string) => {
    completeMitigationAction.mutate(id);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja remover esta ação de mitigação?")) {
      deleteMitigationAction.mutate(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium">Ações de Mitigação</h4>
        <Button size="sm" onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Nova Ação
        </Button>
      </div>

      {mitigationActions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Shield className="h-8 w-8 mb-2" />
          <p>Nenhuma ação de mitigação cadastrada</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => setIsFormOpen(true)}>
            Adicionar primeira ação
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {mitigationActions.map((action) => (
            <Card key={action.id} className={`border ${statusColors[action.status]?.split(' ')[2] || ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h5 className="font-medium">{action.title}</h5>
                      <Badge className={statusColors[action.status]}>
                        {statusLabels[action.status]}
                      </Badge>
                    </div>
                    {action.description && (
                      <p className="text-sm text-muted-foreground mb-2">{action.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {action.responsible && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {action.responsible.full_name}
                        </span>
                      )}
                      {action.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(action.due_date).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                      {action.completed_at && (
                        <span className="flex items-center gap-1 text-success">
                          <Check className="h-3 w-3" />
                          Concluído em {new Date(action.completed_at).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {action.status !== "completed" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleComplete(action.id)}
                        title="Marcar como concluído"
                      >
                        <Check className="h-4 w-4 text-success" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(action.id)}
                      title="Remover ação"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Action Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Ação de Mitigação</DialogTitle>
            <DialogDescription>
              Adicione uma ação para mitigar este risco
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Descreva a ação de mitigação..."
              />
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalhes adicionais..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Responsável</Label>
                <Select
                  value={formData.responsible_id}
                  onValueChange={(value) => setFormData({ ...formData, responsible_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Data Limite</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={!formData.title || createMitigationAction.isPending}>
              Criar Ação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
