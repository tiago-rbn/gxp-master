import { useState, useEffect } from "react";
import { Building2, Users, Shield, FileText, Settings as SettingsIcon, Plus, Edit, Trash2, MoreHorizontal, Loader2, Mail, Send, RefreshCw, XCircle, Clock } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge, StatusType } from "@/components/shared/StatusBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { useProfiles, Profile } from "@/hooks/useProfiles";
import { useDocumentTemplates, DocumentTemplate } from "@/hooks/useDocumentTemplates";
import { useInvitations } from "@/hooks/useInvitations";
import { useAuth } from "@/contexts/AuthContext";
import { UserFormDialog } from "@/components/settings/UserFormDialog";
import { TemplateFormDialog } from "@/components/settings/TemplateFormDialog";
import { DeleteTemplateDialog } from "@/components/settings/DeleteTemplateDialog";
import { InviteUserDialog } from "@/components/settings/InviteUserDialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  validator: "Validador",
  responsible: "Responsável",
  reader: "Leitor",
};

const roleColors: Record<string, string> = {
  super_admin: "bg-destructive/10 text-destructive border-destructive/20",
  admin: "bg-primary/10 text-primary border-primary/20",
  validator: "bg-info/10 text-info border-info/20",
  responsible: "bg-warning/10 text-warning border-warning/20",
  reader: "bg-muted text-muted-foreground border-border",
};

