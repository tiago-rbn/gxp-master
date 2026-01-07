import { useState, useEffect } from "react";
import { FileText, Download, Loader2, FileDown, History } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { exportDocumentToPDF } from "@/lib/pdfExport";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { DocumentVersionHistory } from "./DocumentVersionHistory";
import { useDocuments } from "@/hooks/useDocuments";
import { useUserCompanies } from "@/hooks/useUserCompanies";

type Document = Database["public"]["Tables"]["documents"]["Row"] & {
  system?: { name: string } | null;
  author?: { full_name: string } | null;
  approver?: { full_name: string } | null;
};

interface DocumentViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: Document | null;
  onEdit: () => void;
}

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  pending: "Em Revisão",
  approved: "Aprovado",
  rejected: "Rejeitado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const documentTypeLabels: Record<string, string> = {
  URS: "User Requirements Specification",
  FS: "Functional Specification",
  DS: "Design Specification",
  IQ: "Installation Qualification",
  OQ: "Operational Qualification",
  PQ: "Performance Qualification",
  RTM: "Requirements Traceability Matrix",
  Report: "Relatório de Validação",
};

const documentTypeColors: Record<string, string> = {
  URS: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  FS: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  DS: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  IQ: "bg-green-500/10 text-green-600 border-green-500/20",
  OQ: "bg-teal-500/10 text-teal-600 border-teal-500/20",
  PQ: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  RTM: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  Report: "bg-rose-500/10 text-rose-600 border-rose-500/20",
};

export function DocumentViewDialog({
  open,
  onOpenChange,
  document,
  onEdit,
}: DocumentViewDialogProps) {
  const { activeCompany } = useUserCompanies();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  
  const { useDocumentVersions } = useDocuments();
  const { data: versions = [], isLoading: isLoadingVersions } = useDocumentVersions(document?.id || null);

  // Load company logo
  useEffect(() => {
    const loadCompanyLogo = async () => {
      if (activeCompany?.logo_url) {
        try {
          const { data } = await supabase.storage
            .from('company-logos')
            .createSignedUrl(activeCompany.logo_url, 60);
          
          if (data?.signedUrl) {
            setCompanyLogo(data.signedUrl);
          }
        } catch (error) {
          console.warn('Failed to load company logo:', error);
        }
      } else {
        setCompanyLogo(null);
      }
    };
    
    loadCompanyLogo();
  }, [activeCompany?.logo_url]);

  if (!document) return null;

  const handleDownload = async () => {
    if (!document.file_url) return;
    
    setIsDownloading(true);
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(document.file_url, 60);

      if (error) throw error;
      
      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Download error:', error);
      toast.error("Erro ao baixar arquivo");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await exportDocumentToPDF(document, {
        companyLogo,
        companyName: activeCompany?.name,
      });
      toast.success("PDF exportado com sucesso!");
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Erro ao exportar PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {document.title}
          </DialogTitle>
          <DialogDescription>
            {documentTypeLabels[document.document_type] || document.document_type}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Tipo</Label>
              <div className="mt-1">
                <Badge variant="outline" className={documentTypeColors[document.document_type] || ""}>
                  {document.document_type}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Versão</Label>
              <p className="font-medium">v{document.version || "1.0"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Sistema</Label>
              <p className="font-medium">{document.system?.name || "-"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <div className="mt-1">
                <Badge variant="outline">
                  {statusLabels[document.status || "draft"]}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Autor</Label>
              <p className="font-medium">{document.author?.full_name || "-"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Criado em</Label>
              <p className="font-medium">
                {new Date(document.created_at).toLocaleDateString("pt-BR")}
              </p>
            </div>
            {document.approved_at && (
              <>
                <div>
                  <Label className="text-muted-foreground">Aprovado por</Label>
                  <p className="font-medium">{document.approver?.full_name || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Aprovado em</Label>
                  <p className="font-medium">
                    {new Date(document.approved_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </>
            )}
          </div>

          {document.content && (
            <div>
              <Label className="text-muted-foreground">Conteúdo</Label>
              <p className="mt-1 rounded-lg bg-muted p-3 whitespace-pre-wrap">
                {document.content}
              </p>
            </div>
          )}

          {document.file_url ? (
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">Arquivo anexado</p>
                <p className="text-sm text-muted-foreground">
                  Clique para fazer download
                </p>
              </div>
              <Button variant="outline" onClick={handleDownload} disabled={isDownloading}>
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border bg-muted/30 p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Nenhum arquivo anexado
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowVersionHistory(true)}
            className="w-full sm:w-auto"
          >
            <History className="mr-2 h-4 w-4" />
            Histórico ({versions.length})
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExportPDF}
            disabled={isExporting}
            className="w-full sm:w-auto"
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            Exportar PDF
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button onClick={onEdit}>Editar</Button>
          </div>
        </DialogFooter>
      </DialogContent>

      <DocumentVersionHistory
        open={showVersionHistory}
        onOpenChange={setShowVersionHistory}
        versions={versions}
        isLoading={isLoadingVersions}
        currentContent={document.content}
      />
    </Dialog>
  );
}
