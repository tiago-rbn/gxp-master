import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Package,
  FileText,
  Tag,
  Building2,
  Calendar,
  User,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TemplatePackage,
  usePackageItems,
} from "@/hooks/useTemplatePackages";
import { useDocumentTemplatesNew } from "@/hooks/useDocumentTemplatesNew";
import { GampBadge } from "@/components/shared/GampBadge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TemplatePackageDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pkg: TemplatePackage | null;
  isOwner?: boolean;
  onUpdateDocumentCount?: (count: number) => void;
}

export function TemplatePackageDetailsDialog({
  open,
  onOpenChange,
  pkg,
  isOwner = false,
  onUpdateDocumentCount,
}: TemplatePackageDetailsDialogProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const { items, isLoading: itemsLoading, addItem, removeItem } = usePackageItems(pkg?.id || null);
  const { templates } = useDocumentTemplatesNew();

  if (!pkg) return null;

  const formatPrice = (price: number) => {
    if (price === 0) return "Gratuito";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const handleAddTemplate = async () => {
    if (!selectedTemplateId || !pkg) return;
    
    await addItem.mutateAsync({
      packageId: pkg.id,
      templateId: selectedTemplateId,
    });
    
    setSelectedTemplateId("");
    onUpdateDocumentCount?.(items ? items.length + 1 : 1);
  };

  const handleRemoveTemplate = async (itemId: string) => {
    await removeItem.mutateAsync(itemId);
    onUpdateDocumentCount?.(items ? items.length - 1 : 0);
  };

  // Filter out templates already in the package
  const availableTemplates = templates?.filter(
    (t) => !items?.some((item) => item.template_id === t.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">{pkg.name}</DialogTitle>
              {pkg.company && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Building2 className="h-4 w-4" />
                  {pkg.company.name}
                </p>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Info Section */}
            <div className="space-y-3">
              {pkg.description && (
                <p className="text-muted-foreground">{pkg.description}</p>
              )}

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  <Tag className="h-3 w-3 mr-1" />
                  {pkg.application}
                </Badge>
                {pkg.gamp_category && (
                  <GampBadge category={pkg.gamp_category as "1" | "3" | "4" | "5"} />
                )}
                {pkg.system_name && (
                  <Badge variant="secondary">{pkg.system_name}</Badge>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <FileText className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-2xl font-bold">{items?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Documentos</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <Calendar className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {format(new Date(pkg.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                  <p className="text-xs text-muted-foreground">Criado em</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-primary/10">
                  <p className="text-2xl font-bold text-primary">
                    {formatPrice(pkg.price)}
                  </p>
                  <p className="text-xs text-muted-foreground">Preço</p>
                </div>
              </div>

              {pkg.creator && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Criado por {pkg.creator.full_name}</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Templates Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Templates Incluídos</h3>
                {isOwner && (
                  <div className="flex items-center gap-2">
                    <Select
                      value={selectedTemplateId || "__placeholder__"}
                      onValueChange={(value) => setSelectedTemplateId(value === "__placeholder__" ? "" : value)}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Adicionar template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTemplates?.length === 0 ? (
                          <SelectItem value="__empty__" disabled>
                            Nenhum template disponível
                          </SelectItem>
                        ) : (
                          availableTemplates?.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      onClick={handleAddTemplate}
                      disabled={!selectedTemplateId || addItem.isPending}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {itemsLoading ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : items?.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Nenhum template adicionado a este pacote ainda.
                </p>
              ) : (
                <div className="space-y-2">
                  {items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{item.template?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.template?.document_type}
                          </p>
                        </div>
                      </div>
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTemplate(item.id)}
                          disabled={removeItem.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
