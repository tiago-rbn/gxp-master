import { Package, FileText, Tag, Building2, CheckCircle, Clock, XCircle } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TemplatePackage, TemplatePackageActivation } from "@/hooks/useTemplatePackages";
import { GampBadge } from "@/components/shared/GampBadge";

interface TemplatePackageCardProps {
  pkg: TemplatePackage;
  activation?: TemplatePackageActivation | null;
  onActivate?: () => void;
  onView?: () => void;
  onEdit?: () => void;
  isOwner?: boolean;
  activating?: boolean;
}

export function TemplatePackageCard({
  pkg,
  activation,
  onActivate,
  onView,
  onEdit,
  isOwner = false,
  activating = false,
}: TemplatePackageCardProps) {
  const formatPrice = (price: number) => {
    if (price === 0) return "Gratuito";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const getStatusBadge = () => {
    if (!activation) return null;

    switch (activation.status) {
      case "approved":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Ativado
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Aguardando Aprovação
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

  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg line-clamp-1">{pkg.name}</CardTitle>
              {pkg.company && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Building2 className="h-3 w-3" />
                  {pkg.company.name}
                </p>
              )}
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        {pkg.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {pkg.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            <Tag className="h-3 w-3 mr-1" />
            {pkg.application}
          </Badge>
          {pkg.gamp_category && (
            <GampBadge category={pkg.gamp_category as "1" | "3" | "4" | "5"} />
          )}
          {pkg.system_name && (
            <Badge variant="secondary" className="text-xs">
              {pkg.system_name}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>{pkg.document_count} documentos</span>
          </div>
          <span className="text-lg font-bold text-primary">
            {formatPrice(pkg.price)}
          </span>
        </div>
      </CardContent>

      <CardFooter className="pt-0 gap-2">
        {onView && (
          <Button variant="outline" size="sm" className="flex-1" onClick={onView}>
            Ver Detalhes
          </Button>
        )}
        {isOwner && onEdit && (
          <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
            Editar
          </Button>
        )}
        {!isOwner && onActivate && !activation && (
          <Button size="sm" className="flex-1" onClick={onActivate} disabled={activating}>
            {activating ? "Solicitando..." : "Ativar Pacote"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
