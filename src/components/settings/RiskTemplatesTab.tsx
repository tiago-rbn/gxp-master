import { useState } from "react";
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, FolderOpen, Loader2, MoreHorizontal, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useRiskTemplates, RiskTemplatePackage, RiskTemplateItem } from "@/hooks/useRiskTemplates";

export function RiskTemplatesTab() {
  const { packages, isLoading, createPackage, updatePackage, deletePackage, createItem, updateItem, deleteItem } = useRiskTemplates();
  const [expandedPkgs, setExpandedPkgs] = useState<Set<string>>(new Set());
  
  // Package dialog
  const [pkgDialogOpen, setPkgDialogOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<RiskTemplatePackage | null>(null);
  const [pkgForm, setPkgForm] = useState({ name: "", description: "", category: "" });

  // Item dialog
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RiskTemplateItem | null>(null);
  const [itemPackageId, setItemPackageId] = useState("");
  const [itemForm, setItemForm] = useState({ title: "", description: "", severity: 3, probability: 3, detectability: 3, controls: "" });

  // Delete dialogs
  const [deletePkgId, setDeletePkgId] = useState<string | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  const togglePkg = (id: string) => {
    setExpandedPkgs(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openNewPackage = () => {
    setEditingPkg(null);
    setPkgForm({ name: "", description: "", category: "" });
    setPkgDialogOpen(true);
  };

  const openEditPackage = (pkg: RiskTemplatePackage) => {
    setEditingPkg(pkg);
    setPkgForm({ name: pkg.name, description: pkg.description || "", category: pkg.category || "" });
    setPkgDialogOpen(true);
  };

  const handlePkgSubmit = () => {
    if (!pkgForm.name.trim()) return;
    if (editingPkg) {
      updatePackage.mutate({ id: editingPkg.id, ...pkgForm }, { onSuccess: () => setPkgDialogOpen(false) });
    } else {
      createPackage.mutate(pkgForm, { onSuccess: () => setPkgDialogOpen(false) });
    }
  };

  const openNewItem = (packageId: string) => {
    setEditingItem(null);
    setItemPackageId(packageId);
    setItemForm({ title: "", description: "", severity: 3, probability: 3, detectability: 3, controls: "" });
    setItemDialogOpen(true);
  };

  const openEditItem = (item: RiskTemplateItem) => {
    setEditingItem(item);
    setItemPackageId(item.package_id);
    setItemForm({
      title: item.title,
      description: item.description || "",
      severity: item.severity || 3,
      probability: item.probability || 3,
      detectability: item.detectability || 3,
      controls: item.controls || "",
    });
    setItemDialogOpen(true);
  };

  const handleItemSubmit = () => {
    if (!itemForm.title.trim()) return;
    if (editingItem) {
      updateItem.mutate({ id: editingItem.id, ...itemForm }, { onSuccess: () => setItemDialogOpen(false) });
    } else {
      createItem.mutate({ package_id: itemPackageId, ...itemForm }, { onSuccess: () => setItemDialogOpen(false) });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Templates de Riscos Funcionais</CardTitle>
            <CardDescription>Crie pacotes reutilizáveis de riscos funcionais para aplicar em sistemas</CardDescription>
          </div>
          <Button onClick={openNewPackage}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Pacote
          </Button>
        </CardHeader>
        <CardContent>
          {packages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Nenhum pacote de riscos criado ainda.</p>
              <Button onClick={openNewPackage}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Pacote
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {packages.map(pkg => {
                const isExpanded = expandedPkgs.has(pkg.id);
                const items = pkg.items || [];
                return (
                  <Collapsible key={pkg.id} open={isExpanded} onOpenChange={() => togglePkg(pkg.id)}>
                    <Card>
                      <CollapsibleTrigger asChild>
                        <CardContent className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                              <FolderOpen className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <h3 className="font-semibold">{pkg.name}</h3>
                                {pkg.description && <p className="text-sm text-muted-foreground">{pkg.description}</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {pkg.category && <Badge variant="outline">{pkg.category}</Badge>}
                              <Badge variant="secondary">{items.length} risco(s)</Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={e => { e.stopPropagation(); openEditPackage(pkg); }}>
                                    <Edit className="mr-2 h-4 w-4" />Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={e => { e.stopPropagation(); openNewItem(pkg.id); }}>
                                    <Plus className="mr-2 h-4 w-4" />Adicionar Risco
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive" onClick={e => { e.stopPropagation(); setDeletePkgId(pkg.id); }}>
                                    <Trash2 className="mr-2 h-4 w-4" />Excluir Pacote
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardContent>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="border-t p-4">
                          <div className="flex justify-end mb-2">
                            <Button size="sm" variant="outline" onClick={() => openNewItem(pkg.id)}>
                              <Plus className="mr-2 h-3 w-3" />Adicionar Risco
                            </Button>
                          </div>
                          {items.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">Nenhum risco neste pacote.</p>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Título</TableHead>
                                  <TableHead>S</TableHead>
                                  <TableHead>P</TableHead>
                                  <TableHead>D</TableHead>
                                  <TableHead>RPN</TableHead>
                                  <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {items.map(item => (
                                  <TableRow key={item.id}>
                                    <TableCell>
                                      <div>
                                        <p className="font-medium">{item.title}</p>
                                        {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                                      </div>
                                    </TableCell>
                                    <TableCell>{item.severity || 3}</TableCell>
                                    <TableCell>{item.probability || 3}</TableCell>
                                    <TableCell>{item.detectability || 3}</TableCell>
                                    <TableCell>{(item.severity || 3) * (item.probability || 3) * (item.detectability || 3)}</TableCell>
                                    <TableCell>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem onClick={() => openEditItem(item)}>
                                            <Edit className="mr-2 h-4 w-4" />Editar
                                          </DropdownMenuItem>
                                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteItemId(item.id)}>
                                            <Trash2 className="mr-2 h-4 w-4" />Excluir
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Package Dialog */}
      <Dialog open={pkgDialogOpen} onOpenChange={setPkgDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPkg ? "Editar Pacote" : "Novo Pacote de Riscos"}</DialogTitle>
            <DialogDescription>Defina um pacote reutilizável de riscos funcionais</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Pacote *</Label>
              <Input value={pkgForm.name} onChange={e => setPkgForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Riscos de Infraestrutura" />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Input value={pkgForm.category} onChange={e => setPkgForm(f => ({ ...f, category: e.target.value }))} placeholder="Ex: Infraestrutura, Segurança, Compliance" />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={pkgForm.description} onChange={e => setPkgForm(f => ({ ...f, description: e.target.value }))} placeholder="Descreva o pacote..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPkgDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handlePkgSubmit} disabled={createPackage.isPending || updatePackage.isPending}>
              {editingPkg ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Editar Risco" : "Novo Risco no Pacote"}</DialogTitle>
            <DialogDescription>Defina os detalhes do risco funcional</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input value={itemForm.title} onChange={e => setItemForm(f => ({ ...f, title: e.target.value }))} placeholder="Título do risco" />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={itemForm.description} onChange={e => setItemForm(f => ({ ...f, description: e.target.value }))} placeholder="Descrição detalhada..." />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Severidade (1-5)</Label>
                <Input type="number" min={1} max={5} value={itemForm.severity} onChange={e => setItemForm(f => ({ ...f, severity: Number(e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <Label>Probabilidade (1-5)</Label>
                <Input type="number" min={1} max={5} value={itemForm.probability} onChange={e => setItemForm(f => ({ ...f, probability: Number(e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <Label>Detectabilidade (1-5)</Label>
                <Input type="number" min={1} max={5} value={itemForm.detectability} onChange={e => setItemForm(f => ({ ...f, detectability: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Controles</Label>
              <Textarea value={itemForm.controls} onChange={e => setItemForm(f => ({ ...f, controls: e.target.value }))} placeholder="Controles de mitigação..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleItemSubmit} disabled={createItem.isPending || updateItem.isPending}>
              {editingItem ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Package Confirm */}
      <AlertDialog open={!!deletePkgId} onOpenChange={() => setDeletePkgId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Pacote?</AlertDialogTitle>
            <AlertDialogDescription>Todos os riscos dentro deste pacote serão excluídos. Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deletePkgId) deletePackage.mutate(deletePkgId); setDeletePkgId(null); }}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Item Confirm */}
      <AlertDialog open={!!deleteItemId} onOpenChange={() => setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Risco?</AlertDialogTitle>
            <AlertDialogDescription>Este risco será removido do pacote.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteItemId) deleteItem.mutate(deleteItemId); setDeleteItemId(null); }}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
