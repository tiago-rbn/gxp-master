import { useState } from "react";
import { Loader2, Package, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useRiskTemplates, RiskTemplateItem } from "@/hooks/useRiskTemplates";
import { useRiskAssessments, useSystemsForSelect } from "@/hooks/useRiskAssessments";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface LoadFromTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getRiskLevel(s: number, p: number, d: number): "low" | "medium" | "high" {
  const rpn = s * p * d;
  if (rpn >= 50) return "high";
  if (rpn >= 20) return "medium";
  return "low";
}

export function LoadFromTemplateDialog({ open, onOpenChange }: LoadFromTemplateDialogProps) {
  const { packages, isLoading: loadingPkgs } = useRiskTemplates();
  const { createRiskAssessment } = useRiskAssessments();
  const { data: systems } = useSystemsForSelect();

  const [selectedSystemId, setSelectedSystemId] = useState<string>("");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allItems = packages.flatMap(p => (p.items || []).map(i => ({ ...i, packageName: p.name })));

  const toggleItem = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const togglePackage = (packageId: string) => {
    const pkg = packages.find(p => p.id === packageId);
    if (!pkg?.items) return;
    const itemIds = pkg.items.map(i => i.id);
    const allSelected = itemIds.every(id => selectedItems.has(id));
    setSelectedItems(prev => {
      const next = new Set(prev);
      itemIds.forEach(id => allSelected ? next.delete(id) : next.add(id));
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!selectedSystemId) {
      toast.error("Selecione um sistema");
      return;
    }
    if (selectedItems.size === 0) {
      toast.error("Selecione pelo menos um risco");
      return;
    }

    setIsSubmitting(true);
    const itemsToCreate = allItems.filter(i => selectedItems.has(i.id));

    try {
      for (const item of itemsToCreate) {
        const s = item.severity || 3;
        const p = item.probability || 3;
        const d = item.detectability || 3;
        await createRiskAssessment.mutateAsync({
          title: item.title,
          description: item.description || undefined,
          assessment_type: "FRA",
          system_id: selectedSystemId,
          severity: s,
          probability: p,
          detectability: d,
          controls: item.controls || undefined,
          risk_level: getRiskLevel(s, p, d),
          tags: item.tags || [],
          status: "draft",
        });
      }
      toast.success(`${itemsToCreate.length} risco(s) criado(s) com sucesso!`);
      setSelectedItems(new Set());
      setSelectedSystemId("");
      onOpenChange(false);
    } catch {
      toast.error("Erro ao criar riscos");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Carregar Riscos de Template
          </DialogTitle>
          <DialogDescription>
            Selecione um sistema e os riscos de template que deseja aplicar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Sistema de destino *</Label>
            <Select value={selectedSystemId} onValueChange={setSelectedSystemId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o sistema..." />
              </SelectTrigger>
              <SelectContent>
                {systems?.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {loadingPkgs ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : packages.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum template de riscos cadastrado. Crie pacotes em Configurações.
            </p>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {packages.map(pkg => {
                  const items = pkg.items || [];
                  const allSelected = items.length > 0 && items.every(i => selectedItems.has(i.id));
                  const someSelected = items.some(i => selectedItems.has(i.id));

                  return (
                    <div key={pkg.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={() => togglePackage(pkg.id)}
                          className={someSelected && !allSelected ? "opacity-50" : ""}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{pkg.name}</span>
                            {pkg.category && <Badge variant="outline" className="text-xs">{pkg.category}</Badge>}
                            <Badge variant="secondary" className="text-xs">{items.length} risco(s)</Badge>
                          </div>
                          {pkg.description && <p className="text-xs text-muted-foreground">{pkg.description}</p>}
                        </div>
                      </div>

                      {items.length > 0 && (
                        <div className="ml-8 space-y-1">
                          {items.map(item => (
                            <div key={item.id} className="flex items-center gap-3 py-1">
                              <Checkbox
                                checked={selectedItems.has(item.id)}
                                onCheckedChange={() => toggleItem(item.id)}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm">{item.title}</p>
                                {item.description && <p className="text-xs text-muted-foreground truncate">{item.description}</p>}
                              </div>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                RPN: {(item.severity || 3) * (item.probability || 3) * (item.detectability || 3)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <span className="text-sm text-muted-foreground">
              {selectedItems.size} risco(s) selecionado(s)
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting || selectedItems.size === 0}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Carregar Riscos
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
