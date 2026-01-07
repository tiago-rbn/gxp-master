import { useState } from "react";
import { Building2, Plus, Edit, Users, Loader2, Search, ShieldAlert, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCompanies, Company } from "@/hooks/useCompanies";
import { CompanyFormDialog } from "@/components/companies/CompanyFormDialog";
import { CompanyUsersDialog } from "@/components/companies/CompanyUsersDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Navigate } from "react-router-dom";

export default function Companies() {
  const { companies, isLoading, isSuperAdmin, createCompany, updateCompany, deleteCompany } = useCompanies();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [usersDialogOpen, setUsersDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);

  // Redirect if not super_admin
  if (isSuperAdmin === false) {
    return <Navigate to="/dashboard" replace />;
  }

  const filteredCompanies = companies?.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cnpj?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNewCompany = () => {
    setSelectedCompany(null);
    setDialogOpen(true);
  };

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setDialogOpen(true);
  };

  const handleManageUsers = (company: Company) => {
    setSelectedCompany(company);
    setUsersDialogOpen(true);
  };

  const handleDeleteCompany = (company: Company) => {
    setCompanyToDelete(company);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!companyToDelete) return;
    await deleteCompany.mutateAsync(companyToDelete.id);
    setDeleteDialogOpen(false);
    setCompanyToDelete(null);
  };

  const handleSubmit = async (data: { name: string; cnpj?: string; address?: string; phone?: string; logo_url?: string }) => {
    if (selectedCompany) {
      await updateCompany.mutateAsync({
        id: selectedCompany.id,
        updates: {
          name: data.name,
          cnpj: data.cnpj || null,
          logo_url: data.logo_url || null,
          settings: {
            ...(selectedCompany.settings as Record<string, any> || {}),
            address: data.address,
            phone: data.phone,
          },
        },
      });
    } else {
      await createCompany.mutateAsync({
        name: data.name,
        cnpj: data.cnpj,
        settings: { address: data.address, phone: data.phone },
      });
    }
    setDialogOpen(false);
  };

  if (isSuperAdmin === undefined) {
    return (
      <AppLayout>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Gerenciamento de Empresas"
        description="Visualize e gerencie todas as organizações do sistema"
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Área Super Admin
            </CardTitle>
            <CardDescription>
              {companies?.length || 0} empresas cadastradas
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-[250px]"
              />
            </div>
            <Button onClick={handleNewCompany}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Empresa
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Usuários</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="w-[150px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhuma empresa encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCompanies?.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {company.logo_url ? (
                            <img 
                              src={company.logo_url} 
                              alt={company.name}
                              className="h-10 w-10 rounded-lg object-contain bg-muted"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                              <Building2 className="h-5 w-5 text-primary" />
                            </div>
                          )}
                          <div>
                            <span className="font-medium">{company.name}</span>
                            {(company.settings as Record<string, any>)?.address && (
                              <p className="text-xs text-muted-foreground">
                                {(company.settings as Record<string, any>).address}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {company.cnpj || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="gap-1">
                          <Users className="h-3 w-3" />
                          {company.user_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(company.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleManageUsers(company)}
                            title="Gerenciar Usuários"
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCompany(company)}
                            title="Editar Empresa"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCompany(company)}
                            title="Excluir Empresa"
                            disabled={(company.user_count || 0) > 0}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CompanyFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        company={selectedCompany}
        onSubmit={handleSubmit}
        isSubmitting={createCompany.isPending || updateCompany.isPending}
      />

      <CompanyUsersDialog
        open={usersDialogOpen}
        onOpenChange={setUsersDialogOpen}
        company={selectedCompany}
      />

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setCompanyToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Empresa</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. A empresa "{companyToDelete?.name}" será removida do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteCompany.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={deleteCompany.isPending}>
              {deleteCompany.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