export default function Settings() {
  const { user } = useAuth();
  const { company, isLoading: companyLoading, updateCompany } = useCompanySettings();
  const { profiles, isLoading: profilesLoading, updateProfile, toggleUserStatus } = useProfiles();
  const { templates, isLoading: templatesLoading, addTemplate, updateTemplate, deleteTemplate } = useDocumentTemplates();
  const { invitations, isLoading: invitationsLoading, sendInvitation, cancelInvitation, resendInvitation } = useInvitations();

  // Company form state
  const [companyForm, setCompanyForm] = useState({
    name: "",
    cnpj: "",
    address: "",
    phone: "",
  });

  // Parameters state
  const [riskThreshold, setRiskThreshold] = useState([6]);
  const [autoRevalidation, setAutoRevalidation] = useState(true);
  const [notifyHighRisks, setNotifyHighRisks] = useState(true);
  const [requireDualApproval, setRequireDualApproval] = useState(false);
  const [criticalRevalidationMonths, setCriticalRevalidationMonths] = useState(12);
  const [nonCriticalRevalidationMonths, setNonCriticalRevalidationMonths] = useState(24);
  const [revalidationAlertDays, setRevalidationAlertDays] = useState(30);
  const [documentExpirationDays, setDocumentExpirationDays] = useState(365);

  // Dialog states
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [deleteTemplateDialogOpen, setDeleteTemplateDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<DocumentTemplate | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  // Load company data into form
  useEffect(() => {
    if (company) {
      const settings = company.settings || {};
      setCompanyForm({
        name: company.name || "",
        cnpj: company.cnpj || "",
        address: settings.address || "",
        phone: settings.phone || "",
      });
      setRiskThreshold([settings.risk_threshold || 6]);
      setAutoRevalidation(settings.auto_revalidation ?? true);
      setNotifyHighRisks(settings.notify_high_risks ?? true);
      setRequireDualApproval(settings.require_dual_approval ?? false);
      setCriticalRevalidationMonths(settings.critical_revalidation_months || 12);
      setNonCriticalRevalidationMonths(settings.non_critical_revalidation_months || 24);
      setRevalidationAlertDays(settings.revalidation_alert_days || 30);
      setDocumentExpirationDays(settings.document_expiration_days || 365);
    }
  }, [company]);

  const handleSaveCompany = async () => {
    if (!company) return;
    await updateCompany.mutateAsync({
      name: companyForm.name,
      cnpj: companyForm.cnpj,
      settings: {
        ...company.settings,
        address: companyForm.address,
        phone: companyForm.phone,
      },
    });
  };

  const handleSaveRiskParams = async () => {
    if (!company) return;
    await updateCompany.mutateAsync({
      settings: {
        ...company.settings,
        risk_threshold: riskThreshold[0],
        auto_revalidation: autoRevalidation,
        notify_high_risks: notifyHighRisks,
        require_dual_approval: requireDualApproval,
      },
    });
  };

  const handleSaveValidationParams = async () => {
    if (!company) return;
    await updateCompany.mutateAsync({
      settings: {
        ...company.settings,
        critical_revalidation_months: criticalRevalidationMonths,
        non_critical_revalidation_months: nonCriticalRevalidationMonths,
        revalidation_alert_days: revalidationAlertDays,
        document_expiration_days: documentExpirationDays,
      },
    });
  };

  const handleEditUser = (user: Profile) => {
    setSelectedUser(user);
    setUserDialogOpen(true);
  };

  const handleUserSubmit = async (data: Partial<Profile>) => {
    if (!selectedUser) return;
    await updateProfile.mutateAsync({ id: selectedUser.id, updates: data });
    setUserDialogOpen(false);
  };

  const handleToggleUserStatus = async (user: Profile) => {
    await toggleUserStatus.mutateAsync({ id: user.id, isActive: !user.is_active });
  };

  const handleNewTemplate = () => {
    setSelectedTemplate(null);
    setTemplateDialogOpen(true);
  };

  const handleEditTemplate = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setTemplateDialogOpen(true);
  };

  const handleTemplateSubmit = async (data: Omit<DocumentTemplate, "id" | "created_at" | "updated_at">) => {
    if (selectedTemplate) {
      await updateTemplate.mutateAsync({ id: selectedTemplate.id, updates: data });
    } else {
      await addTemplate.mutateAsync(data);
    }
    setTemplateDialogOpen(false);
  };

  const handleDeleteTemplateClick = (template: DocumentTemplate) => {
    setTemplateToDelete(template);
    setDeleteTemplateDialogOpen(true);
  };

  const handleDeleteTemplateConfirm = async () => {
    if (!templateToDelete) return;
    await deleteTemplate.mutateAsync(templateToDelete.id);
    setDeleteTemplateDialogOpen(false);
    setTemplateToDelete(null);
  };

  const handleSendInvite = async (email: string, role: string) => {
    if (!company || !user) return;

    // Get current user's profile to get their name
    const currentProfile = profiles?.find(p => p.id === user.id);
    const inviterName = currentProfile?.full_name || user.email || "Usuário";

    await sendInvitation.mutateAsync({
      email,
      role,
      companyId: company.id,
      companyName: company.name,
      inviterName,
    });
    setInviteDialogOpen(false);
  };

  const pendingInvitations = invitations?.filter(i => i.status === "pending") || [];
  const isInvitationExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  if (companyLoading) {
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
        title="Configurações"
        description="Gerencie as configurações do sistema"
      />

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-5">
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Empresa</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Usuários</span>
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Permissões</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Templates</span>
          </TabsTrigger>
          <TabsTrigger value="parameters" className="gap-2">
            <SettingsIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Parâmetros</span>
          </TabsTrigger>
        </TabsList>

        {/* Company Tab */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Empresa</CardTitle>
              <CardDescription>Dados cadastrais e configurações gerais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Nome da Empresa</Label>
                  <Input
                    id="company-name"
                    value={companyForm.name}
                    onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={companyForm.cnpj}
                    onChange={(e) => setCompanyForm({ ...companyForm, cnpj: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={companyForm.address}
                    onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={companyForm.phone}
                    onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveCompany} disabled={updateCompany.isPending}>
                  {updateCompany.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          {/* Active Users */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Usuários</CardTitle>
                <CardDescription>Gerencie os usuários do sistema</CardDescription>
              </div>
              <Button onClick={() => setInviteDialogOpen(true)}>
                <Mail className="mr-2 h-4 w-4" />
                Convidar Usuário
              </Button>
            </CardHeader>
            <CardContent>
              {profilesLoading ? (
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
                      <TableHead>Departamento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {getInitials(user.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="font-medium">{user.full_name}</span>
                              {user.position && (
                                <p className="text-xs text-muted-foreground">{user.position}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={roleColors[user.role || "reader"]}>
                            {roleLabels[user.role || "reader"] || user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.department || "-"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={user.is_active ? "approved" : "cancelled" as StatusType} />
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className={user.is_active ? "text-destructive" : "text-success"}
                                onClick={() => handleToggleUserStatus(user)}
                              >
                                {user.is_active ? (
                                  <>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Desativar
                                  </>
                                ) : (
                                  <>
                                    <Users className="mr-2 h-4 w-4" />
                                    Ativar
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Pending Invitations */}
          {pendingInvitations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Convites Pendentes
                </CardTitle>
                <CardDescription>
                  Convites aguardando aceitação ({pendingInvitations.length})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead>Enviado em</TableHead>
                      <TableHead>Expira em</TableHead>
                      <TableHead>Convidado por</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingInvitations.map((invitation) => (
                      <TableRow key={invitation.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{invitation.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={roleColors[invitation.role]}>
                            {roleLabels[invitation.role] || invitation.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(invitation.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {isInvitationExpired(invitation.expires_at) ? (
                            <Badge variant="destructive">Expirado</Badge>
                          ) : (
                            <span className="text-muted-foreground">
                              {format(new Date(invitation.expires_at), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {invitation.inviter?.full_name || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => resendInvitation.mutate(invitation)}
                              disabled={resendInvitation.isPending}
                              title="Reenviar convite"
                            >
                              <RefreshCw className={`h-4 w-4 ${resendInvitation.isPending ? 'animate-spin' : ''}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => cancelInvitation.mutate(invitation.id)}
                              disabled={cancelInvitation.isPending}
                              title="Cancelar convite"
                              className="text-destructive hover:text-destructive"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>Matriz de Permissões</CardTitle>
              <CardDescription>Configure as permissões por perfil de usuário</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Módulo</TableHead>
                    <TableHead className="text-center">Admin</TableHead>
                    <TableHead className="text-center">Validador</TableHead>
                    <TableHead className="text-center">Responsável</TableHead>
                    <TableHead className="text-center">Leitor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { module: "Dashboard", admin: true, validator: true, responsible: true, reader: true },
                    { module: "Inventário de Sistemas", admin: true, validator: true, responsible: true, reader: true },
                    { module: "Criar/Editar Sistemas", admin: true, validator: true, responsible: false, reader: false },
                    { module: "Gerenciamento de Riscos", admin: true, validator: true, responsible: true, reader: true },
                    { module: "Criar/Editar Riscos", admin: true, validator: true, responsible: false, reader: false },
                    { module: "Projetos de Validação", admin: true, validator: true, responsible: true, reader: true },
                    { module: "Criar/Editar Projetos", admin: true, validator: true, responsible: false, reader: false },
                    { module: "Documentação", admin: true, validator: true, responsible: true, reader: true },
                    { module: "Aprovar Documentos", admin: true, validator: true, responsible: false, reader: false },
                    { module: "Gerenciamento de Mudanças", admin: true, validator: true, responsible: true, reader: true },
                    { module: "Configurações", admin: true, validator: false, responsible: false, reader: false },
                  ].map((row) => (
                    <TableRow key={row.module}>
                      <TableCell className="font-medium">{row.module}</TableCell>
                      <TableCell className="text-center">
                        <Switch checked={row.admin} disabled />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch checked={row.validator} />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch checked={row.responsible} />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch checked={row.reader} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 flex justify-end">
                <Button>Salvar Permissões</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Templates de Documentos</CardTitle>
                <CardDescription>Modelos para geração automática de documentos</CardDescription>
              </div>
              <Button onClick={handleNewTemplate}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Template
              </Button>
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {templates?.map((template) => (
                    <Card key={template.id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{template.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {template.document_type} • v{template.version}
                            </p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteTemplateClick(template)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Parameters Tab */}
        <TabsContent value="parameters">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Parâmetros de Risco</CardTitle>
                <CardDescription>Configure os limites de classificação de risco</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Limite de Risco Alto</Label>
                    <span className="font-medium">{riskThreshold[0]}</span>
                  </div>
                  <Slider
                    value={riskThreshold}
                    onValueChange={setRiskThreshold}
                    max={9}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Baixo (1-2)</span>
                    <span>Médio (3-5)</span>
                    <span>Alto (6-9)</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Revalidação Automática</Label>
                    <Switch checked={autoRevalidation} onCheckedChange={setAutoRevalidation} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Notificar Riscos Altos</Label>
                    <Switch checked={notifyHighRisks} onCheckedChange={setNotifyHighRisks} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Exigir Aprovação Dupla</Label>
                    <Switch checked={requireDualApproval} onCheckedChange={setRequireDualApproval} />
                  </div>
                </div>
                <Button onClick={handleSaveRiskParams} disabled={updateCompany.isPending}>
                  {updateCompany.isPending ? "Salvando..." : "Salvar Parâmetros"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configurações de Validação</CardTitle>
                <CardDescription>Defina os intervalos de revalidação</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Intervalo de Revalidação (meses)</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Sistemas Críticos</Label>
                      <Input
                        type="number"
                        value={criticalRevalidationMonths}
                        onChange={(e) => setCriticalRevalidationMonths(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Sistemas Não-Críticos</Label>
                      <Input
                        type="number"
                        value={nonCriticalRevalidationMonths}
                        onChange={(e) => setNonCriticalRevalidationMonths(Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Alerta de Revalidação (dias antes)</Label>
                  <Input
                    type="number"
                    value={revalidationAlertDays}
                    onChange={(e) => setRevalidationAlertDays(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dias para Expiração de Documentos</Label>
                  <Input
                    type="number"
                    value={documentExpirationDays}
                    onChange={(e) => setDocumentExpirationDays(Number(e.target.value))}
                  />
                </div>
                <Button onClick={handleSaveValidationParams} disabled={updateCompany.isPending}>
                  {updateCompany.isPending ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* User Edit Dialog */}
      <UserFormDialog
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        user={selectedUser}
        onSubmit={handleUserSubmit}
        isSubmitting={updateProfile.isPending}
      />

      {/* Template Form Dialog */}
      <TemplateFormDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        template={selectedTemplate}
        onSubmit={handleTemplateSubmit}
        isSubmitting={addTemplate.isPending || updateTemplate.isPending}
        companyId={company?.id || ""}
      />

      {/* Delete Template Dialog */}
      <DeleteTemplateDialog
        open={deleteTemplateDialogOpen}
        onOpenChange={setDeleteTemplateDialogOpen}
        templateName={templateToDelete?.name || ""}
        onConfirm={handleDeleteTemplateConfirm}
        isDeleting={deleteTemplate.isPending}
      />

      {/* Invite User Dialog */}
      <InviteUserDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onSubmit={handleSendInvite}
        isSubmitting={sendInvitation.isPending}
      />
    </AppLayout>
  );
}
