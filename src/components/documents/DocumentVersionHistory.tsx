import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { History, Eye, GitCompare, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface DocumentVersion {
  id: string;
  document_id: string;
  version: string;
  title: string;
  content: string | null;
  file_url: string | null;
  created_by: string | null;
  created_at: string;
  change_summary: string | null;
  creator?: { full_name: string } | null;
}

interface DocumentVersionHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versions: DocumentVersion[];
  isLoading: boolean;
  currentContent: string | null;
}

export function DocumentVersionHistory({
  open,
  onOpenChange,
  versions,
  isLoading,
  currentContent,
}: DocumentVersionHistoryProps) {
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);
  const [compareVersion, setCompareVersion] = useState<DocumentVersion | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());

  const toggleExpanded = (versionId: string) => {
    const newExpanded = new Set(expandedVersions);
    if (newExpanded.has(versionId)) {
      newExpanded.delete(versionId);
    } else {
      newExpanded.add(versionId);
    }
    setExpandedVersions(newExpanded);
  };

  const handleCompare = (version: DocumentVersion) => {
    if (!compareVersion) {
      setCompareVersion(version);
    } else if (compareVersion.id === version.id) {
      setCompareVersion(null);
    } else {
      setSelectedVersion(version);
      setShowCompare(true);
    }
  };

  const getDiffLines = (oldText: string | null, newText: string | null) => {
    const oldLines = (oldText || "").split("\n");
    const newLines = (newText || "").split("\n");
    const maxLength = Math.max(oldLines.length, newLines.length);
    
    const diff: Array<{ type: "added" | "removed" | "unchanged"; line: string }> = [];
    
    for (let i = 0; i < maxLength; i++) {
      const oldLine = oldLines[i] || "";
      const newLine = newLines[i] || "";
      
      if (oldLine === newLine) {
        diff.push({ type: "unchanged", line: oldLine });
      } else {
        if (oldLine) {
          diff.push({ type: "removed", line: oldLine });
        }
        if (newLine) {
          diff.push({ type: "added", line: newLine });
        }
      }
    }
    
    return diff;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Versões
            </DialogTitle>
          </DialogHeader>

          {compareVersion && !showCompare && (
            <div className="bg-muted p-3 rounded-lg flex items-center justify-between">
              <span className="text-sm">
                Comparando: <strong>v{compareVersion.version}</strong> - Selecione outra versão
              </span>
              <Button variant="ghost" size="sm" onClick={() => setCompareVersion(null)}>
                Cancelar
              </Button>
            </div>
          )}

          <ScrollArea className="h-[500px] pr-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma versão anterior encontrada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {versions.map((version, index) => (
                  <Collapsible
                    key={version.id}
                    open={expandedVersions.has(version.id)}
                    onOpenChange={() => toggleExpanded(version.id)}
                  >
                    <div 
                      className={`border rounded-lg p-4 ${
                        compareVersion?.id === version.id ? "border-primary bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={index === 0 ? "default" : "secondary"}>
                              v{version.version}
                            </Badge>
                            {index === 0 && (
                              <Badge variant="outline" className="text-xs">
                                Mais recente
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-medium">{version.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(version.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                            {version.creator?.full_name && ` • ${version.creator.full_name}`}
                          </p>
                          {version.change_summary && (
                            <p className="text-sm mt-1 text-muted-foreground italic">
                              "{version.change_summary}"
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCompare(version)}
                            className={compareVersion?.id === version.id ? "text-primary" : ""}
                          >
                            <GitCompare className="h-4 w-4" />
                          </Button>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm">
                              {expandedVersions.has(version.id) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                      </div>
                      <CollapsibleContent>
                        <div className="mt-4 pt-4 border-t">
                          <pre className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-lg max-h-60 overflow-auto">
                            {version.content || "(Sem conteúdo)"}
                          </pre>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Compare Dialog */}
      <Dialog open={showCompare} onOpenChange={setShowCompare}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5" />
              Comparação de Versões
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-between mb-4">
            <Badge variant="secondary">v{compareVersion?.version}</Badge>
            <span className="text-muted-foreground">→</span>
            <Badge>v{selectedVersion?.version}</Badge>
          </div>

          <ScrollArea className="h-[500px]">
            <div className="space-y-1 font-mono text-sm">
              {getDiffLines(compareVersion?.content, selectedVersion?.content).map((line, index) => (
                <div
                  key={index}
                  className={`px-3 py-1 rounded ${
                    line.type === "added"
                      ? "bg-green-500/20 text-green-700 dark:text-green-400"
                      : line.type === "removed"
                      ? "bg-red-500/20 text-red-700 dark:text-red-400"
                      : ""
                  }`}
                >
                  <span className="mr-2 opacity-50">
                    {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
                  </span>
                  {line.line || " "}
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
