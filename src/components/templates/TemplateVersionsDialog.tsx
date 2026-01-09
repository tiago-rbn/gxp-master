import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { History, Eye, ArrowLeft } from "lucide-react";
import { useTemplateVersions, TemplateVersion } from "@/hooks/useDocumentTemplatesNew";
import { useState } from "react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string | null;
  templateName: string;
  currentVersion: string;
}

export function TemplateVersionsDialog({
  open,
  onOpenChange,
  templateId,
  templateName,
  currentVersion,
}: Props) {
  const { data: versions, isLoading } = useTemplateVersions(templateId);
  const [selectedVersion, setSelectedVersion] = useState<(TemplateVersion & { created_by_profile: { full_name: string } | null }) | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Versões
          </DialogTitle>
          <DialogDescription>
            {templateName} - Versão atual: {currentVersion}
          </DialogDescription>
        </DialogHeader>

        {selectedVersion ? (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedVersion(null)}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
              <Badge variant="secondary">Versão {selectedVersion.version}</Badge>
              <span className="text-sm text-muted-foreground">
                {format(new Date(selectedVersion.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>
            
            {selectedVersion.change_summary && (
              <div className="mb-4 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Resumo das alterações:</p>
                <p className="text-sm text-muted-foreground">{selectedVersion.change_summary}</p>
              </div>
            )}

            <ScrollArea className="flex-1 border rounded-lg p-4">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {selectedVersion.content || "Sem conteúdo"}
              </pre>
            </ScrollArea>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Carregando...</p>
              </div>
            ) : versions && versions.length > 0 ? (
              <div className="space-y-2">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">v{version.version}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(version.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      {version.change_summary && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {version.change_summary}
                        </p>
                      )}
                      {version.created_by_profile && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Por: {version.created_by_profile.full_name}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedVersion(version)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <History className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Nenhuma versão anterior encontrada</p>
                <p className="text-sm text-muted-foreground">
                  As versões serão salvas automaticamente ao editar o template
                </p>
              </div>
            )}
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
