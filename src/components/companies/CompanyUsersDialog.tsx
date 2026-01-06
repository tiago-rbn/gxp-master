import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Edit, UserCheck, UserX, Plus } from "lucide-react";
import { Company } from "@/hooks/useCompanies";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CompanyUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
}

type UserWithRole = {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  role?: string;
};

export function CompanyUsersDialog({
  open,
  onOpenChange,
  company,
}: CompanyUsersDialogProps) {
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUserData, setNewUserData] = useState({
    full_name: "",
    email: "",
    role: "reader",
  });

  // Fetch users for this company
  const { data: users, isLoading } = useQuery({
    queryKey: ["company-users", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];

      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("company_id", company.id)
        .order("full_name");

      if (error) throw error;

      // Fetch roles for these users
      const userIds = profiles.map((p) => p.id);
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      const rolesMap = new Map(roles?.map((r) => [r.user_id, r.role]) || []);

      return profiles.map((p) => ({
        ...p,
        role: rolesMap.get(p.id) || "reader",
      })) as UserWithRole[];
    },
    enabled: open && !!company?.id,
  });

  // Update user mutation
  const updateUser = useMutation({
    mutationFn: async ({
      userId,
      updates,
      role,
    }: {
      userId: string;
      updates: { full_name?: string; is_active?: boolean };
      role?: string;
    }) => {
      // Update profile
      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from("profiles")
          .update(updates)
          .eq("id", userId);
        if (error) throw error;
      }

      // Update role if provided
      if (role) {
        const { data: existing } = await supabase
          .from("user_roles")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from("user_roles")
            .update({ role: role as any })
            .eq("user_id", userId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("user_roles")
            .insert({ user_id: userId, role: role as any });
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-users", company?.id] });
      toast.success("Usuário atualizado com sucesso");
      setEditingUser(null);
    },
    onError: (error) => {
      toast.error("Erro ao atualizar usuário: " + error.message);
    },
  });

  // Create user invitation mutation
  const inviteUser = useMutation({
    mutationFn: async (data: { email: string; full_name: string; role: string }) => {
      const token = crypto.randomUUID();
      const { error } = await supabase.from("invitations").insert({
        company_id: company!.id,
        email: data.email,
        role: data.role,
        token,
        invited_by: (await supabase.auth.getUser()).data.user?.id,
      });
      if (error) throw error;
      return { token };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-users", company?.id] });
      toast.success("Convite enviado com sucesso");
      setShowAddForm(false);
      setNewUserData({ full_name: "", email: "", role: "reader" });
    },
    onError: (error) => {
      toast.error("Erro ao enviar convite: " + error.message);
    },
  });

  const handleSaveEdit = () => {
    if (!editingUser) return;
    updateUser.mutate({
      userId: editingUser.id,
      updates: { full_name: editingUser.full_name },
      role: editingUser.role,
    });
  };

  const handleToggleActive = (user: UserWithRole) => {
    updateUser.mutate({
      userId: user.id,
      updates: { is_active: !user.is_active },
    });
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.email || !newUserData.full_name) return;
    inviteUser.mutate(newUserData);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "super_admin":
        return "destructive";
      case "admin":
        return "default";
      case "editor":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "super_admin":
        return "Super Admin";
      case "admin":
        return "Admin";
      case "editor":
        return "Editor";
      default:
        return "Leitor";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Usuários - {company?.name}</DialogTitle>
          <DialogDescription>
            Gerencie os usuários desta empresa
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add User Form */}
          {showAddForm ? (
            <form onSubmit={handleInvite} className="border rounded-lg p-4 space-y-4 bg-muted/50">
              <h4 className="font-medium">Convidar Novo Usuário</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-name">Nome Completo *</Label>
                  <Input
                    id="new-name"
                    value={newUserData.full_name}
                    onChange={(e) =>
                      setNewUserData({ ...newUserData, full_name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-email">Email *</Label>
                  <Input
                    id="new-email"
                    type="email"
                    value={newUserData.email}
                    onChange={(e) =>
                      setNewUserData({ ...newUserData, email: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-role">Perfil</Label>
                <Select
                  value={newUserData.role}
                  onValueChange={(value) =>
                    setNewUserData({ ...newUserData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reader">Leitor</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={inviteUser.isPending}>
                  {inviteUser.isPending ? "Enviando..." : "Enviar Convite"}
                </Button>
              </div>
            </form>
          ) : (
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Convidar Usuário
            </Button>
          )}

          {/* Users Table */}
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="w-[120px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  users?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        {editingUser?.id === user.id ? (
                          <Input
                            value={editingUser.full_name}
                            onChange={(e) =>
                              setEditingUser({ ...editingUser, full_name: e.target.value })
                            }
                            className="w-[150px]"
                          />
                        ) : (
                          <span className="font-medium">{user.full_name}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        {editingUser?.id === user.id ? (
                          <Select
                            value={editingUser.role || "reader"}
                            onValueChange={(value) =>
                              setEditingUser({ ...editingUser, role: value })
                            }
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="reader">Leitor</SelectItem>
                              <SelectItem value="editor">Editor</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="super_admin">Super Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant={getRoleBadgeVariant(user.role || "reader")}>
                            {getRoleLabel(user.role || "reader")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? "default" : "secondary"}>
                          {user.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {editingUser?.id === user.id ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSaveEdit}
                                disabled={updateUser.isPending}
                              >
                                Salvar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingUser(null)}
                              >
                                Cancelar
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingUser(user)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleActive(user)}
                              >
                                {user.is_active ? (
                                  <UserX className="h-4 w-4 text-destructive" />
                                ) : (
                                  <UserCheck className="h-4 w-4 text-green-600" />
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
