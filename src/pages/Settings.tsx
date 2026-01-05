import { useState } from "react";
import { Building2, Users, Shield, FileText, Settings as SettingsIcon, Plus, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
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
import { users } from "@/data/mockData";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const roleColors: Record<string, string> = {
  "Super Admin": "bg-destructive/10 text-destructive border-destructive/20",
  Admin: "bg-primary/10 text-primary border-primary/20",
  Validator: "bg-info/10 text-info border-info/20",
  Responsible: "bg-warning/10 text-warning border-warning/20",
  Reader: "bg-muted text-muted-foreground border-border",
};

export default function Settings() {
  const [riskThreshold, setRiskThreshold] = useState([6]);

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
                  <Input id="company-name" defaultValue="Pharma Corp Ltda" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input id="cnpj" defaultValue="12.345.678/0001-90" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input id="address" defaultValue="Av. Industrial, 1000 - São Paulo, SP" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" defaultValue="(11) 3000-0000" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button>Salvar Alterações</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Usuários</CardTitle>
                <CardDescription>Gerencie os usuários do sistema</CardDescription>
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Usuário
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Último Acesso</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={roleColors[user.role]}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={user.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.lastAccess}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Desativar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
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
                    <TableHead className="text-center">Validator</TableHead>
                    <TableHead className="text-center">Responsible</TableHead>
                    <TableHead className="text-center">Reader</TableHead>
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
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Template
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[
                  { name: "URS Template", type: "URS", version: "2.0" },
                  { name: "Functional Specification", type: "FS", version: "1.5" },
                  { name: "IQ Protocol", type: "IQ", version: "3.0" },
                  { name: "OQ Protocol", type: "OQ", version: "3.0" },
                  { name: "PQ Protocol", type: "PQ", version: "2.5" },
                  { name: "Validation Report", type: "Report", version: "1.0" },
                ].map((template) => (
                  <Card key={template.name}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{template.name}</p>
                          <p className="text-sm text-muted-foreground">v{template.version}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Notificar Riscos Altos</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Exigir Aprovação Dupla</Label>
                    <Switch />
                  </div>
                </div>
                <Button>Salvar Parâmetros</Button>
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
                      <Input type="number" defaultValue={12} />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Sistemas Não-Críticos</Label>
                      <Input type="number" defaultValue={24} />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Alerta de Revalidação (dias antes)</Label>
                  <Input type="number" defaultValue={30} />
                </div>
                <div className="space-y-2">
                  <Label>Dias para Expiração de Documentos</Label>
                  <Input type="number" defaultValue={365} />
                </div>
                <Button>Salvar Configurações</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}