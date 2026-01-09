import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, Clock, Package, Building2 } from "lucide-react";
import { usePackageActivations } from "@/hooks/useTemplatePackages";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EmptyState } from "@/components/shared/EmptyState";

export function TemplatePackageActivationsTab() {
  const { user } = useAuth();
  const { activations, isLoading, updateActivation, isSuperAdmin } = usePackageActivations();
  const [selectedActivation, setSelectedActivation] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [notes, setNotes] = useState("");

  const pendingActivations = activations?.filter((a) => a.status === "pending") || [];
  const processedActivations = activations?.filter((a) => a.status !== "pending") || [];

  const handleAction = async () => {
    if (!selectedActivation || !actionType || !user) return;

    await updateActivation.mutateAsync({
      id: selectedActivation,
      status: actionType === "approve" ? "approved" : "rejected",
      approvedBy: user.id,
      notes: notes || undefined,
    });

    setSelectedActivation(null);
    setActionType(null);
    setNotes("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Aprovado
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rejeitado
          </Badge>
        );
    }
  };

  if (isLoading) {
    return <div className="p-4 text-center">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Pending Activations (for Super Admin) */}
      {isSuperAdmin && pendingActivations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            Solicitações Pendentes ({pendingActivations.length})
          </h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pacote</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Solicitado por</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingActivations.map((activation) => (
                  <TableRow key={activation.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {activation.package?.name || "Pacote não encontrado"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {activation.company?.name}
                      </div>
                    </TableCell>
                    <TableCell>{activation.requester?.full_name}</TableCell>
                    <TableCell>
                      {format(new Date(activation.requested_at), "dd/MM/yyyy HH:mm", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            setSelectedActivation(activation.id);
                            setActionType("approve");
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedActivation(activation.id);
                            setActionType("reject");
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Rejeitar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* All Activations History */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          {isSuperAdmin ? "Histórico de Ativações" : "Minhas Solicitações"}
        </h3>
        
        {activations?.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Nenhuma solicitação"
            description="Não há solicitações de ativação de pacotes ainda."
          />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pacote</TableHead>
                  {isSuperAdmin && <TableHead>Empresa</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead>Solicitado em</TableHead>
                  {isSuperAdmin && <TableHead>Aprovado por</TableHead>}
                  <TableHead>Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activations?.map((activation) => (
                  <TableRow key={activation.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {activation.package?.name || "Pacote não encontrado"}
                        </span>
                      </div>
                    </TableCell>
                    {isSuperAdmin && (
                      <TableCell>{activation.company?.name}</TableCell>
                    )}
                    <TableCell>{getStatusBadge(activation.status)}</TableCell>
                    <TableCell>
                      {format(new Date(activation.requested_at), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    {isSuperAdmin && (
                      <TableCell>
                        {activation.approver?.full_name || "-"}
                      </TableCell>
                    )}
                    <TableCell className="max-w-[200px] truncate">
                      {activation.notes || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Action Dialog */}
      <Dialog
        open={!!selectedActivation && !!actionType}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedActivation(null);
            setActionType(null);
            setNotes("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Aprovar Ativação" : "Rejeitar Ativação"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {actionType === "approve"
                ? "Ao aprovar, os templates deste pacote serão disponibilizados para a empresa solicitante."
                : "Ao rejeitar, a empresa não terá acesso aos templates deste pacote."}
            </p>
            <Textarea
              placeholder="Adicionar notas (opcional)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedActivation(null);
                setActionType(null);
                setNotes("");
              }}
            >
              Cancelar
            </Button>
            <Button
              variant={actionType === "approve" ? "default" : "destructive"}
              onClick={handleAction}
              disabled={updateActivation.isPending}
            >
              {actionType === "approve" ? "Confirmar Aprovação" : "Confirmar Rejeição"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
