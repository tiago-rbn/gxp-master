import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MoreHorizontal,
  UserCheck,
  UserX,
  ShieldCheck,
  Building2,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ManageUserCompaniesDialog } from "@/components/settings/ManageUserCompaniesDialog";

interface UserWithDetails {
  id: string;
  email: string;
  full_name: string;
  company_id: string | null;
  company_name: string | null;
  department: string | null;
  position: string | null;
  is_active: boolean;
  created_at: string;
  role: string | null;
}

export default function Users() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [manageCompaniesUser, setManageCompaniesUser] = useState<UserWithDetails | null>(null);

  // Check if user is super admin
  const { data: isSuperAdmin, isLoading: isCheckingAdmin } = useQuery({
    queryKey: ["is-super-admin", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "super_admin")
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  // Fetch all companies for filter
  const { data: companies } = useQuery({
    queryKey: ["all-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: isSuperAdmin === true,
  });

  // Fetch all users with their company and role info
  const { data: users, isLoading } = useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      // Get all profiles with company names
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          id,
          email,
          full_name,
          company_id,
          department,
          position,
          is_active,
          created_at,
          companies:company_id (name)
        `)
        .order("full_name");

      if (profilesError) throw profilesError;

      // Get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Map roles to users
      const roleMap = new Map<string, string>();
      roles?.forEach((r) => {
        // Prioritize super_admin, then admin, etc
        const existing = roleMap.get(r.user_id);
        if (!existing || getPriorityRole(r.role) > getPriorityRole(existing)) {
          roleMap.set(r.user_id, r.role);
        }
      });

      return profiles.map((p): UserWithDetails => ({
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        company_id: p.company_id,
        company_name: (p.companies as any)?.name || null,
        department: p.department,
        position: p.position,
        is_active: p.is_active ?? true,
        created_at: p.created_at,
        role: roleMap.get(p.id) || null,
      }));
    },
    enabled: isSuperAdmin === true,
  });

  // Toggle user status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: isActive })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      toast.success("Status do usuário atualizado");
    },
    onError: () => {
      toast.error("Erro ao atualizar status");
    },
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      // Delete existing roles
      await supabase.from("user_roles").delete().eq("user_id", userId);
      
      // Insert new role using the correct type
      const { error } = await supabase.from("user_roles").insert([{
        user_id: userId,
        role: newRole as "super_admin" | "admin" | "validator" | "responsible" | "reader",
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      toast.success("Perfil do usuário atualizado");
    },
    onError: () => {
      toast.error("Erro ao atualizar perfil");
    },
  });

  // Redirect if not super admin
  if (!isCheckingAdmin && !isSuperAdmin) {
    navigate("/dashboard");
    return null;
  }

  const getPriorityRole = (role: string): number => {
    const priorities: Record<string, number> = {
      super_admin: 5,
      admin: 4,
      validator: 3,
      responsible: 2,
      reader: 1,
    };
    return priorities[role] || 0;
  };

  const getRoleBadge = (role: string | null) => {
    const roleConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      super_admin: { label: "Super Admin", variant: "destructive" },
      admin: { label: "Admin", variant: "default" },
      validator: { label: "Validador", variant: "secondary" },
      responsible: { label: "Responsável", variant: "secondary" },
      reader: { label: "Leitor", variant: "outline" },
    };
    const config = role ? roleConfig[role] : null;
    if (!config) return <Badge variant="outline">Sem perfil</Badge>;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredUsers = users?.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.company_name?.toLowerCase().includes(search.toLowerCase()) ?? false);
    
    const matchesCompany = companyFilter === "all" || u.company_id === companyFilter;
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && u.is_active) ||
      (statusFilter === "inactive" && !u.is_active);

    return matchesSearch && matchesCompany && matchesRole && matchesStatus;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Gestão de Usuários"
          description="Visualize e gerencie todos os usuários do sistema"
        />

        <Card>
          <CardContent className="pt-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou empresa..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={companyFilter} onValueChange={setCompanyFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Building2 className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Empresas</SelectItem>
                    {companies?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[150px]">
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Perfis</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="validator">Validador</SelectItem>
                    <SelectItem value="responsible">Responsável</SelectItem>
                    <SelectItem value="reader">Leitor</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading || isCheckingAdmin ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          Nenhum usuário encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers?.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{u.full_name}</span>
                              <span className="text-sm text-muted-foreground">{u.email}</span>
                              {(u.department || u.position) && (
                                <span className="text-xs text-muted-foreground">
                                  {[u.position, u.department].filter(Boolean).join(" • ")}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {u.company_name || (
                              <span className="text-muted-foreground italic">Sem empresa</span>
                            )}
                          </TableCell>
                          <TableCell>{getRoleBadge(u.role)}</TableCell>
                          <TableCell>
                            <Badge variant={u.is_active ? "default" : "secondary"}>
                              {u.is_active ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(u.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    toggleStatusMutation.mutate({
                                      userId: u.id,
                                      isActive: !u.is_active,
                                    })
                                  }
                                >
                                  {u.is_active ? (
                                    <>
                                      <UserX className="mr-2 h-4 w-4" />
                                      Desativar
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="mr-2 h-4 w-4" />
                                      Ativar
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateRoleMutation.mutate({ userId: u.id, newRole: "reader" })
                                  }
                                  disabled={u.role === "reader"}
                                >
                                  Definir como Leitor
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateRoleMutation.mutate({ userId: u.id, newRole: "responsible" })
                                  }
                                  disabled={u.role === "responsible"}
                                >
                                  Definir como Responsável
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateRoleMutation.mutate({ userId: u.id, newRole: "validator" })
                                  }
                                  disabled={u.role === "validator"}
                                >
                                  Definir como Validador
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateRoleMutation.mutate({ userId: u.id, newRole: "admin" })
                                  }
                                  disabled={u.role === "admin"}
                                >
                                  Definir como Admin
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateRoleMutation.mutate({ userId: u.id, newRole: "super_admin" })
                                  }
                                  disabled={u.role === "super_admin"}
                                  className="text-destructive"
                                >
                                  Definir como Super Admin
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setManageCompaniesUser(u)}>
                                  <Building2 className="mr-2 h-4 w-4" />
                                  Gerenciar Empresas
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {filteredUsers && (
              <div className="mt-4 text-sm text-muted-foreground">
                {filteredUsers.length} usuário(s) encontrado(s)
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {manageCompaniesUser && (
        <ManageUserCompaniesDialog
          open={!!manageCompaniesUser}
          onOpenChange={(open) => !open && setManageCompaniesUser(null)}
          user={{
            id: manageCompaniesUser.id,
            email: manageCompaniesUser.email,
            full_name: manageCompaniesUser.full_name,
            company_id: manageCompaniesUser.company_id,
            department: manageCompaniesUser.department,
            position: manageCompaniesUser.position,
            is_active: manageCompaniesUser.is_active,
            created_at: manageCompaniesUser.created_at,
            updated_at: manageCompaniesUser.created_at,
            avatar_url: null,
          }}
        />
      )}
    </AppLayout>
  );
}
